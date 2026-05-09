-- ============================================================
-- ATOMIC INVENTORY RPC FUNCTIONS
-- Run this in Supabase SQL Editor
--
-- These functions execute inside a single transaction with
-- SELECT FOR UPDATE row locking to prevent overselling.
-- Both products.stock_quantity AND inventory_movements are
-- updated atomically — no partial writes possible.
-- ============================================================

-- ============================================================
-- deduct_inventory_atomic
-- Deducts stock for multiple products in one transaction.
-- Returns success=false with error message if any item is
-- out of stock — the entire operation is rolled back.
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_inventory_atomic(
  p_tenant_id    UUID,
  p_items        JSONB,   -- [{product_id, quantity, product_name}]
  p_movement_type TEXT,
  p_reference_id TEXT,
  p_notes        TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item         JSONB;
  v_product      RECORD;
  v_new_stock    INTEGER;
  v_movements    JSONB := '[]'::JSONB;
BEGIN
  -- Set tenant context for RLS (scoped to this transaction)
  PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, true);

  -- Process each item
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Lock the product row to prevent concurrent modifications
    SELECT id, stock_quantity, name
    INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
      AND tenant_id = p_tenant_id
    FOR UPDATE;

    -- Verify product exists and belongs to tenant
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Product %s not found or access denied', v_item->>'product_id')
      );
    END IF;

    -- Check sufficient stock
    IF v_product.stock_quantity < (v_item->>'quantity')::INTEGER THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format(
          'Insufficient stock for %s. Available: %s, Requested: %s',
          COALESCE(v_item->>'product_name', v_product.name),
          v_product.stock_quantity,
          v_item->>'quantity'
        )
      );
    END IF;

    v_new_stock := v_product.stock_quantity - (v_item->>'quantity')::INTEGER;

    -- Update stock
    UPDATE products
    SET stock_quantity = v_new_stock,
        updated_at = NOW()
    WHERE id = v_product.id
      AND tenant_id = p_tenant_id;

    -- Write audit movement
    INSERT INTO inventory_movements (
      product_id, tenant_id, movement_type, stock_type,
      quantity_change, stock_before, stock_after,
      related_transaction_id, reason, notes
    ) VALUES (
      v_product.id, p_tenant_id, p_movement_type, 'Retail',
      -((v_item->>'quantity')::INTEGER),
      v_product.stock_quantity, v_new_stock,
      p_reference_id, p_movement_type, p_notes
    );

    -- Accumulate result
    v_movements := v_movements || jsonb_build_object(
      'productId', v_product.id,
      'stockBefore', v_product.stock_quantity,
      'stockAfter', v_new_stock,
      'quantityChange', -((v_item->>'quantity')::INTEGER)
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'movements', v_movements);

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================================
-- restore_inventory_atomic
-- Restores stock for cancellations and returns.
-- ============================================================
CREATE OR REPLACE FUNCTION restore_inventory_atomic(
  p_tenant_id    UUID,
  p_items        JSONB,
  p_movement_type TEXT,
  p_reference_id TEXT,
  p_notes        TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item         JSONB;
  v_product      RECORD;
  v_new_stock    INTEGER;
  v_movements    JSONB := '[]'::JSONB;
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, true);

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, stock_quantity, name
    INTO v_product
    FROM products
    WHERE id = (v_item->>'product_id')::UUID
      AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Product %s not found or access denied', v_item->>'product_id')
      );
    END IF;

    v_new_stock := v_product.stock_quantity + (v_item->>'quantity')::INTEGER;

    UPDATE products
    SET stock_quantity = v_new_stock,
        updated_at = NOW()
    WHERE id = v_product.id
      AND tenant_id = p_tenant_id;

    INSERT INTO inventory_movements (
      product_id, tenant_id, movement_type, stock_type,
      quantity_change, stock_before, stock_after,
      related_transaction_id, reason, notes
    ) VALUES (
      v_product.id, p_tenant_id, p_movement_type, 'Retail',
      (v_item->>'quantity')::INTEGER,
      v_product.stock_quantity, v_new_stock,
      p_reference_id, p_movement_type, p_notes
    );

    v_movements := v_movements || jsonb_build_object(
      'productId', v_product.id,
      'stockBefore', v_product.stock_quantity,
      'stockAfter', v_new_stock,
      'quantityChange', (v_item->>'quantity')::INTEGER
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'movements', v_movements);

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Grant execute to service_role only (called from server-side only)
GRANT EXECUTE ON FUNCTION deduct_inventory_atomic(UUID, JSONB, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION restore_inventory_atomic(UUID, JSONB, TEXT, TEXT, TEXT) TO service_role;

-- Revoke from anon and authenticated (server-side only)
REVOKE EXECUTE ON FUNCTION deduct_inventory_atomic(UUID, JSONB, TEXT, TEXT, TEXT) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION restore_inventory_atomic(UUID, JSONB, TEXT, TEXT, TEXT) FROM anon, authenticated;

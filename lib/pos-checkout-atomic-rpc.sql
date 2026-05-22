-- ============================================================
-- ATOMIC POS CHECKOUT RPC
-- Run this in Supabase SQL Editor before deploying the matching
-- pages/api/pos/checkout.ts change.
--
-- Completes a POS checkout in one PostgreSQL transaction:
-- - Locks cart rows by tenant/session
-- - Validates debt credit limit, if payment method is debt
-- - Locks product rows and validates stock
-- - Creates transaction and transaction_items
-- - Creates debt record for debt sales
-- - Deducts inventory and writes inventory_movements
-- - Clears the cart
-- ============================================================

CREATE OR REPLACE FUNCTION complete_pos_checkout_atomic(
  p_tenant_id UUID,
  p_session_id TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_customer_phone TEXT DEFAULT NULL,
  p_total NUMERIC DEFAULT NULL,
  p_amount_paid NUMERIC DEFAULT NULL,
  p_payment_method TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_cashier_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cart_count INTEGER;
  v_cart_total NUMERIC(12, 2);
  v_change NUMERIC(12, 2);
  v_customer RECORD;
  v_current_debt NUMERIC(12, 2) := 0;
  v_available_credit NUMERIC(12, 2);
  v_item RECORD;
  v_product RECORD;
  v_transaction RECORD;
  v_transaction_number TEXT;
  v_sale_number TEXT;
  v_items JSONB;
BEGIN
  PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, true);

  IF p_tenant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tenant context required');
  END IF;

  IF p_session_id IS NULL OR length(trim(p_session_id)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Session ID is required');
  END IF;

  IF p_payment_method IS NULL OR length(trim(p_payment_method)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment method is required');
  END IF;

  -- Lock this checkout cart. A second checkout for the same session waits,
  -- then sees an empty cart after the first transaction clears it.
  PERFORM 1
  FROM cart_items
  WHERE tenant_id = p_tenant_id
    AND session_id = p_session_id
  FOR UPDATE;

  SELECT COUNT(*), COALESCE(SUM(subtotal), 0)
  INTO v_cart_count, v_cart_total
  FROM cart_items
  WHERE tenant_id = p_tenant_id
    AND session_id = p_session_id;

  IF v_cart_count = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cart is empty');
  END IF;

  IF p_total IS NULL OR ABS(p_total - v_cart_total) > 0.01 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format(
        'Cart total changed. Expected %s, current %s',
        COALESCE(p_total::TEXT, 'none'),
        v_cart_total::TEXT
      )
    );
  END IF;

  IF p_payment_method <> 'debt' AND (p_amount_paid IS NULL OR p_amount_paid < v_cart_total) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient amount paid');
  END IF;

  IF p_payment_method = 'debt' THEN
    IF p_customer_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Customer is required for debt payment');
    END IF;

    SELECT id, name, debt_limit
    INTO v_customer
    FROM customers
    WHERE id = p_customer_id
      AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Customer not found');
    END IF;

    IF COALESCE(v_customer.debt_limit, 0) <= 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Customer does not have a credit limit set');
    END IF;

    PERFORM 1
    FROM debts
    WHERE customer_id = p_customer_id
      AND tenant_id = p_tenant_id
      AND status <> 'Paid'
    FOR UPDATE;

    SELECT COALESCE(SUM(amount_remaining), 0)
    INTO v_current_debt
    FROM debts
    WHERE customer_id = p_customer_id
      AND tenant_id = p_tenant_id
      AND status <> 'Paid';

    v_available_credit := COALESCE(v_customer.debt_limit, 0) - v_current_debt;

    IF v_cart_total > v_available_credit THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Insufficient credit. Available: KES %s', v_available_credit::TEXT)
      );
    END IF;
  END IF;

  -- Validate and lock stock for every cart item before any writes.
  FOR v_item IN
    SELECT product_id, product_name, quantity
    FROM cart_items
    WHERE tenant_id = p_tenant_id
      AND session_id = p_session_id
    ORDER BY product_id
  LOOP
    SELECT id, name, stock_quantity
    INTO v_product
    FROM products
    WHERE id = v_item.product_id
      AND tenant_id = p_tenant_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format('Product %s not found or access denied', v_item.product_id)
      );
    END IF;

    IF v_product.stock_quantity < v_item.quantity THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', format(
          'Insufficient stock for %s. Available: %s, Requested: %s',
          COALESCE(v_item.product_name, v_product.name),
          v_product.stock_quantity,
          v_item.quantity
        )
      );
    END IF;
  END LOOP;

  v_transaction_number := 'TXN-' || floor(extract(epoch from clock_timestamp()) * 1000)::BIGINT || '-' || upper(substr(md5(random()::TEXT), 1, 6));
  v_sale_number := 'SALE-' || floor(random() * 900000 + 100000)::INTEGER;
  v_change := CASE WHEN p_payment_method = 'debt' THEN 0 ELSE COALESCE(p_amount_paid, 0) - v_cart_total END;

  INSERT INTO transactions (
    tenant_id,
    transaction_id,
    customer_id,
    customer_name,
    customer_phone,
    total_amount,
    payment_method,
    payment_status,
    notes,
    created_by
  ) VALUES (
    p_tenant_id,
    v_transaction_number,
    p_customer_id,
    COALESCE(p_customer_name, 'Walk-in Customer'),
    p_customer_phone,
    v_cart_total,
    p_payment_method,
    'completed',
    p_notes,
    p_cashier_name
  )
  RETURNING * INTO v_transaction;

  INSERT INTO transaction_items (
    tenant_id,
    transaction_id,
    product_id,
    product_name,
    quantity,
    unit_price,
    total_price
  )
  SELECT
    p_tenant_id,
    v_transaction.transaction_id,
    product_id,
    COALESCE(product_name, 'Unknown Product'),
    quantity,
    unit_price,
    subtotal
  FROM cart_items
  WHERE tenant_id = p_tenant_id
    AND session_id = p_session_id;

  IF p_payment_method = 'debt' THEN
    INSERT INTO debts (
      tenant_id,
      customer_id,
      customer_name,
      sale_id,
      total_amount,
      amount_paid,
      amount_remaining,
      status,
      due_date,
      notes
    ) VALUES (
      p_tenant_id,
      p_customer_id,
      COALESCE(v_customer.name, p_customer_name, 'Unknown'),
      v_sale_number,
      v_cart_total,
      0,
      v_cart_total,
      'Outstanding',
      (CURRENT_DATE + INTERVAL '30 days')::DATE,
      'Credit sale - ' || v_transaction.transaction_id
    );
  END IF;

  FOR v_item IN
    SELECT product_id, product_name, quantity
    FROM cart_items
    WHERE tenant_id = p_tenant_id
      AND session_id = p_session_id
    ORDER BY product_id
  LOOP
    SELECT id, stock_quantity
    INTO v_product
    FROM products
    WHERE id = v_item.product_id
      AND tenant_id = p_tenant_id
    FOR UPDATE;

    UPDATE products
    SET stock_quantity = v_product.stock_quantity - v_item.quantity,
        updated_at = NOW()
    WHERE id = v_product.id
      AND tenant_id = p_tenant_id;

    INSERT INTO inventory_movements (
      product_id,
      tenant_id,
      movement_type,
      stock_type,
      quantity_change,
      stock_before,
      stock_after,
      related_transaction_id,
      reason,
      notes,
      performed_by_name
    ) VALUES (
      v_product.id,
      p_tenant_id,
      'sale',
      'Retail',
      -v_item.quantity,
      v_product.stock_quantity,
      v_product.stock_quantity - v_item.quantity,
      v_transaction.transaction_id,
      'sale',
      'POS sale ' || v_transaction.transaction_id,
      p_cashier_name
    );
  END LOOP;

  SELECT COALESCE(jsonb_agg(to_jsonb(ti) ORDER BY ti.created_at), '[]'::JSONB)
  INTO v_items
  FROM transaction_items ti
  WHERE ti.tenant_id = p_tenant_id
    AND ti.transaction_id = v_transaction.transaction_id;

  DELETE FROM cart_items
  WHERE tenant_id = p_tenant_id
    AND session_id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction', to_jsonb(v_transaction) || jsonb_build_object(
      'items', v_items,
      'change', v_change
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION complete_pos_checkout_atomic(UUID, TEXT, UUID, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT) TO service_role;
REVOKE EXECUTE ON FUNCTION complete_pos_checkout_atomic(UUID, TEXT, UUID, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT) FROM anon, authenticated;

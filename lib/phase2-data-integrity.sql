-- ============================================================
-- PHASE 2: DATA INTEGRITY FIXES
-- Add tenant_id to missing tables + composite indexes
-- ============================================================

-- ============================================================
-- STEP 1: Add tenant_id to returns
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'returns' AND table_schema = 'public') THEN
    ALTER TABLE returns ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_returns_tenant ON returns(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_returns_tenant_date ON returns(tenant_id, return_date);
    -- Backfill: link returns to transactions to get tenant_id
    UPDATE returns r
    SET tenant_id = t.tenant_id
    FROM transactions t
    WHERE r.transaction_id = t.transaction_id
      AND r.tenant_id IS NULL;
    -- Any remaining unlinked returns go to Nyla Wigs
    UPDATE returns SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

-- ============================================================
-- STEP 2: Add tenant_id to transaction_items
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transaction_items' AND table_schema = 'public') THEN
    ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_transaction_items_tenant ON transaction_items(tenant_id);
    -- Backfill from parent transactions
    UPDATE transaction_items ti
    SET tenant_id = t.tenant_id
    FROM transactions t
    WHERE ti.transaction_id = t.transaction_id
      AND ti.tenant_id IS NULL;
    UPDATE transaction_items SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

-- ============================================================
-- STEP 3: Add tenant_id to cart_items
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cart_items' AND table_schema = 'public') THEN
    ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_cart_items_tenant ON cart_items(tenant_id);
    UPDATE cart_items SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

-- ============================================================
-- STEP 4: Composite indexes for performance at scale
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_transactions_tenant_date ON transactions(tenant_id, created_at DESC);
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_expenses_tenant_date ON expenses(tenant_id, expense_date DESC);
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'debts' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_debts_tenant_status ON debts(tenant_id, status);
    CREATE INDEX IF NOT EXISTS idx_debts_tenant_date ON debts(tenant_id, created_at DESC);
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_customers_tenant_name ON customers(tenant_id, name);
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_products_tenant_name ON products(tenant_id, name);
    CREATE INDEX IF NOT EXISTS idx_products_tenant_sku ON products(tenant_id, sku);
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'message_queue' AND table_schema = 'public') THEN
    CREATE INDEX IF NOT EXISTS idx_message_queue_tenant_date ON message_queue(tenant_id, created_at DESC);
  END IF;
END $$;

-- ============================================================
-- STEP 5: Add tenant_id to message_queue if missing
-- ============================================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'message_queue' AND table_schema = 'public') THEN
    ALTER TABLE message_queue ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;
    UPDATE message_queue SET tenant_id = 'a0000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
  END IF;
END $$;

-- ============================================================
-- DONE
-- ============================================================

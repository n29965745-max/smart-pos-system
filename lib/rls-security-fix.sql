-- ============================================================
-- RLS SECURITY FIX
-- Run this in Supabase SQL Editor
--
-- CRITICAL: The previous RLS policies used get_tenant_id() which
-- relied on current_setting('app.current_user_id') — this was never
-- set by the API (which used service role key bypassing RLS anyway).
--
-- This migration:
-- 1. Drops all old permissive/broken policies
-- 2. Creates a secure helper function
-- 3. Re-creates all policies correctly
-- ============================================================

-- ============================================================
-- STEP 1: Drop old broken policies
-- ============================================================
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ============================================================
-- STEP 2: Drop old get_tenant_id function
-- ============================================================
DROP FUNCTION IF EXISTS get_tenant_id();

-- ============================================================
-- STEP 3: Create secure tenant lookup function
-- Uses the custom users table (not auth.users) since the app
-- uses a custom auth system.
-- This function is called with the user_id set via app.current_user_id
-- which the API sets before each query.
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id TEXT;
BEGIN
  -- Get user_id from session variable (set by API middleware)
  v_user_id := current_setting('app.current_user_id', true);
  
  IF v_user_id IS NULL OR v_user_id = '' THEN
    RETURN NULL;
  END IF;
  
  SELECT tenant_id INTO v_tenant_id
  FROM public.users
  WHERE id = v_user_id::UUID
    AND is_active = true
  LIMIT 1;
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- STEP 4: Enable RLS on all tables
-- ============================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
    ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transaction_items' AND table_schema = 'public') THEN
    ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cart_items' AND table_schema = 'public') THEN
    ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses' AND table_schema = 'public') THEN
    ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'debts' AND table_schema = 'public') THEN
    ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'returns' AND table_schema = 'public') THEN
    ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'message_queue' AND table_schema = 'public') THEN
    ALTER TABLE message_queue ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'message_templates' AND table_schema = 'public') THEN
    ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================
-- STEP 5: Create RLS policies
-- All policies use get_current_tenant_id() which reads from
-- the session variable set by the API middleware.
-- ============================================================

-- Tenants: users can only see their own tenant
CREATE POLICY "tenants_isolation" ON tenants
  FOR ALL USING (id = get_current_tenant_id());

-- Tenant users
CREATE POLICY "tenant_users_isolation" ON tenant_users
  FOR ALL USING (tenant_id = get_current_tenant_id());

-- Users: only see users in same tenant
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    CREATE POLICY "users_tenant_isolation" ON users
      FOR ALL USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- Products
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
    CREATE POLICY "products_tenant_isolation" ON products
      FOR ALL USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- Customers
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'customers' AND table_schema = 'public') THEN
    CREATE POLICY "customers_tenant_isolation" ON customers
      FOR ALL USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- Transactions
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions' AND table_schema = 'public') THEN
    CREATE POLICY "transactions_tenant_isolation" ON transactions
      FOR ALL USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- Transaction items
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transaction_items' AND table_schema = 'public') THEN
    CREATE POLICY "transaction_items_tenant_isolation" ON transaction_items
      FOR ALL USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- Cart items
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cart_items' AND table_schema = 'public') THEN
    CREATE POLICY "cart_items_tenant_isolation" ON cart_items
      FOR ALL USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- Expenses
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'expenses' AND table_schema = 'public') THEN
    CREATE POLICY "expenses_tenant_isolation" ON expenses
      FOR ALL USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- Debts
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'debts' AND table_schema = 'public') THEN
    CREATE POLICY "debts_tenant_isolation" ON debts
      FOR ALL USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- Returns
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'returns' AND table_schema = 'public') THEN
    CREATE POLICY "returns_tenant_isolation" ON returns
      FOR ALL USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- Message queue
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'message_queue' AND table_schema = 'public') THEN
    CREATE POLICY "message_queue_tenant_isolation" ON message_queue
      FOR ALL USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- Message templates
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'message_templates' AND table_schema = 'public') THEN
    CREATE POLICY "message_templates_tenant_isolation" ON message_templates
      FOR ALL USING (tenant_id = get_current_tenant_id());
  END IF;
END $$;

-- ============================================================
-- DONE: RLS is now active on all tables.
-- The API middleware sets app.current_user_id before queries,
-- and get_current_tenant_id() resolves the tenant from the users table.
-- ============================================================

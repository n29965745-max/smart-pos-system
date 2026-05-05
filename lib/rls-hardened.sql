-- ============================================================
-- HARDENED RLS POLICIES
-- Run this in Supabase SQL Editor
--
-- Changes from previous version:
-- 1. Policies now use app.current_tenant_id directly (set by API)
--    instead of a function that does a DB lookup per row.
--    This is faster and eliminates the user-lookup attack surface.
-- 2. FORCE ROW LEVEL SECURITY added to all tables so even the
--    table owner cannot bypass policies.
-- 3. All tables covered: products, customers, transactions,
--    transaction_items, cart_items, expenses, debts, returns,
--    message_queue, message_templates, shop_settings,
--    automation_rules, customer_communication_prefs
-- ============================================================

-- ============================================================
-- STEP 1: Drop all existing policies (clean slate)
-- ============================================================
DO $$
DECLARE
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
-- STEP 2: Drop old helper functions
-- ============================================================
DROP FUNCTION IF EXISTS get_current_tenant_id();
DROP FUNCTION IF EXISTS get_tenant_id();

-- ============================================================
-- STEP 3: Create lean helper function
-- Reads app.current_tenant_id set by the API middleware.
-- Returns NULL if not set — RLS will then deny access (fail closed).
-- ============================================================
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id TEXT;
BEGIN
  v_tenant_id := current_setting('app.current_tenant_id', true);
  IF v_tenant_id IS NULL OR v_tenant_id = '' THEN
    RETURN NULL;
  END IF;
  RETURN v_tenant_id::UUID;
EXCEPTION
  WHEN invalid_text_representation THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- STEP 4: Enable RLS + FORCE on all tenant-scoped tables
-- FORCE ensures even the table owner (postgres role) is subject to RLS
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'products', 'customers', 'transactions', 'transaction_items',
    'cart_items', 'expenses', 'debts', 'returns',
    'message_queue', 'message_templates', 'shop_settings',
    'automation_rules', 'customer_communication_prefs'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
      RAISE NOTICE 'RLS enabled + forced on: %', tbl;
    ELSE
      RAISE NOTICE 'Table not found (skipped): %', tbl;
    END IF;
  END LOOP;
END $$;

-- tenants and tenant_users: special handling
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users FORCE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS policies
-- Pattern: tenant_id = current_tenant_id()
-- If current_tenant_id() returns NULL → no rows match → fail closed
-- ============================================================

-- tenants: users can only see their own tenant record
CREATE POLICY "tenants_isolation" ON tenants
  FOR ALL USING (id = current_tenant_id());

-- tenant_users
CREATE POLICY "tenant_users_isolation" ON tenant_users
  FOR ALL USING (tenant_id = current_tenant_id());

-- products
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='products') THEN
    CREATE POLICY "products_tenant_isolation" ON products
      FOR ALL USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

-- customers
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='customers') THEN
    CREATE POLICY "customers_tenant_isolation" ON customers
      FOR ALL USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

-- transactions
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='transactions') THEN
    CREATE POLICY "transactions_tenant_isolation" ON transactions
      FOR ALL USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

-- transaction_items
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='transaction_items') THEN
    CREATE POLICY "transaction_items_tenant_isolation" ON transaction_items
      FOR ALL USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

-- cart_items
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='cart_items') THEN
    CREATE POLICY "cart_items_tenant_isolation" ON cart_items
      FOR ALL USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

-- expenses
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='expenses') THEN
    CREATE POLICY "expenses_tenant_isolation" ON expenses
      FOR ALL USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

-- debts
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='debts') THEN
    CREATE POLICY "debts_tenant_isolation" ON debts
      FOR ALL USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

-- returns
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='returns') THEN
    CREATE POLICY "returns_tenant_isolation" ON returns
      FOR ALL USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

-- shop_settings
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='shop_settings') THEN
    CREATE POLICY "shop_settings_tenant_isolation" ON shop_settings
      FOR ALL USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

-- message_queue
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='message_queue') THEN
    CREATE POLICY "message_queue_tenant_isolation" ON message_queue
      FOR ALL USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

-- message_templates
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='message_templates') THEN
    CREATE POLICY "message_templates_tenant_isolation" ON message_templates
      FOR ALL USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

-- automation_rules
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='automation_rules') THEN
    CREATE POLICY "automation_rules_tenant_isolation" ON automation_rules
      FOR ALL USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

-- customer_communication_prefs
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='customer_communication_prefs') THEN
    CREATE POLICY "comm_prefs_tenant_isolation" ON customer_communication_prefs
      FOR ALL USING (tenant_id = current_tenant_id())
      WITH CHECK (tenant_id = current_tenant_id());
  END IF;
END $$;

-- ============================================================
-- STEP 6: Update set_config wrapper to use new variable name
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_config(
  setting_name TEXT,
  new_value TEXT,
  is_local BOOLEAN DEFAULT false
)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT set_config(setting_name, new_value, is_local);
$$;

GRANT EXECUTE ON FUNCTION public.set_config(TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_config(TEXT, TEXT, BOOLEAN) TO anon;
GRANT EXECUTE ON FUNCTION public.set_config(TEXT, TEXT, BOOLEAN) TO service_role;

-- ============================================================
-- STEP 7: Verify — check for NULL tenant_id records
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
  cnt BIGINT;
  tables TEXT[] := ARRAY[
    'products', 'customers', 'transactions', 'transaction_items',
    'cart_items', 'expenses', 'debts', 'returns'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    IF EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('SELECT COUNT(*) FROM %I WHERE tenant_id IS NULL', tbl) INTO cnt;
      IF cnt > 0 THEN
        RAISE WARNING 'TABLE % HAS % ROWS WITH NULL tenant_id — FIX IMMEDIATELY', tbl, cnt;
      ELSE
        RAISE NOTICE 'OK: % — no NULL tenant_id rows', tbl;
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- STEP 8: Verify RLS is enabled on all tables
-- ============================================================
SELECT
  tablename,
  rowsecurity AS rls_enabled,
  forcerowsecurity AS rls_forced
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'tenants', 'tenant_users', 'products', 'customers',
    'transactions', 'transaction_items', 'cart_items',
    'expenses', 'debts', 'returns', 'shop_settings',
    'message_queue', 'message_templates', 'automation_rules',
    'customer_communication_prefs'
  )
ORDER BY tablename;

-- ============================================================
-- DONE.
-- Security model:
-- 1. API sets app.current_tenant_id via set_config() RPC
-- 2. current_tenant_id() reads it — returns NULL if missing
-- 3. RLS policies: tenant_id = current_tenant_id()
-- 4. NULL current_tenant_id → no rows match → fail closed
-- 5. FORCE ROW LEVEL SECURITY → even postgres role is subject to RLS
-- 6. API also has explicit WHERE tenant_id = req.tenantId (defense-in-depth)
-- ============================================================

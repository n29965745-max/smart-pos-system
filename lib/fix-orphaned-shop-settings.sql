-- Fix orphaned shop_settings record (the one with NULL tenant_id)
-- This happens when a shop_settings record exists but isn't linked to any tenant

-- Step 1: Check which record is orphaned
SELECT 
  id,
  business_name,
  user_id,
  created_at,
  'This record needs to be linked to a tenant' as note
FROM shop_settings
WHERE tenant_id IS NULL;

-- Step 2: Option A - Link it to Nyla Wigs tenant (if it's a duplicate)
-- Uncomment and run this if the orphaned "Nyla Wigs" should be linked to Nyla Wigs tenant:
/*
UPDATE shop_settings
SET tenant_id = (
  SELECT id FROM tenants WHERE business_name = 'Nyla Wigs' LIMIT 1
)
WHERE tenant_id IS NULL
AND business_name = 'Nyla Wigs';
*/

-- Step 3: Option B - Delete the orphaned record (if it's a duplicate)
-- Since you already have a working Nyla Wigs record with tenant_id, 
-- the orphaned one is likely a duplicate and can be safely deleted:
DELETE FROM shop_settings
WHERE tenant_id IS NULL;

-- Step 4: Verify all records now have tenant_id
SELECT 
  t.business_name as tenant,
  s.business_name as settings,
  CASE WHEN s.tenant_id IS NULL THEN '❌ NEEDS FIX' ELSE '✅ OK' END as status
FROM shop_settings s
LEFT JOIN tenants t ON s.tenant_id = t.id;

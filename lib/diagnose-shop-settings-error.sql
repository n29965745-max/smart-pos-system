-- DIAGNOSTIC SCRIPT for "user_email not found in schema cache" error
-- Run this first to see what's wrong
-- Copy the output and we can determine the exact fix needed

-- ============================================
-- CHECK 1: Does shop_settings table exist?
-- ============================================
SELECT 
  'CHECK 1: Table Existence' as check_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shop_settings')
    THEN '✅ shop_settings table exists'
    ELSE '❌ shop_settings table MISSING'
  END as result;

-- ============================================
-- CHECK 2: What columns exist?
-- ============================================
SELECT 
  'CHECK 2: Current Columns' as check_name,
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'shop_settings'
ORDER BY ordinal_position;

-- ============================================
-- CHECK 3: Does tenant_id column exist?
-- ============================================
SELECT 
  'CHECK 3: tenant_id Column' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'shop_settings' AND column_name = 'tenant_id'
    )
    THEN '✅ tenant_id column exists'
    ELSE '❌ tenant_id column MISSING - THIS IS THE PROBLEM'
  END as result;

-- ============================================
-- CHECK 4: Does user_id column exist?
-- ============================================
SELECT 
  'CHECK 4: user_id Column' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'shop_settings' AND column_name = 'user_id'
    )
    THEN '✅ user_id column exists'
    ELSE '❌ user_id column MISSING'
  END as result;

-- ============================================
-- CHECK 5: How many records exist?
-- ============================================
SELECT 
  'CHECK 5: Record Count' as check_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN tenant_id IS NULL THEN 1 END) as orphaned_records,
  COUNT(CASE WHEN tenant_id IS NOT NULL THEN 1 END) as valid_records
FROM shop_settings;

-- ============================================
-- CHECK 6: Show all records with details
-- ============================================
SELECT 
  'CHECK 6: All Records' as check_name,
  s.id,
  s.tenant_id,
  s.user_id,
  s.business_name,
  s.business_type,
  s.created_at,
  CASE 
    WHEN s.tenant_id IS NULL THEN '❌ ORPHANED'
    ELSE '✅ VALID'
  END as status
FROM shop_settings s
ORDER BY s.created_at DESC;

-- ============================================
-- CHECK 7: Match settings to tenants
-- ============================================
SELECT 
  'CHECK 7: Settings-Tenant Mapping' as check_name,
  s.id as settings_id,
  s.business_name as settings_name,
  s.tenant_id,
  t.business_name as tenant_name,
  t.slug as tenant_slug,
  CASE 
    WHEN s.tenant_id IS NULL THEN '❌ No tenant link'
    WHEN t.id IS NULL THEN '❌ Tenant not found'
    ELSE '✅ Properly linked'
  END as link_status
FROM shop_settings s
LEFT JOIN tenants t ON s.tenant_id = t.id;

-- ============================================
-- CHECK 8: RLS Policies
-- ============================================
SELECT 
  'CHECK 8: RLS Policies' as check_name,
  policyname,
  cmd as operation,
  CASE 
    WHEN policyname LIKE '%tenant%' THEN '✅ Tenant-based'
    ELSE '⚠️ Old policy'
  END as policy_type
FROM pg_policies
WHERE tablename = 'shop_settings';

-- ============================================
-- CHECK 9: Constraints
-- ============================================
SELECT 
  'CHECK 9: Constraints' as check_name,
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'p' THEN 'Primary Key'
    WHEN 'f' THEN 'Foreign Key'
    WHEN 'u' THEN 'Unique'
    WHEN 'c' THEN 'Check'
    ELSE 'Other'
  END as type_description
FROM pg_constraint
WHERE conrelid = 'shop_settings'::regclass;

-- ============================================
-- CHECK 10: Indexes
-- ============================================
SELECT 
  'CHECK 10: Indexes' as check_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'shop_settings';

-- ============================================
-- SUMMARY & RECOMMENDATIONS
-- ============================================
SELECT 
  'SUMMARY' as section,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shop_settings' AND column_name = 'tenant_id')
    THEN '❌ PROBLEM: tenant_id column missing. Run fix-user-email-error-complete.sql'
    
    WHEN EXISTS (SELECT 1 FROM shop_settings WHERE tenant_id IS NULL)
    THEN '⚠️ WARNING: Orphaned records exist. Run fix to delete them.'
    
    WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'shop_settings' AND policyname LIKE '%tenant%')
    THEN '⚠️ WARNING: Old RLS policies. Run fix to update them.'
    
    ELSE '✅ Structure looks good. Try: NOTIFY pgrst, ''reload schema'';'
  END as recommendation;

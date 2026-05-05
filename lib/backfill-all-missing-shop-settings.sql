-- Backfill shop_settings for ALL tenants that don't have them
-- Run this in Supabase SQL Editor

-- Step 1: Check which tenants are missing shop_settings
SELECT 
  t.id,
  t.business_name,
  t.slug,
  t.created_at,
  CASE WHEN s.id IS NULL THEN '❌ Missing' ELSE '✅ Has Settings' END as status
FROM tenants t
LEFT JOIN shop_settings s ON s.tenant_id = t.id
ORDER BY t.created_at DESC;

-- Step 2: Create shop_settings for all tenants that don't have them
INSERT INTO shop_settings (
  tenant_id,
  user_id,
  business_name,
  business_type,
  business_email,
  business_phone,
  business_address,
  business_tagline,
  logo_url,
  primary_color,
  currency,
  currency_symbol,
  tiktok_url,
  instagram_url,
  facebook_url,
  created_at,
  updated_at
)
SELECT 
  t.id as tenant_id,
  u.id as user_id,
  t.business_name,
  COALESCE(t.business_type, 'Retail Store') as business_type,
  COALESCE(t.business_email, '') as business_email,
  COALESCE(t.business_phone, '') as business_phone,
  '' as business_address,
  COALESCE(t.tagline, '') as business_tagline,
  '' as logo_url,
  COALESCE(t.theme_color, '#10b981') as primary_color,
  COALESCE(t.currency, 'KES') as currency,
  COALESCE(t.currency_symbol, 'KSh') as currency_symbol,
  '' as tiktok_url,
  '' as instagram_url,
  '' as facebook_url,
  NOW() as created_at,
  NOW() as updated_at
FROM tenants t
LEFT JOIN LATERAL (
  SELECT id 
  FROM users 
  WHERE tenant_id = t.id 
    AND role = 'Admin' 
  ORDER BY created_at ASC 
  LIMIT 1
) u ON true
LEFT JOIN shop_settings s ON s.tenant_id = t.id
WHERE s.id IS NULL
  AND u.id IS NOT NULL;

-- Step 3: Verify all tenants now have shop_settings
SELECT 
  t.business_name,
  t.slug,
  s.business_name as shop_settings_name,
  s.primary_color,
  s.currency,
  CASE WHEN s.id IS NULL THEN '❌ Still Missing' ELSE '✅ Fixed' END as status
FROM tenants t
LEFT JOIN shop_settings s ON s.tenant_id = t.id
ORDER BY t.created_at DESC;

-- Step 4: Count results
SELECT 
  COUNT(*) as total_tenants,
  COUNT(s.id) as tenants_with_settings,
  COUNT(*) - COUNT(s.id) as tenants_missing_settings
FROM tenants t
LEFT JOIN shop_settings s ON s.tenant_id = t.id;

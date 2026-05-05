-- Backfill shop_settings for Prime Tech Electronics Ltd
-- Run this in Supabase SQL Editor

-- First, let's check if Prime Tech has shop_settings
SELECT 
  t.id as tenant_id,
  t.business_name,
  t.slug,
  s.id as shop_settings_id
FROM tenants t
LEFT JOIN shop_settings s ON s.tenant_id = t.id
WHERE t.business_name ILIKE '%prime tech%';

-- Create shop_settings for Prime Tech if it doesn't exist
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
  facebook_url
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
  '' as facebook_url
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id AND u.role = 'Admin'
LEFT JOIN shop_settings s ON s.tenant_id = t.id
WHERE t.business_name ILIKE '%prime tech%'
  AND s.id IS NULL
  AND u.id IS NOT NULL;

-- Verify the insert
SELECT 
  t.business_name,
  t.slug,
  s.business_name as shop_settings_name,
  s.primary_color,
  s.currency
FROM tenants t
JOIN shop_settings s ON s.tenant_id = t.id
WHERE t.business_name ILIKE '%prime tech%';

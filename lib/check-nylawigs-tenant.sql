-- Check if nylawigs tenant exists
SELECT 
  id,
  business_name,
  subdomain,
  is_active,
  created_at
FROM tenants
WHERE subdomain = 'nylawigs';

-- Check products for nylawigs
SELECT 
  p.id,
  p.name,
  p.retail_price,
  p.stock_quantity,
  p.tenant_id,
  t.subdomain
FROM products p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'nylawigs'
LIMIT 5;

-- Check shop_settings for nylawigs
SELECT 
  ss.id,
  ss.tenant_id,
  ss.logo_url,
  ss.business_tagline,
  t.subdomain
FROM shop_settings ss
JOIN tenants t ON ss.tenant_id = t.id
WHERE t.subdomain = 'nylawigs';

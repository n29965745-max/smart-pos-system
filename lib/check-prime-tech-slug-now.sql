-- Check Prime Tech Electronics Ltd tenant and slug

SELECT 
  id,
  business_name,
  slug,
  created_at
FROM tenants
WHERE business_name ILIKE '%prime%tech%'
ORDER BY created_at DESC;

-- Also check all tenants to see what we have
SELECT 
  id,
  business_name,
  slug,
  created_at
FROM tenants
ORDER BY created_at DESC;

-- Check all tenants and their slugs
SELECT 
  id,
  business_name,
  slug,
  is_active,
  created_at
FROM tenants
ORDER BY created_at ASC;

-- Check which tenant is returned first (the fallback issue)
SELECT 
  id,
  business_name,
  slug,
  is_active
FROM tenants
WHERE is_active = true
LIMIT 1;

-- Find Prime Tech tenant
SELECT 
  id,
  business_name,
  slug,
  is_active
FROM tenants
WHERE business_name ILIKE '%prime%tech%'
   OR slug ILIKE '%prime%tech%';

-- Check Prime Tech's current slug
SELECT 
  id,
  business_name,
  slug,
  created_at
FROM tenants
WHERE business_name ILIKE '%prime tech%';

-- If the slug is wrong, update it with this:
-- UPDATE tenants 
-- SET slug = 'prime-tech-electronics-ltd'
-- WHERE business_name = 'Prime Tech Electronics Ltd';

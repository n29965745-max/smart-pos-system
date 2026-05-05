-- Find the correct login credentials for Prime Tech

-- Check all users and their tenant associations
SELECT 
  u.email,
  u.created_at as user_created,
  tu.role,
  t.business_name,
  t.slug,
  t.is_active
FROM auth.users u
LEFT JOIN tenant_users tu ON u.id = tu.user_id
LEFT JOIN tenants t ON tu.tenant_id = t.id
ORDER BY u.created_at DESC;

-- Find Prime Tech specific users
SELECT 
  u.email,
  tu.role,
  t.business_name,
  t.slug
FROM tenants t
JOIN tenant_users tu ON t.id = tu.tenant_id
JOIN auth.users u ON tu.user_id = u.id
WHERE t.business_name ILIKE '%prime%tech%'
   OR t.slug ILIKE '%prime%tech%';

-- Check all users and their tenant mappings
SELECT 
  u.email,
  tu.tenant_id,
  tu.role,
  t.business_name,
  t.slug
FROM auth.users u
LEFT JOIN tenant_users tu ON u.id = tu.user_id
LEFT JOIN tenants t ON tu.tenant_id = t.id
ORDER BY u.created_at DESC;

-- Check if there are users without tenant mapping
SELECT 
  u.id,
  u.email,
  u.created_at
FROM auth.users u
LEFT JOIN tenant_users tu ON u.id = tu.user_id
WHERE tu.tenant_id IS NULL;

-- Check Prime Tech tenant and its users
SELECT 
  t.id as tenant_id,
  t.business_name,
  t.slug,
  u.email,
  tu.role
FROM tenants t
LEFT JOIN tenant_users tu ON t.id = tu.tenant_id
LEFT JOIN auth.users u ON tu.user_id = u.id
WHERE t.business_name ILIKE '%prime%tech%'
   OR t.slug ILIKE '%prime%tech%';

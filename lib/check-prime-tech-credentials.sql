-- Find Prime Tech Electronics tenant and its users
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  t.slug,
  u.id as user_id,
  u.email,
  u.full_name,
  u.role,
  u.system_role,
  u.is_active
FROM tenants t
LEFT JOIN tenant_users tu ON t.id = tu.tenant_id
LEFT JOIN users u ON tu.user_id = u.id
WHERE t.name ILIKE '%prime%tech%'
   OR t.name ILIKE '%electronics%'
ORDER BY t.created_at DESC, u.email;

-- Also check if there are any users without the tenant_users link
SELECT 
  id,
  email,
  full_name,
  tenant_id,
  role,
  system_role,
  is_active
FROM users
WHERE tenant_id IN (
  SELECT id FROM tenants 
  WHERE name ILIKE '%prime%tech%' 
     OR name ILIKE '%electronics%'
);

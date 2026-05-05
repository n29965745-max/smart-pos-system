-- LINK USER TO PRIME TECH TENANT
-- This will fix the Shop Settings URL issue

-- Insert the mapping between user and Prime Tech tenant
INSERT INTO tenant_users (user_id, tenant_id, role)
VALUES (
  '9947007e-e7d3-4b3e-97ab-e69c0c0a964c',  -- User: samuelmboogo234@gmail.com
  '4b208408-970d-4713-9720-60792e5aa969',  -- Prime Tech Electronics Ltd
  'owner'
)
ON CONFLICT (user_id, tenant_id) DO UPDATE
SET role = 'owner',
    updated_at = NOW();

-- Verify the mapping was created
SELECT 
  u.email,
  tu.role,
  t.business_name,
  t.slug,
  CONCAT('https://your-domain.vercel.app/s/', t.slug) as shop_url
FROM tenant_users tu
JOIN auth.users u ON tu.user_id = u.id
JOIN tenants t ON tu.tenant_id = t.id
WHERE u.email = 'samuelmboogo234@gmail.com';

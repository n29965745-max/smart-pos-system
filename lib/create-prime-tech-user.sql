-- CREATE USER FOR PRIME TECH ELECTRONICS LTD

-- Step 1: Check all existing users
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC;

-- Step 2: Check tenant_users mappings
SELECT 
  tu.user_id,
  tu.tenant_id,
  tu.role,
  u.email,
  t.business_name
FROM tenant_users tu
JOIN auth.users u ON tu.user_id = u.id
JOIN tenants t ON tu.tenant_id = t.id;

-- Step 3: Create a user for Prime Tech (if no users exist)
-- You'll need to create this user through Supabase Auth UI or use this approach:

-- OPTION A: Link an existing user to Prime Tech
-- Replace 'USER_EMAIL_HERE' with an actual user email from Step 1
DO $$
DECLARE
  prime_tech_id UUID;
  user_id_to_link UUID;
BEGIN
  -- Get Prime Tech tenant ID
  SELECT id INTO prime_tech_id
  FROM tenants
  WHERE business_name = 'Prime Tech Electronics Ltd'
  LIMIT 1;

  -- Get the most recent user (or specify an email)
  SELECT id INTO user_id_to_link
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if user already has a tenant mapping
  IF EXISTS (SELECT 1 FROM tenant_users WHERE user_id = user_id_to_link) THEN
    RAISE NOTICE 'User already has a tenant mapping. Updating to Prime Tech...';
    
    UPDATE tenant_users
    SET tenant_id = prime_tech_id,
        role = 'owner'
    WHERE user_id = user_id_to_link;
  ELSE
    -- Create new mapping
    INSERT INTO tenant_users (user_id, tenant_id, role)
    VALUES (user_id_to_link, prime_tech_id, 'owner');
  END IF;

  RAISE NOTICE 'User % linked to Prime Tech tenant %', user_id_to_link, prime_tech_id;
END $$;

-- Step 4: Verify the mapping
SELECT 
  u.email,
  tu.role,
  t.business_name,
  t.slug
FROM tenant_users tu
JOIN auth.users u ON tu.user_id = u.id
JOIN tenants t ON tu.tenant_id = t.id
WHERE t.business_name = 'Prime Tech Electronics Ltd';

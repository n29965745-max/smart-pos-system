-- COMPLETE FIX FOR PRIME TECH URL ISSUE
-- This script will ensure Prime Tech is the default tenant

-- Step 1: Check current tenants
SELECT 
  id,
  business_name,
  slug,
  is_active,
  created_at
FROM tenants
ORDER BY created_at ASC;

-- Step 2: Find Prime Tech tenant ID
DO $$
DECLARE
  prime_tech_id UUID;
  nyla_id UUID;
BEGIN
  -- Get Prime Tech tenant ID
  SELECT id INTO prime_tech_id
  FROM tenants
  WHERE business_name ILIKE '%prime%tech%'
     OR slug ILIKE '%prime%tech%'
  LIMIT 1;

  -- Get Nyla Wigs tenant ID
  SELECT id INTO nyla_id
  FROM tenants
  WHERE business_name ILIKE '%nyla%'
     OR slug ILIKE '%nyla%'
  LIMIT 1;

  -- Deactivate Nyla Wigs temporarily (so it's not returned as first active tenant)
  IF nyla_id IS NOT NULL THEN
    UPDATE tenants
    SET is_active = false
    WHERE id = nyla_id;
    
    RAISE NOTICE 'Deactivated Nyla Wigs tenant: %', nyla_id;
  END IF;

  -- Ensure Prime Tech is active and has correct slug
  IF prime_tech_id IS NOT NULL THEN
    UPDATE tenants
    SET 
      is_active = true,
      slug = 'prime-tech-electronics-ltd',
      updated_at = NOW()
    WHERE id = prime_tech_id;
    
    RAISE NOTICE 'Updated Prime Tech tenant: %', prime_tech_id;
  ELSE
    RAISE EXCEPTION 'Prime Tech tenant not found!';
  END IF;
END $$;

-- Step 3: Verify the fix
SELECT 
  id,
  business_name,
  slug,
  is_active
FROM tenants
WHERE is_active = true
ORDER BY created_at ASC
LIMIT 1;

-- This should now return Prime Tech Electronics Ltd with slug: prime-tech-electronics-ltd

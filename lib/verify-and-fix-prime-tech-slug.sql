-- Verify and fix Prime Tech's slug in database
-- Run this in Supabase SQL Editor

-- Step 1: Check current slug for Prime Tech
SELECT 
  id,
  business_name,
  slug,
  created_at
FROM tenants
WHERE business_name = 'Prime Tech Electronics Ltd';

-- Step 2: If slug is wrong or NULL, update it
UPDATE tenants
SET slug = 'prime-tech-electronics-ltd'
WHERE business_name = 'Prime Tech Electronics Ltd'
AND (slug IS NULL OR slug != 'prime-tech-electronics-ltd');

-- Step 3: Verify the update
SELECT 
  id,
  business_name,
  slug,
  'Should be: prime-tech-electronics-ltd' as expected
FROM tenants
WHERE business_name = 'Prime Tech Electronics Ltd';

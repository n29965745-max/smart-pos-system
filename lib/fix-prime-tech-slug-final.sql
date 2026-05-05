-- Fix Prime Tech Slug - Final Solution
-- Run this in Supabase SQL Editor if the slug is wrong in database

-- Step 1: Check current state
SELECT 
  id,
  business_name,
  slug,
  created_at,
  CASE 
    WHEN slug = 'prime-tech-electronics-ltd' THEN '✅ CORRECT'
    WHEN slug IS NULL THEN '❌ NULL - NEEDS FIX'
    ELSE '❌ WRONG - NEEDS FIX'
  END as status
FROM tenants
WHERE business_name = 'Prime Tech Electronics Ltd';

-- Step 2: Fix the slug if it's wrong or NULL
UPDATE tenants
SET slug = 'prime-tech-electronics-ltd'
WHERE business_name = 'Prime Tech Electronics Ltd'
AND (slug IS NULL OR slug != 'prime-tech-electronics-ltd');

-- Step 3: Verify the fix
SELECT 
  id,
  business_name,
  slug,
  'Expected: prime-tech-electronics-ltd' as expected,
  CASE 
    WHEN slug = 'prime-tech-electronics-ltd' THEN '✅ FIXED!'
    ELSE '❌ STILL WRONG'
  END as result
FROM tenants
WHERE business_name = 'Prime Tech Electronics Ltd';

-- Step 4: Check all tenants to see if there's any confusion
SELECT 
  id,
  business_name,
  slug,
  created_at
FROM tenants
ORDER BY created_at DESC;

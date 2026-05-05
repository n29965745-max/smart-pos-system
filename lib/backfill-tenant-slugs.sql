-- Backfill slugs for existing tenants that don't have one
-- Run this in Supabase SQL Editor

-- Generate slug from business_name for any tenant missing a slug
UPDATE tenants
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(business_name, '[^a-zA-Z0-9]+', '-', 'g'),
    '^-+|-+$', '', 'g'
  )
)
WHERE slug IS NULL OR slug = '';

-- Verify the slugs were created
SELECT id, business_name, slug FROM tenants;

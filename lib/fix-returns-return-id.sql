-- Fix Returns Table - Ensure return_id column is properly configured
-- Run this in Supabase SQL Editor if you continue to have issues

-- 1. Check current structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'returns'
  AND column_name IN ('return_id', 'id', 'tenant_id')
ORDER BY ordinal_position;

-- 2. If return_id column doesn't exist or has wrong type, recreate it
-- (Only run if needed based on results above)

-- Drop the constraint if it exists
ALTER TABLE returns DROP CONSTRAINT IF EXISTS returns_return_id_key;

-- Ensure return_id column exists and is TEXT
DO $$ 
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'returns' AND column_name = 'return_id'
  ) THEN
    -- Add the column if it doesn't exist
    ALTER TABLE returns ADD COLUMN return_id TEXT;
  END IF;
  
  -- Make sure it's NOT NULL
  ALTER TABLE returns ALTER COLUMN return_id SET NOT NULL;
END $$;

-- Add unique constraint
ALTER TABLE returns ADD CONSTRAINT returns_return_id_key UNIQUE (return_id);

-- 3. Update any existing NULL return_id values
UPDATE returns 
SET return_id = 'RET-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))
WHERE return_id IS NULL;

-- 4. Verify the fix
SELECT 
  COUNT(*) as total_returns,
  COUNT(return_id) as returns_with_id,
  COUNT(*) - COUNT(return_id) as null_return_ids
FROM returns;

-- 5. Show recent returns
SELECT id, return_id, transaction_id, customer_name, product_name, status, created_at
FROM returns
ORDER BY created_at DESC
LIMIT 5;

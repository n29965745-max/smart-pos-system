-- Check the actual structure of the returns table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns
WHERE table_name = 'returns'
ORDER BY ordinal_position;

-- Check if there are any returns with null return_id
SELECT COUNT(*) as null_return_id_count
FROM returns
WHERE return_id IS NULL;

-- Check recent returns
SELECT id, return_id, transaction_id, customer_name, product_name, created_at
FROM returns
ORDER BY created_at DESC
LIMIT 5;

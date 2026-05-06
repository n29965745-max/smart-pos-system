-- Check all cart items in the database
SELECT 
  id,
  session_id,
  tenant_id,
  product_id,
  product_name,
  quantity,
  unit_price,
  subtotal,
  created_at
FROM cart_items
ORDER BY created_at DESC
LIMIT 20;

-- Check if there are cart items without tenant_id
SELECT COUNT(*) as items_without_tenant
FROM cart_items
WHERE tenant_id IS NULL;

-- Check cart items grouped by tenant
SELECT 
  tenant_id,
  COUNT(*) as item_count,
  COUNT(DISTINCT session_id) as session_count
FROM cart_items
GROUP BY tenant_id;

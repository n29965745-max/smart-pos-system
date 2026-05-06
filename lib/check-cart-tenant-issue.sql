-- Check cart items and their tenant_id values
SELECT 
  id,
  session_id,
  product_id,
  product_name,
  quantity,
  tenant_id,
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

-- Check recent sessions
SELECT DISTINCT 
  session_id,
  tenant_id,
  COUNT(*) as items,
  MAX(created_at) as last_updated
FROM cart_items
GROUP BY session_id, tenant_id
ORDER BY last_updated DESC
LIMIT 10;

-- IMPORTANT: Run this in Supabase SQL Editor
-- This will delete ALL cart items that don't have a tenant_id
-- These are old items from before tenant isolation was added

-- First, check how many items will be deleted
SELECT COUNT(*) as items_to_delete
FROM cart_items
WHERE tenant_id IS NULL;

-- If you're okay with deleting them, uncomment and run this:
-- DELETE FROM cart_items WHERE tenant_id IS NULL;

-- After deleting, verify all remaining items have tenant_id:
-- SELECT COUNT(*) as items_with_tenant FROM cart_items WHERE tenant_id IS NOT NULL;
-- SELECT COUNT(*) as items_without_tenant FROM cart_items WHERE tenant_id IS NULL;

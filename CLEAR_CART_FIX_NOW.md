# 🔧 Fix POS Checkout - Clear Old Cart Items

## The Problem

You're getting **Status 400** errors when trying to complete a sale. This is likely because:

1. Old cart items exist in the database WITHOUT `tenant_id` (from before the fix)
2. New cart items are being added WITH `tenant_id`
3. The checkout API now filters by `tenant_id`, so it can't see the old items

## Solution: Clear Old Cart Items

### Step 1: Check Cart Items in Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/xqnteamrznvoqgaazhpu
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste this SQL:

```sql
-- Check all cart items
SELECT 
  id,
  session_id,
  tenant_id,
  product_name,
  quantity,
  created_at
FROM cart_items
ORDER BY created_at DESC;
```

5. Click **Run**
6. **Look at the `tenant_id` column** - if you see `NULL` values, those are old items

### Step 2: Delete Old Cart Items

If you see items with `tenant_id = NULL`, delete them:

1. In the same SQL Editor, run this:

```sql
-- Delete all cart items without tenant_id
DELETE FROM cart_items WHERE tenant_id IS NULL;
```

2. Click **Run**

### Step 3: Test Again

1. Go back to your POS page
2. **Refresh the page** (Ctrl+F5 or Cmd+Shift+R)
3. Add items to cart
4. Try to complete the sale

It should work now!

## Alternative: Clear ALL Cart Items

If you want to start fresh, you can delete ALL cart items:

```sql
-- Delete ALL cart items (fresh start)
DELETE FROM cart_items;
```

This won't affect any completed transactions - only items currently in carts.

## Why This Happened

When we added tenant isolation to the cart API, it started adding `tenant_id` to new cart items. But old items in the database don't have `tenant_id`, so the checkout API (which now filters by `tenant_id`) can't see them.

---

**After clearing old items, the checkout will work perfectly!**

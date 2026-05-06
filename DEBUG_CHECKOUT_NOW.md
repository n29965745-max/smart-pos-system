# 🔍 Debug POS Checkout Issue

## Step 1: Check Cart Items in Database

Run this SQL in Supabase SQL Editor:

```sql
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
```

**What to look for:**
- Are there cart items?
- Do they have `tenant_id` values?
- What `session_id` values do you see?

---

## Step 2: Use Debug Endpoint

1. Open your POS page
2. Add items to cart
3. Note the session ID from browser console (or check Network tab)
4. Open this URL in a new tab:

```
https://your-site.vercel.app/api/pos/debug-checkout?sessionId=YOUR_SESSION_ID
```

Replace `YOUR_SESSION_ID` with the actual session ID from your POS page.

**What the debug endpoint shows:**
- Your tenant ID
- Cart items with tenant filter
- Cart items without tenant filter
- Whether there's a mismatch

---

## Step 3: Check Browser Console

1. Open POS page
2. Open browser DevTools (F12)
3. Go to Console tab
4. Add items to cart
5. Try to checkout
6. Look for any error messages

---

## Step 4: Check Network Tab

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try to complete a sale
4. Find the `/api/pos/checkout` request
5. Click on it
6. Check the Response tab
7. **Copy the exact error message and send it to me**

---

## Common Issues:

### Issue 1: Cart items have NULL tenant_id
**Solution:** Clear cart and re-add items after the fix is deployed

```sql
-- Clear all cart items
DELETE FROM cart_items;
```

### Issue 2: Session ID mismatch
**Solution:** Clear browser cache and reload POS page

### Issue 3: User not logged in properly
**Solution:** Log out and log back in

---

## Quick Fix: Clear Cart

If you want to start fresh, run this in Supabase:

```sql
-- Clear all cart items for your tenant
DELETE FROM cart_items 
WHERE tenant_id = 'YOUR_TENANT_ID';

-- Or clear ALL cart items (if you're the only user)
DELETE FROM cart_items;
```

---

## Send Me This Info:

1. Screenshot of cart items from SQL query (Step 1)
2. Response from debug endpoint (Step 2)
3. Error message from Network tab (Step 4)

This will help me identify the exact issue!

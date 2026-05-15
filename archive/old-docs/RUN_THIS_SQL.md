# Restore All Original Data (121 Products + 54 Customers)

## Quick Steps:

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.REDACTED_APP_SECRET
   - Login if needed

2. **Copy the SQL**
   - Open file: `restore-all-original-data.sql` (in this folder)
   - Select ALL content (Ctrl + A)
   - Copy it (Ctrl + C)

3. **Run in Supabase**
   - Paste into SQL Editor (Ctrl + V)
   - Click "Run" button
   - Wait for "Success" message

4. **Verify**
   - You should see:
     - `total_products: 121`
     - `total_customers: 54`

5. **Refresh Your App**
   - Go to: https://smart-pos-system-peach.vercel.app
   - Hard refresh: `Ctrl + Shift + R`
   - Check inventory page - should show 121 products

## What This Does:
- Deletes the 3 test products (TEST-001, TEST-002, TEST-003)
- Inserts all 121 original products with correct stock quantities
- Inserts all 54 original customers
- Uses the `stock` field values (not the zero `stock_quantity`)

## File Location:
`restore-all-original-data.sql` - 175 total rows (121 products + 54 customers)

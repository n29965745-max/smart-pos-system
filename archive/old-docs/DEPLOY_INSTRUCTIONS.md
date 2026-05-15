# 🚀 DEPLOYMENT INSTRUCTIONS - COMPLETE DATABASE RESTORATION

## Current Status
✅ Database restored with 121 products, 54 customers, 18 returns, 10 expenses, 4 debts, 1 shop settings
✅ All API files updated to use centralized Supabase client
✅ Environment variables configured in Vercel
⚠️ Missing `sales_transactions` table causing dashboard to show empty

## STEP 1: Create Missing Tables in Supabase

1. Go to Supabase Dashboard: https://supabase.REDACTED_APP_SECRET
2. Click "SQL Editor" in left sidebar
3. Copy and paste the entire content of `CREATE_MISSING_TABLES.sql`
4. Click "Run" button
5. Verify you see: "✅ Missing tables created successfully!"

## STEP 2: Verify Environment Variables in Vercel

Go to: https://vercel.com/brunowachira001-coders-projects/smart-pos-system-peach/settings/environment-variables

Ensure these are set:
- `NEXT_PUBLIC_SUPABASE_URL` = `https://xqnteamrznvoqgaazhpu.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (your anon key)
- `SUPABASE_SERVICE_ROLE_KEY` = (your service role key - optional)

## STEP 3: Deploy to Vercel

The code changes are ready. Now commit and push:

```bash
git add .
git commit -m "Fix: Update all APIs to use centralized Supabase client"
git push origin main
```

Vercel will auto-deploy in 2-3 minutes.

## STEP 4: Test After Deployment

After deployment completes, test these pages:

1. **Dashboard** - https://smart-pos-system-peach.vercel.app/dashboard
   - Should show: 121 products, 54 customers, 0 transactions (empty is OK for now)
   
2. **Inventory** - https://smart-pos-system-peach.vercel.app/inventory
   - Should show: All 121 products with stock levels
   
3. **Customers** - https://smart-pos-system-peach.vercel.app/customers
   - Should show: All 54 customers
   
4. **Returns** - https://smart-pos-system-peach.vercel.app/returns
   - Should show: All 18 returns
   
5. **Expenses** - https://smart-pos-system-peach.vercel.app/expenses
   - Should show: All 10 expenses
   
6. **Debts** - https://smart-pos-system-peach.vercel.app/debts
   - Should show: All 4 debts
   
7. **Shop Settings** - https://smart-pos-system-peach.vercel.app/shop-settings
   - Should show: Nyla Wigs shop information

## What Was Fixed

1. ✅ Created `CREATE_MISSING_TABLES.sql` to add sales_transactions, transaction_items, cart_items tables
2. ✅ Updated `lib/supabase.ts` to use proper environment variables with fallback
3. ✅ Updated `lib/supabase-client.ts` to use service role key when available
4. ✅ Updated 10+ API files to use centralized Supabase client:
   - pages/api/inventory/adjust.ts
   - pages/api/inventory/restock.ts
   - pages/api/inventory/index.ts
   - pages/api/pos/checkout.ts
   - pages/api/pos/cart.ts
   - pages/api/customers/index.ts
   - pages/api/shop-settings/index.ts

## Expected Behavior After Fix

- Dashboard will load without errors (transactions will be 0 until you make sales)
- All inventory pages will show the 121 restored products
- Customer page will show all 54 customers
- Returns page will show all 18 returns
- Expenses page will show all 10 expenses
- Debts page will show all 4 debts
- Shop settings will show "Nyla Wigs" information
- POS system will be ready to create new transactions

## Troubleshooting

If pages still show empty after deployment:

1. Hard refresh browser: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
2. Check browser console for errors (F12 → Console tab)
3. Test API directly: https://smart-pos-system-peach.vercel.app/api/test-db-connection
4. Verify Vercel deployment completed successfully
5. Check Vercel logs for any errors

## Next Steps After Successful Deployment

1. Test POS checkout to create first transaction
2. Verify transaction appears on dashboard
3. Test all CRUD operations (Create, Read, Update, Delete)
4. Add product images if needed
5. Configure receipt printing if needed

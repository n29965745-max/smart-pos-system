# ✅ FIXED! Use: COMPLETE_WORKING_RESTORE.sql

## What Was Wrong
Returns and debts referenced customer IDs that don't exist in the customer list.

## What's Fixed
**COMPLETE_WORKING_RESTORE.sql** now sets `customer_id` to NULL for any returns/debts where the customer doesn't exist in our export. The customer_name is still preserved, so you can see who the return/debt was for.

## File Location
```
/home/bruno/Desktop/COMPLETE_WORKING_RESTORE.sql
```

## How to Use (3 Steps)

### Step 1: Open
```bash
gedit COMPLETE_WORKING_RESTORE.sql
```

### Step 2: Copy All (Ctrl + A, then Ctrl + C)

### Step 3: Run in Supabase
1. Go to: https://supabase.REDACTED_APP_SECRET
2. Click "New Query"
3. Paste (Ctrl + V)
4. Click "Run"
5. Wait 10-15 seconds

## What You'll Get
✅ 121 Products
✅ 54 Customers
✅ 18 Returns (customer_id set to NULL where customer doesn't exist, but customer_name preserved)
✅ 10 Expenses
✅ 4 Debts (customer_id set to NULL where customer doesn't exist, but customer_name preserved)
✅ 1 Shop Settings (Nyla Wigs)

## After Running
Hard refresh your dashboard: Ctrl + Shift + R

All your data will be there!

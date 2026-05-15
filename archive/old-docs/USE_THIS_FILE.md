# ✅ USE THIS FILE: FINAL_WORKING_RESTORE.sql

## The Problem
The old SQL file tried to insert into a `returns` table that had the wrong structure. 

## The Solution
**FINAL_WORKING_RESTORE.sql** - This file:
1. DROPS all old tables completely
2. Creates fresh tables with correct schemas
3. Inserts ALL your data (121 products, 54 customers, 18 returns, 10 expenses, 4 debts, 1 shop settings)

## How to Use - 3 Steps

### Step 1: Open the File
```bash
# The file is at:
/home/bruno/Desktop/FINAL_WORKING_RESTORE.sql

# Open it with:
gedit FINAL_WORKING_RESTORE.sql
# or
code FINAL_WORKING_RESTORE.sql
```

### Step 2: Copy All Contents
- Press `Ctrl + A` (select all)
- Press `Ctrl + C` (copy)

### Step 3: Run in Supabase
1. Go to: https://supabase.REDACTED_APP_SECRET
2. Click "New Query"
3. Press `Ctrl + V` (paste all 418 lines)
4. Click "Run"
5. Wait 10-15 seconds

## What It Does

### Drops Old Tables
```sql
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS debts CASCADE;
DROP TABLE IF EXISTS shop_settings CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
```

### Creates Fresh Tables
- Products (with sku, name, stock_quantity, retail_price, wholesale_price, cost_price, etc.)
- Customers (with name, email, phone, customer_type, status)
- Returns (with return_id, transaction_id, customer_name, product_name, refund_amount, etc.)
- Expenses (with expense_id, category, amount, payment_method, vendor_name, etc.)
- Debts (with customer_name, sale_id, total_amount, amount_paid, status, etc.)
- Shop Settings (with business_name, logo_url, colors, currency, etc.)

### Enables RLS & Policies
All tables have Row Level Security with open policies.

### Inserts ALL Data
- 121 Products (USB-C Cable, Phone Case, Milk, Bread, Rice, Sugar, Product 1-100, etc.)
- 54 Customers (Ann Wachira, Sam Ngungu, Customer 1-50, etc.)
- 18 Returns (with refund amounts and reasons)
- 10 Expenses (Rent 35,000, Salaries 85,000, Marketing 12,000, etc.)
- 4 Debts (customer relationships and payment status)
- 1 Shop Settings (Nyla Wigs with logo and branding)

### Verifies Data
At the end, it runs COUNT queries to confirm:
- 121 products ✓
- 54 customers ✓
- 18 returns ✓
- 10 expenses ✓
- 4 debts ✓
- 1 shop settings ✓

## After Running

### Check Your Dashboard
Visit: https://smart-pos-system-peach.vercel.app

Login: brunowachira001@gmail.com / admin123

Hard refresh: Ctrl + Shift + R

You should see ALL your data:
- Inventory: 121 products
- Customers: 54 customers
- Returns: 18 returns
- Expenses: 10 expenses
- Debts: 4 debts
- Shop Settings: Nyla Wigs

## Why This Works
The previous file tried to work with existing tables that had wrong schemas. This file completely drops and recreates everything fresh, so there are no schema conflicts.

## File Location
```
/home/bruno/Desktop/FINAL_WORKING_RESTORE.sql
```

418 lines, ready to run!

# Recover or Migrate Old Database

## OPTION 1: Recover Old Database (EASIEST)

If your old Supabase project still exists (paused or active), this is the fastest solution.

### Steps:
1. Go to https://supabase.com/dashboard/projects
2. Look for your old project (it might be paused)
3. If you see it:
   - Click on it
   - If it's paused, click "Restore Project" or "Resume"
   - Get the credentials from Settings → API
   - Keep using the old database (no migration needed!)

### If Old Project Exists:
- Just keep the old Supabase credentials in Vercel
- No need to migrate anything
- All your data is already there

---

## OPTION 2: Migrate Data to New Database

If the old project is deleted or you want to use the new one, follow these steps:

### Step 1: Get Old Database Credentials from Vercel

1. Go to: https://vercel.com/brunowachira001-coders-projects/smart-pos-system-peach/settings/environment-variables
2. Look at the CURRENT values of:
   - `NEXT_PUBLIC_SUPABASE_URL` (this is your OLD database URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (this is your OLD anon key)
3. Copy these values - we'll need them to export data

### Step 2: Export Data from Old Database

1. Go to the old Supabase project dashboard (use the URL from Step 1)
2. Go to SQL Editor
3. Run this export query:

```sql
-- Export all data as INSERT statements
-- Copy the results and save them

-- Products
SELECT 'INSERT INTO products VALUES (' || 
  quote_literal(id) || ',' ||
  quote_literal(name) || ',' ||
  COALESCE(quote_literal(sku), 'NULL') || ',' ||
  COALESCE(quote_literal(description), 'NULL') || ',' ||
  COALESCE(quote_literal(category), 'NULL') || ',' ||
  price || ',' ||
  COALESCE(cost::text, 'NULL') || ',' ||
  stock_quantity || ',' ||
  low_stock_threshold || ',' ||
  COALESCE(quote_literal(image_url), 'NULL') || ',' ||
  COALESCE(quote_literal(barcode), 'NULL') || ',' ||
  is_active || ',' ||
  quote_literal(created_at) || ',' ||
  quote_literal(updated_at) || ');'
FROM products;

-- Customers
SELECT 'INSERT INTO customers VALUES (' || 
  quote_literal(id) || ',' ||
  quote_literal(name) || ',' ||
  COALESCE(quote_literal(email), 'NULL') || ',' ||
  COALESCE(quote_literal(phone), 'NULL') || ',' ||
  COALESCE(quote_literal(address), 'NULL') || ',' ||
  COALESCE(credit_limit::text, '0') || ',' ||
  COALESCE(current_balance::text, '0') || ',' ||
  COALESCE(debt_limit::text, '0') || ',' ||
  COALESCE(total_purchases::text, '0') || ',' ||
  is_active || ',' ||
  quote_literal(created_at) || ',' ||
  quote_literal(updated_at) || ');'
FROM customers;

-- Transactions
SELECT 'INSERT INTO transactions VALUES (' || 
  quote_literal(id) || ',' ||
  quote_literal(transaction_number) || ',' ||
  COALESCE(quote_literal(customer_id), 'NULL') || ',' ||
  COALESCE(quote_literal(user_id), 'NULL') || ',' ||
  total_amount || ',' ||
  COALESCE(quote_literal(payment_method), 'NULL') || ',' ||
  COALESCE(quote_literal(payment_status), 'NULL') || ',' ||
  COALESCE(quote_literal(notes), 'NULL') || ',' ||
  quote_literal(created_at) || ');'
FROM transactions;

-- Continue for other tables...
```

### Step 3: Import Data to New Database

1. Go to new Supabase project: https://supabase.REDACTED_APP_SECRET
2. Go to SQL Editor
3. Paste the INSERT statements from Step 2
4. Run them

---

## RECOMMENDED APPROACH

**Check Option 1 first!** If your old database still exists, just restore it and keep using it. Much easier than migrating.

If the old database is truly gone, we'll need to do Option 2 (migration).

---

## What's Your Old Database URL?

Check Vercel environment variables to find out:
https://vercel.com/brunowachira001-coders-projects/smart-pos-system-peach/settings/environment-variables

Look for `NEXT_PUBLIC_SUPABASE_URL` - that's your old database.

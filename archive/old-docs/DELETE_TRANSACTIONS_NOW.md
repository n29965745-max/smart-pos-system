# Delete All Transactions - Run This SQL Now

## Instructions

1. Go to Supabase Dashboard: https://supabase.REDACTED_APP_SECRET
2. Click on "SQL Editor" in the left sidebar
3. Copy and paste this SQL:

```sql
-- DELETE ALL TRANSACTIONS AND TRANSACTION ITEMS
DELETE FROM transaction_items;
DELETE FROM transactions;

-- Verify deletion
SELECT COUNT(*) as remaining_transactions FROM transactions;
SELECT COUNT(*) as remaining_transaction_items FROM transaction_items;
```

4. Click "Run" button
5. You should see: remaining_transactions = 0, remaining_transaction_items = 0

## What This Does

- Removes all 6 demo transactions that have NULL product_ids
- Removes all their transaction_items
- Clears the confusing 3560 revenue from dashboard
- Fresh start for real sales with proper profit tracking

## After Running

- Dashboard will show 0 revenue and 0 profit (correct!)
- Make a new sale through POS
- New sales will track profit correctly because they'll have real product_ids

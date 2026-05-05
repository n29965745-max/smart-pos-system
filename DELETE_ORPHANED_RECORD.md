# Delete Orphaned Shop Settings Record

## What You Saw

Your SQL query showed:
- ❌ **NULL tenant** with "Nyla Wigs" settings - **NEEDS FIX**
- ✅ **Nyla Wigs** tenant with "Nyla Wigs" settings - **OK**
- ✅ **Prime Tech** tenant with "Prime Tech" settings - **OK**

The first row is an orphaned duplicate that needs to be deleted.

---

## ✅ Run This SQL to Fix

Copy this into Supabase SQL Editor:

```sql
-- Delete the orphaned record (the one with NULL tenant_id)
DELETE FROM shop_settings
WHERE tenant_id IS NULL;

-- Verify it's gone
SELECT 
  t.business_name as tenant,
  s.business_name as settings,
  CASE WHEN s.tenant_id IS NULL THEN '❌ NEEDS FIX' ELSE '✅ OK' END as status
FROM shop_settings s
LEFT JOIN tenants t ON s.tenant_id = t.id;
```

---

## ✅ What You Should See After

Only 2 rows, both with "✅ OK":
- Nyla Wigs → Nyla Wigs (OK)
- Prime Tech Electronics Ltd → Prime Tech Electronics Ltd (OK)

---

## 🔄 Then Test Shop Settings

1. Refresh Shop Settings page (`Ctrl+F5`)
2. Try editing settings
3. Should work perfectly now!

---

## Why This Happened

The orphaned record was created before the multi-tenant migration. It has no `tenant_id`, so the API can't access it. Since you already have a properly linked Nyla Wigs record, the orphaned one is just a duplicate and can be safely deleted.

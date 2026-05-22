# Tenant Isolation - Next Steps

## Current Status ✅

**RLS Security Fix Applied Successfully**
- ✅ RLS enabled on `sms_config`, `automation_rules`, `ai_message_analytics`
- ✅ Authenticated-only policies created
- ✅ Service role policies created (backend access)
- ✅ Anonymous access revoked
- ✅ All 3 tables now have proper Row Level Security

**Script Applied:** `lib/fix-supabase-security-simple.sql`

---

## Next Step: Add Tenant Isolation 🎯

You confirmed you want to add tenant isolation (tenant_id columns) to these tables. This will ensure each tenant can only see their own SMS configurations, automation rules, and analytics.

### Script to Apply:
**File:** `lib/add-tenant-isolation-to-sms-tables.sql`

### What This Script Does:
1. ✅ Adds `tenant_id` column to all 3 tables
2. ✅ Backfills existing data with first tenant ID
3. ✅ Makes `tenant_id` NOT NULL (required)
4. ✅ Adds indexes for performance
5. ✅ Replaces authenticated policies with tenant isolation policies
6. ✅ Keeps service_role access for backend operations

---

## How to Apply the Script

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project: https://supabase.com/dashboard/project/xqnteamrznvoqgaazhpu
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `lib/add-tenant-isolation-to-sms-tables.sql`
5. Paste into the SQL editor
6. Click "Run" button
7. Check the output for success messages

### Option 2: Command Line
```bash
# Make sure you have your database URL
psql $DATABASE_URL -f lib/add-tenant-isolation-to-sms-tables.sql
```

---

## What Happens After Running the Script

### Immediate Changes:
- All 3 tables will have `tenant_id` column
- Existing data will be assigned to your first tenant
- New RLS policies will enforce tenant isolation
- Each tenant can only see their own data

### Verification Output:
The script will show:
- ✓ Tenant columns added and made NOT NULL
- ✓ Indexes created
- ✓ Policies created
- ✓ Record counts per tenant

---

## Application Code Changes Required

After applying the script, you need to update your backend code to set the tenant context:

### In Your API Routes:
```typescript
// Before querying these tables, set the tenant context
await supabase.rpc('set_config', {
  setting: 'app.current_tenant_id',
  value: tenantId
});

// Then your queries will automatically filter by tenant
const { data } = await supabase
  .from('sms_config')
  .select('*');
// Returns only this tenant's SMS config
```

### Alternative: Use Service Role Key
If you're using the service_role key (backend operations), you have full access to all tenants' data. The RLS policies don't apply to service_role.

---

## Testing After Migration

### 1. Verify Tenant Isolation:
```sql
-- Check that data is assigned to tenants
SELECT 
  'sms_config' as table_name,
  tenant_id,
  COUNT(*) as record_count
FROM public.sms_config
GROUP BY tenant_id;
```

### 2. Test Application:
- Log in as a user from Tenant A
- Verify you can see SMS config
- Log in as a user from Tenant B
- Verify you CANNOT see Tenant A's SMS config

### 3. Check Supabase Dashboard:
- Go to "Database" → "Policies"
- Verify policies exist for all 3 tables
- Check that security issues are resolved

---

## Rollback Plan (If Needed)

If something goes wrong, you can rollback:

```sql
-- Remove tenant_id columns
ALTER TABLE public.sms_config DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.automation_rules DROP COLUMN IF EXISTS tenant_id;
ALTER TABLE public.ai_message_analytics DROP COLUMN IF EXISTS tenant_id;

-- Restore authenticated policies
CREATE POLICY sms_config_authenticated_all ON public.sms_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY automation_rules_authenticated_all ON public.automation_rules
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY ai_message_analytics_authenticated_all ON public.ai_message_analytics
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## Summary

**Current State:**
- ✅ RLS enabled (basic security)
- ⏳ Tenant isolation pending (multi-tenant security)

**Next Action:**
Run `lib/add-tenant-isolation-to-sms-tables.sql` in Supabase SQL Editor

**Expected Result:**
- ✅ Full tenant isolation
- ✅ Each tenant sees only their own data
- ✅ All Supabase security issues resolved

---

**Ready to proceed?** Just run the script in Supabase SQL Editor and let me know if you see any errors!

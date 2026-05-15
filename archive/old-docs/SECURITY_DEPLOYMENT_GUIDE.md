# 🚀 SECURITY FIX DEPLOYMENT GUIDE

## Overview
This guide walks through deploying the security fixes to production safely.

## ⚠️ PRE-DEPLOYMENT CHECKLIST

### 1. Environment Variables
Ensure these are set in production (Vercel/your hosting):

```bash
# Required for HMAC token signing
JWT_SECRET=REDACTED

# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

**Generate JWT_SECRET=REDACTED
```bash
# Generate a secure 64-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Database Schema
Verify all tables have `tenant_id` column:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.columns 
WHERE column_name = 'tenant_id' 
AND table_schema = 'public';

-- Add tenant_id if missing (example)
ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
-- ... repeat for all tables
```

### 3. Row Level Security (RLS)
Enable RLS on all tables:

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_automations ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy (example for products)
CREATE POLICY "Tenant isolation" ON products
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Repeat for all tables
```

## 📋 DEPLOYMENT STEPS

### Step 1: Complete Route Migration

Run the migration script:
```bash
./scripts/migrate-remaining-routes.sh
```

This will:
- Migrate all `withAuth` routes to `secureRoute`
- Replace `supabaseAdmin` with `getAdminDb()`
- Update type definitions

### Step 2: Manual Tenant Filtering

For each migrated route, manually add tenant filtering:

**Before:**
```typescript
const { data } = await db.from('products').select('*');
```

**After:**
```typescript
const { tenantId } = req;
const { data } = await db
  .from('products')
  .select('*')
  .eq('tenant_id', tenantId); // ADD THIS
```

**For inserts:**
```typescript
const { data } = await db
  .from('products')
  .insert({
    name: 'Product',
    tenant_id: tenantId // ADD THIS
  });
```

### Step 3: Build and Test Locally

```bash
# Install dependencies
npm install

# Build
npm run build

# Check for TypeScript errors
npm run type-check

# Start dev server
npm run dev

# In another terminal, run security tests
TEST_URL=http://localhost:3000 \
TEST_TOKEN=<get-from-login> \
node scripts/security-validation-tests.js
```

### Step 4: Fix Any Errors

Common issues:
- Missing `tenant_id` in queries
- Incorrect type usage (`AuthenticatedRequest` → `SecureRequest`)
- Missing `getAdminDb()` import
- Supabase client usage instead of admin client

### Step 5: Deploy to Staging

```bash
# Commit changes
git add .
git commit -m "security: implement authentication and tenant isolation"

# Push to staging branch
git push origin staging

# Deploy to staging environment
vercel --prod --scope=staging
```

### Step 6: Run Security Tests on Staging

```bash
# Get a valid token by logging in
curl -X POST https://staging.your-app.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}'

# Run tests
TEST_URL=https://staging.your-app.com \
TEST_TOKEN=<token-from-login> \
node scripts/security-validation-tests.js
```

Expected output:
```
✅ Passed: 15
❌ Failed: 0
📝 Total:  15

✅ ALL SECURITY TESTS PASSED
```

### Step 7: Manual Testing

Test critical flows:
1. **Login** - Verify token is returned
2. **POS Checkout** - Complete a sale
3. **Product Management** - Create/edit products
4. **Customer Management** - Add customers
5. **Reports** - View dashboard
6. **Settings** - Update shop settings

For each, verify:
- ✅ Works with valid token
- ❌ Fails without token (401)
- ❌ Cannot access other tenant's data

### Step 8: Deploy to Production

```bash
# Merge to main
git checkout main
git merge staging
git push origin main

# Deploy to production
vercel --prod

# Or if using Vercel Git integration, it will auto-deploy
```

### Step 9: Post-Deployment Verification

```bash
# Run security tests on production
TEST_URL=https://your-app.com \
TEST_TOKEN=<production-token> \
node scripts/security-validation-tests.js
```

### Step 10: Monitor

Watch for:
- 401 errors (authentication failures)
- 403 errors (authorization failures)
- Unusual access patterns
- Failed login attempts

```bash
# Vercel logs
vercel logs --follow

# Or check your logging service
```

## 🔧 ROLLBACK PLAN

If issues occur:

### Quick Rollback (Vercel)
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback <previous-deployment-url>
```

### Manual Rollback
```bash
# Revert commit
git revert HEAD
git push origin main

# Redeploy
vercel --prod
```

## 🧪 SECURITY VALIDATION CHECKLIST

After deployment, verify:

- [ ] ❌ Cannot access `/api/pos/checkout` without token
- [ ] ❌ Cannot access `/api/products/index` without token
- [ ] ❌ Cannot access `/api/shop-settings/index` without token
- [ ] ❌ Forged tokens are rejected
- [ ] ❌ Expired tokens are rejected
- [ ] ❌ Cannot access other tenant's data
- [ ] ✅ Valid tokens work correctly
- [ ] ✅ Login returns valid token
- [ ] ✅ All business flows work
- [ ] ✅ RLS policies are active

## 📊 MONITORING

### Key Metrics to Watch

1. **Authentication Rate**
   - Track 401 responses
   - Alert if >5% of requests

2. **Authorization Failures**
   - Track 403 responses
   - Investigate any occurrences

3. **Token Validation**
   - Monitor token verification failures
   - Alert on suspicious patterns

4. **Cross-Tenant Attempts**
   - Log any tenant_id mismatches
   - Alert immediately

### Logging

Add to your monitoring:
```typescript
// In secureRoute
console.log({
  timestamp: new Date().toISOString(),
  userId: user.userId,
  tenantId: user.tenantId,
  endpoint: req.url,
  method: req.method,
  ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress
});
```

## 🚨 INCIDENT RESPONSE

If security breach detected:

1. **Immediate:**
   - Rotate JWT_SECRET
   - Invalidate all tokens
   - Force re-login

2. **Investigation:**
   - Review access logs
   - Identify affected tenants
   - Assess data exposure

3. **Remediation:**
   - Patch vulnerability
   - Notify affected users
   - Document incident

4. **Prevention:**
   - Add additional monitoring
   - Implement rate limiting
   - Schedule security audit

## 📞 SUPPORT

### Common Issues

**Issue:** "JWT_SECRET must be set"
**Fix:** Add JWT_SECRET to environment variables

**Issue:** "Cannot find module 'secure-route'"
**Fix:** Check import path is correct for file depth

**Issue:** "tenant_id column does not exist"
**Fix:** Run database migration to add column

**Issue:** "User not found" on valid login
**Fix:** Verify users table has tenant_id populated

### Getting Help

1. Check `SECURITY_FIX_SUMMARY.md`
2. Review `lib/secure-route.ts` implementation
3. Check example: `pages/api/users/index.ts`
4. Run diagnostics: `npm run build`

## ✅ SUCCESS CRITERIA

Deployment is successful when:

1. ✅ All security tests pass
2. ✅ No 401/403 errors for valid users
3. ✅ All business flows work
4. ✅ No cross-tenant data leakage
5. ✅ Monitoring shows normal patterns
6. ✅ No user complaints
7. ✅ Performance is acceptable

## 📅 POST-DEPLOYMENT

### Week 1:
- Monitor logs daily
- Review security metrics
- Address any issues

### Week 2:
- Conduct security audit
- Review RLS policies
- Optimize performance

### Month 1:
- Schedule penetration test
- Review incident response plan
- Update documentation

---

**Last Updated:** May 4, 2026
**Version:** 1.0
**Status:** Ready for Deployment

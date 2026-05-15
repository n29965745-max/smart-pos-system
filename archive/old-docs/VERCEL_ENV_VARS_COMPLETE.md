# ✅ Add These Environment Variables to Vercel NOW

## Step 1: Go to Vercel Dashboard
https://vercel.com/your-project/settings/environment-variables

## Step 2: Add Each Variable Below

**IMPORTANT**: For each variable, select **Production**, **Preview**, AND **Development** environments.

---

### Database & Supabase (CRITICAL - Required for Login)

```
NEXT_PUBLIC_SUPABASE_URL
https://xqnteamrznvoqgaazhpu.supabase.co
```

```
NEXT_PUBLIC_SUPABASE_ANON_KEY
REDACTED_JWT_TOKEN
```

```
SUPABASE_SERVICE_ROLE_KEY
REDACTED_JWT_TOKEN
```

```
DATABASE_URL
postgresql://postgres.xqnteamrznvoqgaazhpu:REDACTED_DB_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

---

### Security Keys (CRITICAL)

```
JWT_SECRET
REDACTED_APP_SECRET
```

```
JWT_REFRESH_SECRET
REDACTED_APP_SECRET
```

```
ENCRYPTION_KEY
REDACTED_APP_SECRET
```

---

### Redis

```
REDIS_URL
redis://default:REDACTED_REDIS_PASSWORD@free-pig-97875.upstash.io:6379
```

---

### Application Settings

```
NODE_ENV
production
```

```
SMS_TEST_MODE
false
```

```
SMS_PROVIDER
celcom
```

```
CRON_SECRET
REDACTED_CRON_SECRET
```

---

### SMS Providers

**Africa's Talking:**
```
AFRICASTALKING_USERNAME
NYLAWIGS
```

```
AFRICASTALKING_API_KEY
REDACTED_AFRICASTALKING_KEY
```

**Celcom Africa (Active):**
```
CELCOM_API_KEY
REDACTED_HEX_SECRET
```

```
CELCOM_PARTNER_ID
36
```

```
CELCOM_SENDER_ID
TEXTME
```

**SMS Leopard (Backup):**
```
SMSLEOPARD_ACCESS_TOKEN
REDACTED_APP_SECRET
```

```
SMSLEOPARD_SENDER_ID
NYLAWIGS
```

**Mobitech (Backup):**
```
MOBITECH_API_KEY
REDACTED_APP_SECRET
```

```
MOBITECH_ACCOUNT
MT6896
```

```
MOBITECH_SENDER_ID
FULL_CIRCLE
```

---

## Step 3: Trigger Redeploy

After adding ALL variables:

1. Go to **Deployments** tab
2. Click the **three dots** on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete (2-3 minutes)

---

## Step 4: Test Login

Once redeployed, go to your site and try logging in. The "Unexpected token" error should be gone!

---

## Why This Fixes the Login Error

The login API (`/api/auth/login`) uses `getAdminDb()` which requires `SUPABASE_SERVICE_ROLE_KEY`. Without this variable, the API crashes and returns an HTML error page instead of JSON, causing the "Unexpected token 'A'" error you saw.

Now that all variables are set, the API will work correctly! ✅

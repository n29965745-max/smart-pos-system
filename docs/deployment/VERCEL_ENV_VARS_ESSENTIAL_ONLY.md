# Essential Environment Variables for Vercel (Celcom)

Use placeholders below. Copy real values from your local `.env.local` or password manager — **never commit real secrets**.

## Step 1: Vercel dashboard

https://vercel.com/your-project/settings/environment-variables

For each variable, enable **Production**, **Preview**, and **Development**.

---

### Database and Supabase (required for login)

| Variable | Example value |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API (server only) |
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (pooler) |

---

### Security keys

| Variable | Notes |
|----------|--------|
| `JWT_SECRET` | Long random string (32+ chars) |
| `JWT_REFRESH_SECRET` | Different long random string |
| `ENCRYPTION_KEY` | 64-char hex or strong random string |

---

### Redis (optional)

| Variable | Notes |
|----------|--------|
| `REDIS_URL` | Upstash or other Redis URL with password |

---

### Application

| Variable | Suggested value |
|----------|-----------------|
| `NODE_ENV` | `production` |
| `SMS_TEST_MODE` | `false` |
| `SMS_PROVIDER` | `celcom` |
| `CRON_SECRET` | Random secret for cron routes |

---

### SMS (Celcom)

| Variable | Notes |
|----------|--------|
| `CELCOM_API_KEY` | From Celcom dashboard |
| `CELCOM_PARTNER_ID` | Your partner ID |
| `CELCOM_SENDER_ID` | Approved sender ID |

---

## Step 2: Redeploy

After saving variables: **Deployments** → latest → **Redeploy**.

## Step 3: Verify

- `GET /api/health` returns JSON
- Login works without `Unexpected token` errors

See `.env.example` in the repo root for a full local template.

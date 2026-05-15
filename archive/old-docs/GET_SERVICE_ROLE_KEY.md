# Get Service Role Key for Vercel

You also need to update the **SUPABASE_SERVICE_ROLE_KEY** in Vercel.

## How to Get It:

1. Go to Supabase Project Settings:
   👉 https://supabase.REDACTED_APP_SECRET

2. Scroll down to "Project API keys"

3. Find **service_role** key (it's a secret key)

4. Click "Reveal" and copy it

5. Go to Vercel:
   👉 https://vercel.com/brunowachira001-coder/smart-pos-system-peach/settings/environment-variables

6. Update **SUPABASE_SERVICE_ROLE_KEY** with the service_role key you copied

7. Save and wait for redeploy

## Then Test:

1. Wait 2-3 minutes for deployment
2. Go to: https://smart-pos-system-peach.vercel.app
3. Hard refresh: **Ctrl + Shift + R**
4. Login with:
   - Email: `brunowachira001@gmail.com`
   - Password: `admin123`

This should work now!

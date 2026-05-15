# Get Old Database Credentials

Your OLD Supabase project (with all the data):
- Project: smart-pos-system
- Reference ID: xqnteamrznvoqgaazhpu
- URL: https://xqnteamrznvoqgaazhpu.supabase.co

## Steps to Get Credentials

1. Go to: https://supabase.REDACTED_APP_SECRET

2. Click "Settings" (gear icon in left sidebar)

3. Click "API" in the settings menu

4. Copy these THREE values:

   **Project URL:**
   ```
   https://xqnteamrznvoqgaazhpu.supabase.co
   ```

   **anon public key:** (under "Project API keys")
   - Look for the key labeled "anon" or "public"
   - Copy the entire long string

   **service_role key:** (under "Project API keys")
   - Click "Reveal" next to service_role
   - Copy the entire long string

## Next Step

Once you have these three values, I'll update your `.env.local` file!

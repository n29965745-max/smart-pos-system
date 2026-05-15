# Automated Credentials Setup

## 🚀 Quick Setup with Script

I've created an automated script that will guide you through collecting all credentials and create your `.env.local` file automatically.

---

## How to Use

### Step 1: Run the Setup Script

```bash
cd websites/snatchfit-boutique
node setup-credentials.js
```

### Step 2: Follow the Prompts

The script will ask you for:

1. **Supabase Credentials** (from https://supabase.com/dashboard)
   - Project URL
   - Anon Public Key
   - Service Role Secret Key

2. **Stripe Credentials** (from https://dashboard.stripe.com)
   - Publishable Key (test mode)
   - Secret Key (test mode)

3. **Generated Secrets**
   - JWT_SECRET (32+ characters)
   - NEXTAUTH_SECRET (32+ characters)

4. **Application URLs**
   - Your Vercel domain (e.g., https://snatchfit-boutique.vercel.app)

5. **Admin Credentials**
   - Admin email
   - Admin password

### Step 3: Review and Confirm

The script will show you a summary of all credentials and ask for confirmation before saving.

### Step 4: File Created

Your `.env.local` file will be created with all credentials.

---

## Before Running the Script

### Get Your Credentials Ready

**From Supabase:**
1. Go to https://supabase.com/dashboard
2. Click on your project
3. Go to Settings → API
4. Copy:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - Anon Public Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - Service Role Secret (SUPABASE_SERVICE_ROLE_KEY)

**From Stripe:**
1. Go to https://dashboard.stripe.com
2. Make sure Test mode is enabled
3. Go to Developers → API keys
4. Copy:
   - Publishable Key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
   - Secret Key (STRIPE_SECRET_KEY)

**Generate Secrets:**
1. Open terminal
2. Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
3. Copy output for JWT_SECRET
4. Run again for NEXTAUTH_SECRET

**Your Vercel Domain:**
- You'll get this after deploying to Vercel
- Format: `https://your-project-name.vercel.app`
- For now, use: `https://snatchfit-boutique.vercel.app`

---

## What the Script Does

✅ Validates all inputs
✅ Checks URLs are valid
✅ Checks keys are long enough
✅ Shows summary before saving
✅ Creates `.env.local` file
✅ Keeps credentials secure

---

## After Running the Script

### 1. Verify File Created

```bash
cat .env.local
```

You should see all your credentials.

### 2. Add to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable from `.env.local`

### 3. Deploy

```bash
git add .
git commit -m "Add environment configuration"
git push origin main
```

Vercel will auto-deploy.

---

## Troubleshooting

### "Command not found: node"
- Install Node.js from https://nodejs.org
- Restart terminal
- Try again

### "Invalid URL"
- Make sure URL starts with `https://`
- Example: `https://snatchfit-boutique.vercel.app`

### "Invalid key"
- Make sure you copied the entire key
- Keys should be long (50+ characters)
- Don't include quotes

### ".env.local not created"
- Check you have write permissions
- Try running with `sudo`
- Check terminal for error messages

### "File already exists"
- The script will overwrite existing `.env.local`
- Backup your current file first if needed

---

## Security Notes

⚠️ **Important:**
- `.env.local` is in `.gitignore` (won't be committed)
- Keep this file secret
- Don't share with anyone
- Don't commit to GitHub
- Regenerate secrets if compromised

---

## Next Steps After Setup

### 1. Test Locally

```bash
npm run build
npm run start
```

Visit http://localhost:3000

### 2. Deploy to Vercel

```bash
git push origin main
```

### 3. Add Environment Variables to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable from `.env.local`

### 4. Redeploy

Vercel will auto-redeploy with new variables.

### 5. Test Your Site

Visit your Vercel URL and test all features.

---

## What's in .env.local

After running the script, your `.env.local` will contain:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=REDACTED_STRIPE_TEST
JWT_SECRET=REDACTED
NEXTAUTH_SECRET=xxxxx
NEXTAUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_ADMIN_EMAIL=admin@snatchfit.com
NEXT_PUBLIC_ADMIN_PASSWORD=your_password
NODE_ENV=production
```

---

## Support

- **Supabase**: https://supabase.com/docs
- **Stripe**: https://stripe.com/docs
- **Vercel**: https://vercel.com/docs

---

## You're Ready! 🚀

Run the script and your credentials will be set up automatically!

```bash
node setup-credentials.js
```

Good luck! 🎉


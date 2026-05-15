# Environment Variables Configuration

## Overview

This document explains all environment variables needed for SnatchFit Boutique.

---

## Required Variables

### Database Configuration

**MONGODB_URI**
- **What it is**: Connection string to your MongoDB database
- **Where to get it**: MongoDB Atlas dashboard
- **Format**: `mongodb+srv://username:REDACTED_PASSWORD@cluster.mongodb.net/dbname`
- **Example**: `mongodb+srv://snatchfit_user:REDACTED_PASSWORD@cluster0.abc123.mongodb.net/snatchfit?retryWrites=true&w=majority`
- **Required**: YES

### Authentication

**JWT_SECRET**
- **What it is**: Secret key for signing JWT tokens
- **How to generate**: Use a random string generator or run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **Length**: Minimum 32 characters
- **Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2`
- **Required**: YES
- **Security**: Keep this secret! Never commit to git.

**NEXTAUTH_SECRET**
- **What it is**: Secret key for NextAuth.js
- **How to generate**: Use a random string generator or run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- **Length**: Minimum 32 characters
- **Example**: `z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9`
- **Required**: YES
- **Security**: Keep this secret! Never commit to git.

### Stripe Configuration

**NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
- **What it is**: Public Stripe API key (safe to expose in frontend)
- **Where to get it**: Stripe Dashboard → Developers → API keys
- **Format**: Starts with `pk_test_` (for testing) or `pk_live_` (for production)
- **Example**: `pk_test_51234567890abcdefghijklmnopqrstuvwxyz`
- **Required**: YES
- **Security**: This is public - safe to commit to git

**STRIPE_SECRET_KEY**
- **What it is**: Secret Stripe API key (must be kept secret)
- **Where to get it**: Stripe Dashboard → Developers → API keys
- **Format**: Starts with `sk_test_` (for testing) or `sk_live_` (for production)
- **Example**: `REDACTED_STRIPE_TEST`
- **Required**: YES
- **Security**: Keep this secret! Never commit to git.

### NextAuth Configuration

**NEXTAUTH_URL**
- **What it is**: URL where your app is hosted
- **For Vercel**: `https://your-project-name.vercel.app`
- **For custom domain**: `https://yourdomain.com`
- **Example**: `https://snatchfit-boutique.vercel.app`
- **Required**: YES (in production)

### Application Configuration

**NEXT_PUBLIC_APP_URL**
- **What it is**: Public URL of your application
- **For Vercel**: `https://your-project-name.vercel.app`
- **For custom domain**: `https://yourdomain.com`
- **Example**: `https://snatchfit-boutique.vercel.app`
- **Required**: YES

**NEXT_PUBLIC_ADMIN_EMAIL**
- **What it is**: Default admin email for login
- **Example**: `admin@snatchfit.com`
- **Required**: YES
- **Security**: This is public - safe to commit to git

**NEXT_PUBLIC_ADMIN_PASSWORD**
- **What it is**: Default admin password for login
- **Example**: `SecurePassword123!`
- **Required**: YES
- **Security**: Change this immediately after first login!

**NODE_ENV**
- **What it is**: Environment mode
- **Values**: `development` or `production`
- **For deployment**: `production`
- **Required**: YES

---

## How to Set Environment Variables

### Option 1: Vercel Dashboard (Recommended)

1. Go to your Vercel project
2. Click "Settings"
3. Click "Environment Variables"
4. Add each variable:
   - Name: (e.g., `MONGODB_URI`)
   - Value: (e.g., your connection string)
   - Select environments: Production, Preview, Development
5. Click "Save"

### Option 2: Local Development (.env.local)

Create a `.env.local` file in the project root:

```env
MONGODB_URI=mongodb+srv://snatchfit_user:REDACTED_PASSWORD@cluster0.abc123.mongodb.net/snatchfit
JWT_SECRET=REDACTED
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=REDACTED_STRIPE_TEST
NEXTAUTH_SECRET=your_nextauth_secret_key_min_32_chars
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_EMAIL=admin@snatchfit.com
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
NODE_ENV=development
```

**Important**: Never commit `.env.local` to git!

### Option 3: .env.production

For production deployment, use `.env.production`:

```env
MONGODB_URI=mongodb+srv://snatchfit_user:REDACTED_PASSWORD@cluster0.abc123.mongodb.net/snatchfit
JWT_SECRET=REDACTED
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=REDACTED_STRIPE_PK_LIVE
STRIPE_SECRET_KEY=REDACTED_STRIPE_LIVE
NEXTAUTH_SECRET=your_production_nextauth_secret_key_min_32_chars
NEXTAUTH_URL=https://snatchfit-boutique.vercel.app
NEXT_PUBLIC_APP_URL=https://snatchfit-boutique.vercel.app
NEXT_PUBLIC_ADMIN_EMAIL=admin@snatchfit.com
NEXT_PUBLIC_ADMIN_PASSWORD=your_strong_password
NODE_ENV=production
```

---

## Generating Secure Secrets

### Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Using OpenSSL
```bash
openssl rand -hex 32
```

### Using Python
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## Testing Environment Variables

### Verify Variables Are Loaded
```bash
npm run build
npm run start
```

Then check:
1. Homepage loads
2. Shop page works
3. Admin login works
4. Stripe checkout works

### Check Specific Variable
```bash
echo $MONGODB_URI
echo $STRIPE_SECRET_KEY
```

---

## Security Best Practices

1. **Never commit secrets to git**
   - Add `.env.local` to `.gitignore`
   - Add `.env.production` to `.gitignore`

2. **Use strong secrets**
   - Minimum 32 characters
   - Mix of letters, numbers, symbols
   - Use random generators

3. **Rotate secrets regularly**
   - Change JWT_SECRET monthly
   - Change admin password quarterly
   - Rotate Stripe keys if compromised

4. **Limit access**
   - Only share secrets with team members who need them
   - Use Vercel's environment variable access controls
   - Audit who has access

5. **Monitor usage**
   - Check Stripe dashboard for suspicious activity
   - Monitor MongoDB Atlas for unusual connections
   - Review Vercel logs for errors

---

## Troubleshooting

### "Cannot find module" errors
- Check all variables are set in Vercel
- Verify variable names match exactly
- Redeploy after adding variables

### "Invalid MongoDB URI"
- Check connection string format
- Verify username and password
- Ensure database exists
- Check IP whitelist in MongoDB Atlas

### "Stripe key invalid"
- Verify you're using test keys for testing
- Verify you're using live keys for production
- Check keys haven't been rotated
- Regenerate keys if needed

### "NextAuth error"
- Verify NEXTAUTH_URL matches your domain
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL doesn't have trailing slash

---

## Checklist

Before deploying:

- [ ] MongoDB connection string obtained
- [ ] JWT_SECRET generated (32+ chars)
- [ ] NEXTAUTH_SECRET generated (32+ chars)
- [ ] Stripe test keys obtained
- [ ] Stripe live keys obtained (for production)
- [ ] All variables added to Vercel
- [ ] Variables tested locally
- [ ] Build successful
- [ ] Deployment successful

---

## Support

- **Vercel Docs**: https://vercel.com/docs/concepts/projects/environment-variables
- **MongoDB Docs**: https://docs.mongodb.com/manual/reference/connection-string/
- **Stripe Docs**: https://stripe.com/docs/keys
- **NextAuth Docs**: https://next-auth.js.org/configuration/options

---

You're all set! 🚀


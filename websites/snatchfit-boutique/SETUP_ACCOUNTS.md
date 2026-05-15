# SnatchFit Boutique - Account Setup Guide

## Step-by-Step Setup (30 minutes)

Follow these steps in order to set up all required accounts and services.

---

## 1. MongoDB Atlas (Database) - 5 minutes

### Create Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free"
3. Sign up with email or Google
4. Verify your email

### Create Cluster
1. Click "Create" on the dashboard
2. Select "M0 Free" tier
3. Choose your region (closest to your users)
4. Click "Create Cluster"
5. Wait 2-3 minutes for cluster to be ready

### Create Database User
1. Go to "Database Access" in left menu
2. Click "Add New Database User"
3. Username: `snatchfit_user`
4. Password: Generate a strong password (save this!)
5. Click "Add User"

### Get Connection String
1. Go to "Databases" in left menu
2. Click "Connect" on your cluster
3. Select "Drivers"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<username>` with `snatchfit_user`
7. Save this string - you'll need it for Vercel

### Example Connection String
```
mongodb+srv://snatchfit_user:REDACTED_PASSWORD@cluster0.xxxxx.mongodb.net/snatchfit?retryWrites=true&w=majority
```

---

## 2. Stripe (Payments) - 5 minutes

### Create Account
1. Go to https://stripe.com
2. Click "Start now"
3. Sign up with email
4. Verify your email
5. Complete your profile

### Get Test API Keys
1. Go to https://dashboard.stripe.com
2. Make sure you're in "Test mode" (toggle in top right)
3. Go to "Developers" → "API keys"
4. Copy "Publishable key" (starts with `pk_test_`)
5. Copy "Secret key" (starts with `sk_test_`)
6. Save both - you'll need them for Vercel

### Test Cards for Testing
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Expiry**: Any future date
- **CVC**: Any 3 digits

---

## 3. GitHub (Code Repository) - 5 minutes

### Create Account
1. Go to https://github.com
2. Click "Sign up"
3. Enter email and create password
4. Verify your email
5. Complete setup

### Create Repository
1. Go to https://github.com/new
2. Repository name: `snatchfit-boutique`
3. Description: "E-commerce platform for SnatchFit Boutique"
4. Select "Public" or "Private"
5. Click "Create repository"

### Push Code to GitHub
```bash
cd websites/snatchfit-boutique

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - production ready"

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/snatchfit-boutique.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 4. Vercel (Hosting) - 10 minutes

### Create Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended)
4. Authorize Vercel to access your GitHub account

### Import Project
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Select your `snatchfit-boutique` repository
4. Click "Import"

### Configure Environment Variables
1. In the import dialog, click "Environment Variables"
2. Add each variable below:

```
MONGODB_URI=mongodb+srv://snatchfit_user:REDACTED_PASSWORD@cluster0.xxxxx.mongodb.net/snatchfit?retryWrites=true&w=majority

JWT_SECRET=REDACTED

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx_from_stripe_dashboard

STRIPE_SECRET_KEY=REDACTED_STRIPE_TEST_from_stripe_dashboard

NEXTAUTH_SECRET=your_nextauth_secret_key_min_32_chars_long_generate_random_string_here_12345

NEXTAUTH_URL=https://snatchfit-boutique.vercel.app

NEXT_PUBLIC_APP_URL=https://snatchfit-boutique.vercel.app

NEXT_PUBLIC_ADMIN_EMAIL=admin@snatchfit.com

NEXT_PUBLIC_ADMIN_PASSWORD=your_strong_admin_password_change_this

NODE_ENV=production
```

### Deploy
1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. Your site is live!

---

## 5. Custom Domain (Optional) - 5 minutes

### Add Custom Domain
1. Go to your Vercel project settings
2. Click "Domains"
3. Enter your domain (e.g., snatchfit.com)
4. Click "Add"
5. Follow DNS configuration instructions
6. Wait 24-48 hours for DNS to propagate

---

## Verification Checklist

After completing all steps:

- [ ] MongoDB cluster created and running
- [ ] Database user created with password saved
- [ ] Connection string copied
- [ ] Stripe account created
- [ ] Test API keys copied
- [ ] GitHub account created
- [ ] Repository created
- [ ] Code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables added
- [ ] Deployment successful
- [ ] Site accessible at Vercel URL

---

## Testing Your Deployment

### Test Homepage
1. Visit your Vercel URL
2. Homepage should load
3. Check console for errors

### Test Shop
1. Click "Shop"
2. Products should load
3. Filtering should work

### Test Checkout (with test card)
1. Add item to cart
2. Go to checkout
3. Fill in address
4. Use test card: 4242 4242 4242 4242
5. Complete payment
6. Should see success page

### Test Admin
1. Go to `/admin/login`
2. Email: admin@snatchfit.com
3. Password: (the one you set in env variables)
4. Should see admin dashboard

---

## Troubleshooting

### Build Failed
- Check environment variables are correct
- Verify MongoDB connection string
- Check Stripe keys are valid
- Look at Vercel build logs

### Site Not Loading
- Wait 5 minutes for deployment to complete
- Clear browser cache
- Check Vercel deployment status

### Payments Not Working
- Verify Stripe keys are correct
- Make sure you're using test keys
- Check Stripe dashboard for errors

### Database Connection Error
- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user password is correct

---

## Next Steps

1. ✅ Complete all account setup above
2. ✅ Verify deployment is successful
3. ✅ Test all features
4. ✅ Add products to store
5. ✅ Configure email notifications
6. ✅ Set up analytics
7. ✅ Launch to customers!

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **Stripe Docs**: https://stripe.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## You're Ready! 🚀

Follow these steps and your SnatchFit Boutique will be live in 30 minutes!

Good luck! 🎉


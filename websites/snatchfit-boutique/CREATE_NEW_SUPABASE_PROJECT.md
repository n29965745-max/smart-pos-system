# Create New Supabase Project - Complete Guide

## 🚀 Step-by-Step: Create Fresh SnatchFit Project

This guide will walk you through creating a brand new Supabase project for SnatchFit Boutique.

---

## Step 1: Create Supabase Account (If Needed)

### If you don't have a Supabase account:

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with:
   - GitHub account (recommended), OR
   - Email address
4. Verify your email
5. You're ready to create a project!

### If you already have an account:

1. Go to https://supabase.com/dashboard
2. You should see your dashboard
3. Continue to Step 2

---

## Step 2: Create New Project

### In Supabase Dashboard:

1. Click **"New Project"** button
2. Fill in the form:

| Field | Value |
|-------|-------|
| Project name | `snatchfit-boutique` |
| Database password | Generate strong password (save this!) |
| Region | Choose closest to your users |
| Pricing plan | Free (perfect for startups) |

3. Click **"Create new project"**
4. Wait 2-3 minutes for project to be created

### You'll see:

```
Creating your project...
Setting up database...
Initializing...
```

When done, you'll be in your project dashboard.

---

## Step 3: Create Database Tables

### Go to SQL Editor:

1. In left sidebar, click **"SQL Editor"**
2. Click **"New Query"**
3. Copy and paste the SQL below
4. Click **"Run"** button

### SQL to Create Tables:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(255),
  category VARCHAR(100),
  inventory INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart table
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
```

### What this does:

✅ Creates 5 database tables
✅ Sets up relationships between tables
✅ Enables security policies
✅ Ready for your e-commerce data

---

## Step 4: Get Your Credentials

### Go to Settings → API:

1. In left sidebar, click **"Settings"**
2. Click **"API"**
3. You'll see your credentials:

### Copy These Values:

**Project URL:**
```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
```

**Anon Public Key:**
```
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
```

**Service Role Secret:**
```
SUPABASE_SERVICE_ROLE_KEY = eyJ...
```

### Save these in a text file:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**⚠️ Keep these secret! Don't share with anyone!**

---

## Step 5: Verify Tables Were Created

### Check Tables:

1. In left sidebar, click **"Table Editor"**
2. You should see these tables:
   - [ ] users
   - [ ] products
   - [ ] orders
   - [ ] order_items
   - [ ] cart_items

### If tables don't appear:

1. Go back to SQL Editor
2. Check for error messages
3. Run the SQL again
4. Refresh the page

---

## Step 6: Get Stripe Keys

### Go to Stripe Dashboard:

1. Go to https://dashboard.stripe.com
2. Make sure **"Test mode"** is enabled (toggle in top right)
3. Click **"Developers"** in left sidebar
4. Click **"API keys"**

### Copy These Values:

**Publishable Key:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_xxxxx
```

**Secret Key:**
```
STRIPE_SECRET_KEY = REDACTED_STRIPE_TEST
```

### Save these:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=REDACTED_STRIPE_TEST
```

---

## Step 7: Generate Secret Keys

### Generate JWT_SECRET=REDACTED terminal and run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and save as:
```
JWT_SECRET=REDACTED
```

### Generate NEXTAUTH_SECRET:

Run the same command again:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and save as:
```
NEXTAUTH_SECRET=xxxxx
```

---

## Step 8: Prepare All Environment Variables

### Collect All Values:

Create a text file with all your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=REDACTED_STRIPE_TEST

# Secrets
JWT_SECRET=REDACTED
NEXTAUTH_SECRET=xxxxx

# URLs (will update after Vercel deployment)
NEXTAUTH_URL=https://your-project.vercel.app
NEXT_PUBLIC_APP_URL=https://your-project.vercel.app

# Admin
NEXT_PUBLIC_ADMIN_EMAIL=admin@snatchfit.com
NEXT_PUBLIC_ADMIN_PASSWORD=your_strong_password

# Environment
NODE_ENV=production
```

**Keep this file safe - you'll need it for Vercel!**

---

## Step 9: Create GitHub Repository

### If you don't have GitHub:

1. Go to https://github.com
2. Sign up with email
3. Verify email

### Create Repository:

1. Go to https://github.com/new
2. Repository name: `snatchfit-boutique`
3. Description: "E-commerce platform for SnatchFit Boutique"
4. Select "Public" or "Private"
5. Click "Create repository"

### Push Code to GitHub:

```bash
cd websites/snatchfit-boutique

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "SnatchFit Boutique - Production Ready"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/snatchfit-boutique.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 10: Deploy to Vercel

### Create Vercel Project:

1. Go to https://vercel.com/dashboard
2. Click **"New Project"**
3. Select your GitHub repository
4. Click **"Import"**

### Add Environment Variables:

1. In the import dialog, click **"Environment Variables"**
2. Add each variable from Step 8:

| Variable | Value |
|----------|-------|
| NEXT_PUBLIC_SUPABASE_URL | From Supabase |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | From Supabase |
| SUPABASE_SERVICE_ROLE_KEY | From Supabase |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | From Stripe |
| STRIPE_SECRET_KEY | From Stripe |
| JWT_SECRET | Generated |
| NEXTAUTH_SECRET | Generated |
| NEXTAUTH_URL | https://your-project.vercel.app |
| NEXT_PUBLIC_APP_URL | https://your-project.vercel.app |
| NEXT_PUBLIC_ADMIN_EMAIL | admin@snatchfit.com |
| NEXT_PUBLIC_ADMIN_PASSWORD | your_password |
| NODE_ENV | production |

3. Click **"Deploy"**
4. Wait 2-3 minutes for build to complete

---

## Step 11: Test Your Site

### Visit Your Site:

1. Wait for Vercel build to complete
2. Click the URL in Vercel dashboard
3. Your site should load!

### Test Features:

- [ ] Homepage loads
- [ ] Shop page displays
- [ ] Can add to cart
- [ ] Checkout page loads
- [ ] Admin login works
- [ ] Mobile responsive

### Test Stripe Payment:

1. Go to checkout
2. Use test card: `4242 4242 4242 4242`
3. Expiry: Any future date
4. CVC: Any 3 digits
5. Should process successfully

---

## Step 12: Add Sample Products

### Login to Admin:

1. Go to `/admin/login`
2. Email: `admin@snatchfit.com`
3. Password: (the one you set)

### Add Products:

1. Click "Products"
2. Click "Add Product"
3. Fill in:
   - Name
   - Description
   - Price
   - Image URL
   - Category
   - Inventory
4. Click "Save"
5. Repeat for 5-10 products

---

## Checklist

### Supabase Setup
- [ ] Account created
- [ ] Project created
- [ ] Database tables created
- [ ] Credentials copied
- [ ] Tables verified

### Stripe Setup
- [ ] Account created
- [ ] Test mode enabled
- [ ] API keys copied

### Secrets Generated
- [ ] JWT_SECRET generated
- [ ] NEXTAUTH_SECRET generated

### GitHub Setup
- [ ] Repository created
- [ ] Code pushed to GitHub

### Vercel Setup
- [ ] Project imported
- [ ] Environment variables added
- [ ] Build successful
- [ ] Site accessible

### Testing
- [ ] Homepage loads
- [ ] Shop works
- [ ] Checkout works
- [ ] Admin works
- [ ] Stripe payment works

### Launch
- [ ] Sample products added
- [ ] All features tested
- [ ] Ready for customers

---

## Timeline

| Step | Time |
|------|------|
| 1. Create Account | 5 min |
| 2. Create Project | 5 min |
| 3. Create Tables | 5 min |
| 4. Get Credentials | 5 min |
| 5. Verify Tables | 2 min |
| 6. Get Stripe Keys | 5 min |
| 7. Generate Secrets | 2 min |
| 8. Prepare Variables | 5 min |
| 9. Create GitHub Repo | 5 min |
| 10. Deploy to Vercel | 10 min |
| 11. Test Site | 10 min |
| 12. Add Products | 10 min |
| **Total** | **74 min** |

---

## Troubleshooting

### "SQL Error" when creating tables
- Check SQL syntax
- Make sure you're in SQL Editor
- Try running one table at a time

### "Can't find credentials"
- Go to Settings → API
- Make sure you're in the right project
- Refresh the page

### "Build failed on Vercel"
- Check environment variables are correct
- Check for typos in variable names
- Redeploy after fixing

### "Site not loading"
- Wait 5 minutes for build to complete
- Check Vercel deployment status
- Clear browser cache

### "Payments not working"
- Verify Stripe keys are correct
- Make sure test mode is enabled
- Check Stripe dashboard for errors

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Stripe Docs**: https://stripe.com/docs

---

## You're Ready! 🚀

Follow these 12 steps and your SnatchFit Boutique will be live!

**Start with Step 1: Create Supabase Account**

Good luck! 🎉


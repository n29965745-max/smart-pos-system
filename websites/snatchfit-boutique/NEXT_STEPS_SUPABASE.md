# Next Steps - Supabase Deployment

## 🎯 Your Action Items

Based on your existing Supabase project, here's what you need to do next:

---

## Step 1: Verify Your Supabase Project ✅

### Action: Check Your Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Look for your SnatchFit project
3. Click on it to open

### What You Need to Get:

**From Settings → API:**
```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY = eyJ...
```

**Save these values - you'll need them in Step 2**

---

## Step 2: Verify Database Tables ✅

### Action: Check if Tables Exist

1. In Supabase dashboard, go to **SQL Editor**
2. Run this query:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Expected Tables:
- [ ] users
- [ ] products
- [ ] orders
- [ ] order_items
- [ ] cart_items

### If Tables Don't Exist:

Copy and run this SQL in the SQL Editor:

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

---

## Step 3: Get Stripe Keys ✅

### Action: Get Your Stripe API Keys

1. Go to https://dashboard.stripe.com
2. Make sure you're in **Test mode** (toggle in top right)
3. Go to **Developers** → **API keys**
4. Copy these values:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_xxxxx
STRIPE_SECRET_KEY = REDACTED_STRIPE_TEST
```

**Save these values - you'll need them in Step 4**

---

## Step 4: Generate Secrets ✅

### Action: Generate Random Secrets

You need to generate two random 32+ character strings.

**Option A: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this command twice to get:
```
JWT_SECRET=REDACTED output here)
NEXTAUTH_SECRET = (paste output here)
```

**Option B: Using Online Generator**
- Go to https://www.random.org/strings/
- Generate 2 random strings (32+ characters)

**Save these values - you'll need them in Step 5**

---

## Step 5: Add Environment Variables to Vercel ✅

### Action: Add Variables to Vercel

1. Go to https://vercel.com/dashboard
2. Select your project (or create new one)
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

| Variable | Value |
|----------|-------|
| NEXT_PUBLIC_SUPABASE_URL | From Step 1 |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | From Step 1 |
| SUPABASE_SERVICE_ROLE_KEY | From Step 1 |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | From Step 3 |
| STRIPE_SECRET_KEY | From Step 3 |
| JWT_SECRET | From Step 4 |
| NEXTAUTH_SECRET | From Step 4 |
| NEXTAUTH_URL | https://your-project.vercel.app |
| NEXT_PUBLIC_APP_URL | https://your-project.vercel.app |
| NEXT_PUBLIC_ADMIN_EMAIL | admin@snatchfit.com |
| NEXT_PUBLIC_ADMIN_PASSWORD | your_strong_password |
| NODE_ENV | production |

**For NEXTAUTH_URL and NEXT_PUBLIC_APP_URL:**
- Replace `your-project` with your actual Vercel project name
- Example: `https://snatchfit-boutique.vercel.app`

---

## Step 6: Deploy to Vercel ✅

### Action: Deploy Your Code

**Option A: If you haven't pushed to GitHub yet**

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

**Option B: If code is already on GitHub**

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Select your GitHub repository
4. Click "Import"
5. Environment variables should already be set
6. Click "Deploy"

---

## Step 7: Test Your Site ✅

### Action: Verify Everything Works

1. Wait for Vercel build to complete (2-3 minutes)
2. Visit your Vercel URL
3. Test these features:

- [ ] Homepage loads
- [ ] Shop page displays products
- [ ] Can add items to cart
- [ ] Checkout page loads
- [ ] Admin login works
- [ ] Mobile responsive
- [ ] No console errors

### Test Stripe Payment:

1. Go to checkout
2. Use test card: `4242 4242 4242 4242`
3. Expiry: Any future date
4. CVC: Any 3 digits
5. Should process successfully

---

## Step 8: Add Sample Products (Optional) ✅

### Action: Add Products to Your Store

1. Login to admin: `/admin/login`
2. Email: `admin@snatchfit.com`
3. Password: (the one you set in env variables)
4. Click "Products"
5. Add 5-10 sample products

---

## Checklist

### Verification
- [ ] Supabase project found
- [ ] Database tables verified/created
- [ ] Stripe account has test keys

### Configuration
- [ ] Supabase credentials copied
- [ ] Stripe keys copied
- [ ] Secrets generated
- [ ] Environment variables added to Vercel

### Deployment
- [ ] Code pushed to GitHub
- [ ] Project imported to Vercel
- [ ] Build successful
- [ ] Site accessible

### Testing
- [ ] Homepage loads
- [ ] Shop page works
- [ ] Checkout works
- [ ] Admin panel works
- [ ] Mobile responsive

### Launch
- [ ] Sample products added
- [ ] All features tested
- [ ] Ready to go live

---

## Timeline

| Step | Time | Action |
|------|------|--------|
| 1. Verify Supabase | 5 min | Check project & credentials |
| 2. Verify Tables | 5 min | Check/create database tables |
| 3. Get Stripe Keys | 5 min | Copy from Stripe dashboard |
| 4. Generate Secrets | 2 min | Generate random strings |
| 5. Add to Vercel | 5 min | Add environment variables |
| 6. Deploy | 10 min | Push to GitHub & deploy |
| 7. Test | 10 min | Verify all features work |
| 8. Add Products | 10 min | Add sample products |
| **Total** | **52 min** | **Your site is live!** |

---

## Troubleshooting

### "Can't find Supabase project"
→ Check you're logged into the correct account
→ Check project name in dashboard

### "Database tables don't exist"
→ Run the SQL provided in Step 2
→ Check SQL Editor for errors

### "Build failed on Vercel"
→ Check environment variables are correct
→ Check variable names match exactly
→ Redeploy after fixing

### "Site not loading"
→ Wait 5 minutes for build to complete
→ Check Vercel deployment status
→ Clear browser cache

### "Payments not working"
→ Verify Stripe keys are correct
→ Make sure you're using test keys
→ Check Stripe dashboard for errors

---

## Support

- **Supabase**: https://supabase.com/docs
- **Vercel**: https://vercel.com/docs
- **Stripe**: https://stripe.com/docs

---

## You're Almost There! 🚀

Follow these 8 steps and your SnatchFit Boutique will be live!

**Start with Step 1: Verify Your Supabase Project**

Good luck! 🎉


# SnatchFit Boutique - Complete Setup Guide

## Step-by-Step Installation

### Step 1: Prerequisites Check

Ensure you have:
- Node.js 16+ installed (`node --version`)
- npm or yarn installed (`npm --version`)
- Git installed
- A MongoDB Atlas account (free)
- A Stripe account (free test mode)

### Step 2: Clone/Navigate to Project

```bash
cd websites/snatchfit-boutique
```

### Step 3: Install Dependencies

```bash
npm install
```

This will install:
- Next.js 14
- React 18
- Tailwind CSS
- MongoDB driver
- Stripe SDK
- Zustand (state management)
- React Hot Toast (notifications)

### Step 4: MongoDB Setup (5 minutes)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new project
4. Create a cluster (select free tier)
5. Wait for cluster to deploy (2-3 minutes)
6. Click "Connect"
7. Choose "Connect your application"
8. Copy the connection string
9. Replace `<password>` with your database password
10. Replace `myFirstDatabase` with `snatchfit`

Your connection string should look like:
```
mongodb+srv://username:REDACTED_PASSWORD@cluster0.xxxxx.mongodb.net/snatchfit?retryWrites=true&w=majority
```

### Step 5: Stripe Setup (5 minutes)

1. Go to https://dashboard.stripe.com
2. Sign up for free account
3. Go to "Developers" → "API Keys"
4. Copy your test keys:
   - Publishable Key (starts with `pk_test_`)
   - Secret Key (starts with `sk_test_`)

### Step 6: Create Environment File

Create `.env.local` in the project root:

```bash
# Copy from .env.example
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```env
# MongoDB - from Step 4
MONGODB_URI=mongodb+srv://username:REDACTED_PASSWORD@cluster0.xxxxx.mongodb.net/snatchfit?retryWrites=true&w=majority

# JWT - generate a random string (min 32 chars)
JWT_SECRET=REDACTED

# Stripe - from Step 5
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=REDACTED_STRIPE_TEST

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_key_here_min_32_chars
NEXTAUTH_URL=http://localhost:3000

# Admin Credentials (change these!)
NEXT_PUBLIC_ADMIN_EMAIL=admin@snatchfit.com
NEXT_PUBLIC_ADMIN_PASSWORD=admin123

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Step 7: Start Development Server

```bash
npm run dev
```

You should see:
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 8: Test the Application

Open http://localhost:3000 in your browser

#### Test Customer Flow:
1. Go to `/shop` - Browse products
2. Click a product - View details
3. Add to cart - Should see cart count increase
4. Go to `/cart` - View cart
5. Click "Proceed to Checkout"
6. Login/Register if needed
7. Fill shipping address
8. Use Stripe test card: `4242 4242 4242 4242`
9. Complete purchase

#### Test Admin Panel:
1. Go to `/admin/login`
2. Email: `admin@snatchfit.com`
3. Password: `admin123`
4. View dashboard, manage products and orders

## 🔧 Common Issues & Solutions

### Issue: "Cannot find module 'mongoose'"
**Solution**: Run `npm install` again

### Issue: "MONGODB_URI is not defined"
**Solution**: 
- Check `.env.local` exists in project root
- Verify `MONGODB_URI` is set correctly
- Restart dev server: `npm run dev`

### Issue: "Stripe key is invalid"
**Solution**:
- Go to Stripe dashboard
- Copy keys again (ensure you're in test mode)
- Verify no extra spaces in `.env.local`

### Issue: "Cannot connect to MongoDB"
**Solution**:
- Check MongoDB Atlas cluster is running
- Verify IP whitelist includes your IP (or allow all: 0.0.0.0/0)
- Check password doesn't have special characters (URL encode if needed)

### Issue: "Port 3000 already in use"
**Solution**:
```bash
# Use different port
npm run dev -- -p 3001
```

### Issue: "Cart not saving"
**Solution**:
- Check browser localStorage is enabled
- Clear browser cache
- Try incognito/private window

## 📊 Database Schema

The app automatically creates these collections:

### Users
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'user' | 'admin',
  addresses: Array,
  createdAt: Date
}
```

### Products
```javascript
{
  name: String,
  description: String,
  price: Number,
  category: String,
  sizes: Array,
  colors: Array,
  images: Array,
  featured: Boolean,
  createdAt: Date
}
```

### Orders
```javascript
{
  userId: ObjectId,
  items: Array,
  shippingAddress: Object,
  subtotal: Number,
  tax: Number,
  shippingCost: Number,
  total: Number,
  status: 'pending' | 'processing' | 'shipped' | 'delivered',
  stripePaymentId: String,
  createdAt: Date
}
```

## 🚀 Next Steps

### Add Sample Products
1. Go to `/admin/login`
2. Click "Manage Products"
3. Click "Add Product"
4. Fill in details and submit

### Customize Brand
1. Edit `tailwind.config.js` - Change colors
2. Edit `components/Layout.js` - Change logo/name
3. Edit `pages/index.js` - Change homepage content

### Deploy to Production
1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

## 📱 Mobile Testing

Test on mobile devices:

```bash
# Find your local IP
ipconfig getifaddr en0  # macOS
hostname -I            # Linux
ipconfig                # Windows

# Access from mobile on same network
http://YOUR_IP:3000
```

## 🔐 Security Checklist

- [ ] Change admin password in `.env.local`
- [ ] Use strong JWT_SECRET (min 32 chars)
- [ ] Enable HTTPS in production
- [ ] Set secure Stripe webhook
- [ ] Use environment variables for all secrets
- [ ] Enable MongoDB IP whitelist
- [ ] Set up CORS properly
- [ ] Validate all user inputs

## 📚 File Structure Explained

```
pages/
├── api/              # Backend API routes
├── admin/            # Admin pages
├── product/          # Product detail page
├── checkout/         # Checkout pages
├── index.js          # Homepage
├── shop.js           # Product listing
├── cart.js           # Shopping cart
├── login.js          # User login
├── register.js       # User registration
├── profile.js        # User profile
├── orders.js         # Order history
├── about.js          # About page
├── contact.js        # Contact page
├── _app.js           # App wrapper
└── _document.js      # HTML document

components/
└── Layout.js         # Main layout with nav/footer

lib/
├── db.js             # MongoDB connection
├── auth.js           # JWT utilities
└── models/           # Database schemas

store/
├── authStore.js      # Auth state (Zustand)
└── cartStore.js      # Cart state (Zustand)

styles/
└── globals.css       # Global styles
```

## 🎯 Key Features Explained

### Authentication Flow
1. User registers → Password hashed with bcryptjs
2. JWT token generated and stored in browser
3. Token sent with each API request
4. Backend verifies token before processing

### Cart Management
1. Cart stored in browser localStorage (Zustand)
2. Synced with database when user logs in
3. Persists across sessions
4. Cleared after successful checkout

### Payment Flow
1. User adds items to cart
2. Proceeds to checkout
3. Enters shipping address
4. Redirected to Stripe checkout
5. Stripe processes payment
6. Redirected to success page
7. Order created in database

### Admin Features
1. Secure login with credentials
2. View all orders and products
3. Update order status
4. Add/edit/delete products
5. View sales analytics

## 💡 Tips & Tricks

### Speed Up Development
- Use VS Code with ES7+ snippets
- Install React Developer Tools extension
- Use `npm run dev` for hot reload

### Debug Issues
- Check browser console for errors
- Check terminal for server errors
- Use MongoDB Atlas UI to inspect data
- Use Stripe dashboard to view test payments

### Improve Performance
- Optimize images (use Next.js Image component)
- Enable caching headers
- Use CDN for static assets
- Implement pagination for products

## 🆘 Getting Help

1. Check README.md for overview
2. Check SETUP_GUIDE.md (this file)
3. Check troubleshooting section above
4. Review code comments
5. Check Next.js/MongoDB/Stripe docs

## ✅ Verification Checklist

After setup, verify:
- [ ] Dev server running on http://localhost:3000
- [ ] Homepage loads without errors
- [ ] Can navigate to all pages
- [ ] Can register new user
- [ ] Can login with registered user
- [ ] Can add products to cart
- [ ] Can proceed to checkout
- [ ] Can access admin panel
- [ ] Can create/edit/delete products
- [ ] Can view orders

If all checks pass, you're ready to go! 🎉

---

**Need help?** Check the troubleshooting section or review the code comments.

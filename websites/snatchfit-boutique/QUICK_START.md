# SnatchFit Boutique - Quick Start (5 Minutes)

## TL;DR - Get Running in 5 Minutes

### 1. Install Dependencies
```bash
cd websites/snatchfit-boutique
npm install
```

### 2. Create `.env.local`
```bash
cp .env.example .env.local
```

### 3. Fill in `.env.local`
Get these from:
- **MongoDB**: https://www.mongodb.com/cloud/atlas (free account)
- **Stripe**: https://dashboard.stripe.com (test keys)

```env
MONGODB_URI=mongodb+srv://user:REDACTED_PASSWORD@cluster.mongodb.net/snatchfit
JWT_SECRET=REDACTED
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=REDACTED_STRIPE_TEST
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_EMAIL=admin@snatchfit.com
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Start Server
```bash
npm run dev
```

### 5. Open Browser
```
http://localhost:3000
```

## 🧪 Quick Test

### Test Customer Flow (2 min)
1. Go to `/shop` → Browse products
2. Click product → Add to cart
3. Go to `/cart` → Proceed to checkout
4. Register/Login
5. Fill address → Use test card `4242 4242 4242 4242`
6. Complete purchase ✓

### Test Admin (1 min)
1. Go to `/admin/login`
2. Email: `admin@snatchfit.com`
3. Password: `admin123`
4. View dashboard ✓

## 📋 What's Included

✅ Full e-commerce platform
✅ User authentication
✅ Shopping cart
✅ Stripe payments
✅ Admin dashboard
✅ Product management
✅ Order tracking
✅ Responsive design
✅ Production-ready code

## 🔗 Important Links

- **Homepage**: http://localhost:3000
- **Shop**: http://localhost:3000/shop
- **Admin**: http://localhost:3000/admin/login
- **API Docs**: See README.md

## 🆘 Stuck?

1. **MongoDB error?** → Check connection string in `.env.local`
2. **Stripe error?** → Verify API keys are correct
3. **Port in use?** → Run `npm run dev -- -p 3001`
4. **Still stuck?** → Read SETUP_GUIDE.md

## 📚 Next Steps

1. Add sample products via admin panel
2. Customize colors in `tailwind.config.js`
3. Change brand name throughout
4. Deploy to Vercel
5. Set up production database

## 🚀 Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Then add environment variables in Vercel dashboard.

---

**That's it! You're ready to go.** 🎉

For detailed setup, see SETUP_GUIDE.md
For full documentation, see README.md

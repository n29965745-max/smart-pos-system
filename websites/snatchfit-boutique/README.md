# SnatchFit Boutique - E-Commerce Platform

A production-ready e-commerce platform for a fashion brand built with Next.js, Tailwind CSS, MongoDB, and Stripe.

## 🎯 Features

### Customer-Facing Store
- ✅ Modern homepage with hero section and brand story
- ✅ Product listing with advanced filters (category, price range, search)
- ✅ Product detail pages with image gallery, pricing, and size/color selection
- ✅ Shopping cart with quantity management
- ✅ Checkout with Stripe payment integration
- ✅ Order confirmation and tracking

### Authentication & User Management
- ✅ User registration and login with JWT
- ✅ Protected routes for checkout and orders
- ✅ User profile page with order history
- ✅ Persistent cart storage

### Admin Dashboard
- ✅ Secure admin login
- ✅ Product management (CRUD operations)
- ✅ Order management with status updates
- ✅ Inventory tracking
- ✅ Sales analytics and statistics

### Technical Features
- ✅ Responsive mobile-first design
- ✅ Smooth animations and transitions
- ✅ Real-time cart updates
- ✅ Secure payment processing
- ✅ Database persistence with MongoDB
- ✅ API-driven architecture

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB
- **Authentication**: JWT
- **Payments**: Stripe
- **State Management**: Zustand
- **Notifications**: React Hot Toast
- **Deployment**: Vercel-ready

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- MongoDB Atlas account (free tier available)
- Stripe account (test mode)
- Git

## 🚀 Quick Start

### 1. Clone and Setup

```bash
cd websites/snatchfit-boutique
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
# Database
MONGODB_URI=mongodb+srv://username:REDACTED_PASSWORD@cluster.mongodb.net/snatchfit

# JWT
JWT_SECRET=REDACTED

# Stripe (Get from https://dashboard.stripe.com/test/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=REDACTED_STRIPE_TEST_secret_key

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# Admin Credentials
NEXT_PUBLIC_ADMIN_EMAIL=admin@snatchfit.com
NEXT_PUBLIC_ADMIN_PASSWORD=admin123

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. MongoDB Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Replace `username:password` in `MONGODB_URI`

### 4. Stripe Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your test API keys
3. Add them to `.env.local`

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📱 User Flows

### Customer Journey
1. **Browse**: Visit homepage → Shop page with filters
2. **Select**: Click product → View details → Choose size/color
3. **Cart**: Add to cart → View cart → Update quantities
4. **Checkout**: Enter shipping → Stripe payment
5. **Confirmation**: Order confirmation → Track order

### Admin Journey
1. **Login**: Visit `/admin/login` → Enter credentials
2. **Dashboard**: View stats and recent orders
3. **Products**: Manage inventory, add/edit/delete products
4. **Orders**: Update order status, view details

## 🔐 Test Credentials

### Admin Login
- Email: `admin@snatchfit.com`
- Password: `admin123`

### Stripe Test Cards
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Any future expiry date, any CVC

## 📁 Project Structure

```
snatchfit-boutique/
├── pages/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.js
│   │   │   └── register.js
│   │   ├── products/
│   │   │   ├── index.js
│   │   │   └── [id].js
│   │   ├── cart/
│   │   │   ├── index.js
│   │   │   └── [itemId].js
│   │   ├── orders/
│   │   │   └── index.js
│   │   └── stripe/
│   │       └── checkout.js
│   ├── admin/
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── products.js
│   │   └── orders.js
│   ├── product/
│   │   └── [id].js
│   ├── checkout/
│   │   └── success.js
│   ├── index.js (homepage)
│   ├── shop.js
│   ├── cart.js
│   ├── login.js
│   ├── register.js
│   ├── profile.js
│   ├── orders.js
│   ├── about.js
│   ├── contact.js
│   ├── _app.js
│   └── _document.js
├── components/
│   └── Layout.js
├── lib/
│   ├── db.js
│   ├── auth.js
│   └── models/
│       ├── User.js
│       ├── Product.js
│       ├── Order.js
│       └── Cart.js
├── store/
│   ├── authStore.js
│   └── cartStore.js
├── styles/
│   └── globals.css
├── public/
├── .env.example
├── .env.local (create this)
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/[id]` - Get single product
- `POST /api/products` - Create product (admin)
- `PUT /api/products/[id]` - Update product (admin)
- `DELETE /api/products/[id]` - Delete product (admin)

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/[itemId]` - Update cart item
- `DELETE /api/cart/[itemId]` - Remove from cart

### Orders
- `GET /api/orders` - Get user's orders
- `POST /api/orders` - Create order
- `PUT /api/orders/[id]` - Update order status (admin)

### Payments
- `POST /api/stripe/checkout` - Create Stripe checkout session

## 🎨 Customization

### Colors
Edit `tailwind.config.js`:
```js
colors: {
  primary: '#000000',
  secondary: '#FFFFFF',
  accent: '#FF6B9D', // Change this
  gold: '#D4AF37',
}
```

### Brand Name
Search and replace `SnatchFit` with your brand name

### Product Categories
Edit `pages/shop.js` and `lib/models/Product.js`

## 📦 Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy

```bash
# Or deploy via CLI
npm i -g vercel
vercel
```

### Environment Variables on Vercel
Add all `.env.local` variables in Vercel dashboard under Settings → Environment Variables

## 🧪 Testing

### Test User Registration
1. Go to `/register`
2. Fill in details
3. Submit

### Test Product Purchase
1. Go to `/shop`
2. Add product to cart
3. Go to `/checkout`
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete purchase

### Test Admin Panel
1. Go to `/admin/login`
2. Use credentials from `.env.local`
3. Manage products and orders

## 🐛 Troubleshooting

### MongoDB Connection Error
- Check `MONGODB_URI` is correct
- Ensure IP whitelist includes your IP in MongoDB Atlas
- Verify database name matches

### Stripe Error
- Verify API keys are correct
- Check Stripe account is in test mode
- Ensure `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is public key

### Cart Not Persisting
- Check browser localStorage is enabled
- Clear browser cache and try again

### Admin Login Not Working
- Verify credentials in `.env.local`
- Check `NEXT_PUBLIC_ADMIN_EMAIL` and `NEXT_PUBLIC_ADMIN_PASSWORD`

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Stripe Documentation](https://stripe.com/docs)
- [Zustand](https://github.com/pmndrs/zustand)

## 📝 License

MIT License - feel free to use for commercial projects

## 🤝 Support

For issues or questions, check the troubleshooting section or create an issue in your repository.

---

**Built with ❤️ for fashion brands**

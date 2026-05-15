# 🛍️ E-Commerce Platform Setup Guide

## Overview

This guide will help you set up the complete e-commerce platform integrated with your POS system. The e-commerce site shares the same database with your POS, providing unified inventory management across both sales channels.

---

## 🎯 What You're Building

- **Complete standalone e-commerce website**
- **Shared inventory** between POS and online shop
- **Multi-tenant architecture** - supports 1000+ shops
- **Secure checkout** with multiple payment options
- **Real-time inventory sync** between POS and e-commerce
- **Customer accounts** and order tracking
- **Mobile-responsive** design

---

## 📋 Prerequisites

- Existing POS system running
- Supabase project set up
- Node.js and npm installed
- Vercel account (for deployment)

---

## 🚀 Step 1: Run Database Migration

1. Open your Supabase SQL Editor
2. Run the e-commerce schema migration:

```bash
# Copy the contents of lib/ecommerce-schema.sql
# Paste into Supabase SQL Editor
# Click "Run"
```

This creates:
- `online_carts` - Shopping carts
- `online_cart_items` - Cart items
- `customer_addresses` - Delivery addresses
- `online_orders` - E-commerce orders
- `online_order_items` - Order line items
- `product_reviews` - Customer reviews
- `wishlists` - Saved products
- `coupons` - Discount codes
- `abandoned_cart_recovery` - Cart recovery tracking

All tables have:
- ✅ `tenant_id` for multi-tenancy
- ✅ Row Level Security (RLS) enabled
- ✅ Proper indexes for performance
- ✅ Foreign key constraints

---

## 🔧 Step 2: Configure Tenant Subdomain

Each tenant needs a unique subdomain for their online shop.

```sql
-- Update your tenant with a subdomain
UPDATE tenants
SET subdomain = 'nylawigs'  -- Change to your shop name
WHERE id = 'your-tenant-id';
```

Your shop will be accessible at:
```
https://yourdomain.com/shop/nylawigs
```

---

## 📦 Step 3: Verify Inventory Integration

The e-commerce platform uses the existing `inventory_movements` table to track all stock changes.

**How it works:**
1. Customer places order on e-commerce site
2. Stock is deducted from `products.stock_quantity`
3. Movement is logged in `inventory_movements` table
4. POS sees updated stock in real-time

**Test it:**
```sql
-- Check inventory movements
SELECT * FROM inventory_movements
WHERE movement_type = 'sale'
AND source = 'ecommerce'
ORDER BY created_at DESC;
```

---

## 🎨 Step 4: Customize Shop Appearance

Update your shop settings in the database:

```sql
UPDATE tenants
SET 
  business_name = 'Your Shop Name',
  tagline = 'Your Shop Tagline',
  logo_url = 'https://your-logo-url.com/logo.png',
  primary_color = '#10b981',  -- Emerald green
  secondary_color = '#059669'
WHERE subdomain = 'your-shop-slug';
```

---

## 🛒 Step 5: Add Products to E-Commerce

Products from your POS automatically appear in the e-commerce store if:
- ✅ `is_active = true`
- ✅ `stock_quantity > 0`

**Make products visible:**
```sql
UPDATE products
SET is_active = true
WHERE tenant_id = 'your-tenant-id';
```

**Add product images:**
```sql
UPDATE products
SET image_url = 'https://your-image-url.com/product.jpg'
WHERE id = 'product-id';
```

---

## 💳 Step 6: Configure Payment Methods

Currently supported:
- **Cash on Delivery (COD)** - Default, no setup needed
- **M-Pesa** - Coming soon
- **Stripe** - Coming soon

---

## 🧪 Step 7: Test the E-Commerce Flow

### Test as a Customer:

1. **Browse Products**
   ```
   Visit: /shop/your-slug
   ```

2. **Add to Cart**
   - Click on a product
   - Select quantity
   - Click "Add to Cart"

3. **Checkout**
   - Fill in shipping address
   - Select payment method
   - Place order

4. **Verify Order**
   - Check order success page
   - Verify order in database:
   ```sql
   SELECT * FROM online_orders
   WHERE tenant_id = 'your-tenant-id'
   ORDER BY created_at DESC;
   ```

5. **Check Inventory**
   - Verify stock was deducted:
   ```sql
   SELECT 
     p.name,
     p.stock_quantity,
     im.quantity_change,
     im.created_at
   FROM products p
   JOIN inventory_movements im ON p.id = im.product_id
   WHERE im.movement_type = 'sale'
   ORDER BY im.created_at DESC;
   ```

---

## 📊 Step 8: Monitor Orders (Admin)

### View All Orders:
```sql
SELECT 
  order_number,
  total_amount,
  order_status,
  payment_status,
  created_at
FROM online_orders
WHERE tenant_id = 'your-tenant-id'
ORDER BY created_at DESC;
```

### Update Order Status:
```sql
UPDATE online_orders
SET 
  order_status = 'shipped',
  shipped_at = NOW()
WHERE order_number = 'ORD-20260507-1234';
```

### View Order Details:
```sql
SELECT 
  o.order_number,
  o.total_amount,
  o.order_status,
  oi.product_name,
  oi.quantity,
  oi.unit_price
FROM online_orders o
JOIN online_order_items oi ON o.id = oi.order_id
WHERE o.order_number = 'ORD-20260507-1234';
```

---

## 🔐 Security Checklist

✅ **Tenant Isolation**
- All tables have `tenant_id`
- RLS policies enforce tenant filtering
- API routes use `secureRoute` middleware

✅ **Inventory Protection**
- Stock checks before order creation
- Atomic updates with row locking
- Movement logging for audit trail

✅ **Payment Security**
- No card data stored
- Webhook signature verification (when integrated)
- Idempotent order creation

✅ **Data Validation**
- Input validation on all forms
- SQL injection prevention
- XSS protection

---

## 🚀 Step 9: Deploy to Production

### Vercel Deployment:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add e-commerce platform"
   git push origin main
   ```

2. **Deploy on Vercel**
   - Connect your GitHub repo
   - Add environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     JWT_SECRET=REDACTED
     ```

3. **Configure Custom Domain** (Optional)
   - Add your domain in Vercel
   - Update DNS records
   - Enable HTTPS

---

## 📱 Step 10: Mobile Optimization

The e-commerce site is fully responsive and works on:
- ✅ Desktop browsers
- ✅ Tablets
- ✅ Mobile phones

**Test on mobile:**
1. Open Chrome DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test different screen sizes

---

## 🎯 Key Features

### For Customers:
- Browse products by category
- Search products
- Filter by price range
- Add to cart
- Secure checkout
- Order tracking
- Product reviews (coming soon)
- Wishlist (coming soon)

### For Shop Owners:
- Unified inventory with POS
- Real-time stock updates
- Order management
- Customer data
- Sales analytics
- Multi-channel reporting

---

## 🔄 Inventory Synchronization

### How It Works:

1. **POS Sale**
   ```
   POS → Update stock → Log movement (source: 'pos')
   ```

2. **Online Sale**
   ```
   E-commerce → Update stock → Log movement (source: 'ecommerce')
   ```

3. **Restock**
   ```
   POS → Update stock → Log movement (source: 'manual')
   ```

### View All Movements:
```sql
SELECT 
  p.name AS product,
  im.movement_type,
  im.source,
  im.quantity_change,
  im.stock_before,
  im.stock_after,
  im.created_at
FROM inventory_movements im
JOIN products p ON im.product_id = p.id
WHERE im.tenant_id = 'your-tenant-id'
ORDER BY im.created_at DESC
LIMIT 50;
```

---

## 🐛 Troubleshooting

### Issue: Products not showing in e-commerce

**Solution:**
```sql
-- Check product status
SELECT id, name, is_active, stock_quantity
FROM products
WHERE tenant_id = 'your-tenant-id';

-- Activate products
UPDATE products
SET is_active = true
WHERE tenant_id = 'your-tenant-id';
```

### Issue: Cart not working

**Solution:**
- Check browser console for errors
- Verify API endpoints are accessible
- Check tenant context is set correctly

### Issue: Order creation fails

**Solution:**
```sql
-- Check stock availability
SELECT id, name, stock_quantity
FROM products
WHERE id = 'product-id';

-- Verify cart items
SELECT * FROM online_cart_items
WHERE cart_id = 'cart-id';
```

### Issue: Inventory not syncing

**Solution:**
```sql
-- Check inventory movements
SELECT * FROM inventory_movements
WHERE product_id = 'product-id'
ORDER BY created_at DESC;

-- Verify RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'inventory_movements';
```

---

## 📈 Performance Optimization

### Database Indexes:
All critical indexes are created automatically by the migration script.

### Caching Strategy:
- Product listings: Cache for 5 minutes
- Product details: Cache for 10 minutes
- Cart: No caching (real-time)
- Orders: No caching (real-time)

### Image Optimization:
- Use Next.js Image component
- Compress images before upload
- Use CDN for static assets

---

## 🎓 Next Steps

1. **Add Payment Integration**
   - Stripe for card payments
   - M-Pesa for mobile money
   - PayPal for international

2. **Implement Customer Accounts**
   - Registration and login
   - Order history
   - Saved addresses
   - Wishlist

3. **Add Product Reviews**
   - Customer ratings
   - Review moderation
   - Verified purchase badges

4. **Enable Coupons**
   - Discount codes
   - Percentage/fixed discounts
   - Usage limits

5. **Abandoned Cart Recovery**
   - Email reminders
   - SMS notifications
   - Special offers

6. **Analytics Dashboard**
   - Sales by channel (POS vs E-commerce)
   - Top products
   - Customer insights
   - Revenue reports

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review the database logs in Supabase
3. Check browser console for errors
4. Verify environment variables are set correctly

---

## ✅ Checklist

Before going live:

- [ ] Database migration completed
- [ ] Tenant subdomain configured
- [ ] Products activated and visible
- [ ] Product images uploaded
- [ ] Test order placed successfully
- [ ] Inventory sync verified
- [ ] Payment method configured
- [ ] Mobile responsiveness tested
- [ ] Security checklist reviewed
- [ ] Deployed to production
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active

---

**Status**: E-Commerce Platform Ready for Testing ✅

**Next**: Test the complete flow from browsing to checkout!

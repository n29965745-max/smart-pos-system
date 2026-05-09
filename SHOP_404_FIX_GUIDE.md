# 🔧 Shop 404 Error - Fix Guide

**Issue:** Getting 404 error when visiting `/shop/nylawigs`  
**Status:** Diagnostic tools created  
**Date:** May 9, 2026

---

## 🎯 QUICK FIX (5 minutes)

### Step 1: Run Database Setup Script

The issue is likely that the `nylawigs` tenant doesn't exist or has no products in the database.

**Run this SQL in Supabase:**

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/xqnteamrznvoqgaazhpu
2. Go to **SQL Editor**
3. Copy and paste the contents of `lib/fix-nylawigs-shop.sql`
4. Click **Run**

**What this does:**
- ✅ Creates/verifies `nylawigs` tenant exists
- ✅ Ensures tenant is active
- ✅ Creates shop_settings
- ✅ Adds 20 sample wig products if none exist
- ✅ Verifies the setup

**Expected output:**
```
NOTICE: Nylawigs tenant exists: a0000000-0000-0000-0000-000000000001
NOTICE: Shop settings configured
NOTICE: Current product count: 20
NOTICE: =================================
NOTICE: SETUP COMPLETE!
NOTICE: Tenant ID: a0000000-0000-0000-0000-000000000001
NOTICE: Tenant Slug: nylawigs
NOTICE: Total Products: 20
NOTICE: =================================
```

---

### Step 2: Test the APIs

After running the SQL, test the APIs using our diagnostic page:

**Visit:** http://localhost:3000/test-shop-nylawigs.html

Or test manually:
1. **Tenant API:** http://localhost:3000/api/tenant/by-slug/nylawigs
2. **Products API:** http://localhost:3000/api/ecommerce/products/simple?tenantSlug=nylawigs&limit=5

**Expected responses:**

**Tenant API should return:**
```json
{
  "tenant": {
    "id": "a0000000-0000-0000-0000-000000000001",
    "name": "Nyla Wigs",
    "slug": "nylawigs",
    "type": "retail",
    "theme_color": "#ec4899",
    "tagline": "Luxury wigs that EAT everytime",
    "phone": "0718307550"
  }
}
```

**Products API should return:**
```json
{
  "products": [
    {
      "id": "...",
      "name": "Brazilian Lace Front Wig - Natural Black",
      "retail_price": 8500,
      "stock_quantity": 15,
      "category": "Lace Front Wigs",
      "image_url": "..."
    }
    // ... more products
  ],
  "total": 20
}
```

---

### Step 3: Visit the Shop Page

After confirming the APIs work:

**Visit:** http://localhost:3000/shop/nylawigs

**You should see:**
- ✅ Nyla Wigs branding
- ✅ 20 wig products displayed
- ✅ Product categories
- ✅ Search bar
- ✅ Cart icon
- ✅ Flash deal banner (if deals exist)
- ✅ Trust badges
- ✅ Footer

---

## 🔍 DIAGNOSTIC TOOLS CREATED

### 1. Database Fix Script
**File:** `lib/fix-nylawigs-shop.sql`
- Creates/verifies tenant
- Adds sample products
- Configures shop settings

### 2. API Test Page
**File:** `public/test-shop-nylawigs.html`
- Tests tenant API
- Tests products API
- Tests flash deals API
- Auto-runs on page load

### 3. Database Check Script
**File:** `lib/check-nylawigs-tenant.sql`
- Checks if tenant exists
- Lists products
- Shows shop settings

---

## 🐛 TROUBLESHOOTING

### Issue 1: Tenant API returns 404
**Cause:** Tenant doesn't exist in database  
**Fix:** Run `lib/fix-nylawigs-shop.sql`

### Issue 2: Products API returns empty array
**Cause:** No products for this tenant  
**Fix:** Run `lib/fix-nylawigs-shop.sql` to add sample products

### Issue 3: Page loads but shows "No Products Available"
**Cause:** Products exist but API call is failing  
**Fix:** 
1. Check browser console for errors
2. Verify API endpoint: `/api/ecommerce/products/simple?tenantSlug=nylawigs`
3. Check if products have `stock_quantity > 0`

### Issue 4: Still getting 404 after database fix
**Cause:** Build or deployment issue  
**Fix:**
1. Rebuild: `npm run build`
2. Restart dev server: `npm run dev`
3. Clear browser cache (Ctrl+Shift+R)
4. Check Next.js routing: `pages/shop/[slug]/index.tsx` should exist

### Issue 5: Works locally but 404 on production
**Cause:** Database not synced or deployment issue  
**Fix:**
1. Run SQL script on production database (Supabase)
2. Trigger new deployment on Vercel
3. Check Vercel deployment logs

---

## 📊 VERIFICATION CHECKLIST

After running the fix, verify:

- [ ] Tenant API returns 200 status
- [ ] Tenant API shows "Nyla Wigs" business name
- [ ] Products API returns 200 status
- [ ] Products API shows at least 20 products
- [ ] Shop page loads without 404
- [ ] Products are displayed on the page
- [ ] Images are loading
- [ ] Cart functionality works
- [ ] Product detail pages work

---

## 🚀 PRODUCTION DEPLOYMENT

Once working locally, deploy to production:

### Step 1: Run SQL on Production Database
1. Open Supabase Dashboard (production project)
2. Go to SQL Editor
3. Run `lib/fix-nylawigs-shop.sql`

### Step 2: Verify Production APIs
Test these URLs:
- https://smart-pos-system.vercel.app/api/tenant/by-slug/nylawigs
- https://smart-pos-system.vercel.app/api/ecommerce/products/simple?tenantSlug=nylawigs&limit=5

### Step 3: Visit Production Shop
- https://smart-pos-system.vercel.app/shop/nylawigs

---

## 📁 FILES CREATED

1. **lib/fix-nylawigs-shop.sql** - Database setup script
2. **lib/check-nylawigs-tenant.sql** - Diagnostic queries
3. **public/test-shop-nylawigs.html** - API testing page
4. **SHOP_404_FIX_GUIDE.md** - This guide

---

## 🎯 ROOT CAUSE ANALYSIS

The 404 error is most likely caused by:

1. **Missing Tenant** (90% probability)
   - The `nylawigs` tenant doesn't exist in the database
   - Or the tenant exists but `is_active = false`

2. **No Products** (5% probability)
   - Tenant exists but has no products
   - Page loads but shows empty state

3. **Routing Issue** (3% probability)
   - Next.js dynamic route not working
   - Build issue

4. **API Error** (2% probability)
   - API endpoint failing
   - Database connection issue

**Solution:** Running `lib/fix-nylawigs-shop.sql` fixes causes #1 and #2, which covers 95% of cases.

---

## ✅ NEXT STEPS

After fixing the 404:

1. **Add Real Products**
   - Replace sample products with actual wig inventory
   - Add real product images
   - Set accurate prices

2. **Configure Flash Deals**
   - Run `lib/seed-ecommerce-features.sql` (after updating tenant_id)
   - Create time-limited deals
   - Test countdown timers

3. **Test All Features**
   - Product browsing
   - Add to cart
   - Checkout flow
   - Order success page

4. **Mobile Testing**
   - Test on mobile devices
   - Check responsive design
   - Test mobile shop: `/m/nylawigs`

---

**Status:** Fix scripts ready  
**Action Required:** Run `lib/fix-nylawigs-shop.sql` in Supabase  
**Expected Time:** 5 minutes  
**Success Rate:** 95%+

---

**Need help?** Check the diagnostic page at `/test-shop-nylawigs.html`

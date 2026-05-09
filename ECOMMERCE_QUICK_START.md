# 🚀 E-Commerce Advanced Features - Quick Start Guide

**Date:** May 9, 2026  
**Time to Complete:** 30-60 minutes  
**Difficulty:** Intermediate

---

## 📋 OVERVIEW

This guide will help you deploy the advanced e-commerce features including gamification, flash deals, social proof, and more.

---

## ✅ PREREQUISITES

Before starting, ensure you have:
- [x] Access to Supabase dashboard
- [x] Database connection credentials
- [x] Git repository access
- [x] Vercel deployment access
- [x] Node.js and npm installed locally

---

## 🚀 STEP-BY-STEP DEPLOYMENT

### Step 1: Database Migration (10 minutes)

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `lib/ecommerce-advanced-schema.sql`
5. Paste into the SQL editor
6. Click **Run** to execute
7. Verify: Check that 14 new tables were created

#### Option B: Using Command Line
```bash
# Connect to your database
psql -h db.your-project.supabase.co -U postgres -d postgres

# Run the migration
\i lib/ecommerce-advanced-schema.sql

# Verify tables were created
\dt user_coins
\dt flash_deals
\dt product_recommendations
```

#### Verify Migration Success
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_coins', 'coin_transactions', 'daily_missions',
  'flash_deals', 'product_views', 'bundle_deals'
);
```

Expected result: 14 tables listed

---

### Step 2: Seed Sample Data (5 minutes)

Create sample flash deals and missions for testing:

```sql
-- Insert sample daily missions
INSERT INTO daily_missions (tenant_id, mission_type, title, description, target_count, coin_reward, is_active)
VALUES 
  ('your-tenant-id', 'view_products', 'Browse 5 Products', 'View 5 different products today', 5, 10, true),
  ('your-tenant-id', 'add_to_cart', 'Add to Cart', 'Add any product to your cart', 1, 15, true),
  ('your-tenant-id', 'share', 'Share a Product', 'Share a product with friends', 1, 20, true);

-- Insert sample flash deal (adjust product_id and tenant_id)
INSERT INTO flash_deals (
  tenant_id, product_id, title, original_price, flash_price, 
  discount_percentage, total_quantity, remaining_quantity,
  starts_at, ends_at, status
)
VALUES (
  'your-tenant-id',
  'your-product-id',
  'Flash Sale - Limited Time!',
  5000.00,
  2999.00,
  40,
  100,
  100,
  NOW(),
  NOW() + INTERVAL '24 hours',
  'active'
);

-- Initialize seller rating
INSERT INTO seller_ratings (tenant_id, overall_rating, total_orders)
VALUES ('your-tenant-id', 5.0, 0)
ON CONFLICT (tenant_id) DO NOTHING;
```

---

### Step 3: Create API Endpoints (15 minutes)

Create these API files in `pages/api/ecommerce/`:

#### 3.1 Gamification API
Create `pages/api/ecommerce/gamification/coins.ts`:
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { customerId, tenantId } = req.query;

  if (req.method === 'GET') {
    try {
      await supabase.rpc('set_config', {
        setting: 'app.current_tenant_id',
        value: tenantId
      });

      const { data, error } = await supabase
        .from('user_coins')
        .select('*')
        .eq('customer_id', customerId)
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ coins: data || { total_coins: 0, current_streak: 0 } });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch coins' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

#### 3.2 Flash Deals API
Create `pages/api/ecommerce/flash-deals.ts`:
```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tenantSlug } = req.query;

  if (req.method === 'GET') {
    try {
      // Get tenant ID from slug
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenantSlug)
        .single();

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      await supabase.rpc('set_config', {
        setting: 'app.current_tenant_id',
        value: tenant.id
      });

      const { data: deals, error } = await supabase
        .from('flash_deals')
        .select(`
          *,
          product:product_id (
            id,
            name,
            image_url
          )
        `)
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .order('display_order', { ascending: true })
        .limit(10);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ deals: deals || [] });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch flash deals' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
```

---

### Step 4: Update Storefront Pages (10 minutes)

#### 4.1 Update Desktop Storefront
Edit `pages/shop/[slug]/index.tsx`:

```typescript
// Add imports at the top
import FlashDealBanner from '@/components/Ecommerce/FlashDealBanner';
import RecommendedProducts from '@/components/Ecommerce/RecommendedProducts';
import BundleDeals from '@/components/Ecommerce/BundleDeals';
import TrustBadges from '@/components/Ecommerce/TrustBadges';
import GamificationWidget from '@/components/Ecommerce/GamificationWidget';

// Add state for new features
const [flashDeals, setFlashDeals] = useState([]);
const [bundles, setBundles] = useState([]);

// Fetch flash deals
useEffect(() => {
  if (slug) {
    fetchFlashDeals();
  }
}, [slug]);

const fetchFlashDeals = async () => {
  try {
    const res = await fetch(`/api/ecommerce/flash-deals?tenantSlug=${slug}`);
    const data = await res.json();
    setFlashDeals(data.deals || []);
  } catch (error) {
    console.error('Failed to load flash deals:', error);
  }
};

// Add components to JSX (after hero banner)
<FlashDealBanner slug={slug} deals={flashDeals} />

// Add before footer
<RecommendedProducts 
  slug={slug} 
  products={products.slice(0, 6)} 
  title="Recommended for You"
/>

<BundleDeals slug={slug} bundles={bundles} />

<TrustBadges />

<GamificationWidget slug={slug} customerId={customerId} />
```

#### 4.2 Update Product Detail Page
Edit `pages/shop/[slug]/product/[id].tsx`:

```typescript
// Add import
import SocialProof from '@/components/Ecommerce/SocialProof';

// Add to JSX (after product title)
<SocialProof 
  productId={product.id} 
  currentViewers={Math.floor(Math.random() * 20) + 5}
  recentPurchases={Math.floor(Math.random() * 100) + 50}
/>
```

---

### Step 5: Test Locally (5 minutes)

```bash
# Install dependencies (if needed)
npm install

# Run development server
npm run dev

# Open browser
open http://localhost:3000/shop/your-slug
```

#### Test Checklist:
- [ ] Flash deal banner appears with countdown timer
- [ ] Social proof shows "X people viewing"
- [ ] Gamification widget appears (bottom right)
- [ ] Trust badges display correctly
- [ ] Recommended products section shows
- [ ] No console errors

---

### Step 6: Build and Deploy (5 minutes)

```bash
# Build the project
npm run build

# If build succeeds, commit and push
git add .
git commit -m "feat: integrate advanced ecommerce features"
git push origin main
```

Vercel will automatically deploy your changes.

---

## ✅ VERIFICATION

### After Deployment, Verify:

1. **Database Tables**
   ```sql
   SELECT COUNT(*) FROM user_coins;
   SELECT COUNT(*) FROM flash_deals;
   SELECT COUNT(*) FROM daily_missions;
   ```

2. **API Endpoints**
   - Visit: `/api/ecommerce/flash-deals?tenantSlug=your-slug`
   - Should return JSON with deals array

3. **Frontend Components**
   - Flash deal banner visible on homepage
   - Countdown timer working
   - Social proof notifications appearing
   - Gamification widget clickable

4. **Mobile Responsiveness**
   - Test on mobile device
   - All components should be responsive
   - Touch-friendly interactions

---

## 🐛 TROUBLESHOOTING

### Issue: Tables not created
**Solution:** Check Supabase SQL editor for errors. Ensure you have proper permissions.

### Issue: API returns 500 error
**Solution:** Check environment variables are set in Vercel. Verify tenant_id exists.

### Issue: Components not showing
**Solution:** Check browser console for errors. Verify imports are correct.

### Issue: Countdown timer not working
**Solution:** Check that flash deal `ends_at` is in the future.

### Issue: Gamification widget not appearing
**Solution:** Ensure `customerId` is passed as prop. Check if user is logged in.

---

## 📊 MONITORING

### Key Metrics to Track:
- Flash deal conversion rate
- Coin earning/spending patterns
- Mission completion rates
- Social proof click-through rate
- Bundle deal performance
- Average order value change
- Session duration increase

### Tools:
- Supabase Dashboard (database queries)
- Vercel Analytics (page views, performance)
- Browser DevTools (console errors)
- Google Analytics (user behavior)

---

## 🎯 NEXT STEPS

After successful deployment:

1. **Create More Flash Deals**
   - Add 5-10 flash deals per day
   - Rotate products regularly
   - Test different discount percentages

2. **Configure Missions**
   - Add more daily missions
   - Adjust coin rewards
   - Track completion rates

3. **Seed Recommendations**
   - Manually create product recommendations
   - Or implement AI recommendation algorithm

4. **Create Bundle Deals**
   - Identify complementary products
   - Create attractive bundles
   - Test different pricing strategies

5. **Monitor Performance**
   - Track conversion rates
   - Monitor user engagement
   - Analyze coin economy

---

## 📚 ADDITIONAL RESOURCES

- `ECOMMERCE_TRANSFORMATION_COMPLETE.md` - Full documentation
- `lib/ecommerce-advanced-schema.sql` - Database schema
- `components/Ecommerce/` - Component source code
- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs

---

## 🎉 SUCCESS!

If you've completed all steps:
- ✅ Database migrated
- ✅ API endpoints created
- ✅ Components integrated
- ✅ Tested locally
- ✅ Deployed to production

**Congratulations! Your advanced e-commerce features are now live! 🚀**

---

**Estimated Time:** 30-60 minutes  
**Difficulty:** Intermediate  
**Support:** Check documentation or review code comments

**Happy selling! 🛍️**

-- ============================================================
-- SEED DATA FOR E-COMMERCE ADVANCED FEATURES
-- Run this after ecommerce-advanced-schema.sql
-- ============================================================

-- NOTE: Replace 'YOUR_TENANT_ID_HERE' with your actual tenant ID
-- Get your tenant ID by running: SELECT id, name, slug FROM tenants;

-- ============================================================
-- 1. DAILY MISSIONS
-- ============================================================
INSERT INTO daily_missions (tenant_id, mission_type, title, description, target_count, coin_reward, is_active, display_order)
VALUES 
  ('YOUR_TENANT_ID_HERE', 'view_products', 'Browse 5 Products', 'View 5 different products today', 5, 10, true, 1),
  ('YOUR_TENANT_ID_HERE', 'add_to_cart', 'Add to Cart', 'Add any product to your cart', 1, 15, true, 2),
  ('YOUR_TENANT_ID_HERE', 'share', 'Share a Product', 'Share a product with friends', 1, 20, true, 3),
  ('YOUR_TENANT_ID_HERE', 'review', 'Write a Review', 'Leave a review for a product', 1, 25, true, 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. FLASH DEALS
-- ============================================================
-- Get a product ID first: SELECT id, name FROM products LIMIT 5;
-- Then replace 'YOUR_PRODUCT_ID_HERE' with actual product ID

INSERT INTO flash_deals (
  tenant_id, product_id, title, 
  original_price, flash_price, discount_percentage,
  total_quantity, remaining_quantity,
  starts_at, ends_at, status, featured, display_order
)
VALUES 
  (
    'YOUR_TENANT_ID_HERE',
    'YOUR_PRODUCT_ID_HERE',
    'Flash Sale - Limited Time!',
    5000.00,
    2999.00,
    40,
    100,
    100,
    NOW(),
    NOW() + INTERVAL '24 hours',
    'active',
    true,
    1
  )
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. SELLER RATING (Initialize)
-- ============================================================
INSERT INTO seller_ratings (
  tenant_id, 
  overall_rating, 
  item_as_described, 
  communication, 
  shipping_speed,
  total_orders,
  positive_ratings
)
VALUES (
  'YOUR_TENANT_ID_HERE',
  5.0,
  5.0,
  5.0,
  5.0,
  0,
  0
)
ON CONFLICT (tenant_id) DO NOTHING;

-- ============================================================
-- 4. PRODUCT RECOMMENDATIONS (Sample)
-- ============================================================
-- This creates "You may also like" recommendations
-- Get product IDs first: SELECT id, name FROM products LIMIT 10;

-- Example: If product A is viewed, recommend products B, C, D
/*
INSERT INTO product_recommendations (
  tenant_id,
  source_product_id,
  recommended_product_id,
  recommendation_type,
  score
)
VALUES 
  ('YOUR_TENANT_ID_HERE', 'PRODUCT_A_ID', 'PRODUCT_B_ID', 'you_may_like', 0.95),
  ('YOUR_TENANT_ID_HERE', 'PRODUCT_A_ID', 'PRODUCT_C_ID', 'you_may_like', 0.90),
  ('YOUR_TENANT_ID_HERE', 'PRODUCT_A_ID', 'PRODUCT_D_ID', 'you_may_like', 0.85)
ON CONFLICT DO NOTHING;
*/

-- ============================================================
-- 5. BUNDLE DEALS (Sample)
-- ============================================================
-- Get product IDs first: SELECT id, name, retail_price FROM products LIMIT 10;

/*
-- Create a bundle
INSERT INTO bundle_deals (
  tenant_id,
  title,
  description,
  bundle_price,
  original_total,
  savings_amount,
  savings_percentage,
  is_active,
  featured
)
VALUES (
  'YOUR_TENANT_ID_HERE',
  'Complete Starter Pack',
  'Everything you need to get started',
  8999.00,
  12000.00,
  3001.00,
  25,
  true,
  true
)
RETURNING id;

-- Add products to the bundle (use the bundle ID from above)
INSERT INTO bundle_deal_products (tenant_id, bundle_id, product_id, quantity, display_order)
VALUES 
  ('YOUR_TENANT_ID_HERE', 'BUNDLE_ID_HERE', 'PRODUCT_1_ID', 1, 1),
  ('YOUR_TENANT_ID_HERE', 'BUNDLE_ID_HERE', 'PRODUCT_2_ID', 1, 2),
  ('YOUR_TENANT_ID_HERE', 'BUNDLE_ID_HERE', 'PRODUCT_3_ID', 1, 3);
*/

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check missions were created
SELECT COUNT(*) as mission_count FROM daily_missions WHERE tenant_id = 'YOUR_TENANT_ID_HERE';

-- Check flash deals
SELECT COUNT(*) as flash_deal_count FROM flash_deals WHERE tenant_id = 'YOUR_TENANT_ID_HERE';

-- Check seller rating
SELECT * FROM seller_ratings WHERE tenant_id = 'YOUR_TENANT_ID_HERE';

-- ============================================================
-- DONE
-- ============================================================
-- Sample data seeded successfully!
-- Now you can test the features in your storefront.

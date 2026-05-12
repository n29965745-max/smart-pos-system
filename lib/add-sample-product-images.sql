-- =====================================================
-- ADD SAMPLE PRODUCT IMAGES & VIDEOS
-- =====================================================
-- This script helps you add images and videos to your products
-- First, let's see what products you have
-- =====================================================

-- Step 1: View your products (run this first to get IDs)
SELECT 
  id as product_id,
  tenant_id,
  name,
  image_url as current_image
FROM products
LIMIT 10;

-- =====================================================
-- Step 2: Add images to a specific product
-- Replace the UUIDs below with actual values from Step 1
-- =====================================================

/*
-- Example: Add multiple images to ONE product
-- Copy the product_id and tenant_id from the query above

INSERT INTO product_images (tenant_id, product_id, image_url, image_type, display_order, alt_text)
VALUES 
  -- Replace these UUIDs with your actual product_id and tenant_id
  ('PASTE_TENANT_ID_HERE', 'PASTE_PRODUCT_ID_HERE', 'https://example.com/front.jpg', 'primary', 0, 'Front view'),
  ('PASTE_TENANT_ID_HERE', 'PASTE_PRODUCT_ID_HERE', 'https://example.com/side.jpg', 'angle', 1, 'Side view'),
  ('PASTE_TENANT_ID_HERE', 'PASTE_PRODUCT_ID_HERE', 'https://example.com/back.jpg', 'angle', 2, 'Back view'),
  ('PASTE_TENANT_ID_HERE', 'PASTE_PRODUCT_ID_HERE', 'https://example.com/detail.jpg', 'detail', 3, 'Close-up detail');
*/

-- =====================================================
-- Step 3: Add a video to a product (optional)
-- =====================================================

/*
-- Example: Add a YouTube video
INSERT INTO product_videos (tenant_id, product_id, video_url, video_type, display_order, title)
VALUES 
  ('PASTE_TENANT_ID_HERE', 'PASTE_PRODUCT_ID_HERE', 'https://youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 0, 'Product Demo');
*/

-- =====================================================
-- Step 4: Verify your images were added
-- =====================================================

/*
-- Check images for a product
SELECT 
  pi.image_type,
  pi.display_order,
  pi.image_url,
  pi.alt_text,
  p.name as product_name
FROM product_images pi
JOIN products p ON pi.product_id = p.id
WHERE pi.product_id = 'PASTE_PRODUCT_ID_HERE'
ORDER BY pi.display_order;
*/

-- =====================================================
-- QUICK START: Use existing product images
-- =====================================================
-- This will copy your existing product.image_url into product_images table

INSERT INTO product_images (tenant_id, product_id, image_url, image_type, display_order, alt_text)
SELECT 
  tenant_id,
  id as product_id,
  image_url,
  'primary' as image_type,
  0 as display_order,
  name || ' - Main Image' as alt_text
FROM products
WHERE image_url IS NOT NULL
  AND image_url != ''
  AND NOT EXISTS (
    -- Don't duplicate if already exists
    SELECT 1 FROM product_images pi 
    WHERE pi.product_id = products.id 
    AND pi.image_type = 'primary'
  );

-- Check how many images were added
SELECT COUNT(*) as images_added FROM product_images;

-- View products with their image counts
SELECT 
  p.id,
  p.name,
  p.image_url as original_image,
  COUNT(pi.id) as image_count
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id, p.name, p.image_url
ORDER BY image_count DESC
LIMIT 20;

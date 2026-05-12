-- =====================================================
-- ADD SAMPLE PRODUCT IMAGES & VIDEOS (SIMPLE VERSION)
-- =====================================================
-- Works without tenant_id in products table
-- =====================================================

-- Step 1: Check your products table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Step 2: View your products
SELECT 
  id as product_id,
  name,
  image_url as current_image
FROM products
LIMIT 10;

-- =====================================================
-- QUICK START: Copy existing product images
-- This uses a dummy tenant_id (all zeros UUID)
-- =====================================================

-- Use a default tenant_id for all products
DO $$
DECLARE
  default_tenant_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- Copy existing product images into product_images table
  INSERT INTO product_images (tenant_id, product_id, image_url, image_type, display_order, alt_text)
  SELECT 
    default_tenant_id,
    id as product_id,
    image_url,
    'primary' as image_type,
    0 as display_order,
    name || ' - Main Image' as alt_text
  FROM products
  WHERE image_url IS NOT NULL
    AND image_url != ''
    AND NOT EXISTS (
      SELECT 1 FROM product_images pi 
      WHERE pi.product_id = products.id 
      AND pi.image_type = 'primary'
    );
  
  RAISE NOTICE 'Images copied successfully!';
END $$;

-- Check results
SELECT 
  p.id,
  p.name,
  p.image_url as original_image,
  COUNT(pi.id) as image_count,
  STRING_AGG(pi.image_type, ', ') as image_types
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id, p.name, p.image_url
ORDER BY image_count DESC
LIMIT 20;

-- =====================================================
-- To add more images manually:
-- =====================================================

/*
-- Get a product ID first
SELECT id, name FROM products LIMIT 5;

-- Then add images (replace the product_id)
INSERT INTO product_images (tenant_id, product_id, image_url, image_type, display_order, alt_text)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'PASTE_PRODUCT_ID_HERE', 'https://example.com/front.jpg', 'primary', 0, 'Front view'),
  ('00000000-0000-0000-0000-000000000000', 'PASTE_PRODUCT_ID_HERE', 'https://example.com/side.jpg', 'angle', 1, 'Side view'),
  ('00000000-0000-0000-0000-000000000000', 'PASTE_PRODUCT_ID_HERE', 'https://example.com/back.jpg', 'angle', 2, 'Back view');
*/

-- =====================================================
-- To add a video:
-- =====================================================

/*
INSERT INTO product_videos (tenant_id, product_id, video_url, video_type, display_order, title)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'PASTE_PRODUCT_ID_HERE', 'https://youtube.com/watch?v=xxxxx', 'youtube', 0, 'Product Demo');
*/

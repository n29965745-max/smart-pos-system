-- =====================================================
-- IMMERSIVE VISUAL SHOP - DATABASE SCHEMA EXTENSIONS
-- =====================================================
-- This migration adds support for multi-angle product images,
-- product videos, and recommendation caching for the immersive
-- visual shopping experience.
--
-- Tasks: 1.1, 1.3, 1.4, 1.6
-- Requirements: 16.1, 16.4, 16.5, 16.7, 10.3, 13.1
-- =====================================================

-- =====================================================
-- TASK 1.1: Create product_images table with RLS
-- =====================================================

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Image details
  image_url TEXT NOT NULL,
  image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('primary', 'angle', 'lifestyle', 'size_reference', 'detail')),
  display_order INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  
  -- Metadata
  width INTEGER,
  height INTEGER,
  file_size_kb INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure ordering is unique per product
  UNIQUE(tenant_id, product_id, display_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_tenant ON product_images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_order ON product_images(product_id, display_order);

-- Enable RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images FORCE ROW LEVEL SECURITY;

-- RLS Policy: Tenant isolation
DROP POLICY IF EXISTS product_images_tenant_isolation ON product_images;
CREATE POLICY product_images_tenant_isolation ON product_images
  FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON product_images TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_images TO anon;

-- =====================================================
-- TASK 1.3: Create product_videos table with RLS
-- =====================================================

CREATE TABLE IF NOT EXISTS product_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Video details
  video_url TEXT NOT NULL,
  video_type VARCHAR(20) NOT NULL CHECK (video_type IN ('mp4', 'webm', 'youtube', 'vimeo')),
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  
  -- Display
  display_order INTEGER NOT NULL DEFAULT 0,
  title VARCHAR(255),
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_videos_tenant ON product_videos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_videos_product ON product_videos(product_id);
CREATE INDEX IF NOT EXISTS idx_product_videos_product_order ON product_videos(product_id, display_order);

-- Enable RLS
ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_videos FORCE ROW LEVEL SECURITY;

-- RLS Policy: Tenant isolation
DROP POLICY IF EXISTS product_videos_tenant_isolation ON product_videos;
CREATE POLICY product_videos_tenant_isolation ON product_videos
  FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON product_videos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_videos TO anon;

-- =====================================================
-- TASK 1.4: Create product_recommendations_cache table
-- =====================================================

CREATE TABLE IF NOT EXISTS product_recommendations_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Cached recommendations (array of product IDs)
  recommended_product_ids UUID[] NOT NULL,
  
  -- Cache metadata
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  
  UNIQUE(tenant_id, product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_tenant ON product_recommendations_cache(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_product ON product_recommendations_cache(product_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_expires ON product_recommendations_cache(expires_at);

-- Enable RLS
ALTER TABLE product_recommendations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recommendations_cache FORCE ROW LEVEL SECURITY;

-- RLS Policy: Tenant isolation
DROP POLICY IF EXISTS recommendations_cache_tenant_isolation ON product_recommendations_cache;
CREATE POLICY recommendations_cache_tenant_isolation ON product_recommendations_cache
  FOR ALL 
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON product_recommendations_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_recommendations_cache TO anon;

-- =====================================================
-- TASK 1.6: Add shop_settings columns for visual customization
-- =====================================================

-- Add new columns to shop_settings table
ALTER TABLE shop_settings 
  ADD COLUMN IF NOT EXISTS background_image_url TEXT,
  ADD COLUMN IF NOT EXISTS background_video_url TEXT,
  ADD COLUMN IF NOT EXISTS ai_assistant_enabled BOOLEAN DEFAULT false;

-- Update existing records to set default values
UPDATE shop_settings 
SET ai_assistant_enabled = false 
WHERE ai_assistant_enabled IS NULL;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify tables were created
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
    RAISE NOTICE '✓ product_images table created successfully';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_videos') THEN
    RAISE NOTICE '✓ product_videos table created successfully';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_recommendations_cache') THEN
    RAISE NOTICE '✓ product_recommendations_cache table created successfully';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'shop_settings' 
    AND column_name = 'ai_assistant_enabled'
  ) THEN
    RAISE NOTICE '✓ shop_settings columns added successfully';
  END IF;
END $$;

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- This section can be used to add sample images/videos for testing
-- Uncomment and modify as needed

/*
-- Example: Add sample images for a product
INSERT INTO product_images (tenant_id, product_id, image_url, image_type, display_order, alt_text)
SELECT 
  p.tenant_id,
  p.id,
  'https://example.com/images/product-' || p.id || '-front.jpg',
  'primary',
  0,
  p.name || ' - Front View'
FROM products p
WHERE p.name LIKE '%Sample%'
LIMIT 1;
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

RAISE NOTICE '========================================';
RAISE NOTICE 'Immersive Visual Shop Schema Migration Complete!';
RAISE NOTICE '========================================';
RAISE NOTICE 'Tables Created:';
RAISE NOTICE '  - product_images (with RLS)';
RAISE NOTICE '  - product_videos (with RLS)';
RAISE NOTICE '  - product_recommendations_cache (with RLS)';
RAISE NOTICE 'Columns Added:';
RAISE NOTICE '  - shop_settings.background_image_url';
RAISE NOTICE '  - shop_settings.background_video_url';
RAISE NOTICE '  - shop_settings.ai_assistant_enabled';
RAISE NOTICE '========================================';

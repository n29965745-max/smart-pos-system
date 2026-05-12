-- =====================================================
-- IMMERSIVE VISUAL SHOP - STANDALONE MIGRATION
-- =====================================================
-- This version works without the tenants table
-- Uses products table tenant_id directly
-- =====================================================

-- =====================================================
-- 1. PRODUCT IMAGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT NOT NULL CHECK (image_type IN ('primary', 'angle', 'lifestyle', 'size_reference', 'detail')),
  display_order INTEGER NOT NULL DEFAULT 0,
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  file_size_kb INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique display order per product
  CONSTRAINT unique_product_image_order UNIQUE (tenant_id, product_id, display_order)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_tenant ON product_images(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_order ON product_images(product_id, display_order);

-- Enable RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access images for their tenant
CREATE POLICY product_images_tenant_isolation ON product_images
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- =====================================================
-- 2. PRODUCT VIDEOS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_type TEXT NOT NULL CHECK (video_type IN ('mp4', 'webm', 'youtube', 'vimeo')),
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  title TEXT,
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

-- RLS Policy: Users can only access videos for their tenant
CREATE POLICY product_videos_tenant_isolation ON product_videos
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- =====================================================
-- 3. PRODUCT RECOMMENDATIONS CACHE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS product_recommendations_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_ids UUID[] NOT NULL DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  
  -- Ensure one cache entry per product
  CONSTRAINT unique_product_recommendations UNIQUE (tenant_id, product_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_tenant ON product_recommendations_cache(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_product ON product_recommendations_cache(product_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_cache_expires ON product_recommendations_cache(expires_at);

-- Enable RLS
ALTER TABLE product_recommendations_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access cache for their tenant
CREATE POLICY recommendations_cache_tenant_isolation ON product_recommendations_cache
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

-- =====================================================
-- 4. ADD COLUMNS TO SHOP_SETTINGS (IF TABLE EXISTS)
-- =====================================================

DO $$
BEGIN
  -- Check if shop_settings table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shop_settings') THEN
    
    -- Add background_image_url if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'shop_settings' AND column_name = 'background_image_url'
    ) THEN
      ALTER TABLE shop_settings ADD COLUMN background_image_url TEXT;
      RAISE NOTICE 'Added background_image_url to shop_settings';
    END IF;
    
    -- Add background_video_url if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'shop_settings' AND column_name = 'background_video_url'
    ) THEN
      ALTER TABLE shop_settings ADD COLUMN background_video_url TEXT;
      RAISE NOTICE 'Added background_video_url to shop_settings';
    END IF;
    
    -- Add ai_assistant_enabled if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'shop_settings' AND column_name = 'ai_assistant_enabled'
    ) THEN
      ALTER TABLE shop_settings ADD COLUMN ai_assistant_enabled BOOLEAN DEFAULT false;
      RAISE NOTICE 'Added ai_assistant_enabled to shop_settings';
    END IF;
    
  ELSE
    RAISE NOTICE 'shop_settings table does not exist - skipping column additions';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Immersive Visual Shop Schema Migration Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - product_images (with RLS)';
  RAISE NOTICE '  - product_videos (with RLS)';
  RAISE NOTICE '  - product_recommendations_cache (with RLS)';
  RAISE NOTICE 'Columns Added (if shop_settings exists):';
  RAISE NOTICE '  - shop_settings.background_image_url';
  RAISE NOTICE '  - shop_settings.background_video_url';
  RAISE NOTICE '  - shop_settings.ai_assistant_enabled';
  RAISE NOTICE '========================================';
END $$;

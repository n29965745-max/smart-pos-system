-- ============================================
-- FIX NYLAWIGS SHOP - Complete Setup
-- ============================================
-- This script ensures nylawigs tenant exists with products

-- Step 1: Check if nylawigs tenant exists
DO $$
DECLARE
  v_tenant_id UUID;
  v_product_count INT;
BEGIN
  -- Get or create nylawigs tenant
  SELECT id INTO v_tenant_id
  FROM tenants
  WHERE subdomain = 'nylawigs';

  IF v_tenant_id IS NULL THEN
    -- Create nylawigs tenant
    INSERT INTO tenants (
      id,
      business_name,
      subdomain,
      business_type,
      is_active,
      primary_color,
      tagline,
      business_phone,
      created_at
    ) VALUES (
      'a0000000-0000-0000-0000-000000000001',
      'Nyla Wigs',
      'nylawigs',
      'retail',
      true,
      '#ec4899',
      'Luxury wigs that EAT everytime',
      '0718307550',
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET subdomain = 'nylawigs',
        business_name = 'Nyla Wigs',
        is_active = true;

    v_tenant_id := 'a0000000-0000-0000-0000-000000000001';
    RAISE NOTICE 'Created/Updated nylawigs tenant: %', v_tenant_id;
  ELSE
    -- Update to ensure it's active
    UPDATE tenants
    SET is_active = true,
        business_name = 'Nyla Wigs',
        tagline = 'Luxury wigs that EAT everytime'
    WHERE id = v_tenant_id;
    
    RAISE NOTICE 'Nylawigs tenant exists: %', v_tenant_id;
  END IF;

  -- Step 2: Ensure shop_settings exists
  INSERT INTO shop_settings (
    tenant_id,
    business_tagline,
    business_phone,
    primary_color,
    created_at
  ) VALUES (
    v_tenant_id,
    'Luxury wigs that EAT everytime',
    '0718307550',
    '#ec4899',
    NOW()
  )
  ON CONFLICT (tenant_id) DO UPDATE
  SET business_tagline = 'Luxury wigs that EAT everytime',
      business_phone = '0718307550',
      primary_color = '#ec4899';

  RAISE NOTICE 'Shop settings configured';

  -- Step 3: Check product count
  SELECT COUNT(*) INTO v_product_count
  FROM products
  WHERE tenant_id = v_tenant_id;

  RAISE NOTICE 'Current product count: %', v_product_count;

  -- Step 4: Add sample products if none exist
  IF v_product_count < 5 THEN
    RAISE NOTICE 'Adding sample products...';
    
    -- Add 20 sample wig products
    INSERT INTO products (
      tenant_id,
      name,
      sku,
      category,
      retail_price,
      cost_price,
      stock_quantity,
      description,
      image_url,
      created_at
    ) VALUES
    -- Lace Front Wigs
    (v_tenant_id, 'Brazilian Lace Front Wig - Natural Black', 'WIG-LF-001', 'Lace Front Wigs', 8500, 4500, 15, 'Premium Brazilian human hair lace front wig with natural hairline', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400', NOW()),
    (v_tenant_id, 'HD Lace Frontal Wig - Body Wave', 'WIG-LF-002', 'Lace Front Wigs', 12000, 6500, 12, 'Invisible HD lace with beautiful body wave texture', 'https://images.unsplash.com/photo-1595475884562-073c30d45670?w=400', NOW()),
    (v_tenant_id, 'Transparent Lace Wig - Straight', 'WIG-LF-003', 'Lace Front Wigs', 9500, 5000, 20, 'Transparent lace for all skin tones, silky straight', 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400', NOW()),
    (v_tenant_id, '13x4 Lace Front Wig - Deep Wave', 'WIG-LF-004', 'Lace Front Wigs', 11000, 6000, 10, 'Deep wave texture with 13x4 lace frontal', 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400', NOW()),
    
    -- Full Lace Wigs
    (v_tenant_id, 'Full Lace Wig - Curly', 'WIG-FL-001', 'Full Lace Wigs', 15000, 8000, 8, 'Full lace construction for versatile styling', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400', NOW()),
    (v_tenant_id, 'Full Lace Bob Wig - Straight', 'WIG-FL-002', 'Full Lace Wigs', 13500, 7000, 10, 'Chic bob style with full lace cap', 'https://images.unsplash.com/photo-1524502397800-2eeaad7c3fe5?w=400', NOW()),
    (v_tenant_id, 'Full Lace Wig - Loose Wave', 'WIG-FL-003', 'Full Lace Wigs', 14000, 7500, 7, 'Loose wave pattern, full lace for maximum styling', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400', NOW()),
    
    -- Closure Wigs
    (v_tenant_id, '4x4 Closure Wig - Kinky Straight', 'WIG-CL-001', 'Closure Wigs', 7500, 4000, 18, 'Kinky straight texture with 4x4 closure', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400', NOW()),
    (v_tenant_id, '5x5 Closure Wig - Water Wave', 'WIG-CL-002', 'Closure Wigs', 8000, 4200, 15, 'Beautiful water wave with 5x5 closure', 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=400', NOW()),
    (v_tenant_id, '6x6 Closure Wig - Yaki Straight', 'WIG-CL-003', 'Closure Wigs', 8500, 4500, 12, 'Yaki straight texture, 6x6 closure for natural look', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400', NOW()),
    
    -- Colored Wigs
    (v_tenant_id, 'Burgundy Lace Front Wig', 'WIG-COL-001', 'Colored Wigs', 10500, 5500, 9, 'Stunning burgundy color, lace front construction', 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400', NOW()),
    (v_tenant_id, 'Blonde Highlight Wig - Body Wave', 'WIG-COL-002', 'Colored Wigs', 13000, 7000, 6, 'Blonde highlights on body wave texture', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400', NOW()),
    (v_tenant_id, 'Ombre Wig - Black to Brown', 'WIG-COL-003', 'Colored Wigs', 11500, 6000, 8, 'Beautiful ombre from black to brown', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400', NOW()),
    (v_tenant_id, 'Red Lace Front Wig - Straight', 'WIG-COL-004', 'Colored Wigs', 12500, 6500, 5, 'Vibrant red color, silky straight', 'https://images.unsplash.com/photo-1479936343636-73cdc5aae0c3?w=400', NOW()),
    
    -- Short Wigs
    (v_tenant_id, 'Pixie Cut Wig - Natural Black', 'WIG-SHORT-001', 'Short Wigs', 6500, 3500, 20, 'Chic pixie cut for bold look', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400', NOW()),
    (v_tenant_id, 'Bob Wig - Straight', 'WIG-SHORT-002', 'Short Wigs', 7000, 3800, 18, 'Classic bob style, straight texture', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400', NOW()),
    (v_tenant_id, 'Curly Bob Wig', 'WIG-SHORT-003', 'Short Wigs', 7500, 4000, 15, 'Curly bob for playful style', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400', NOW()),
    
    -- Long Wigs
    (v_tenant_id, '30 Inch Straight Wig', 'WIG-LONG-001', 'Long Wigs', 16000, 8500, 5, 'Extra long 30 inch straight wig', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400', NOW()),
    (v_tenant_id, '28 Inch Body Wave Wig', 'WIG-LONG-002', 'Long Wigs', 15000, 8000, 6, 'Long body wave for glamorous look', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400', NOW()),
    (v_tenant_id, '26 Inch Deep Wave Wig', 'WIG-LONG-003', 'Long Wigs', 14500, 7800, 7, 'Deep wave texture, 26 inches long', 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400', NOW())
    ON CONFLICT (sku, tenant_id) DO NOTHING;

    RAISE NOTICE 'Sample products added';
  END IF;

  -- Step 5: Verify setup
  SELECT COUNT(*) INTO v_product_count
  FROM products
  WHERE tenant_id = v_tenant_id;

  RAISE NOTICE '=================================';
  RAISE NOTICE 'SETUP COMPLETE!';
  RAISE NOTICE 'Tenant ID: %', v_tenant_id;
  RAISE NOTICE 'Tenant Slug: nylawigs';
  RAISE NOTICE 'Total Products: %', v_product_count;
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Shop URL: /shop/nylawigs';
  RAISE NOTICE 'Test API: /api/tenant/by-slug/nylawigs';
  RAISE NOTICE 'Products API: /api/ecommerce/products/simple?tenantSlug=nylawigs';
  RAISE NOTICE '=================================';

END $$;

-- Verify the setup
SELECT 
  'Tenant' as type,
  id::text as id,
  business_name as name,
  subdomain as slug,
  is_active::text as active
FROM tenants
WHERE subdomain = 'nylawigs'

UNION ALL

SELECT 
  'Products' as type,
  COUNT(*)::text as id,
  'Total Products' as name,
  '' as slug,
  '' as active
FROM products p
JOIN tenants t ON p.tenant_id = t.id
WHERE t.subdomain = 'nylawigs';

/**
 * Product Gallery API Endpoint
 * 
 * GET /api/ecommerce/products/[id]/gallery?tenantSlug=xxx
 * 
 * Returns product data with all images and videos for the gallery component.
 * 
 * Tasks: 3.1
 * Requirements: 1.1, 2.1
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import mediaService from '../../../../../services/media.service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { tenantSlug } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }

    if (!tenantSlug || typeof tenantSlug !== 'string') {
      return res.status(400).json({ success: false, error: 'Tenant slug is required' });
    }

    // Get tenant by slug
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    const tenantId = tenant.id;

    // Set tenant context for RLS
    await supabase.rpc('set_config', {
      setting: 'app.current_tenant_id',
      value: tenantId
    });

    // Get product data
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Get images and videos
    const [images, videos] = await Promise.all([
      mediaService.getProductImages(tenantId, id),
      mediaService.getProductVideos(tenantId, id)
    ]);

    // Determine primary image
    let primaryImage = product.image_url || '';
    if (images.length > 0) {
      const primaryImg = images.find(img => img.image_type === 'primary');
      primaryImage = primaryImg ? primaryImg.image_url : images[0].image_url;
    }

    return res.status(200).json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          retail_price: product.retail_price,
          stock_quantity: product.stock_quantity,
          category: product.category,
        },
        images,
        videos,
        primaryImage
      }
    });
  } catch (error: any) {
    console.error('Error in gallery endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * Product Videos API Endpoint
 * 
 * GET /api/ecommerce/products/[id]/videos?tenantSlug=xxx
 * 
 * Returns all videos for a product, ordered by display_order.
 * 
 * Tasks: 3.2
 * Requirements: 2.1, 2.3
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

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Get videos
    const videos = await mediaService.getProductVideos(tenantId, id);

    return res.status(200).json({
      success: true,
      data: {
        videos,
        productId: id,
        productName: product.name
      }
    });
  } catch (error: any) {
    console.error('Error in videos endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

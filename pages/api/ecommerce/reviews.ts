/**
 * Product Reviews API Endpoint
 * 
 * GET /api/ecommerce/reviews?tenantSlug=xxx&productId=xxx&sort=most_recent
 * 
 * Returns customer reviews for a product with sorting options.
 * 
 * Tasks: 3.7
 * Requirements: 14.1, 14.2, 14.4
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

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
    const { tenantSlug, productId, sort = 'most_recent', limit = 20 } = req.query;

    if (!tenantSlug || typeof tenantSlug !== 'string') {
      return res.status(400).json({ success: false, error: 'Tenant slug is required' });
    }

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
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

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .eq('tenant_id', tenantId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Build reviews query
    let query = supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true); // Only show approved reviews

    // Apply sorting
    switch (sort) {
      case 'highest_rated':
        query = query.order('rating', { ascending: false });
        break;
      case 'most_helpful':
        query = query.order('helpful_count', { ascending: false });
        break;
      case 'most_recent':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    // Apply limit
    const limitNum = parseInt(limit as string, 10);
    query = query.limit(limitNum);

    const { data: reviews, error: reviewsError } = await query;

    if (reviewsError) {
      throw reviewsError;
    }

    // Calculate average rating and total count
    const { data: stats } = await supabase
      .from('product_reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_approved', true);

    const totalCount = stats?.length || 0;
    const averageRating = totalCount > 0
      ? stats!.reduce((sum, r) => sum + r.rating, 0) / totalCount
      : 0;

    // Get rating distribution
    const ratingDistribution = {
      5: stats?.filter(r => r.rating === 5).length || 0,
      4: stats?.filter(r => r.rating === 4).length || 0,
      3: stats?.filter(r => r.rating === 3).length || 0,
      2: stats?.filter(r => r.rating === 2).length || 0,
      1: stats?.filter(r => r.rating === 1).length || 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        reviews: reviews || [],
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalCount,
        ratingDistribution,
        productId,
        productName: product.name
      }
    });
  } catch (error: any) {
    console.error('Error in reviews endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

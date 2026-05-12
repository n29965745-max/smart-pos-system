/**
 * Recently Viewed Products API Endpoint
 * 
 * POST /api/ecommerce/recently-viewed - Add product to recently viewed
 * GET /api/ecommerce/recently-viewed?tenantSlug=xxx&productIds=id1,id2,id3 - Get product details
 * 
 * Note: Recently viewed history is managed client-side in localStorage.
 * This endpoint provides product details for the IDs stored in localStorage.
 * 
 * Tasks: 3.5
 * Requirements: 9.1, 9.2
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
  if (req.method === 'GET') {
    return handleGet(req, res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}

/**
 * GET - Fetch product details for recently viewed product IDs
 */
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tenantSlug, productIds } = req.query;

    if (!tenantSlug || typeof tenantSlug !== 'string') {
      return res.status(400).json({ success: false, error: 'Tenant slug is required' });
    }

    if (!productIds || typeof productIds !== 'string') {
      return res.status(400).json({ success: false, error: 'Product IDs are required' });
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

    // Parse product IDs
    const productIdArray = productIds.split(',').filter(Boolean);

    if (productIdArray.length === 0) {
      return res.status(200).json({
        success: true,
        data: { products: [] }
      });
    }

    // Set tenant context for RLS
    await supabase.rpc('set_config', {
      setting: 'app.current_tenant_id',
      value: tenantId
    });

    // Fetch products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, description, retail_price, stock_quantity, category, image_url')
      .eq('tenant_id', tenantId)
      .in('id', productIdArray)
      .gt('stock_quantity', 0); // Only return in-stock products

    if (productsError) {
      throw productsError;
    }

    // Maintain the order from productIds
    const orderedProducts = productIdArray
      .map(id => products?.find(p => p.id === id))
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: {
        products: orderedProducts
      }
    });
  } catch (error: any) {
    console.error('Error in recently-viewed GET:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

/**
 * POST - Validate that a product exists (client manages localStorage)
 */
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { tenantSlug, productId } = req.body;

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

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, retail_price, image_url, category')
      .eq('id', productId)
      .eq('tenant_id', tenantId)
      .single();

    if (productError || !product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    // Return product data for client to store in localStorage
    return res.status(200).json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          retail_price: product.retail_price,
          image_url: product.image_url,
          category: product.category,
          viewedAt: Date.now()
        }
      }
    });
  } catch (error: any) {
    console.error('Error in recently-viewed POST:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

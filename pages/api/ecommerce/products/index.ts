/**
 * Enhanced Products API Endpoint
 * 
 * GET /api/ecommerce/products?tenantSlug=xxx&search=xxx&autocomplete=true
 * 
 * Features:
 * - Autocomplete support (returns suggestions after 2 characters)
 * - Advanced filtering (category, price range, colors, sizes, inStock)
 * - Result counts per filter option
 * - Fast response time (<300ms for typical queries)
 * 
 * Tasks: 3.6 (Enhanced)
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${method} not allowed` });
  }

  try {
    const { 
      tenantSlug, 
      category, 
      minPrice, 
      maxPrice, 
      search, 
      page = 1, 
      limit = 12,
      autocomplete,
      colors,
      sizes,
      inStock
    } = req.query;

    if (!tenantSlug) {
      return res.status(400).json({ error: 'Tenant slug required' });
    }

    // Autocomplete mode - return suggestions after 2 characters
    if (autocomplete === 'true' && search && typeof search === 'string' && search.length >= 2) {
      return handleAutocomplete(tenantSlug as string, search, res);
    }

    // Get tenant by slug
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant not found:', tenantSlug, tenantError);
      return res.status(404).json({ error: 'Shop not found', details: tenantError?.message });
    }

    // Build query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenant.id);

    // Stock filter
    if (inStock === 'true') {
      query = query.gt('stock_quantity', 0);
    } else {
      // By default, show all products (including out of stock)
      // This allows customers to see what's available even if temporarily out of stock
    }

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }

    if (minPrice) {
      query = query.gte('retail_price', parseFloat(minPrice as string));
    }

    if (maxPrice) {
      query = query.lte('retail_price', parseFloat(maxPrice as string));
    }

    // Color filter (if products have color field)
    if (colors && typeof colors === 'string') {
      const colorArray = colors.split(',');
      query = query.in('color', colorArray);
    }

    // Size filter (if products have size field)
    if (sizes && typeof sizes === 'string') {
      const sizeArray = sizes.split(',');
      query = query.in('size', sizeArray);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`);
    }

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    const { data: products, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch products',
        details: error.message,
        tenantId: tenant.id
      });
    }

    // Get filter counts (for "Show X results" on filter options)
    const filterCounts = await getFilterCounts(tenant.id, {
      category: category as string,
      minPrice: minPrice as string,
      maxPrice: maxPrice as string,
      search: search as string
    });

    console.log(`Found ${products?.length || 0} products for tenant ${tenantSlug}`);

    return res.status(200).json({
      products: products || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      },
      filterCounts
    });
  } catch (error: any) {
    console.error('Products API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

/**
 * Handle autocomplete suggestions
 */
async function handleAutocomplete(
  tenantSlug: string,
  search: string,
  res: NextApiResponse
) {
  try {
    // Get tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', tenantSlug)
      .single();

    if (!tenant) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Search for matching products (limit to 10 suggestions)
    const { data: products } = await supabase
      .from('products')
      .select('id, name, category, retail_price, image_url')
      .eq('tenant_id', tenant.id)
      .or(`name.ilike.%${search}%,category.ilike.%${search}%`)
      .gt('stock_quantity', 0)
      .limit(10);

    // Format suggestions
    const suggestions = (products || []).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.retail_price,
      image: p.image_url
    }));

    return res.status(200).json({
      success: true,
      suggestions
    });
  } catch (error: any) {
    console.error('Autocomplete error:', error);
    return res.status(500).json({ error: 'Autocomplete failed' });
  }
}

/**
 * Get result counts for filter options
 */
async function getFilterCounts(
  tenantId: string,
  currentFilters: {
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    search?: string;
  }
) {
  try {
    // Get all categories with counts
    const { data: categoryData } = await supabase
      .from('products')
      .select('category')
      .eq('tenant_id', tenantId)
      .gt('stock_quantity', 0);

    const categoryCounts: Record<string, number> = {};
    (categoryData || []).forEach(item => {
      if (item.category) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      }
    });

    // Get price ranges
    const { data: priceData } = await supabase
      .from('products')
      .select('retail_price')
      .eq('tenant_id', tenantId)
      .gt('stock_quantity', 0);

    const prices = (priceData || []).map(p => p.retail_price).filter(Boolean);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      categories: categoryCounts,
      priceRange: {
        min: minPrice,
        max: maxPrice
      },
      totalInStock: categoryData?.length || 0
    };
  } catch (error) {
    console.error('Error getting filter counts:', error);
    return {
      categories: {},
      priceRange: { min: 0, max: 0 },
      totalInStock: 0
    };
  }
}

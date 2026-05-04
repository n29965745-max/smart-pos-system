import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId } = req;
  const db = getAdminDb();
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { 
      page = '1', 
      limit = '20', 
      search = '', 
      category = '',
      filter = 'all', // all, parent, archived
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build query
    let query = db.from('products').select('*', { count: 'exact' }).eq('tenant_id', tenantId);

    // Apply filters
    if (filter === 'parent') {
      query = query.is('variant_of', null);
    } else if (filter === 'archived') {
      query = query.eq('status', 'inactive');
    }
    // For 'all', show all products (no filter)

    // Search
    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);
    }

    // Category filter
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    // Sorting
    query = query.order(sortBy as string, { ascending: sortOrder === 'asc' });

    // Pagination
    query = query.range(offset, offset + limitNum - 1);

    const { data: products, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Get unique categories for filter dropdown
    const { data: allProducts } = await supabase
      .from('products')
      .select('category');
    
    const categories = [...new Set(allProducts?.map(p => p.category) || [])];

    return res.status(200).json({
      products: products || [],
      categories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });

  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch inventory' });
  }
});

import type { NextApiResponse } from 'next';
;
import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

async function handler(req: SecureRequest, res: NextApiResponse) {
  const db = getAdminDb();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tenantId } = req;

  try {
    const { page = '1', limit = '100', search = '' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = getAdminDb()
      .from('products')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (search) query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`);
    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.status(200).json({
      products: data || [],
      pagination: { page: pageNum, limit: limitNum, total: count || 0, totalPages: Math.ceil((count || 0) / limitNum) }
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch products', products: [] });
  }
}

export default secureRoute(handler);

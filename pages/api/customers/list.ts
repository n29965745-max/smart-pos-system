import type { NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-client';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { tenantId } = req.auth;

  try {
    const { page = '1', limit = '20', search = '', customerType = '', status = '', sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    if (customerType && customerType !== 'all') query = query.eq('customer_type', customerType);
    if (status && status !== 'all') query = query.eq('status', status);

    query = query.order(sortBy as string, { ascending: sortOrder === 'asc' }).range(offset, offset + limitNum - 1);

    const { data: customers, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({
      customers: customers || [],
      pagination: { page: pageNum, limit: limitNum, total: count || 0, totalPages: Math.ceil((count || 0) / limitNum) }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch customers' });
  }
}

export default withAuth(handler);

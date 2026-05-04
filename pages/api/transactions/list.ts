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
    const { page = '1', limit = '20', search = '', paymentMethod = '', status = '', startDate = '', endDate = '', sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (search) query = query.or(`transaction_id.ilike.%${search}%,customer_name.ilike.%${search}%`);
    if (paymentMethod && paymentMethod !== 'all') query = query.eq('payment_method', paymentMethod);
    if (status && status !== 'all') query = query.eq('payment_status', status);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    query = query.order(sortBy as string, { ascending: sortOrder === 'asc' }).range(offset, offset + limitNum - 1);

    const { data: transactions, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const transactionsWithDetails = await Promise.all(
      (transactions || []).map(async (transaction) => {
        let customerName = transaction.customer_name || 'Walk-in Customer';
        let customerPhone = transaction.customer_phone || '';

        if (transaction.customer_id && !transaction.customer_name) {
          const { data: customer } = await supabaseAdmin
            .from('customers').select('name, phone').eq('id', transaction.customer_id).eq('tenant_id', tenantId).single();
          if (customer) { customerName = customer.name; customerPhone = customer.phone || ''; }
        }

        const { data: items } = await supabaseAdmin
          .from('transaction_items').select('*').eq('transaction_id', transaction.transaction_id).eq('tenant_id', tenantId);

        return {
          id: transaction.id,
          transaction_number: transaction.transaction_id,
          customer_name: customerName,
          customer_phone: customerPhone,
          total: transaction.total_amount,
          payment_method: transaction.payment_method,
          status: transaction.payment_status,
          created_at: transaction.created_at,
          items_count: items?.length || 0,
          items: items || [],
        };
      })
    );

    return res.status(200).json({
      transactions: transactionsWithDetails,
      pagination: { page: pageNum, limit: limitNum, total: count || 0, totalPages: Math.ceil((count || 0) / limitNum) }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
}

export default withAuth(handler);

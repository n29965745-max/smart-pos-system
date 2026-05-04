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
    const { startDate, endDate } = req.query;

    let query = supabaseAdmin
      .from('transactions')
      .select('transaction_id, total_amount, payment_method, created_at')
      .eq('tenant_id', tenantId);

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: transactions, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    const totalTransactions = transactions?.length || 0;
    const totalRevenue = transactions?.reduce((sum, t) => sum + parseFloat(t.total_amount || 0), 0) || 0;
    const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const transactionIds = transactions?.map(t => t.transaction_id).filter(Boolean) || [];
    let retailRevenue = 0;

    if (transactionIds.length > 0) {
      const { data: items } = await supabaseAdmin
        .from('transaction_items')
        .select('unit_price, quantity, total_price')
        .eq('tenant_id', tenantId)
        .in('transaction_id', transactionIds);

      if (items) {
        retailRevenue = items.reduce((sum, item) => {
          return sum + (parseFloat(item.total_price || 0) || parseFloat(item.unit_price || 0) * (item.quantity || 0));
        }, 0);
      }
    }

    const paymentMethods = transactions?.reduce((acc: any, t) => {
      const method = t.payment_method || 'cash';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    const paymentMethodsPercentage = Object.entries(paymentMethods || {}).map(([method, count]: [string, any]) => ({
      method, count,
      percentage: totalTransactions > 0 ? ((count / totalTransactions) * 100).toFixed(1) : '0'
    }));

    return res.status(200).json({
      overview: {
        totalTransactions,
        averageTransactionValue: averageTransactionValue.toFixed(2),
        totalDiscounts: '0.00',
        grossSalesRevenue: totalRevenue.toFixed(2),
        retailRevenue: retailRevenue.toFixed(2),
        wholesaleRevenue: '0.00'
      },
      paymentMethods: paymentMethodsPercentage
    });

  } catch (error: any) {
    console.error('Error fetching sales analytics:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch sales analytics' });
  }
}

export default withAuth(handler);

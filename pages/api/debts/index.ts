import type { NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-client';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { tenantId } = req.auth;

  if (req.method === 'GET') {
    try {
      const { startDate, endDate, page = '1', limit = '20' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let query = supabaseAdmin
        .from('debts')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId);

      if (startDate && endDate) {
        query = query.gte('created_at', startDate as string).lte('created_at', endDate as string);
      }

      query = query.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

      const { data: debts, error, count } = await query;
      if (error) throw error;

      const customerIds = [...new Set(debts?.map(d => d.customer_id) || [])];
      let customerMap: any = {};
      if (customerIds.length > 0) {
        const { data: customers } = await supabaseAdmin
          .from('customers').select('id, name').eq('tenant_id', tenantId).in('id', customerIds);
        customerMap = customers?.reduce((acc: any, c: any) => { acc[c.id] = c.name; return acc; }, {}) || {};
      }

      const transformedDebts = debts?.map((debt: any) => ({
        id: debt.id,
        customer_name: debt.customer_name || customerMap[debt.customer_id] || 'Unknown',
        sale_id: debt.sale_id,
        total_amount: debt.total_amount,
        amount_paid: debt.amount_paid,
        amount_remaining: debt.amount_remaining,
        status: debt.status,
        due_date: debt.due_date,
        created_at: debt.created_at,
        updated_at: debt.updated_at,
      })) || [];

      return res.status(200).json({
        debts: transformedDebts,
        pagination: { page: pageNum, limit: limitNum, total: count || 0, totalPages: Math.ceil((count || 0) / limitNum) }
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { customer_id, customer_name, sale_id, total_amount, due_date, notes } = req.body;

      const { data: debt, error } = await supabaseAdmin
        .from('debts')
        .insert([{ customer_id, customer_name, sale_id, total_amount, amount_paid: 0,
          amount_remaining: total_amount, status: 'Outstanding', due_date, notes, tenant_id: tenantId }])
        .select().single();

      if (error) throw error;
      return res.status(201).json(debt);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withAuth(handler);

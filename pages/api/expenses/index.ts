import type { NextApiResponse } from 'next';
;
import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

async function handler(req: SecureRequest, res: NextApiResponse) {
  const db = getAdminDb();
  const { tenantId } = req;

  if (req.method === 'GET') {
    try {
      const { category, status, startDate, endDate, search, page = '1', limit = '20' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let query = getAdminDb()
        .from('expenses')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId);

      if (category && category !== 'all') query = query.eq('category', category);
      if (status && status !== 'all') query = query.eq('status', status);
      if (startDate) query = query.gte('expense_date', startDate);
      if (endDate) query = query.lte('expense_date', endDate);
      if (search) query = query.or(`expense_id.ilike.%${search}%,description.ilike.%${search}%,vendor_name.ilike.%${search}%`);

      query = query.order('expense_date', { ascending: false }).range(offset, offset + limitNum - 1);

      const { data: expenses, error, count } = await query;
      if (error) throw error;

      return res.status(200).json({
        expenses: expenses || [],
        pagination: { page: pageNum, limit: limitNum, total: count || 0, totalPages: Math.ceil((count || 0) / limitNum) }
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { category, subcategory, amount, description, payment_method, vendor_name, receipt_number, expense_date, notes, created_by } = req.body;
      const expenseId = `EXP-${Math.floor(Math.random() * 999999 + 1).toString().padStart(6, '0')}`;

      const { data: expense, error } = await getAdminDb()
        .from('expenses')
        .insert([{
          expense_id: expenseId, category, subcategory, amount, description,
          payment_method, vendor_name, receipt_number,
          expense_date: expense_date || new Date().toISOString().split('T')[0],
          notes, created_by: created_by || 'Admin', status: 'Pending',
          tenant_id: tenantId,
        }])
        .select().single();

      if (error) throw error;
      return res.status(201).json(expense);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default secureRoute(handler);

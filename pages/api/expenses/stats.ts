import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase';

import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId } = req;
  const db = getAdminDb();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data: expenses, error } = await supabase
      .from('expenses')
      .select('*');

    if (error) throw error;

    // Today's expenses
    const today = new Date().toDateString();
    const todayExpenses = expenses?.filter(e => {
      const expenseDate = new Date(e.expense_date).toDateString();
      return expenseDate === today && e.status === 'Approved';
    }) || [];
    const todayTotal = todayExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    // Total expenses by type
    const businessExpenses = expenses?.filter(e => {
      const categories = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Supplies', 'Transportation', 'Insurance', 'Maintenance', 'Professional Services', 'Inventory Purchase', 'Miscellaneous'];
      return categories.includes(e.category) && e.status === 'Approved';
    }) || [];
    const businessTotal = businessExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    const personalExpenses = expenses?.filter(e => {
      const categories = ['Food & Dining', 'Entertainment', 'Healthcare', 'Education'];
      return categories.includes(e.category) && e.status === 'Approved';
    }) || [];
    const personalTotal = personalExpenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    // Category breakdown
    const categoryTotals: { [key: string]: number } = {};
    expenses?.filter(e => e.status === 'Approved').forEach(e => {
      if (!categoryTotals[e.category]) {
        categoryTotals[e.category] = 0;
      }
      categoryTotals[e.category] += parseFloat(e.amount || 0);
    });

    const totalExpenses = expenses?.filter(e => e.status === 'Approved').length || 0;
    const totalAmount = expenses?.filter(e => e.status === 'Approved').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0) || 0;

    return res.status(200).json({
      todayTotal,
      todayCount: todayExpenses.length,
      businessTotal,
      personalTotal,
      totalExpenses,
      totalAmount,
      categoryTotals,
      expenses: expenses || [],
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

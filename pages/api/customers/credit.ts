import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
    const { customerId } = req.query;

    if (!customerId) {
      return res.status(400).json({ error: 'Customer ID is required' });
    }

    // Get customer info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, name, debt_limit')
      .eq('id', customerId)
      .single();

    if (customerError || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Get customer's current debt from debts table
    const { data: debts, error: debtsError } = await supabase
      .from('debts')
      .select('amount_remaining')
      .eq('customer_id', customerId)
      .neq('status', 'Paid');

    if (debtsError) {
      return res.status(500).json({ error: debtsError.message });
    }

    const currentDebt = debts?.reduce((sum, debt) => sum + parseFloat(debt.amount_remaining || '0'), 0) || 0;
    const debtLimit = parseFloat(customer.debt_limit || '0');
    const availableCredit = Math.max(0, debtLimit - currentDebt);

    return res.status(200).json({
      customerId: customer.id,
      customerName: customer.name,
      debtLimit,
      currentDebt,
      availableCredit,
      hasCredit: debtLimit > 0
    });

  } catch (error: any) {
    console.error('Error fetching customer credit:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch customer credit' });
  }
});

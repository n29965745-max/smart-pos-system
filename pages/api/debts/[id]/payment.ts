import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../../lib/supabase';

import { secureRoute, SecureRequest, getAdminDb } from '../../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId } = req;
  const db = getAdminDb();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { amount, payment_method, reference_number, notes } = req.body;

    // Get current debt
    const { data: debt, error: debtError } = await supabase
      .from('debts')
      .select('*')
      .eq('id', id)
      .single();

    if (debtError) throw debtError;
    if (!debt) throw new Error('Debt not found');

    // Validate payment amount
    const paymentAmount = parseFloat(amount);
    const currentBalance = parseFloat(debt.amount_remaining);

    if (paymentAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than 0' });
    }

    if (paymentAmount > currentBalance) {
      return res.status(400).json({ 
        error: `Payment amount (${paymentAmount}) exceeds outstanding debt (${currentBalance})` 
      });
    }

    // Update debt directly (no debt_payments table needed)
    const newAmountPaid = parseFloat(debt.amount_paid) + paymentAmount;
    const newBalance = Math.max(0, currentBalance - paymentAmount);
    const newStatus = newBalance <= 0 ? 'Paid' : 'Partial';

    const { data: updatedDebt, error: updateError } = await supabase
      .from('debts')
      .update({
        amount_paid: newAmountPaid,
        amount_remaining: newBalance,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update customer credit
    const { data: credit, error: creditError } = await supabase
      .from('customer_credit')
      .select('*')
      .eq('customer_id', debt.customer_id)
      .single();

    if (!creditError && credit) {
      const newCurrentDebt = parseFloat(credit.current_debt) - parseFloat(amount);
      const newAvailableCredit = parseFloat(credit.credit_limit) - newCurrentDebt;

      await supabase
        .from('customer_credit')
        .update({
          current_debt: newCurrentDebt,
          available_credit: newAvailableCredit,
          updated_at: new Date().toISOString(),
        })
        .eq('customer_id', debt.customer_id);
    }

    return res.status(200).json({ success: true, debt: updatedDebt });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

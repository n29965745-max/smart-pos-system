import type { NextApiResponse } from 'next';
import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { tenantId } = req;
  const db = getAdminDb();

  try {
    if (!tenantId) {
      return res.status(403).json({ error: 'Tenant context required' });
    }

    const {
      sessionId,
      customerId,
      customerName,
      customerPhone,
      total,
      amountPaid,
      paymentMethod,
      notes,
      cashierName
    } = req.body;

    if (!sessionId) return res.status(400).json({ error: 'Session ID is required' });
    if (!total) return res.status(400).json({ error: 'Total amount is required' });
    if (!paymentMethod) return res.status(400).json({ error: 'Payment method is required' });
    if (paymentMethod !== 'debt' && !amountPaid) {
      return res.status(400).json({ error: 'Amount paid is required' });
    }

    if (paymentMethod === 'debt' && !customerId) {
      return res.status(400).json({ error: 'Customer is required for debt payment' });
    }

    const numericTotal = Number(total);
    const numericAmountPaid = paymentMethod === 'debt' ? null : Number(amountPaid);

    if (!Number.isFinite(numericTotal) || numericTotal <= 0) {
      return res.status(400).json({ error: 'Valid total amount is required' });
    }

    if (paymentMethod !== 'debt' && (numericAmountPaid === null || !Number.isFinite(numericAmountPaid) || numericAmountPaid < numericTotal)) {
      return res.status(400).json({ error: 'Insufficient amount paid' });
    }

    const { data: checkoutResult, error: checkoutError } = await db.rpc('complete_pos_checkout_atomic', {
      p_tenant_id: tenantId,
      p_session_id: sessionId,
      p_customer_id: customerId || null,
      p_customer_name: customerName || null,
      p_customer_phone: customerPhone || null,
      p_total: numericTotal,
      p_amount_paid: numericAmountPaid,
      p_payment_method: paymentMethod,
      p_notes: notes || null,
      p_cashier_name: cashierName || null
    });

    if (checkoutError) {
      return res.status(500).json({ error: `Checkout error: ${checkoutError.message}` });
    }

    if (!checkoutResult?.success) {
      return res.status(400).json({ error: checkoutResult?.error || 'Checkout failed' });
    }

    return res.status(201).json({
      success: true,
      transaction: checkoutResult.transaction,
      message: 'Sale completed successfully'
    });

  } catch (error: any) {
    console.error('Checkout Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase-client';

import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId } = req;
  const db = getAdminDb();
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { data: transaction, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const { data: items } = await supabase
        .from('transaction_items')
        .select('*')
        .eq('transaction_id', transaction.transaction_id);

      return res.status(200).json({ transaction, items: items || [] });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Get transaction first to get transaction_id (TEXT)
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('transaction_id')
        .eq('id', id)
        .single();

      if (fetchError || !transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      // Delete items first
      await supabase
        .from('transaction_items')
        .delete()
        .eq('transaction_id', transaction.transaction_id);

      // Delete transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) return res.status(500).json({ error: error.message });

      return res.status(200).json({ success: true });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
});

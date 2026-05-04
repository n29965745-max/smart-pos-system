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
    const { status, approved_by } = req.body;

    const { data: expense, error } = await supabase
      .from('expenses')
      .update({
        status,
        approved_by: approved_by || 'Admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json(expense);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

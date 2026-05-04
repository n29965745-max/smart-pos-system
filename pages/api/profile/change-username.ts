import type { NextApiResponse } from 'next';
import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async (req: SecureRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { full_name } = req.body;
  if (!full_name?.trim()) return res.status(400).json({ error: 'Name is required' });

  const db = getAdminDb();
  const { data, error } = await db
    .from('users')
    .update({ full_name: full_name.trim(), updated_at: new Date().toISOString() })
    .eq('id', req.user.userId)
    .eq('tenant_id', req.tenantId)
    .select('id, full_name, email')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true, user: data });
});

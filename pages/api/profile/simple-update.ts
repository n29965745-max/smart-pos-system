import type { NextApiResponse } from 'next';
import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async (req: SecureRequest, res: NextApiResponse) => {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const { full_name, phone } = req.body;
  const updates: any = { updated_at: new Date().toISOString() };
  if (full_name !== undefined) updates.full_name = full_name;
  if (phone !== undefined) updates.phone = phone;

  const db = getAdminDb();
  const { data, error } = await db
    .from('users').update(updates).eq('id', req.user.userId).eq('tenant_id', req.tenantId)
    .select('id, full_name, email, phone').single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ profile: data });
});

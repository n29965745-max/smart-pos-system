import type { NextApiResponse } from 'next';
import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async (req: SecureRequest, res: NextApiResponse) => {
  const db = getAdminDb();
  const { user, tenantId } = req;
  const userId = user.userId;

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('users')
      .select('id, full_name, email, role, phone, avatar_url, is_active, created_at')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Profile not found' });
    return res.status(200).json({ profile: data });
  }

  if (req.method === 'PUT') {
    const { full_name, phone, avatar_url } = req.body;
    const updates: any = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updates.full_name = full_name;
    if (phone !== undefined) updates.phone = phone;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    const { data, error } = await db
      .from('users')
      .update(updates)
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select('id, full_name, email, role, phone, avatar_url')
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ profile: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});

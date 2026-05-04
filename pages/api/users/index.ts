import type { NextApiResponse } from 'next';
import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

// Users index — only allows admin/owner to manage users within their own tenant
export default secureRoute(async (req: SecureRequest, res: NextApiResponse) => {
  const { tenantId, user } = req;
  const db = getAdminDb();

  // Only admins and owners can manage users
  if (!['Admin', 'owner', 'admin'].includes(user.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    const { data, error } = await db
      .from('users')
      .select('id, full_name, email, role, phone, is_active, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ users: data || [] });
  }

  if (req.method === 'POST') {
    const { full_name, email, role, phone } = req.body;
    if (!full_name || !email) return res.status(400).json({ error: 'Name and email required' });

    const { data, error } = await db
      .from('users')
      .insert({ full_name, email: email.toLowerCase().trim(), role: role || 'Staff', phone, tenant_id: tenantId, is_active: true })
      .select('id, full_name, email, role').single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ user: data });
  }

  if (req.method === 'PUT') {
    const { id, full_name, role, phone, is_active } = req.body;
    if (!id) return res.status(400).json({ error: 'User ID required' });

    // Verify target user belongs to same tenant
    const updates: any = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updates.full_name = full_name;
    if (role !== undefined) updates.role = role;
    if (phone !== undefined) updates.phone = phone;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await db
      .from('users').update(updates).eq('id', id).eq('tenant_id', tenantId)
      .select('id, full_name, email, role, is_active').single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ user: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'User ID required' });
    if (id === req.user.userId) return res.status(400).json({ error: 'Cannot delete yourself' });

    const { error } = await db.from('users').delete().eq('id', id).eq('tenant_id', tenantId);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ message: 'User deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
});

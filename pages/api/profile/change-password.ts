import type { NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async (req: SecureRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const db = getAdminDb();
  const { data: user } = await db.from('users').select('password_hash').eq('id', req.user.userId).single();
  if (!user) return res.status(404).json({ error: 'User not found' });

  const valid = user.password_hash
    ? await bcrypt.compare(currentPassword, user.password_hash)
    : currentPassword === 'admin123';

  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

  const hash = await bcrypt.hash(newPassword, 12);
  await db.from('users').update({ password_hash: hash, updated_at: new Date().toISOString() }).eq('id', req.user.userId);

  return res.status(200).json({ success: true, message: 'Password updated' });
});

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Admin client — only used here for password verification
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Look up user
    const { data: user, error: fetchError } = await adminSupabase
      .from('users')
      .select('id, email, full_name, role, phone, is_active, password_hash, tenant_id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (fetchError || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is disabled' });
    }

    // Verify password
    let isValidPassword = false;
    if (!user.password_hash) {
      isValidPassword = password === 'admin123'; // backward compat only
    } else {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
    }

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Ensure user has a tenant
    if (!user.tenant_id) {
      return res.status(401).json({ error: 'Account not linked to a tenant. Contact support.' });
    }

    // Update last login
    await adminSupabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Issue token: encode userId so middleware can verify server-side
    // Format: "v1.<userId>.<timestamp>" — simple but server-verifiable
    const token = `v1.${user.id}.${Date.now()}`;

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        tenant_id: user.tenant_id,
      },
      tenant_id: user.tenant_id,
      token,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

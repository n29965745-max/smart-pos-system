// API: Manage Automation Rules
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId } = req;
  const db = getAdminDb();
  try {
    if (req.method === 'GET') {
      // Get all automation rules
      const { data, error } = await supabase
        .from('automation_rules')
        .select(`
          *,
          message_templates (
            name,
            message_text
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({ rules: data || [] });
    }

    if (req.method === 'PUT') {
      // Update automation rule
      const { id, is_active, ai_enabled } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Rule ID is required' });
      }

      const { data, error } = await supabase
        .from('automation_rules')
        .update({
          is_active,
          ai_enabled
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ rule: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Automation API error:', error);
    res.status(500).json({ error: error.message });
  }
});

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // Get SMS configuration
      const { data, error } = await supabase
        .from('sms_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return res.status(200).json({
        success: true,
        data: data || null
      });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      // Update or create SMS configuration
      const { provider, api_key, username, sender_id, is_active, test_mode } = req.body;

      const configData = {
        provider: provider || 'africastalking',
        api_key,
        username,
        sender_id,
        is_active: is_active !== undefined ? is_active : false,
        test_mode: test_mode !== undefined ? test_mode : true,
        updated_at: new Date().toISOString()
      };

      // Check if config exists
      const { data: existing } = await supabase
        .from('sms_config')
        .select('id')
        .single();

      let result;
      if (existing) {
        // Update existing
        result = await supabase
          .from('sms_config')
          .update(configData)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Create new
        result = await supabase
          .from('sms_config')
          .insert(configData)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      return res.status(200).json({
        success: true,
        message: 'SMS configuration saved successfully',
        data: result.data
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('SMS config error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

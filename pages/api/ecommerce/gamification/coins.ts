import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { customerId, tenantId } = req.query;

  if (req.method === 'GET') {
    try {
      if (!customerId || !tenantId) {
        return res.status(400).json({ error: 'Missing customerId or tenantId' });
      }

      await supabase.rpc('set_config', {
        setting: 'app.current_tenant_id',
        value: tenantId
      });

      const { data, error } = await supabase
        .from('user_coins')
        .select('*')
        .eq('customer_id', customerId)
        .eq('tenant_id', tenantId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Coins error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ 
        coins: data || { 
          total_coins: 0, 
          current_streak: 0,
          lifetime_earned: 0,
          lifetime_spent: 0
        } 
      });
    } catch (error) {
      console.error('Coins exception:', error);
      return res.status(500).json({ error: 'Failed to fetch coins' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

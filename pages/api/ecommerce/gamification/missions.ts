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
      if (!tenantId) {
        return res.status(400).json({ error: 'Missing tenantId' });
      }

      await supabase.rpc('set_config', {
        setting: 'app.current_tenant_id',
        value: tenantId
      });

      // Get all active missions
      const { data: missions, error: missionsError } = await supabase
        .from('daily_missions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (missionsError) {
        console.error('Missions error:', missionsError);
        return res.status(500).json({ error: missionsError.message });
      }

      // If customer ID provided, get their progress
      if (customerId) {
        const today = new Date().toISOString().split('T')[0];
        
        const { data: progress } = await supabase
          .from('user_mission_progress')
          .select('*')
          .eq('customer_id', customerId)
          .eq('tenant_id', tenantId)
          .eq('mission_date', today);

        // Merge missions with progress
        const missionsWithProgress = missions?.map(mission => {
          const userProgress = progress?.find(p => p.mission_id === mission.id);
          return {
            ...mission,
            current_count: userProgress?.current_count || 0,
            completed: userProgress?.completed || false
          };
        });

        return res.status(200).json({ missions: missionsWithProgress || [] });
      }

      return res.status(200).json({ missions: missions || [] });
    } catch (error) {
      console.error('Missions exception:', error);
      return res.status(500).json({ error: 'Failed to fetch missions' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

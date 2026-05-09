import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tenantSlug } = req.query;

  if (req.method === 'GET') {
    try {
      // Get tenant ID from slug
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', tenantSlug)
        .single();

      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not found' });
      }

      await supabase.rpc('set_config', {
        setting: 'app.current_tenant_id',
        value: tenant.id
      });

      const { data: deals, error } = await supabase
        .from('flash_deals')
        .select(`
          *,
          product:product_id (
            id,
            name,
            image_url
          )
        `)
        .eq('tenant_id', tenant.id)
        .eq('status', 'active')
        .order('display_order', { ascending: true })
        .limit(10);

      if (error) {
        console.error('Flash deals error:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ deals: deals || [] });
    } catch (error) {
      console.error('Flash deals exception:', error);
      return res.status(500).json({ error: 'Failed to fetch flash deals' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

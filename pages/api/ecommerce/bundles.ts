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

      // Get active bundles
      const { data: bundles, error } = await supabase
        .from('bundle_deals')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .order('featured', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Bundles error:', error);
        return res.status(500).json({ error: error.message });
      }

      // Get products for each bundle
      const bundlesWithProducts = await Promise.all(
        (bundles || []).map(async (bundle) => {
          const { data: bundleProducts } = await supabase
            .from('bundle_deal_products')
            .select(`
              *,
              product:product_id (
                id,
                name,
                retail_price,
                image_url
              )
            `)
            .eq('bundle_id', bundle.id)
            .order('display_order', { ascending: true });

          return {
            ...bundle,
            products: bundleProducts?.map(bp => bp.product) || []
          };
        })
      );

      return res.status(200).json({ bundles: bundlesWithProducts });
    } catch (error) {
      console.error('Bundles exception:', error);
      return res.status(500).json({ error: 'Failed to fetch bundles' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

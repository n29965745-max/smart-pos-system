import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tenantSlug, productId, limit = '6' } = req.query;

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

      // If productId provided, get recommendations for that product
      if (productId) {
        const { data: recommendations } = await supabase
          .from('product_recommendations')
          .select(`
            *,
            recommended_product:recommended_product_id (
              id,
              name,
              retail_price,
              image_url,
              stock_quantity
            )
          `)
          .eq('source_product_id', productId)
          .eq('tenant_id', tenant.id)
          .order('score', { ascending: false })
          .limit(parseInt(limit as string));

        if (recommendations && recommendations.length > 0) {
          const products = recommendations.map(r => r.recommended_product);
          return res.status(200).json({ products });
        }
      }

      // Fallback: Return random products
      const { data: products } = await supabase
        .from('products')
        .select('id, name, retail_price, image_url, stock_quantity')
        .eq('tenant_id', tenant.id)
        .gt('stock_quantity', 0)
        .limit(parseInt(limit as string));

      return res.status(200).json({ products: products || [] });
    } catch (error) {
      console.error('Recommendations exception:', error);
      return res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

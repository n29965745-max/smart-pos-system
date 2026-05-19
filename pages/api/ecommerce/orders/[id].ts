import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { tenantSlug } = req.query;

  if (!id || !tenantSlug) {
    return res.status(400).json({ error: 'Order ID and tenant slug are required' });
  }

  try {
    // Resolve tenant
    const { data: tenant, error: tenantError } = await db
      .from('tenants')
      .select('id')
      .eq('subdomain', tenantSlug)
      .eq('is_active', true)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Fetch order
    const { data: order, error: orderError } = await db
      .from('online_orders')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenant.id)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Fetch order items
    const { data: items, error: itemsError } = await db
      .from('online_order_items')
      .select('*')
      .eq('order_id', id)
      .eq('tenant_id', tenant.id);

    if (itemsError) {
      return res.status(500).json({ error: 'Failed to fetch order items' });
    }

    return res.status(200).json({
      success: true,
      order: {
        ...order,
        items: items || [],
      },
    });

  } catch (error: any) {
    console.error('Order fetch error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

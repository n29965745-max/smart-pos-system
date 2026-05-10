import type { NextApiResponse } from 'next';
import { secureRoute, SecureRequest, getAdminDb } from '@/lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId } = req;
  const db = getAdminDb();

  if (!tenantId) return res.status(400).json({ error: 'Tenant required' });

  if (req.method === 'GET') {
    const { status } = req.query;

    let query = db
      .from('online_orders')
      .select(`*, online_order_items(*)`)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('order_status', status as string);
    }

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ orders: data || [] });
  }

  if (req.method === 'PATCH') {
    const { orderId, status } = req.body;
    if (!orderId || !status) return res.status(400).json({ error: 'orderId and status required' });

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const updates: any = { order_status: status, updated_at: new Date().toISOString() };
    if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString();
      updates.payment_status = 'paid'; // Payment confirmed on delivery
    }
    if (status === 'shipped') updates.shipped_at = new Date().toISOString();
    if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();

    const { data: order, error } = await db
      .from('online_orders')
      .update(updates)
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .select('*, online_order_items(*)')
      .single();

    if (error) return res.status(500).json({ error: error.message });

    // ── When delivered: create POS transaction so revenue reflects ──────────
    if (status === 'delivered' && order) {
      try {
        const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

        const { data: tx } = await db
          .from('transactions')
          .insert({
            tenant_id: tenantId,
            transaction_id: transactionNumber,
            customer_name: order.shipping_full_name,
            customer_phone: order.shipping_phone,
            total_amount: order.total_amount,
            payment_method: order.payment_method === 'cod' ? 'cash' : order.payment_method,
            payment_status: 'completed',
            notes: `Online order ${order.order_number}`,
            created_by: 'Online Shop',
          })
          .select()
          .single();

        if (tx && order.online_order_items?.length > 0) {
          const txItems = order.online_order_items.map((item: any) => ({
            tenant_id: tenantId,
            transaction_id: tx.transaction_id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.subtotal,
          }));
          await db.from('transaction_items').insert(txItems);
        }
      } catch (txErr) {
        console.error('Failed to create POS transaction on delivery:', txErr);
        // Non-fatal — order status is already updated
      }
    }

    return res.status(200).json({ order });
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).json({ error: 'Method not allowed' });
});

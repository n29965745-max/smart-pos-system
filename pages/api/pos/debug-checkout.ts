import type { NextApiResponse } from 'next';
import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId, user } = req;
  const db = getAdminDb();
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  try {
    // Check cart items
    const { data: cartItems, error: cartError } = await db
      .from('cart_items')
      .select('*')
      .eq('session_id', sessionId)
      .eq('tenant_id', tenantId);

    // Check all cart items (without tenant filter to see if there are orphaned items)
    const { data: allCartItems } = await db
      .from('cart_items')
      .select('*')
      .eq('session_id', sessionId);

    // Check user's tenant
    const { data: userInfo } = await db
      .from('users')
      .select('id, email, tenant_id')
      .eq('id', user.userId)
      .single();

    return res.status(200).json({
      debug: {
        sessionId,
        requestTenantId: tenantId,
        userTenantId: userInfo?.tenant_id,
        userEmail: userInfo?.email,
        cartItemsWithTenant: cartItems || [],
        cartItemsWithTenantCount: cartItems?.length || 0,
        allCartItemsForSession: allCartItems || [],
        allCartItemsCount: allCartItems?.length || 0,
        cartError: cartError?.message || null,
        tenantMatch: tenantId === userInfo?.tenant_id
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

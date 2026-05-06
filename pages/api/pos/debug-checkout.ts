import type { NextApiResponse } from 'next';
import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId, user } = req;
  const db = getAdminDb();

  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // Check cart items
    const { data: cartItems, error: cartError } = await db
      .from('cart_items')
      .select('*')
      .eq('session_id', sessionId)
      .eq('tenant_id', tenantId);

    // Check user info
    const { data: userData } = await db
      .from('users')
      .select('id, email, tenant_id, role')
      .eq('id', user.userId)
      .single();

    return res.status(200).json({
      debug: {
        sessionId,
        tenantId,
        userId: user.userId,
        userEmail: user.email,
        cartItemsCount: cartItems?.length || 0,
        cartItems: cartItems || [],
        cartError: cartError?.message || null,
        userData,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});

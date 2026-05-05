import type { NextApiResponse } from 'next';
import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId, user } = req;
  const db = getAdminDb();

  try {
    if (req.method === 'GET') {
      // Get shop settings for current tenant
      const { data: settings, error } = await db
        .from('shop_settings')
        .select('*')
        .eq('tenant_id', tenantId) // TENANT ISOLATION
        .single();

      if (error && error.code !== 'PGRST116') {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ settings: settings || null });
      
    } else if (req.method === 'PUT') {
      // Update shop settings - only for current tenant
      const settingsData = req.body;
      
      // Remove user_email from settingsData if it exists (frontend sends it but we don't need it)
      const { user_email, ...cleanSettings } = settingsData;

      // Upsert shop settings for current tenant
      const { data, error } = await db
        .from('shop_settings')
        .upsert({
          tenant_id: tenantId, // TENANT ISOLATION
          user_id: user.userId,
          ...cleanSettings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Shop settings upsert error:', error);
        return res.status(500).json({ error: error.message });
      }

      res.status(200).json({ success: true, settings: data });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Shop settings error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

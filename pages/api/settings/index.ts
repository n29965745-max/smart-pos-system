import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId } = req;
  const db = getAdminDb();
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();

    if (error) {
      // If no settings exist, return defaults
      if (error.code === 'PGRST116') {
        return res.status(200).json({
          store_name: 'Smart POS Store',
          store_email: 'admin@smartpos.com',
          store_phone: '+254 700 000 000',
          currency: 'KES',
          tax_rate: 16,
          low_stock_threshold: 50,
          enable_notifications: true,
          enable_auto_backup: true
        });
      }
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json(data);
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const { 
      store_name, 
      store_email, 
      store_phone, 
      currency, 
      tax_rate, 
      low_stock_threshold,
      enable_notifications,
      enable_auto_backup
    } = req.body;

    // Check if settings exist
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .single();

    if (existing) {
      // Update existing settings
      const { data, error } = await supabase
        .from('settings')
        .update({
          store_name,
          store_email,
          store_phone,
          currency,
          tax_rate,
          low_stock_threshold,
          enable_notifications,
          enable_auto_backup,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json(data);
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from('settings')
        .insert([{ tenant_id: tenantId, 
          store_name,
          store_email,
          store_phone,
          currency,
          tax_rate,
          low_stock_threshold,
          enable_notifications,
          enable_auto_backup
        }])
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json(data);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
});

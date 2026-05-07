import type { NextApiResponse } from 'next';
;
import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId } = req;

  if (req.method === 'GET') {
    try {
      const { status, search, startDate, endDate, page = '1', limit = '20' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let query = getAdminDb()
        .from('returns')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId);

      if (status && status !== 'all') query = query.eq('status', status);
      if (search) query = query.or(`return_id.ilike.%${search}%,customer_name.ilike.%${search}%,product_name.ilike.%${search}%`);
      if (startDate) query = query.gte('return_date', startDate);
      if (endDate) query = query.lte('return_date', endDate);

      query = query.order('return_date', { ascending: false }).range(offset, offset + limitNum - 1);

      const { data: returns, error, count } = await query;
      if (error) throw error;

      return res.status(200).json({
        returns: returns || [],
        pagination: { page: pageNum, limit: limitNum, total: count || 0, totalPages: Math.ceil((count || 0) / limitNum) }
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { transaction_id, customer_id, customer_name, product_id, product_name, quantity, amount, reason, notes } = req.body;

      // Validate required fields
      if (!transaction_id || !product_name || !customer_name || !quantity || !amount || !reason) {
        return res.status(400).json({ 
          error: 'Missing required fields: transaction_id, product_name, customer_name, quantity, amount, reason' 
        });
      }

      // Generate unique return_id with timestamp and random string
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 11).toUpperCase();
      const return_id = `RET-${timestamp}-${randomStr}`;

      console.log('Creating return with return_id:', return_id);

      // Build insert object with only defined values
      const insertData: any = {
        return_id,
        transaction_id, 
        customer_name, 
        product_name,
        quantity: parseInt(quantity), 
        amount: parseFloat(amount), 
        reason, 
        status: 'Pending',
        tenant_id: tenantId,
      };

      // Only add optional fields if they exist
      if (customer_id) insertData.customer_id = customer_id;
      if (product_id) insertData.product_id = product_id;
      if (notes) insertData.notes = notes;

      const { data: returnRecord, error } = await getAdminDb()
        .from('returns')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Database error creating return:', error);
        throw error;
      }

      console.log('Return created successfully:', returnRecord);
      return res.status(201).json(returnRecord);
    } catch (error: any) {
      console.error('Error in POST /api/returns:', error);
      return res.status(500).json({ error: error.message || 'Failed to create return' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default secureRoute(handler);

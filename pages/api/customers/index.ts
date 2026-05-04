import type { NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-client';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { tenantId } = req.auth;

  try {
    switch (req.method) {
      case 'GET': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Customer ID is required' });

        const { data, error } = await supabaseAdmin
          .from('customers').select('*').eq('id', id).eq('tenant_id', tenantId).single();

        if (error || !data) return res.status(404).json({ error: 'Customer not found' });
        return res.status(200).json({ customer: data });
      }

      case 'POST': {
        const { firstName, lastName, name, email, phone, customerType, debtLimit } = req.body;
        const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();
        if (!fullName) return res.status(400).json({ error: 'Customer name is required' });

        const { data, error } = await supabaseAdmin
          .from('customers')
          .insert({ name: fullName, email: email || null, phone: phone || null,
            customer_type: customerType || 'retail',
            debt_limit: debtLimit ? parseFloat(debtLimit) : null,
            status: 'active', tenant_id: tenantId })
          .select().single();

        if (error) return res.status(500).json({ error: error.message });
        return res.status(201).json({ customer: data, message: 'Customer created successfully' });
      }

      case 'PUT': {
        const { id, name, email, phone, customerType, status, debtLimit } = req.body;
        if (!id) return res.status(400).json({ error: 'Customer ID is required' });

        const updateData: any = { updated_at: new Date().toISOString() };
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (customerType !== undefined) updateData.customer_type = customerType;
        if (status !== undefined) updateData.status = status;
        if (debtLimit !== undefined) updateData.debt_limit = debtLimit ? parseFloat(debtLimit) : null;

        const { data, error } = await supabaseAdmin
          .from('customers').update(updateData).eq('id', id).eq('tenant_id', tenantId).select().single();

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ customer: data, message: 'Customer updated successfully' });
      }

      case 'DELETE': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'Customer ID is required' });

        const { error } = await supabaseAdmin
          .from('customers').delete().eq('id', id).eq('tenant_id', tenantId);

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ message: 'Customer deleted successfully' });
      }

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error: any) {
    console.error('Customer API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

export default withAuth(handler);

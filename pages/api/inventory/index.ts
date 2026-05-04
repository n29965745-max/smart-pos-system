import type { NextApiResponse } from 'next';
import { supabaseAdmin } from '../../../lib/supabase-client';
import { withAuth, AuthenticatedRequest } from '../../../lib/auth-middleware';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { tenantId } = req.auth;

  if (req.method === 'POST') {
    try {
      const { name, sku, category, costPrice, retailPrice, wholesalePrice, stockQuantity, minimumStockLevel, variantOf, imageUrl, description, barcode } = req.body;

      if (!name || !sku || !category) {
        return res.status(400).json({ error: 'Name, SKU, and category are required' });
      }

      const { data, error } = await supabaseAdmin
        .from('products')
        .insert([{
          name, sku, category,
          cost_price: costPrice || 0, retail_price: retailPrice || 0, wholesale_price: wholesalePrice || 0,
          stock_quantity: stockQuantity || 0, minimum_stock_level: minimumStockLevel || 10,
          variant_of: variantOf || null, image_url: imageUrl || null,
          description: description || null, barcode: barcode || null,
          status: 'active', tenant_id: tenantId,
        }])
        .select().single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ product: data });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to create product' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const { id, name, sku, category, costPrice, retailPrice, wholesalePrice, stockQuantity, minimumStockLevel, variantOf, imageUrl, description, barcode, status } = req.body;

      if (!id) return res.status(400).json({ error: 'Product ID is required' });

      const updateData: any = { updated_at: new Date().toISOString() };
      if (name) updateData.name = name;
      if (sku) updateData.sku = sku;
      if (category) updateData.category = category;
      if (costPrice !== undefined) updateData.cost_price = costPrice;
      if (retailPrice !== undefined) updateData.retail_price = retailPrice;
      if (wholesalePrice !== undefined) updateData.wholesale_price = wholesalePrice;
      if (stockQuantity !== undefined) updateData.stock_quantity = stockQuantity;
      if (minimumStockLevel !== undefined) updateData.minimum_stock_level = minimumStockLevel;
      if (variantOf !== undefined) updateData.variant_of = variantOf;
      if (imageUrl !== undefined) updateData.image_url = imageUrl;
      if (description !== undefined) updateData.description = description;
      if (barcode !== undefined) updateData.barcode = barcode;
      if (status) updateData.status = status;

      const { data, error } = await supabaseAdmin
        .from('products').update(updateData).eq('id', id).eq('tenant_id', tenantId).select().single();

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ product: data });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to update product' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) return res.status(400).json({ error: 'Product ID is required' });

      const { error } = await supabaseAdmin
        .from('products').delete().eq('id', id).eq('tenant_id', tenantId);

      if (error) return res.status(500).json({ error: error.message });
      return res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to delete product' });
    }
  }

  res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

export default withAuth(handler);

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabase-client';

import { secureRoute, SecureRequest, getAdminDb } from '../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId } = req;
  const db = getAdminDb();
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { productId, quantity, notes } = req.body;

    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Product ID and quantity are required' });
    }

    const quantityNum = parseInt(quantity);
    if (quantityNum <= 0) {
      return res.status(400).json({ error: 'Quantity must be positive' });
    }

    // Get current product
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update stock
    const currentStock = parseInt(product.stock_quantity || product.stock || 0);
    const newStock = currentStock + quantityNum;

    const { data, error } = await supabase
      .from('products')
      .update({
        stock_quantity: newStock,
        stock: newStock, // Backward compatibility
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      message: 'Stock restocked successfully',
      product: data,
      previousStock: currentStock,
      newStock,
      quantityAdded: quantityNum
    });

  } catch (error: any) {
    console.error('Error restocking product:', error);
    return res.status(500).json({ error: error.message || 'Failed to restock product' });
  }
});

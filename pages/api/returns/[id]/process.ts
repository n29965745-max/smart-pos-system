import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

import { secureRoute, SecureRequest, getAdminDb } from '../../../../lib/secure-route';

export default secureRoute(async function handler(req: SecureRequest, res: NextApiResponse) {
  const { tenantId } = req;
  const db = getAdminDb();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { status, refund_method, refund_amount, processed_by, notes } = req.body;

    // First, get the return details to know the product and quantity
    const { data: returnRecord, error: fetchError } = await supabase
      .from('returns')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!returnRecord) {
      return res.status(404).json({ error: 'Return not found' });
    }

    // Update the return status
    const { data: updatedReturn, error: updateError } = await supabase
      .from('returns')
      .update({
        status,
        refund_method,
        refund_amount,
        processed_by,
        notes,
        processed_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // If return is approved (Completed), add the quantity back to inventory
    if (status === 'Completed' && returnRecord.product_name && returnRecord.quantity) {
      console.log(`Processing return approval for: ${returnRecord.product_name}, Quantity: ${returnRecord.quantity}`);
      
      // Try to find product by exact name match first
      let { data: products, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('name', returnRecord.product_name);

      // If no exact match, try case-insensitive search
      if (!products || products.length === 0) {
        const result = await supabase
          .from('products')
          .select('*')
          .ilike('name', returnRecord.product_name);
        products = result.data;
        productError = result.error;
      }

      if (productError) {
        console.error('Error finding product:', productError);
        return res.status(200).json({
          ...updatedReturn,
          warning: 'Return processed but could not update inventory: ' + productError.message
        });
      }

      if (products && products.length > 0) {
        const product = products[0];
        console.log(`Found product: ${product.name}, Current stock: ${product.stock_quantity}`);
        
        // Increase the stock quantity
        const newStockQuantity = (product.stock_quantity || 0) + returnRecord.quantity;
        
        const { error: stockUpdateError } = await supabase
          .from('products')
          .update({
            stock_quantity: newStockQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id);

        if (stockUpdateError) {
          console.error('Error updating product stock:', stockUpdateError);
          return res.status(200).json({
            ...updatedReturn,
            warning: 'Return processed but could not update inventory: ' + stockUpdateError.message
          });
        }

        console.log(`✅ Stock updated successfully: ${product.name} - Added ${returnRecord.quantity} units. New stock: ${newStockQuantity}`);
        
        return res.status(200).json({
          ...updatedReturn,
          inventoryUpdated: true,
          productName: product.name,
          quantityRestored: returnRecord.quantity,
          newStock: newStockQuantity
        });
      } else {
        console.warn(`⚠️ Product not found in inventory: "${returnRecord.product_name}"`);
        return res.status(200).json({
          ...updatedReturn,
          warning: `Return processed but product "${returnRecord.product_name}" not found in inventory`
        });
      }
    }

    return res.status(200).json(updatedReturn);
  } catch (error: any) {
    console.error('Error processing return:', error);
    return res.status(500).json({ error: error.message });
  }
});

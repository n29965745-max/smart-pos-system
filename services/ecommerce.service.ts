import { createClient } from '@supabase/supabase-js';
import { deductInventory } from './inventory.service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// CART MANAGEMENT
// ============================================================

export async function getOrCreateCart(tenantId: string, customerId?: string, sessionId?: string) {
  try {
    // Set tenant context
    await supabase.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      new_value: tenantId,
      is_local: true
    });

    // Find existing active cart
    let query = supabase
      .from('online_carts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'active');

    if (customerId) {
      query = query.eq('customer_id', customerId);
    } else if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data: existingCart } = await query.single();

    if (existingCart) {
      return { success: true, data: existingCart };
    }

    // Create new cart
    const { data: newCart, error } = await supabase
      .from('online_carts')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        session_id: sessionId,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cart:', error);
      return { success: false, error };
    }

    return { success: true, data: newCart };
  } catch (error) {
    console.error('Error in getOrCreateCart:', error);
    return { success: false, error };
  }
}

export async function addToCart(params: {
  tenantId: string;
  cartId: string;
  productId: string;
  quantity: number;
  size?: string;
  color?: string;
}) {
  try {
    const { tenantId, cartId, productId, quantity, size, color } = params;

    // Set tenant context
    await supabase.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      new_value: tenantId,
      is_local: true
    });

    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('name, retail_price, stock_quantity')
      .eq('id', productId)
      .eq('tenant_id', tenantId)
      .single();

    if (productError || !product) {
      return { success: false, error: 'Product not found' };
    }

    // Check stock availability
    if (product.stock_quantity < quantity) {
      return { success: false, error: 'Insufficient stock' };
    }

    // Check if item already exists in cart
    let query = supabase
      .from('online_cart_items')
      .select('*')
      .eq('cart_id', cartId)
      .eq('product_id', productId);

    if (size) query = query.eq('size', size);
    if (color) query = query.eq('color', color);

    const { data: existingItem } = await query.single();

    if (existingItem) {
      // Update quantity
      const { data, error } = await supabase
        .from('online_cart_items')
        .update({
          quantity: existingItem.quantity + quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingItem.id)
        .select()
        .single();

      if (error) return { success: false, error };
      return { success: true, data };
    }

    // Add new item
    const { data, error } = await supabase
      .from('online_cart_items')
      .insert({
        tenant_id: tenantId,
        cart_id: cartId,
        product_id: productId,
        product_name: product.name,
        product_price: product.retail_price,
        quantity,
        size,
        color
      })
      .select()
      .single();

    if (error) return { success: false, error };

    // Update cart timestamp
    await supabase
      .from('online_carts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', cartId);

    return { success: true, data };
  } catch (error) {
    console.error('Error in addToCart:', error);
    return { success: false, error };
  }
}

export async function getCartItems(tenantId: string, cartId: string) {
  try {
    await supabase.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      new_value: tenantId,
      is_local: true
    });

    const { data, error } = await supabase
      .from('online_cart_items')
      .select(`
        *,
        products:product_id (
          id,
          name,
          retail_price,
          stock_quantity,
          image_url
        )
      `)
      .eq('cart_id', cartId)
      .eq('tenant_id', tenantId);

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (error) {
    console.error('Error in getCartItems:', error);
    return { success: false, error };
  }
}

export async function removeFromCart(tenantId: string, itemId: string) {
  try {
    await supabase.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      new_value: tenantId,
      is_local: true
    });

    const { error } = await supabase
      .from('online_cart_items')
      .delete()
      .eq('id', itemId)
      .eq('tenant_id', tenantId);

    if (error) return { success: false, error };
    return { success: true };
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    return { success: false, error };
  }
}

export async function updateCartItemQuantity(
  tenantId: string,
  itemId: string,
  quantity: number
) {
  try {
    await supabase.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      new_value: tenantId,
      is_local: true
    });

    const { data, error } = await supabase
      .from('online_cart_items')
      .update({ quantity, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateCartItemQuantity:', error);
    return { success: false, error };
  }
}

// ============================================================
// ORDER MANAGEMENT
// ============================================================

export async function createOrder(params: {
  tenantId: string;
  customerId?: string;
  cartId: string;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  customerNotes?: string;
}) {
  try {
    const { tenantId, customerId, cartId, shippingAddress, paymentMethod, customerNotes } = params;

    // Set tenant context
    await supabase.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      new_value: tenantId,
      is_local: true
    });

    // Get cart items
    const { data: cartItems, error: cartError } = await supabase
      .from('online_cart_items')
      .select('*, products:product_id(*)')
      .eq('cart_id', cartId)
      .eq('tenant_id', tenantId);

    if (cartError || !cartItems || cartItems.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    // Check stock availability for all items
    for (const item of cartItems) {
      const product = item.products;
      if (product.stock_quantity < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`
        };
      }
    }

    // Calculate totals
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product_price * item.quantity,
      0
    );
    const shippingFee = subtotal >= 100 ? 0 : 10; // Free shipping over $100
    const taxAmount = subtotal * 0.1; // 10% tax
    const totalAmount = subtotal + shippingFee + taxAmount;

    // Generate order number
    const { data: orderNumberData } = await supabase.rpc('generate_order_number');
    const orderNumber = orderNumberData || `ORD-${Date.now()}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('online_orders')
      .insert({
        tenant_id: tenantId,
        customer_id: customerId,
        order_number: orderNumber,
        subtotal,
        shipping_fee: shippingFee,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        shipping_full_name: shippingAddress.fullName,
        shipping_phone: shippingAddress.phone,
        shipping_street: shippingAddress.street,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state,
        shipping_postal_code: shippingAddress.postalCode,
        shipping_country: shippingAddress.country,
        payment_method: paymentMethod,
        customer_notes: customerNotes,
        order_status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return { success: false, error: orderError };
    }

    // Create order items
    for (const item of cartItems) {
      await supabase.from('online_order_items').insert({
        tenant_id: tenantId,
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.products.sku,
        unit_price: item.product_price,
        quantity: item.quantity,
        subtotal: item.product_price * item.quantity,
        size: item.size,
        color: item.color
      });
    }

    // Atomically deduct inventory with row locking — prevents overselling
    const inventoryResult = await deductInventory(
      tenantId,
      cartItems.map(item => ({
        productId: item.product_id,
        quantity: item.quantity,
        productName: item.product_name
      })),
      'online_sale',
      order.order_number,
      `Online order ${order.order_number}`
    );

    if (!inventoryResult.success) {
      // Roll back order and items
      await supabase.from('online_order_items').delete().eq('order_id', order.id);
      await supabase.from('online_orders').delete().eq('id', order.id);
      return { success: false, error: inventoryResult.error || 'Inventory update failed' };
    }

    // Mark cart as converted
    await supabase
      .from('online_carts')
      .update({ status: 'converted' })
      .eq('id', cartId);

    return { success: true, data: order };
  } catch (error) {
    console.error('Error in createOrder:', error);
    return { success: false, error };
  }
}

export async function getOrder(tenantId: string, orderId: string) {
  try {
    await supabase.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      new_value: tenantId,
      is_local: true
    });

    const { data: order, error: orderError } = await supabase
      .from('online_orders')
      .select('*')
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .single();

    if (orderError) return { success: false, error: orderError };

    const { data: items, error: itemsError } = await supabase
      .from('online_order_items')
      .select('*')
      .eq('order_id', orderId)
      .eq('tenant_id', tenantId);

    if (itemsError) return { success: false, error: itemsError };

    return { success: true, data: { ...order, items } };
  } catch (error) {
    console.error('Error in getOrder:', error);
    return { success: false, error };
  }
}

export async function updateOrderStatus(
  tenantId: string,
  orderId: string,
  status: string
) {
  try {
    await supabase.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      new_value: tenantId,
      is_local: true
    });

    const updates: any = { order_status: status, updated_at: new Date().toISOString() };

    if (status === 'shipped') {
      updates.shipped_at = new Date().toISOString();
    } else if (status === 'delivered') {
      updates.delivered_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('online_orders')
      .update(updates)
      .eq('id', orderId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return { success: false, error };
  }
}

export async function getCustomerOrders(tenantId: string, customerId: string) {
  try {
    await supabase.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      new_value: tenantId,
      is_local: true
    });

    const { data, error } = await supabase
      .from('online_orders')
      .select('*')
      .eq('customer_id', customerId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error };
    return { success: true, data };
  } catch (error) {
    console.error('Error in getCustomerOrders:', error);
    return { success: false, error };
  }
}

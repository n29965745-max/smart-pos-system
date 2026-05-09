/**
 * Atomic Inventory Service
 *
 * All stock mutations go through this service.
 * Uses PostgreSQL advisory locks + row-level locking to prevent overselling.
 * Writes to both products.stock_quantity AND inventory_movements atomically.
 *
 * Security guarantees:
 * - tenant_id is always server-derived, never from client
 * - All operations are wrapped in a DB transaction via RPC
 * - Row locking prevents concurrent oversell race conditions
 */

import { createClient } from '@supabase/supabase-js';

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type MovementType = 'sale' | 'restock' | 'adjustment' | 'return' | 'initial_stock' | 'online_sale' | 'online_return';

export interface InventoryDeductItem {
  productId: string;
  quantity: number;
  productName?: string;
}

export interface DeductResult {
  success: boolean;
  error?: string;
  movements?: Array<{
    productId: string;
    stockBefore: number;
    stockAfter: number;
    quantityChange: number;
  }>;
}

/**
 * deductInventory — atomically deducts stock for multiple items.
 *
 * Uses the deduct_inventory_atomic RPC which runs inside a transaction
 * with SELECT FOR UPDATE row locking to prevent overselling.
 *
 * @param tenantId - Server-derived tenant ID (never from client)
 * @param items - Products and quantities to deduct
 * @param movementType - Type of movement for audit trail
 * @param referenceId - Order/transaction ID for traceability
 * @param notes - Optional notes
 */
export async function deductInventory(
  tenantId: string,
  items: InventoryDeductItem[],
  movementType: MovementType,
  referenceId: string,
  notes?: string
): Promise<DeductResult> {
  try {
    const { data, error } = await db.rpc('deduct_inventory_atomic', {
      p_tenant_id: tenantId,
      p_items: items.map(i => ({
        product_id: i.productId,
        quantity: i.quantity,
        product_name: i.productName ?? null
      })),
      p_movement_type: movementType,
      p_reference_id: referenceId,
      p_notes: notes ?? null
    });

    if (error) {
      console.error('[inventory.service] deductInventory RPC error:', error.message);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error ?? 'Inventory deduction failed' };
    }

    return { success: true, movements: data.movements };
  } catch (err: any) {
    console.error('[inventory.service] deductInventory exception:', err?.message);
    return { success: false, error: err?.message ?? 'Internal error' };
  }
}

/**
 * restoreInventory — atomically restores stock (for cancellations/returns).
 */
export async function restoreInventory(
  tenantId: string,
  items: InventoryDeductItem[],
  movementType: MovementType,
  referenceId: string,
  notes?: string
): Promise<DeductResult> {
  try {
    const { data, error } = await db.rpc('restore_inventory_atomic', {
      p_tenant_id: tenantId,
      p_items: items.map(i => ({
        product_id: i.productId,
        quantity: i.quantity,
        product_name: i.productName ?? null
      })),
      p_movement_type: movementType,
      p_reference_id: referenceId,
      p_notes: notes ?? null
    });

    if (error) {
      console.error('[inventory.service] restoreInventory RPC error:', error.message);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error ?? 'Inventory restore failed' };
    }

    return { success: true, movements: data.movements };
  } catch (err: any) {
    console.error('[inventory.service] restoreInventory exception:', err?.message);
    return { success: false, error: err?.message ?? 'Internal error' };
  }
}

/**
 * Products Repository - Database-Per-Tenant Example
 * 
 * Shows how to use tenant database in repositories
 * NO tenant_id column needed!
 */

import { Pool } from 'pg';
import { Request } from 'express';
import { getTenantDB } from '../../core/middleware/tenant-resolver';

// ============================================================================
// TYPES
// ============================================================================

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  reorderLevel: number;
  status: 'active' | 'inactive' | 'discontinued';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDTO {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity?: number;
  reorderLevel?: number;
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  category?: string;
  costPrice?: number;
  sellingPrice?: number;
  stockQuantity?: number;
  reorderLevel?: number;
  status?: 'active' | 'inactive' | 'discontinued';
}

// ============================================================================
// PRODUCTS REPOSITORY
// ============================================================================

export class ProductsRepository {
  /**
   * Get tenant database from request
   * This is the KEY difference - no tenant_id needed!
   */
  private getDB(req: Request): Pool {
    return getTenantDB(req);
  }
  
  /**
   * Find all products
   * Notice: NO WHERE tenant_id = ? clause needed!
   */
  async findAll(req: Request, filters?: {
    category?: string;
    status?: string;
    search?: string;
  }): Promise<Product[]> {
    const db = this.getDB(req);
    
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;
    
    if (filters?.category) {
      query += ` AND category = $${paramIndex++}`;
      params.push(filters.category);
    }
    
    if (filters?.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }
    
    if (filters?.search) {
      query += ` AND (name ILIKE $${paramIndex} OR sku ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await db.query(query, params);
    return result.rows;
  }
  
  /**
   * Find product by ID
   */
  async findById(req: Request, id: string): Promise<Product | null> {
    const db = this.getDB(req);
    
    const result = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Find product by SKU
   */
  async findBySKU(req: Request, sku: string): Promise<Product | null> {
    const db = this.getDB(req);
    
    const result = await db.query(
      'SELECT * FROM products WHERE sku = $1',
      [sku]
    );
    
    return result.rows[0] || null;
  }
  
  /**
   * Create product
   */
  async create(req: Request, data: CreateProductDTO): Promise<Product> {
    const db = this.getDB(req);
    
    const result = await db.query(
      `INSERT INTO products (
        sku, name, description, category,
        cost_price, selling_price, stock_quantity, reorder_level,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *`,
      [
        data.sku,
        data.name,
        data.description,
        data.category,
        data.costPrice,
        data.sellingPrice,
        data.stockQuantity || 0,
        data.reorderLevel || 10,
        'active',
      ]
    );
    
    return result.rows[0];
  }
  
  /**
   * Update product
   */
  async update(req: Request, id: string, data: UpdateProductDTO): Promise<Product | null> {
    const db = this.getDB(req);
    
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    
    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(data.category);
    }
    
    if (data.costPrice !== undefined) {
      updates.push(`cost_price = $${paramIndex++}`);
      params.push(data.costPrice);
    }
    
    if (data.sellingPrice !== undefined) {
      updates.push(`selling_price = $${paramIndex++}`);
      params.push(data.sellingPrice);
    }
    
    if (data.stockQuantity !== undefined) {
      updates.push(`stock_quantity = $${paramIndex++}`);
      params.push(data.stockQuantity);
    }
    
    if (data.reorderLevel !== undefined) {
      updates.push(`reorder_level = $${paramIndex++}`);
      params.push(data.reorderLevel);
    }
    
    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
    }
    
    if (updates.length === 0) {
      return this.findById(req, id);
    }
    
    updates.push(`updated_at = NOW()`);
    params.push(id);
    
    const query = `
      UPDATE products 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await db.query(query, params);
    return result.rows[0] || null;
  }
  
  /**
   * Delete product (soft delete)
   */
  async delete(req: Request, id: string): Promise<boolean> {
    const db = this.getDB(req);
    
    const result = await db.query(
      `UPDATE products 
       SET status = 'discontinued', updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
    
    return result.rowCount > 0;
  }
  
  /**
   * Get low stock products
   */
  async getLowStock(req: Request): Promise<Product[]> {
    const db = this.getDB(req);
    
    const result = await db.query(
      `SELECT * FROM products 
       WHERE stock_quantity <= reorder_level 
       AND status = 'active'
       ORDER BY stock_quantity ASC`
    );
    
    return result.rows;
  }
  
  /**
   * Update stock quantity
   */
  async updateStock(
    req: Request,
    productId: string,
    quantityChange: number,
    movementType: 'sale' | 'restock' | 'adjustment' | 'return'
  ): Promise<Product | null> {
    const db = this.getDB(req);
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Update product stock
      const productResult = await client.query(
        `UPDATE products 
         SET stock_quantity = stock_quantity + $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [quantityChange, productId]
      );
      
      if (productResult.rows.length === 0) {
        throw new Error('Product not found');
      }
      
      // Record inventory movement
      await client.query(
        `INSERT INTO inventory_movements (
          product_id, movement_type, quantity, created_at
        ) VALUES ($1, $2, $3, NOW())`,
        [productId, movementType, quantityChange]
      );
      
      await client.query('COMMIT');
      
      return productResult.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get product statistics
   */
  async getStats(req: Request): Promise<{
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    totalValue: number;
  }> {
    const db = this.getDB(req);
    
    const result = await db.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_products,
        SUM(CASE WHEN stock_quantity <= reorder_level AND status = 'active' THEN 1 ELSE 0 END) as low_stock_products,
        SUM(stock_quantity * cost_price) as total_value
      FROM products
    `);
    
    const row = result.rows[0];
    
    return {
      totalProducts: parseInt(row.total_products),
      activeProducts: parseInt(row.active_products),
      lowStockProducts: parseInt(row.low_stock_products),
      totalValue: parseFloat(row.total_value || 0),
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const productsRepository = new ProductsRepository();

# MySQL Code Changes - Examples

This document shows specific code changes needed when migrating from PostgreSQL to MySQL.

---

## 1. Database Connection

### Before (PostgreSQL/Supabase):
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### After (MySQL):
```typescript
// lib/mysql.ts
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 10,
});

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

export default pool;
```

---

## 2. Products API

### Before (PostgreSQL):
```typescript
// pages/api/ecommerce/products/index.ts
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  const { tenantSlug, category, minPrice, maxPrice, colors, inStock } = req.query;
  
  const supabase = createClient(url, key);
  
  // Get tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('subdomain', tenantSlug)
    .single();
  
  // Build query
  let query = supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenant.id);
  
  if (category) query = query.eq('category', category);
  if (minPrice) query = query.gte('retail_price', minPrice);
  if (maxPrice) query = query.lte('retail_price', maxPrice);
  if (inStock) query = query.gt('stock_quantity', 0);
  
  // Array contains (PostgreSQL specific)
  if (colors) {
    const colorArray = colors.split(',');
    query = query.contains('colors', colorArray);
  }
  
  const { data: products } = await query;
  
  res.json({ success: true, products });
}
```

### After (MySQL):
```typescript
// pages/api/ecommerce/products/index.ts
import { query } from '@/lib/mysql';

export default async function handler(req, res) {
  const { tenantSlug, category, minPrice, maxPrice, colors, inStock } = req.query;
  
  try {
    // Get tenant
    const tenant = await query<{ id: string }>(
      'SELECT id FROM tenants WHERE subdomain = ? AND is_active = 1',
      [tenantSlug]
    );
    
    if (!tenant[0]) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    const tenantId = tenant[0].id;
    
    // Build query dynamically
    let sql = 'SELECT * FROM products WHERE tenant_id = ?';
    const params: any[] = [tenantId];
    
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    
    if (minPrice) {
      sql += ' AND retail_price >= ?';
      params.push(minPrice);
    }
    
    if (maxPrice) {
      sql += ' AND retail_price <= ?';
      params.push(maxPrice);
    }
    
    if (inStock) {
      sql += ' AND stock_quantity > 0';
    }
    
    // JSON array contains (MySQL specific)
    if (colors) {
      const colorArray = colors.split(',');
      // Check if any color in the array matches
      const colorConditions = colorArray.map(() => 'JSON_CONTAINS(colors, ?)').join(' OR ');
      sql += ` AND (${colorConditions})`;
      colorArray.forEach(color => params.push(JSON.stringify(color)));
    }
    
    const products = await query(sql, params);
    
    res.json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 3. Insert with RETURNING

### Before (PostgreSQL):
```typescript
// pages/api/products/index.ts
const { data: product, error } = await supabase
  .from('products')
  .insert({
    tenant_id: tenantId,
    name: 'New Product',
    retail_price: 1000,
    stock_quantity: 50
  })
  .select()
  .single();

if (error) throw error;

res.json({ success: true, product });
```

### After (MySQL):
```typescript
// pages/api/products/index.ts
import { v4 as uuidv4 } from 'uuid';

const productId = uuidv4();

await query(
  `INSERT INTO products (id, tenant_id, name, retail_price, stock_quantity) 
   VALUES (?, ?, ?, ?, ?)`,
  [productId, tenantId, 'New Product', 1000, 50]
);

// Query separately to get the inserted product
const product = await queryOne(
  'SELECT * FROM products WHERE id = ?',
  [productId]
);

res.json({ success: true, product });
```

---

## 4. Array Operations

### Before (PostgreSQL):
```typescript
// Store array directly
await supabase
  .from('products')
  .update({
    colors: ['red', 'blue', 'green'],
    sizes: ['S', 'M', 'L']
  })
  .eq('id', productId);

// Query with array contains
const { data } = await supabase
  .from('products')
  .select('*')
  .contains('colors', ['red']);
```

### After (MySQL):
```typescript
// Store as JSON
await query(
  `UPDATE products 
   SET colors = ?, sizes = ? 
   WHERE id = ?`,
  [
    JSON.stringify(['red', 'blue', 'green']),
    JSON.stringify(['S', 'M', 'L']),
    productId
  ]
);

// Query with JSON contains
const products = await query(
  `SELECT * FROM products 
   WHERE JSON_CONTAINS(colors, ?)`,
  [JSON.stringify('red')]
);
```

---

## 5. Tenant Isolation (RLS Replacement)

### Before (PostgreSQL with RLS):
```sql
-- Automatic tenant isolation via RLS policy
CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

```typescript
// Set tenant context
await supabase.rpc('set_tenant_id', { tenant_id: tenantId });

// All queries automatically filtered by tenant
const { data } = await supabase.from('products').select('*');
```

### After (MySQL - Application Level):
```typescript
// middleware/tenant-isolation.ts
export function withTenantIsolation(handler: any) {
  return async (req: any, res: any) => {
    // Get tenant from session/token
    const tenantId = req.session?.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Add to request
    req.tenantId = tenantId;
    
    return handler(req, res);
  };
}

// Usage in API
export default withTenantIsolation(async (req, res) => {
  const { tenantId } = req;
  
  // ALWAYS include tenant_id in WHERE clause
  const products = await query(
    'SELECT * FROM products WHERE tenant_id = ?',
    [tenantId]
  );
  
  res.json({ products });
});
```

---

## 6. Recommendations Service

### Before (PostgreSQL):
```typescript
// services/recommendation.service.ts
export async function generateRecommendations(
  tenantId: string,
  productId: string
) {
  // Check cache (uses UUID array)
  const { data: cached } = await supabase
    .from('product_recommendations_cache')
    .select('recommended_product_ids')
    .eq('tenant_id', tenantId)
    .eq('product_id', productId)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (cached) {
    // Get products by UUID array
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', cached.recommended_product_ids);
    
    return products;
  }
  
  // Generate recommendations...
  const recommendedIds = ['uuid1', 'uuid2', 'uuid3'];
  
  // Cache with UUID array
  await supabase
    .from('product_recommendations_cache')
    .upsert({
      tenant_id: tenantId,
      product_id: productId,
      recommended_product_ids: recommendedIds
    });
  
  return recommendations;
}
```

### After (MySQL):
```typescript
// services/recommendation.service.ts
export async function generateRecommendations(
  tenantId: string,
  productId: string
) {
  // Check cache (uses JSON array)
  const cached = await queryOne<{ recommended_product_ids: string }>(
    `SELECT recommended_product_ids 
     FROM product_recommendations_cache 
     WHERE tenant_id = ? 
       AND product_id = ? 
       AND expires_at > NOW()`,
    [tenantId, productId]
  );
  
  if (cached) {
    // Parse JSON array
    const productIds = JSON.parse(cached.recommended_product_ids);
    
    // Get products by ID array (using IN clause)
    const placeholders = productIds.map(() => '?').join(',');
    const products = await query(
      `SELECT * FROM products 
       WHERE tenant_id = ? 
         AND id IN (${placeholders})`,
      [tenantId, ...productIds]
    );
    
    return products;
  }
  
  // Generate recommendations...
  const recommendedIds = ['uuid1', 'uuid2', 'uuid3'];
  
  // Cache with JSON array
  await query(
    `INSERT INTO product_recommendations_cache 
     (id, tenant_id, product_id, recommended_product_ids, expires_at)
     VALUES (UUID(), ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
     ON DUPLICATE KEY UPDATE 
       recommended_product_ids = VALUES(recommended_product_ids),
       generated_at = NOW(),
       expires_at = DATE_ADD(NOW(), INTERVAL 24 HOUR)`,
    [tenantId, productId, JSON.stringify(recommendedIds)]
  );
  
  return recommendations;
}
```

---

## 7. Full-Text Search

### Before (PostgreSQL):
```typescript
// Search with full-text search
const { data } = await supabase
  .from('products')
  .select('*')
  .textSearch('name', searchTerm, {
    type: 'websearch',
    config: 'english'
  });
```

### After (MySQL):
```typescript
// Search with FULLTEXT index
const products = await query(
  `SELECT * FROM products 
   WHERE tenant_id = ? 
     AND MATCH(name, description) AGAINST(? IN NATURAL LANGUAGE MODE)`,
  [tenantId, searchTerm]
);

// Or simple LIKE search
const products = await query(
  `SELECT * FROM products 
   WHERE tenant_id = ? 
     AND (name LIKE ? OR description LIKE ?)`,
  [tenantId, `%${searchTerm}%`, `%${searchTerm}%`]
);
```

---

## 8. Transactions

### Before (PostgreSQL):
```typescript
const { data, error } = await supabase.rpc('process_checkout', {
  p_tenant_id: tenantId,
  p_items: items,
  p_customer_id: customerId
});
```

### After (MySQL):
```typescript
import pool from '@/lib/mysql';

const connection = await pool.getConnection();

try {
  await connection.beginTransaction();
  
  // Insert transaction
  const transactionId = uuidv4();
  await connection.execute(
    `INSERT INTO transactions (id, tenant_id, customer_id, total_amount, status)
     VALUES (?, ?, ?, ?, 'completed')`,
    [transactionId, tenantId, customerId, totalAmount]
  );
  
  // Insert transaction items
  for (const item of items) {
    await connection.execute(
      `INSERT INTO transaction_items (id, transaction_id, product_id, quantity, unit_price, total_price)
       VALUES (UUID(), ?, ?, ?, ?, ?)`,
      [transactionId, item.product_id, item.quantity, item.price, item.quantity * item.price]
    );
    
    // Update stock
    await connection.execute(
      `UPDATE products 
       SET stock_quantity = stock_quantity - ? 
       WHERE id = ? AND tenant_id = ?`,
      [item.quantity, item.product_id, tenantId]
    );
  }
  
  await connection.commit();
  
  res.json({ success: true, transactionId });
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

---

## Summary of Changes

### Data Types:
- `UUID` → `CHAR(36)` or use `UUID()` function
- `TEXT[]` → `JSON`
- `JSONB` → `JSON`
- `BOOLEAN` → `TINYINT(1)`
- `TIMESTAMP WITH TIME ZONE` → `DATETIME`

### Syntax:
- `RETURNING *` → Query separately after INSERT
- `ILIKE` → `LIKE` with `COLLATE utf8mb4_unicode_ci`
- `||` (concat) → `CONCAT()`
- `ANY(array)` → `IN (...)` or `JSON_CONTAINS()`

### Features:
- RLS → Application-level tenant isolation
- Array operations → JSON operations
- Materialized views → Regular tables with triggers

### Libraries:
- `@supabase/supabase-js` → `mysql2`
- Add `uuid` package for UUID generation

---

**Estimated Migration Time:** 40-80 hours  
**Recommendation:** Stay with PostgreSQL unless you have a compelling reason to switch.


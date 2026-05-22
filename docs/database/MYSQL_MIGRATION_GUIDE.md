# 🔄 MySQL Migration Guide

**Date:** May 13, 2026  
**Current Database:** PostgreSQL (Supabase)  
**Target Database:** MySQL

---

## ⚠️ Important Considerations

### Why This Matters:
Your system is currently built for **PostgreSQL** with Supabase. Migrating to MySQL requires:
1. **Schema changes** - Different data types and syntax
2. **Code changes** - Different query syntax
3. **Feature changes** - Some PostgreSQL features don't exist in MySQL
4. **Testing** - Extensive testing required

### Recommendation:
**Stay with PostgreSQL** unless you have a specific reason to switch. PostgreSQL is:
- More feature-rich
- Better for complex queries
- Supports JSON better
- Has better full-text search
- Supports arrays (MySQL doesn't)

---

## 🎯 Three Options to Use MySQL

### Option 1: Self-Hosted MySQL (Recommended if switching)
**Cost:** $6-12/month  
**Setup Time:** 2-4 hours  
**Maintenance:** 5-10 hours/month

### Option 2: Managed MySQL (PlanetScale, AWS RDS)
**Cost:** $29-50/month  
**Setup Time:** 1-2 hours  
**Maintenance:** 1-2 hours/month

### Option 3: Keep PostgreSQL (Recommended)
**Cost:** $0-25/month (Supabase)  
**Setup Time:** 0 hours (already done)  
**Maintenance:** 0 hours

---

## 📊 PostgreSQL vs MySQL Comparison

| Feature | PostgreSQL | MySQL |
|---------|-----------|-------|
| **Arrays** | ✅ Native support | ❌ Must use JSON or separate tables |
| **JSON** | ✅ JSONB (fast) | ⚠️ JSON (slower) |
| **Full-text search** | ✅ Built-in | ⚠️ Limited |
| **Window functions** | ✅ Full support | ⚠️ Limited |
| **CTEs (WITH)** | ✅ Full support | ⚠️ Limited |
| **UUID** | ✅ Native type | ❌ Must use CHAR(36) |
| **ENUM** | ✅ Native type | ✅ Native type |
| **Transactions** | ✅ ACID compliant | ✅ ACID compliant |
| **Performance** | ✅ Complex queries | ✅ Simple queries |
| **Popularity** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🔧 What Needs to Change

### 1. Data Types

**PostgreSQL → MySQL:**
```sql
-- UUID
uuid → CHAR(36) or BINARY(16)

-- Arrays
TEXT[] → JSON or separate table
UUID[] → JSON or separate table

-- JSONB
JSONB → JSON

-- TIMESTAMP
TIMESTAMP WITH TIME ZONE → DATETIME

-- SERIAL
SERIAL → INT AUTO_INCREMENT

-- BOOLEAN
BOOLEAN → TINYINT(1)

-- TEXT
TEXT → TEXT or LONGTEXT
```

### 2. Syntax Differences

**PostgreSQL:**
```sql
-- Returning clause
INSERT INTO products (...) VALUES (...) RETURNING *;

-- Array operations
WHERE id = ANY(product_ids)

-- JSON operations
WHERE data->>'status' = 'active'

-- String concatenation
'Hello' || ' ' || 'World'

-- Case-insensitive search
WHERE name ILIKE '%search%'
```

**MySQL:**
```sql
-- No RETURNING (must query separately)
INSERT INTO products (...) VALUES (...);
SELECT * FROM products WHERE id = LAST_INSERT_ID();

-- Array operations (using JSON)
WHERE JSON_CONTAINS(product_ids, CAST(id AS JSON))

-- JSON operations
WHERE JSON_EXTRACT(data, '$.status') = 'active'

-- String concatenation
CONCAT('Hello', ' ', 'World')

-- Case-insensitive search
WHERE name LIKE '%search%' COLLATE utf8mb4_unicode_ci
```

### 3. Features Not in MySQL

**Row Level Security (RLS):**
- PostgreSQL: Built-in with policies
- MySQL: Must implement in application code

**Generated Columns:**
- PostgreSQL: GENERATED ALWAYS AS
- MySQL: GENERATED ALWAYS AS (similar, but different syntax)

**Materialized Views:**
- PostgreSQL: CREATE MATERIALIZED VIEW
- MySQL: Must create tables and triggers

---

## 🚀 Migration Steps

### Step 1: Install MySQL

**Option A: Self-Hosted (Ubuntu/Debian)**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install MySQL
sudo apt install mysql-server -y

# Secure installation
sudo mysql_secure_installation

# Create database
sudo mysql
CREATE DATABASE smart_pos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'pos_user'@'%' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON smart_pos.* TO 'pos_user'@'%';
FLUSH PRIVILEGES;
EXIT;

# Allow remote connections
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Change: bind-address = 0.0.0.0

# Restart MySQL
sudo systemctl restart mysql

# Setup firewall
sudo ufw allow 3306
```

**Option B: Managed MySQL (PlanetScale)**
```bash
# Sign up at https://planetscale.com
# Create new database
# Get connection string
# No installation needed!
```

### Step 2: Convert Schema

I'll create a MySQL version of your schema:

**File:** `lib/mysql-schema.sql`

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS smart_pos 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE smart_pos;

-- Tenants table
CREATE TABLE tenants (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  business_name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  tagline TEXT,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#10b981',
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_subdomain (subdomain),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- Users table
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  username VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role ENUM('admin', 'manager', 'cashier') DEFAULT 'cashier',
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE KEY unique_tenant_email (tenant_id, email),
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_email (email)
) ENGINE=InnoDB;

-- Products table
CREATE TABLE products (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  retail_price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2),
  stock_quantity INT DEFAULT 0,
  barcode VARCHAR(100),
  image_url TEXT,
  description TEXT,
  -- Arrays converted to JSON
  colors JSON,
  sizes JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_category (category),
  INDEX idx_barcode (barcode),
  INDEX idx_stock (stock_quantity)
) ENGINE=InnoDB;

-- Product Images table
CREATE TABLE product_images (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  product_id CHAR(36) NOT NULL,
  image_url TEXT NOT NULL,
  image_type ENUM('primary', 'angle', 'lifestyle', 'size_reference', 'detail') DEFAULT 'angle',
  display_order INT DEFAULT 0,
  alt_text VARCHAR(255),
  width INT,
  height INT,
  file_size_kb INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_tenant_product_order (tenant_id, product_id, display_order),
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_product_id (product_id),
  INDEX idx_product_order (product_id, display_order)
) ENGINE=InnoDB;

-- Transactions table
CREATE TABLE transactions (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  tenant_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  customer_id CHAR(36),
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method ENUM('cash', 'mpesa', 'card', 'credit') DEFAULT 'cash',
  status ENUM('completed', 'pending', 'cancelled') DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- Add more tables as needed...
```

### Step 3: Update Environment Variables

```bash
# .env.local

# OLD (PostgreSQL/Supabase)
# DATABASE_URL="postgresql://..."
# NEXT_PUBLIC_SUPABASE_URL="..."
# NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# NEW (MySQL)
DATABASE_URL="mysql://pos_user:password@your-server-ip:3306/smart_pos"
# or for PlanetScale:
# DATABASE_URL="mysql://user:pass@aws.connect.psdb.cloud/smart_pos?ssl={"rejectUnauthorized":true}"
```

### Step 4: Install MySQL Client

```bash
npm install mysql2
# or
npm install @planetscale/database
```

### Step 5: Update Database Connection

**Create:** `lib/mysql.ts`

```typescript
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'pos_user',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'smart_pos',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

export default pool;
```

### Step 6: Update All Queries

**Example: Products API**

**Before (PostgreSQL):**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Query with RETURNING
const { data, error } = await supabase
  .from('products')
  .insert({ name, price, tenant_id })
  .select()
  .single();

// Array operations
const { data } = await supabase
  .from('products')
  .select('*')
  .contains('colors', ['red', 'blue']);
```

**After (MySQL):**
```typescript
import { query, queryOne } from '@/lib/mysql';

// Insert without RETURNING
const result = await query(
  'INSERT INTO products (id, name, retail_price, tenant_id) VALUES (UUID(), ?, ?, ?)',
  [name, price, tenant_id]
);

// Get inserted record
const product = await queryOne(
  'SELECT * FROM products WHERE id = LAST_INSERT_ID()'
);

// Array operations with JSON
const products = await query(
  `SELECT * FROM products 
   WHERE JSON_CONTAINS(colors, ?)`,
  [JSON.stringify('red')]
);
```

### Step 7: Remove RLS, Implement in Code

**PostgreSQL RLS:**
```sql
-- Automatic tenant isolation
CREATE POLICY tenant_isolation ON products
  USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

**MySQL - Application Level:**
```typescript
// middleware/tenant-isolation.ts
export function withTenantIsolation(handler: any) {
  return async (req: any, res: any) => {
    const tenantId = req.session?.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Add tenant_id to all queries
    req.tenantId = tenantId;
    return handler(req, res);
  };
}

// Usage in API
export default withTenantIsolation(async (req, res) => {
  const { tenantId } = req;
  
  // Always include tenant_id in WHERE clause
  const products = await query(
    'SELECT * FROM products WHERE tenant_id = ?',
    [tenantId]
  );
  
  res.json({ products });
});
```

---

## 📋 Complete Migration Checklist

### Phase 1: Preparation
- [ ] Backup current PostgreSQL database
- [ ] Set up MySQL server (self-hosted or managed)
- [ ] Create MySQL database and user
- [ ] Test MySQL connection

### Phase 2: Schema Migration
- [ ] Convert all PostgreSQL schemas to MySQL
- [ ] Handle array columns (convert to JSON or separate tables)
- [ ] Handle UUID columns (convert to CHAR(36))
- [ ] Create all indexes
- [ ] Create all foreign keys

### Phase 3: Code Migration
- [ ] Install MySQL client library
- [ ] Create MySQL connection utility
- [ ] Update all API endpoints to use MySQL syntax
- [ ] Remove RETURNING clauses
- [ ] Convert array operations to JSON operations
- [ ] Implement tenant isolation in application code
- [ ] Update all services

### Phase 4: Data Migration
- [ ] Export data from PostgreSQL
- [ ] Transform data format (arrays to JSON, etc.)
- [ ] Import data to MySQL
- [ ] Verify data integrity
- [ ] Test all queries

### Phase 5: Testing
- [ ] Test all API endpoints
- [ ] Test tenant isolation
- [ ] Test transactions
- [ ] Test performance
- [ ] Load testing

### Phase 6: Deployment
- [ ] Update environment variables
- [ ] Deploy to staging
- [ ] Test on staging
- [ ] Deploy to production
- [ ] Monitor for errors

---

## 💰 Cost Comparison

### Self-Hosted MySQL:
**Monthly Cost:**
- VPS (DigitalOcean): $12/month
- Backups: $2/month
- **Total: $14/month**

**Time Cost:**
- Setup: 4 hours
- Monthly maintenance: 5 hours
- **Total: ~$250/month** (if time = $50/hour)

### Managed MySQL (PlanetScale):
**Monthly Cost:**
- Hobby: $29/month
- Scaler Pro: $39/month
- **Total: $29-39/month**

**Time Cost:**
- Setup: 1 hour
- Monthly maintenance: 1 hour
- **Total: ~$80/month** (if time = $50/hour)

### Keep PostgreSQL (Supabase):
**Monthly Cost:**
- Free: $0/month
- Pro: $25/month
- **Total: $0-25/month**

**Time Cost:**
- Setup: 0 hours (already done)
- Monthly maintenance: 0 hours
- **Total: $0/month**

---

## ⚠️ Breaking Changes

### Features You'll Lose:

1. **Row Level Security (RLS)**
   - Must implement in application code
   - More error-prone
   - Requires careful testing

2. **Array Support**
   - Must use JSON or separate tables
   - Slower queries
   - More complex code

3. **RETURNING Clause**
   - Must query separately after INSERT
   - Two database calls instead of one
   - Slightly slower

4. **Advanced JSON Operations**
   - Limited JSON functions
   - Slower JSON queries
   - Less flexible

5. **Full-Text Search**
   - Limited capabilities
   - May need external search (Elasticsearch)

---

## 🎯 Recommendation

### Stay with PostgreSQL (Supabase) if:
- ✅ You're happy with current setup
- ✅ You want zero maintenance
- ✅ You need advanced features (RLS, arrays, JSON)
- ✅ You value development speed
- ✅ You have < 500 shops

### Switch to MySQL if:
- ✅ You have specific MySQL requirement
- ✅ Your team knows MySQL better
- ✅ You need MySQL-specific features
- ✅ You're at massive scale (1000+ shops)
- ✅ You have DevOps expertise

### My Recommendation:
**Stick with PostgreSQL/Supabase** unless you have a compelling reason to switch. The migration effort (40-80 hours) and ongoing maintenance (5-10 hours/month) aren't worth it for most use cases.

---

## 📚 Resources

### MySQL Documentation:
- https://dev.mysql.com/doc/
- https://planetscale.com/docs

### Migration Tools:
- pgloader (PostgreSQL to MySQL)
- AWS Database Migration Service
- Manual export/import

### MySQL Clients:
- mysql2 (Node.js)
- @planetscale/database (PlanetScale)
- Prisma (ORM)

---

## 🆘 Need Help?

If you decide to migrate, I can:
1. Convert all your schemas to MySQL
2. Update all API endpoints
3. Implement tenant isolation
4. Create migration scripts
5. Test everything

**Estimated Time:** 40-80 hours of work  
**Estimated Cost:** $2,000-4,000 (if outsourced)

---

**Last Updated:** May 13, 2026  
**Recommendation:** Stay with PostgreSQL/Supabase ✅


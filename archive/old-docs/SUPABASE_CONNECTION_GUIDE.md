# Supabase Connection Guide

## 🔌 How Supabase is Connected

Your POS system uses Supabase as the database backend. Here's how everything is connected:

---

## 📊 Connection Architecture

```
Your POS System (Frontend)
    ↓
Next.js API Routes (Backend)
    ↓
Supabase Client (lib/supabase.ts)
    ↓
Supabase Database (PostgreSQL)
```

---

## 🔑 Connection Configuration

### 1. Environment Variables (`.env.local`)

Your Supabase connection is configured through environment variables:

```env
# Supabase URL - Your project's unique URL
NEXT_PUBLIC_SUPABASE_URL="https://ugemjqouxnholwlgvzer.supabase.co"

# Anon Key - Public key for client-side access
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Service Role Key - Admin key for server-side operations
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Direct Database URL - For direct PostgreSQL connections
DATABASE_URL="postgresql://postgres:REDACTED_DB_PASSWORD@db.ugemjqouxnholwlgvzer.supabase.co:5432/postgres"
```

### 2. Supabase Client (`lib/supabase.ts`)

The client is initialized once and reused throughout the app:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3. API Routes Usage

Every API route imports and uses the Supabase client:

```typescript
import { supabase } from '@/lib/supabase';

// Example: Fetch products
const { data, error } = await supabase
  .from('products')
  .select('*');
```

---

## 🗄️ Database Tables

Your Supabase database has these tables:

1. **products** - Product inventory
2. **customers** - Customer information
3. **transactions** - Sales transactions
4. **transaction_items** - Individual items in transactions
5. **cart_items** - Shopping cart (temporary)
6. **users** - System users/staff
7. **settings** - System settings
8. **shop_settings** - Shop information
9. **debts** - Customer debt records
10. **returns** - Product returns
11. **expenses** - Business expenses

---

## 🔐 Security & Access

### Anon Key (Public)
- Used in frontend and API routes
- Has Row Level Security (RLS) policies
- Safe to expose in client-side code
- Limited permissions

### Service Role Key (Private)
- Admin-level access
- Bypasses RLS policies
- Never exposed to client
- Used for server-side operations only

### Database URL (Private)
- Direct PostgreSQL connection
- Full database access
- Used for migrations and admin tasks
- Never exposed to client

---

## 📡 How Data Flows

### Example: Adding Product to Cart

1. **User scans barcode** on POS page
2. **Frontend calls API**: `POST /api/pos/cart`
3. **API route** receives request
4. **Supabase client** queries database:
   ```typescript
   const { data } = await supabase
     .from('products')
     .select('*')
     .eq('sku', barcode)
     .single();
   ```
5. **Database returns** product data
6. **API inserts** into cart_items table
7. **Response sent** back to frontend
8. **UI updates** with new cart item

---

## 🌐 Accessing Supabase Dashboard

### 1. Login to Supabase
- Go to: https://supabase.com
- Login with your account
- Select your project: `ugemjqouxnholwlgvzer`

### 2. Available Tools

**Table Editor**
- View/edit data directly
- Add/delete rows
- Export to CSV
- Import from CSV

**SQL Editor**
- Run custom SQL queries
- Create tables
- Update data in bulk
- View query results

**Database**
- View schema
- Manage tables
- Set up relationships
- Configure RLS policies

**Authentication**
- Manage users (if using Supabase Auth)
- Configure auth providers
- Set up email templates

**Storage**
- Upload files (product images, etc.)
- Manage buckets
- Set access policies

**API Docs**
- Auto-generated API documentation
- Test API endpoints
- View available queries

---

## 🔧 Common Operations

### View All Products
```sql
-- In Supabase SQL Editor
SELECT * FROM products ORDER BY name;
```

### Add Barcodes to Products
```sql
-- Update product SKUs
UPDATE products SET sku = '1001' WHERE name = 'Product 1';
UPDATE products SET sku = '1002' WHERE name = 'Product 2';
```

### Check Database Connection
```sql
-- Test query
SELECT COUNT(*) as total_products FROM products;
```

### Export Data
1. Go to Table Editor
2. Select table (e.g., products)
3. Click "Export" button
4. Download as CSV

### Import Data
1. Go to Table Editor
2. Select table
3. Click "Import" button
4. Upload CSV file
5. Map columns
6. Import

---

## 🚀 Deployment Configuration

### Vercel Environment Variables

Your app is deployed on Vercel with these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://ugemjqouxnholwlgvzer.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:REDACTED_DB_PASSWORD@db...
```

These are automatically loaded from your `.env.local` file during deployment.

---

## 🔍 Troubleshooting

### Connection Issues

**Problem**: "Failed to fetch" or "Network error"

**Check**:
1. Supabase project is active (not paused)
2. Environment variables are correct
3. Internet connection is working
4. Supabase service is up (check status.supabase.com)

**Solution**:
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Restart development server
npm run dev
```

### Authentication Errors

**Problem**: "Invalid API key" or "Unauthorized"

**Check**:
1. Anon key is correct in `.env.local`
2. Key hasn't expired
3. RLS policies allow the operation

**Solution**:
1. Go to Supabase Dashboard → Settings → API
2. Copy fresh anon key
3. Update `.env.local`
4. Restart server

### Query Errors

**Problem**: "Table not found" or "Column doesn't exist"

**Check**:
1. Table exists in database
2. Column name is spelled correctly
3. Schema is up to date

**Solution**:
```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'products';
```

---

## 📊 Database Schema

### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  retail_price DECIMAL(10,2),
  wholesale_price DECIMAL(10,2),
  stock_quantity INTEGER DEFAULT 0,
  reorder_level INTEGER DEFAULT 10,
  category TEXT,
  description TEXT,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_number TEXT UNIQUE,
  customer_id UUID REFERENCES customers(id),
  customer_name TEXT,
  customer_phone TEXT,
  subtotal DECIMAL(10,2),
  discount DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2),
  amount_paid DECIMAL(10,2),
  payment_method TEXT,
  cashier_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 Data Sync

### Real-time Updates (Optional)

Supabase supports real-time subscriptions:

```typescript
// Subscribe to product changes
const subscription = supabase
  .channel('products-channel')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'products' },
    (payload) => {
      console.log('Product changed:', payload);
      // Update UI
    }
  )
  .subscribe();
```

Currently not implemented, but available if needed.

---

## 💾 Backup & Recovery

### Automatic Backups

Supabase automatically backs up your database:
- Daily backups (retained for 7 days on free plan)
- Point-in-time recovery available on paid plans

### Manual Backup

**Export all data:**
```bash
# Using pg_dump (requires PostgreSQL client)
pg_dump "postgresql://postgres:REDACTED_DB_PASSWORD@db.ugemjqouxnholwlgvzer.supabase.co:5432/postgres" > backup.sql
```

**Or export via Dashboard:**
1. Go to each table
2. Click Export → CSV
3. Save all CSV files
4. Store safely

---

## 📈 Performance

### Query Optimization

**Use indexes** for frequently queried columns:
```sql
-- Add index on SKU for faster barcode lookups
CREATE INDEX idx_products_sku ON products(sku);

-- Add index on transaction date
CREATE INDEX idx_transactions_date ON transactions(created_at);
```

**Use select specific columns**:
```typescript
// Good - only fetch needed columns
const { data } = await supabase
  .from('products')
  .select('id, name, sku, retail_price')
  .eq('sku', barcode);

// Avoid - fetches all columns
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('sku', barcode);
```

---

## 🎯 Summary

Your Supabase connection:

✅ **Configured** via environment variables
✅ **Initialized** in `lib/supabase.ts`
✅ **Used** by all API routes
✅ **Secure** with proper key management
✅ **Deployed** on Vercel with environment variables
✅ **Accessible** via Supabase Dashboard

**Your Supabase Project:**
- URL: https://ugemjqouxnholwlgvzer.supabase.co
- Dashboard: https://supabase.REDACTED_APP_SECRET

Everything is properly connected and working!

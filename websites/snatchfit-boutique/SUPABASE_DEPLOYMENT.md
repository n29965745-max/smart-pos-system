# SnatchFit Boutique - Supabase Deployment Guide

## Using Supabase Instead of MongoDB

This guide shows how to deploy SnatchFit Boutique using Supabase (PostgreSQL) instead of MongoDB.

---

## Why Supabase?

✅ **PostgreSQL Database** - Powerful relational database
✅ **Built-in Authentication** - User management included
✅ **Real-time Capabilities** - Live data updates
✅ **Free Tier** - Generous free tier for startups
✅ **Easy Integration** - Simple JavaScript client
✅ **Vercel Compatible** - Works perfectly with Vercel
✅ **Row Level Security** - Built-in security policies

---

## Step 1: Create Supabase Account (5 minutes)

### Create Account
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub or email
4. Verify your email

### Create Project
1. Click "New Project"
2. Project name: `snatchfit-boutique`
3. Database password: Generate strong password (save this!)
4. Region: Choose closest to your users
5. Click "Create new project"
6. Wait 2-3 minutes for project to be ready

### Get Connection Details
1. Go to "Settings" → "Database"
2. Copy the connection string (you'll need this)
3. Go to "Settings" → "API"
4. Copy the Project URL
5. Copy the anon public key
6. Copy the service_role secret key

---

## Step 2: Create Database Tables

### Option A: Using Supabase Dashboard (Easiest)

1. Go to "SQL Editor" in Supabase dashboard
2. Click "New Query"
3. Copy and paste the SQL below
4. Click "Run"

### SQL to Create Tables

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(255),
  category VARCHAR(100),
  inventory INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart table
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own cart" ON cart_items
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Step 3: Update Environment Variables

### Add to Vercel

In Vercel Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret_key
JWT_SECRET=REDACTED
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=REDACTED_STRIPE_TEST
NEXTAUTH_SECRET=your_nextauth_secret_key_min_32_chars
NEXTAUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_ADMIN_EMAIL=admin@snatchfit.com
NEXT_PUBLIC_ADMIN_PASSWORD=your_strong_password
NODE_ENV=production
```

### Local Development (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_public_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret_key
JWT_SECRET=REDACTED
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=REDACTED_STRIPE_TEST
NEXTAUTH_SECRET=your_nextauth_secret_key_min_32_chars
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_EMAIL=admin@snatchfit.com
NEXT_PUBLIC_ADMIN_PASSWORD=admin123
NODE_ENV=development
```

---

## Step 4: Update Code to Use Supabase

### Create Supabase Client

Create `lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
```

### Example: Update User Registration

```javascript
import { supabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name } = req.body;

  try {
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user in Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          name,
        },
      ])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json({ user: data[0] });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

### Example: Get Products

```javascript
import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

---

## Step 5: Install Dependencies

```bash
npm install
```

This will install `@supabase/supabase-js` and all other dependencies.

---

## Step 6: Deploy to Vercel

1. Push code to GitHub
2. Go to Vercel dashboard
3. Import your repository
4. Add environment variables (from Step 3)
5. Click "Deploy"

---

## Advantages of Supabase

### vs MongoDB
- ✅ SQL queries (more powerful)
- ✅ Built-in authentication
- ✅ Real-time subscriptions
- ✅ Row-level security
- ✅ Better for relational data
- ✅ Easier to query relationships

### vs Firebase
- ✅ Open source
- ✅ PostgreSQL (industry standard)
- ✅ More control
- ✅ Better for complex queries
- ✅ Cheaper at scale

---

## Supabase Pricing

### Free Tier
- ✅ 500MB database
- ✅ 2GB bandwidth
- ✅ Up to 50,000 monthly active users
- ✅ Perfect for startups

### Pro Tier ($25/month)
- ✅ 8GB database
- ✅ 250GB bandwidth
- ✅ Unlimited users
- ✅ Priority support

---

## Testing Supabase Connection

### Test in API Route

Create `pages/api/test-supabase.js`:

```javascript
import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('count', { count: 'exact' });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ 
      message: 'Supabase connected!',
      productCount: data.length 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

Then visit: `http://localhost:3000/api/test-supabase`

---

## Supabase Dashboard Features

### SQL Editor
- Write and run SQL queries
- Create tables
- Manage data

### Table Editor
- Visual table management
- Add/edit/delete rows
- Export data

### Authentication
- Manage users
- Set up OAuth providers
- Configure email templates

### Real-time
- Subscribe to data changes
- Live updates
- Presence tracking

### Backups
- Automatic daily backups
- Point-in-time recovery
- Export data

---

## Migration from MongoDB

If you already have MongoDB data:

1. Export data from MongoDB
2. Transform to PostgreSQL format
3. Import into Supabase
4. Update API routes to use Supabase client

---

## Supabase vs MongoDB Comparison

| Feature | Supabase | MongoDB |
|---------|----------|---------|
| Database Type | PostgreSQL | NoSQL |
| Query Language | SQL | MongoDB Query |
| Authentication | Built-in | Manual |
| Real-time | Yes | No |
| Row Security | Yes | No |
| Free Tier | 500MB | 512MB |
| Relationships | Native | Manual |
| Transactions | Yes | Limited |
| Backups | Automatic | Manual |

---

## Common Supabase Queries

### Insert Data
```javascript
const { data, error } = await supabase
  .from('products')
  .insert([{ name: 'Product', price: 99.99 }])
  .select();
```

### Update Data
```javascript
const { data, error } = await supabase
  .from('products')
  .update({ price: 89.99 })
  .eq('id', productId)
  .select();
```

### Delete Data
```javascript
const { data, error } = await supabase
  .from('products')
  .delete()
  .eq('id', productId);
```

### Query with Filters
```javascript
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('category', 'clothing')
  .gt('price', 50)
  .order('price', { ascending: true });
```

### Join Tables
```javascript
const { data, error } = await supabase
  .from('orders')
  .select(`
    *,
    user:users(name, email),
    items:order_items(quantity, price, product:products(name))
  `)
  .eq('id', orderId);
```

---

## Troubleshooting

### Connection Error
- Verify Supabase URL is correct
- Check anon key is valid
- Ensure project is active

### Row Level Security Error
- Check RLS policies are set correctly
- Verify user is authenticated
- Check policy conditions

### Query Error
- Verify table names are correct
- Check column names match
- Review SQL syntax

---

## Next Steps

1. Create Supabase account
2. Create project
3. Run SQL to create tables
4. Update environment variables
5. Install dependencies: `npm install`
6. Test connection
7. Deploy to Vercel

---

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Supabase GitHub**: https://github.com/supabase/supabase

---

## You're Ready! 🚀

Supabase is now configured for your SnatchFit Boutique.

Next: Deploy to Vercel!

Good luck! 🎉


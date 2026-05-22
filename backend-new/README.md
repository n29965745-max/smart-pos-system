# Smart POS System - Database-Per-Tenant Backend

**Production-Ready Multi-Tenant POS System**  
**Architecture:** Database-Per-Tenant with Dynamic Routing

---

## 🏗️ ARCHITECTURE OVERVIEW

This backend implements a **database-per-tenant** architecture where:

- ✅ Each tenant gets their own PostgreSQL database
- ✅ NO `tenant_id` column in business tables
- ✅ Complete data isolation between tenants
- ✅ Dynamic database routing per request
- ✅ Connection pooling for performance
- ✅ Redis caching for tenant configs

### Key Components:

1. **Central Registry Database** - Stores tenant metadata and user accounts
2. **Tenant Databases** - One database per shop/tenant
3. **Tenant Database Manager** - Creates and manages tenant databases
4. **Tenant Resolver Middleware** - Routes requests to correct database
5. **Migration Tools** - Migrate from shared DB to database-per-tenant

---

## 📁 PROJECT STRUCTURE

```
backend-new/
├── src/
│   ├── core/                          # Core infrastructure
│   │   ├── database/
│   │   │   ├── tenant-db-manager.ts   # Manages tenant databases
│   │   │   ├── connection-pool.ts     # Connection pooling
│   │   │   └── registry-db.ts         # Central registry
│   │   └── middleware/
│   │       ├── tenant-resolver.ts     # Tenant resolution
│   │       └── auth.ts                # Authentication
│   │
│   ├── modules/                       # Business modules
│   │   ├── auth/                      # Authentication
│   │   ├── pos/                       # Point of Sale
│   │   ├── products/                  # Product management
│   │   ├── inventory/                 # Inventory tracking
│   │   ├── sales/                     # Sales transactions
│   │   ├── customers/                 # Customer management
│   │   └── reports/                   # Reporting
│   │
│   ├── migration/                     # Migration tools
│   │   ├── export-tenant-data.ts      # Export from old DB
│   │   ├── import-tenant-data.ts      # Import to new DB
│   │   └── validate-migration.ts      # Validation
│   │
│   └── server.ts                      # Express server
│
├── docs/
│   └── architecture/
│       ├── DATABASE_PER_TENANT_MIGRATION.md
│       └── MIGRATION_EXECUTION_PLAN.md
│
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🚀 QUICK START

### 1. Install Dependencies

```bash
cd backend-new
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Create Central Registry Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE registry_db;

# Run migrations
npm run migrate:registry
```

### 4. Start Server

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

---

## 🔧 CONFIGURATION

### Environment Variables (.env)

```bash
# Central Registry Database
REGISTRY_DB_HOST=localhost
REGISTRY_DB_PORT=5432
REGISTRY_DB_NAME=registry_db
REGISTRY_DB_USER=postgres
REGISTRY_DB_PASSWORD=your_password

# PostgreSQL Admin (for creating tenant DBs)
DB_ADMIN_USER=postgres
DB_ADMIN_PASSWORD=your_admin_password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security
JWT_SECRET=your_jwt_secret_key_here
DB_ENCRYPTION_KEY=your_32_byte_hex_encryption_key

# Application
PORT=3001
NODE_ENV=production
ALLOWED_DOMAINS=yourpos.com,localhost
ALLOWED_ORIGINS=https://yourpos.com,http://localhost:3000

# Migration (for old shared DB)
OLD_DB_HOST=localhost
OLD_DB_PORT=5432
OLD_DB_NAME=smart_pos_shared
OLD_DB_USER=postgres
OLD_DB_PASSWORD=your_password

# Export/Import
EXPORT_DIR=./exports
```

---

## 📊 TENANT PROVISIONING

### Create New Tenant

```bash
# Via API
curl -X POST http://localhost:3001/api/admin/tenants/provision \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "shop1",
    "businessName": "Shop 1",
    "ownerEmail": "owner@shop1.com",
    "plan": "basic"
  }'

# Via CLI
npm run provision-tenant shop1 "Shop 1" owner@shop1.com
```

This will:
1. Create entry in central registry
2. Create new PostgreSQL database (`tenant_shop1_db`)
3. Create database user (`tenant_shop1_user`)
4. Run tenant migrations
5. Link owner to tenant

---

## 🔄 MIGRATION FROM SHARED DATABASE

### Step 1: Export Tenant Data

```bash
# Export single tenant
npm run export-tenant <tenant-id>

# Export all tenants
npm run export-tenant all

# Output: ./exports/<tenant-slug>/
```

### Step 2: Provision New Tenant Database

```bash
npm run provision-tenant <tenant-slug> "<Business Name>" <owner-email>
```

### Step 3: Import Data

```bash
npm run import-tenant <tenant-slug>
```

### Step 4: Validate

```bash
npm run validate-tenant <tenant-slug>
```

### Step 5: Switch Traffic

Update Nginx/load balancer to route tenant to new backend.

---

## 🌐 TENANT RESOLUTION

The system supports multiple tenant resolution strategies:

### 1. Subdomain-Based (Recommended)

```
https://shop1.yourpos.com/api/products
→ Resolves to tenant: shop1
```

### 2. JWT-Based

```bash
curl https://api.yourpos.com/api/products \
  -H "Authorization: Bearer <JWT>"

# JWT payload includes:
{
  "userId": "123",
  "tenantSlug": "shop1",
  "role": "admin"
}
```

### 3. Header-Based

```bash
curl https://api.yourpos.com/api/products \
  -H "X-Tenant-Slug: shop1"
```

---

## 💻 USAGE EXAMPLES

### Products API

```typescript
// GET /api/products
// Notice: NO tenant_id in query!

import { Request, Response } from 'express';
import { productsRepository } from './products.repository';

export async function getProducts(req: Request, res: Response) {
  // Tenant DB is automatically injected by middleware
  const products = await productsRepository.findAll(req, {
    category: req.query.category as string,
    status: req.query.status as string,
    search: req.query.search as string,
  });
  
  res.json({ products });
}

// POST /api/products
export async function createProduct(req: Request, res: Response) {
  const product = await productsRepository.create(req, req.body);
  res.json({ product });
}
```

### Repository Pattern

```typescript
// products.repository.ts
import { getTenantDB } from '../../core/middleware/tenant-resolver';

export class ProductsRepository {
  async findAll(req: Request): Promise<Product[]> {
    const db = getTenantDB(req);  // Get tenant-specific database
    
    // NO tenant_id filter needed!
    const result = await db.query('SELECT * FROM products');
    
    return result.rows;
  }
}
```

---

## 🔒 AUTHENTICATION

### Login

```bash
POST /api/auth/login
{
  "email": "user@shop1.com",
  "password": "password123",
  "tenantSlug": "shop1"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123",
    "email": "user@shop1.com",
    "role": "admin"
  },
  "tenant": {
    "id": "456",
    "slug": "shop1",
    "businessName": "Shop 1"
  }
}
```

### Protected Routes

```typescript
import { requireAuth, requireRole } from './core/middleware/tenant-resolver';

// Require authentication
app.use('/api/products', requireAuth, productsRoutes);

// Require specific role
app.use('/api/reports', requireAuth, requireRole('admin', 'owner'), reportsRoutes);
```

---

## 📈 MONITORING

### Health Check

```bash
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2026-05-22T12:00:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

### Tenant List

```bash
GET /api/admin/tenants

Response:
{
  "tenants": [
    {
      "id": "123",
      "slug": "shop1",
      "dbName": "tenant_shop1_db",
      "status": "active",
      "migrationStatus": "completed"
    }
  ]
}
```

### Database Connections

```bash
# Check active connections per tenant
psql -d tenant_shop1_db -c "
  SELECT count(*) FROM pg_stat_activity 
  WHERE datname = 'tenant_shop1_db';
"
```

---

## 🛡️ SECURITY

### Data Isolation

- Each tenant has separate database
- No cross-tenant queries possible
- Database credentials encrypted in registry

### Connection Security

- Connection pooling with limits
- Automatic connection cleanup
- Redis caching for performance

### Authentication

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt

---

## 🧪 TESTING

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

---

## 📦 DEPLOYMENT

### Docker

```bash
# Build image
docker build -t smart-pos-backend .

# Run container
docker run -p 3001:3001 \
  -e REGISTRY_DB_HOST=postgres \
  -e REDIS_HOST=redis \
  smart-pos-backend
```

### Docker Compose

```bash
docker-compose up -d
```

### Coolify

1. Push code to Git repository
2. Create new service in Coolify
3. Set environment variables
4. Deploy

---

## 📚 DOCUMENTATION

- [Architecture Overview](../docs/architecture/DATABASE_PER_TENANT_MIGRATION.md)
- [Migration Plan](../docs/architecture/MIGRATION_EXECUTION_PLAN.md)
- [API Documentation](./docs/API.md)

---

## 🤝 SUPPORT

For issues or questions:
- Check documentation in `docs/`
- Review migration logs in `./exports/`
- Contact: support@yourpos.com

---

**Version:** 2.0.0  
**Last Updated:** May 22, 2026  
**Status:** Production Ready

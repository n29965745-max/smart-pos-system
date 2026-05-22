# Database-Per-Tenant Migration Architecture

**Status:** Planning Phase  
**Target:** Production-Ready Multi-Tenant POS System  
**Migration Type:** Shared DB (tenant_id) → Database-Per-Tenant  
**Zero Downtime:** Required  
**Financial Transactions:** Critical - No Data Loss Allowed

---

## TABLE OF CONTENTS

1. [Architecture Overview](#1-architecture-overview)
2. [Tenant Database Manager](#2-tenant-database-manager)
3. [Tenant Resolution Middleware](#3-tenant-resolution-middleware)
4. [Database Abstraction Layer](#4-database-abstraction-layer)
5. [Migration Strategy](#5-migration-strategy)
6. [Data Migration Scripts](#6-data-migration-scripts)
7. [Auth System Modifications](#7-auth-system-modifications)
8. [Safety & Rollback](#8-safety--rollback)
9. [Execution Plan](#9-execution-plan)

---

## 1. ARCHITECTURE OVERVIEW

### 1.1 Current Architecture (Shared Database)

```
┌─────────────────────────────────────────┐
│         Single PostgreSQL Database       │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ users (tenant_id, user_id, ...)   │ │
│  │ products (tenant_id, product_id)  │ │
│  │ sales (tenant_id, sale_id, ...)   │ │
│  │ inventory (tenant_id, ...)        │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
         ↑
         │ WHERE tenant_id = ?
         │
    ┌────────────┐
    │  Backend   │
    └────────────┘
```

### 1.2 New Architecture (Database-Per-Tenant)

```
┌──────────────────────────────────────────────────────────┐
│                    CENTRAL REGISTRY DB                    │
│  ┌────────────────────────────────────────────────────┐  │
│  │ tenants (id, slug, db_name, db_host, status, ...)│  │
│  │ users (id, email, password_hash, ...)            │  │
│  │ tenant_users (tenant_id, user_id, role, ...)     │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
                           ↓
              ┌────────────────────────┐
              │  Tenant DB Manager     │
              │  (Connection Router)   │
              └────────────────────────┘
                           ↓
        ┌──────────────────┴──────────────────┐
        ↓                  ↓                   ↓
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Tenant DB 1  │  │  Tenant DB 2  │  │  Tenant DB N  │
│               │  │               │  │               │
│ products      │  │ products      │  │ products      │
│ sales         │  │ sales         │  │ sales         │
│ inventory     │  │ inventory     │  │ inventory     │
│ (NO tenant_id)│  │ (NO tenant_id)│  │ (NO tenant_id)│
└───────────────┘  └───────────────┘  └───────────────┘
```

### 1.3 New Backend Folder Structure

```
smart-pos-system/
├── backend/
│   ├── src/
│   │   ├── core/                          # Core infrastructure
│   │   │   ├── database/
│   │   │   │   ├── tenant-db-manager.ts   # Database-per-tenant manager
│   │   │   │   ├── connection-pool.ts     # Connection pooling
│   │   │   │   ├── registry-db.ts         # Central registry connection
│   │   │   │   └── migrations/
│   │   │   │       ├── central/           # Central DB migrations
│   │   │   │       └── tenant/            # Tenant DB migrations
│   │   │   ├── middleware/
│   │   │   │   ├── tenant-resolver.ts     # Extract tenant from request
│   │   │   │   ├── auth.ts                # Authentication
│   │   │   │   └── db-injector.ts         # Inject tenant DB into context
│   │   │   └── services/
│   │   │       ├── tenant-provisioning.ts # Create new tenant DBs
│   │   │       └── tenant-registry.ts     # Manage tenant metadata
│   │   │
│   │   ├── modules/                       # Business modules
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.repository.ts     # Uses getTenantDB()
│   │   │   ├── pos/
│   │   │   │   ├── pos.controller.ts
│   │   │   │   ├── pos.service.ts
│   │   │   │   └── pos.repository.ts
│   │   │   ├── inventory/
│   │   │   ├── products/
│   │   │   ├── sales/
│   │   │   ├── payments/
│   │   │   └── reports/
│   │   │
│   │   ├── migration/                     # Migration tools
│   │   │   ├── export-tenant-data.ts      # Export from old DB
│   │   │   ├── import-tenant-data.ts      # Import to new DB
│   │   │   ├── validate-migration.ts      # Verify data integrity
│   │   │   └── rollback.ts                # Rollback mechanism
│   │   │
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   └── redis.config.ts
│   │   │
│   │   └── server.ts                      # Express/Fastify server
│   │
│   ├── docker/
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   │
│   └── package.json
│
├── docs/
│   └── architecture/
│       ├── DATABASE_PER_TENANT_MIGRATION.md (this file)
│       └── MIGRATION_EXECUTION_PLAN.md
│
└── .env.example
```

### 1.4 Tenant Resolution Strategy

**Option A: Subdomain-Based (Recommended for POS)**
```
https://shop1.yourpos.com → tenant: shop1
https://shop2.yourpos.com → tenant: shop2
```

**Option B: JWT-Based (Backup)**
```
Authorization: Bearer <JWT>
Decoded JWT: { userId: 123, tenantId: "shop1" }
```

**Implementation: Hybrid Approach**
- Use subdomain for shop-facing requests
- Use JWT for API/mobile apps
- Middleware resolves tenant from both sources

---

## 2. TENANT DATABASE MANAGER

### 2.1 Central Registry Schema

```sql
-- Central Registry Database: registry_db
-- This database stores tenant metadata and user accounts

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,           -- shop1, shop2, etc.
    business_name VARCHAR(255) NOT NULL,
    
    -- Database connection info
    db_name VARCHAR(100) UNIQUE NOT NULL,        -- tenant_shop1_db
    db_host VARCHAR(255) DEFAULT 'localhost',
    db_port INTEGER DEFAULT 5432,
    db_user VARCHAR(100),
    db_password_encrypted TEXT,                  -- Encrypted credentials
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',         -- active, suspended, migrating
    migration_status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed
    
    -- Metadata
    plan VARCHAR(50) DEFAULT 'basic',            -- basic, pro, enterprise
    max_users INTEGER DEFAULT 5,
    max_products INTEGER DEFAULT 1000,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    migrated_at TIMESTAMP,
    last_accessed_at TIMESTAMP,
    
    -- Billing
    subscription_status VARCHAR(50) DEFAULT 'trial',
    trial_ends_at TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_status (status)
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    
    -- Multi-tenant support
    default_tenant_id UUID REFERENCES tenants(id),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP,
    
    INDEX idx_email (email)
);

CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    role VARCHAR(50) NOT NULL,                   -- owner, admin, cashier, viewer
    permissions JSONB DEFAULT '{}',
    
    status VARCHAR(50) DEFAULT 'active',         -- active, suspended, invited
    invited_at TIMESTAMP,
    joined_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, user_id),
    INDEX idx_tenant_user (tenant_id, user_id)
);

CREATE TABLE migration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    
    phase VARCHAR(100) NOT NULL,                 -- export, transform, import, validate
    status VARCHAR(50) NOT NULL,                 -- started, completed, failed
    
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_details JSONB,
    
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    INDEX idx_tenant_migration (tenant_id, phase)
);
```

### 2.2 Tenant Database Schema (Template)

```sql
-- Template schema for each tenant database
-- NO tenant_id column needed!

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(100) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    
    -- Pricing
    cost_price DECIMAL(10,2),
    selling_price DECIMAL(10,2) NOT NULL,
    
    -- Inventory
    stock_quantity INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 10,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_sku (sku),
    INDEX idx_status (status)
);

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Customer
    customer_id UUID,
    customer_name VARCHAR(255),
    
    -- Financial
    subtotal DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    discount DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    
    -- Payment
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'completed',
    
    -- Staff
    cashier_id UUID,
    cashier_name VARCHAR(255),
    
    -- Timestamps
    sale_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_sale_date (sale_date),
    INDEX idx_customer (customer_id)
);

CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    
    product_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_sale (sale_id)
);

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    
    movement_type VARCHAR(50) NOT NULL,         -- sale, restock, adjustment, return
    quantity INTEGER NOT NULL,
    
    reference_id UUID,                          -- sale_id or purchase_id
    reference_type VARCHAR(50),
    
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_product (product_id),
    INDEX idx_created_at (created_at)
);

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Loyalty
    loyalty_points INTEGER DEFAULT 0,
    total_purchases DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_phone (phone),
    INDEX idx_email (email)
);

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,                      -- References central users table
    
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    
    status VARCHAR(50) DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_user (user_id)
);
```

### 2.3 Tenant Database Manager Implementation


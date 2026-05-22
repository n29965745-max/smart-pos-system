# Migration Execution Plan: Shared DB → Database-Per-Tenant

**Zero Downtime Migration Strategy**  
**Production-Ready POS System**

---

## OVERVIEW

This plan ensures safe migration from shared database (tenant_id-based) to database-per-tenant architecture with:

- ✅ Zero downtime
- ✅ Gradual tenant-by-tenant migration
- ✅ Rollback capability at any stage
- ✅ Data integrity validation
- ✅ No financial transaction loss

---

## PHASE 1: PREPARATION (Week 1)

### 1.1 Setup New Infrastructure

```bash
# 1. Create new backend folder structure
cd ~/Desktop/smart-pos-system
mkdir -p backend-new/src/{core,modules,migration}

# 2. Install dependencies
cd backend-new
npm init -y
npm install express pg ioredis jsonwebtoken bcrypt
npm install -D @types/node @types/express @types/pg typescript ts-node

# 3. Setup TypeScript
npx tsc --init

# 4. Create environment file
cp .env.example .env
```

**Environment Variables (.env):**

```bash
# Central Registry Database
REGISTRY_DB_HOST=localhost
REGISTRY_DB_PORT=5432
REGISTRY_DB_NAME=registry_db
REGISTRY_DB_USER=postgres
REGISTRY_DB_PASSWORD=your_password

# Old Shared Database (for migration)
OLD_DB_HOST=localhost
OLD_DB_PORT=5432
OLD_DB_NAME=smart_pos_shared
OLD_DB_USER=postgres
OLD_DB_PASSWORD=your_password

# PostgreSQL Admin (for creating tenant DBs)
DB_ADMIN_USER=postgres
DB_ADMIN_PASSWORD=your_admin_password

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

# Export/Import
EXPORT_DIR=./exports
```

### 1.2 Create Central Registry Database

```sql
-- Run this in PostgreSQL
CREATE DATABASE registry_db;

\c registry_db

-- Run the schema from tenant-db-manager.ts (Section 2.1)
-- Creates: tenants, users, tenant_users, migration_logs tables
```

### 1.3 Deploy New Backend (Parallel to Old System)

```bash
# Build
npm run build

# Start on different port (3001)
npm start

# Old system continues on port 3000
```

---

## PHASE 2: PILOT MIGRATION (Week 2)

### 2.1 Select Pilot Tenant

Choose a small, non-critical tenant for testing:

```sql
-- Find suitable pilot tenant
SELECT id, slug, business_name, 
       (SELECT COUNT(*) FROM products WHERE tenant_id = tenants.id) as product_count,
       (SELECT COUNT(*) FROM sales WHERE tenant_id = tenants.id) as sales_count
FROM tenants
WHERE status = 'active'
ORDER BY product_count ASC
LIMIT 10;
```

### 2.2 Export Pilot Tenant Data

```bash
# Export single tenant
export OLD_DB_HOST=localhost
export OLD_DB_NAME=smart_pos_shared
export OLD_DB_USER=postgres
export OLD_DB_PASSWORD=your_password
export EXPORT_DIR=./exports

npm run export-tenant <pilot-tenant-id>

# Verify export
ls -lh exports/<pilot-tenant-slug>/
cat exports/<pilot-tenant-slug>/_metadata.json
```

### 2.3 Provision New Tenant Database

```typescript
// Run provisioning script
import { getTenantDBManager } from './core/database/tenant-db-manager';

const dbManager = getTenantDBManager();

await dbManager.provisionTenant({
  slug: 'pilot-shop',
  businessName: 'Pilot Shop',
  ownerEmail: 'owner@pilotshop.com',
  plan: 'basic',
});
```

### 2.4 Import Data

```bash
# Import tenant data
export TENANT_DB_PASSWORD=<generated_password>

npm run import-tenant pilot-shop

# Validate import
npm run import-tenant pilot-shop validate
```

### 2.5 Parallel Testing

```bash
# Test old system
curl https://pilot-shop.yourpos.com/api/products
# → Routes to old system (port 3000)

# Test new system
curl https://pilot-shop.yourpos.com:3001/api/products
# → Routes to new system (port 3001)

# Compare responses
diff old_response.json new_response.json
```

### 2.6 Switch Pilot Tenant

```nginx
# Update Nginx config
upstream backend {
    # Route pilot-shop to new backend
    server localhost:3001 if ($host = "pilot-shop.yourpos.com");
    
    # All others to old backend
    server localhost:3000;
}
```

### 2.7 Monitor Pilot Tenant (1 Week)

```bash
# Monitor logs
tail -f backend-new/logs/pilot-shop.log

# Check error rates
grep ERROR backend-new/logs/pilot-shop.log | wc -l

# Monitor database connections
psql -d tenant_pilot_shop_db -c "SELECT count(*) FROM pg_stat_activity;"

# Check sales transactions
psql -d tenant_pilot_shop_db -c "SELECT COUNT(*), SUM(total) FROM sales WHERE sale_date >= NOW() - INTERVAL '1 day';"
```

---

## PHASE 3: BATCH MIGRATION (Weeks 3-6)

### 3.1 Migration Batches

Migrate tenants in batches based on size:

**Batch 1: Small Tenants (Week 3)**
- < 100 products
- < 500 sales
- Low risk

**Batch 2: Medium Tenants (Week 4-5)**
- 100-1000 products
- 500-5000 sales
- Moderate risk

**Batch 3: Large Tenants (Week 6)**
- > 1000 products
- > 5000 sales
- High risk - migrate individually

### 3.2 Automated Batch Migration Script

```typescript
// migrate-batch.ts
import { TenantDataExporter } from './migration/export-tenant-data';
import { TenantDataImporter } from './migration/import-tenant-data';
import { getTenantDBManager } from './core/database/tenant-db-manager';

async function migrateBatch(tenantIds: string[]) {
  const results = [];
  
  for (const tenantId of tenantIds) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Migrating tenant: ${tenantId}`);
    console.log('='.repeat(60));
    
    try {
      // 1. Export
      const exporter = new TenantDataExporter(oldDBConfig, './exports');
      const exportResult = await exporter.exportTenant(tenantId);
      
      if (!exportResult.success) {
        throw new Error('Export failed');
      }
      
      // 2. Provision
      const dbManager = getTenantDBManager();
      const tenantConfig = await dbManager.provisionTenant({
        slug: exportResult.tenantSlug,
        businessName: exportResult.tenantSlug,
        ownerEmail: `owner@${exportResult.tenantSlug}.com`,
      });
      
      // 3. Import
      const importer = new TenantDataImporter(
        {
          database: tenantConfig.dbName,
          user: tenantConfig.dbUser,
          password: tenantConfig.dbPassword,
        },
        './exports'
      );
      
      const importResult = await importer.importTenant(exportResult.tenantSlug);
      
      if (!importResult.success) {
        throw new Error('Import failed');
      }
      
      // 4. Validate
      const validation = await importer.validateImport(exportResult.tenantSlug);
      
      if (!validation.valid) {
        throw new Error('Validation failed');
      }
      
      // 5. Mark as migrated
      await markTenantMigrated(tenantId);
      
      results.push({
        tenantId,
        slug: exportResult.tenantSlug,
        status: 'success',
      });
      
      console.log(`✅ Migration completed for ${exportResult.tenantSlug}`);
      
    } catch (error) {
      console.error(`❌ Migration failed for ${tenantId}:`, error);
      
      results.push({
        tenantId,
        status: 'failed',
        error: error.message,
      });
      
      // Continue with next tenant
    }
    
    // Delay between migrations
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  return results;
}

// Usage
const batch1 = ['tenant-1-id', 'tenant-2-id', 'tenant-3-id'];
migrateBatch(batch1);
```

### 3.3 Gradual Traffic Switch

```nginx
# Nginx config - gradually route traffic to new backend

# Week 3: 10% to new backend
upstream backend {
    server localhost:3001 weight=1;  # New
    server localhost:3000 weight=9;  # Old
}

# Week 4: 50% to new backend
upstream backend {
    server localhost:3001 weight=5;  # New
    server localhost:3000 weight=5;  # Old
}

# Week 5: 90% to new backend
upstream backend {
    server localhost:3001 weight=9;  # New
    server localhost:3000 weight=1;  # Old
}

# Week 6: 100% to new backend
upstream backend {
    server localhost:3001;  # New only
}
```

---

## PHASE 4: VALIDATION & MONITORING (Week 7)

### 4.1 Data Integrity Checks

```sql
-- Compare record counts between old and new systems

-- Old system (shared DB)
SELECT 
    tenant_id,
    COUNT(*) as product_count
FROM products
GROUP BY tenant_id;

-- New system (aggregate from all tenant DBs)
-- Run this for each tenant DB
SELECT COUNT(*) as product_count FROM products;
```

### 4.2 Financial Reconciliation

```sql
-- Critical: Verify all sales transactions migrated

-- Old system
SELECT 
    tenant_id,
    COUNT(*) as sale_count,
    SUM(total) as total_revenue
FROM sales
GROUP BY tenant_id;

-- New system (per tenant DB)
SELECT 
    COUNT(*) as sale_count,
    SUM(total) as total_revenue
FROM sales;
```

### 4.3 Performance Monitoring

```bash
# Monitor query performance
psql -d tenant_shop1_db -c "
SELECT 
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"

# Monitor connection pool usage
# Check logs for pool exhaustion warnings
grep "pool exhausted" backend-new/logs/*.log
```

---

## PHASE 5: DECOMMISSION OLD SYSTEM (Week 8)

### 5.1 Final Verification

```bash
# Verify all tenants migrated
psql -d registry_db -c "
SELECT 
    COUNT(*) as total_tenants,
    SUM(CASE WHEN migration_status = 'completed' THEN 1 ELSE 0 END) as migrated,
    SUM(CASE WHEN migration_status = 'pending' THEN 1 ELSE 0 END) as pending
FROM tenants;
"
```

### 5.2 Backup Old Database

```bash
# Full backup before decommission
pg_dump -h localhost -U postgres smart_pos_shared > backup_old_system_$(date +%Y%m%d).sql

# Compress
gzip backup_old_system_*.sql

# Store securely (keep for 6 months minimum)
aws s3 cp backup_old_system_*.sql.gz s3://your-backup-bucket/
```

### 5.3 Read-Only Mode

```sql
-- Set old database to read-only
ALTER DATABASE smart_pos_shared SET default_transaction_read_only = on;

-- Keep for 30 days for emergency rollback
```

### 5.4 Update DNS/Load Balancer

```nginx
# Final Nginx config - new backend only
upstream backend {
    server localhost:3001;
}

# Remove old backend from config
# server localhost:3000;  # REMOVED
```

---

## ROLLBACK PROCEDURES

### Rollback During Migration (Per Tenant)

```bash
# If tenant migration fails:

# 1. Stop routing to new DB
# Update Nginx to route tenant back to old system

# 2. Drop new tenant DB
psql -U postgres -c "DROP DATABASE tenant_failed_shop_db;"

# 3. Remove tenant record from registry
psql -d registry_db -c "DELETE FROM tenants WHERE slug = 'failed-shop';"

# 4. Tenant continues on old system
# No data loss - old system still has all data
```

### Full Rollback (Emergency)

```bash
# If critical issues discovered:

# 1. Route ALL traffic back to old system
# Update Nginx upstream to point to port 3000

# 2. Mark all tenants as pending migration
psql -d registry_db -c "UPDATE tenants SET migration_status = 'pending';"

# 3. Investigate issues

# 4. Resume migration when fixed
```

---

## SUCCESS CRITERIA

### Before Declaring Migration Complete:

- [ ] All tenants migrated (100%)
- [ ] Zero data loss verified
- [ ] Financial reconciliation passed
- [ ] Performance metrics acceptable
- [ ] Error rates < 0.1%
- [ ] No customer complaints
- [ ] Old system in read-only mode
- [ ] Backups secured
- [ ] Documentation updated
- [ ] Team trained on new system

---

## MONITORING DASHBOARD

### Key Metrics to Track:

```typescript
// metrics.ts
export interface MigrationMetrics {
  totalTenants: number;
  migratedTenants: number;
  pendingTenants: number;
  failedTenants: number;
  
  totalRecords: number;
  migratedRecords: number;
  
  averageMigrationTime: number;
  errorRate: number;
  
  oldSystemQPS: number;  // Queries per second
  newSystemQPS: number;
  
  oldSystemLatency: number;
  newSystemLatency: number;
}
```

---

## TIMELINE SUMMARY

| Week | Phase | Activities | Risk |
|------|-------|------------|------|
| 1 | Preparation | Setup infrastructure, create registry DB | Low |
| 2 | Pilot | Migrate 1 tenant, monitor closely | Medium |
| 3 | Batch 1 | Migrate small tenants (< 100 products) | Low |
| 4-5 | Batch 2 | Migrate medium tenants (100-1000 products) | Medium |
| 6 | Batch 3 | Migrate large tenants (> 1000 products) | High |
| 7 | Validation | Data integrity checks, reconciliation | Low |
| 8 | Decommission | Backup and retire old system | Low |

**Total Duration: 8 weeks**  
**Downtime: 0 minutes**

---

## EMERGENCY CONTACTS

```
Migration Lead: [Name] - [Phone] - [Email]
Database Admin: [Name] - [Phone] - [Email]
DevOps Lead: [Name] - [Phone] - [Email]
CTO: [Name] - [Phone] - [Email]
```

---

**Document Version:** 1.0  
**Last Updated:** May 22, 2026  
**Status:** Ready for Execution

# 🚀 STAGING DEPLOYMENT GUIDE
**Smart POS System - Day 4 Afternoon**

**Date:** May 26, 2026  
**Environment:** Staging  
**Estimated Time:** 2 hours  

---

## 📋 OVERVIEW

This guide walks through deploying the Smart POS system to a staging environment for testing before production deployment.

**Staging Purpose:**
- Test payment reliability fixes
- Verify all features work
- Run load tests
- Identify any issues before production

---

## 🎯 PRE-DEPLOYMENT CHECKLIST

### **Code Changes:**
- [x] Payment reliability fixes implemented
- [x] Database schema updated
- [x] Tests created and passing
- [x] Logger utility added
- [x] Validation schemas updated

### **Documentation:**
- [x] Implementation guide created
- [x] API changes documented
- [x] Migration steps documented

### **Environment:**
- [ ] Staging VPS accessible
- [ ] Domain DNS configured
- [ ] SSL certificates ready
- [ ] Environment variables prepared

---

## 🖥️ STEP 1: PREPARE STAGING ENVIRONMENT

### **1.1: Set Up Staging Subdomain**

**DNS Configuration:**
```
Type    Name              Value              TTL
A       staging           123.45.67.89       300
A       staging-api       123.45.67.89       300
```

**Verify DNS:**
```bash
dig staging.yourpos.com +short
# Should return: 123.45.67.89
```

### **1.2: Prepare Environment Variables**

Create `.env.staging` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/smartpos_staging"

# JWT
JWT_SECRET="your-staging-jwt-secret-32-chars-min"
JWT_EXPIRES_IN="24h"

# Server
NODE_ENV="staging"
PORT=5000
LOG_LEVEL="debug"

# CORS
ALLOWED_ORIGINS="https://staging.yourpos.com,https://staging-api.yourpos.com"

# Sentry
SENTRY_DSN="your-staging-sentry-dsn"
SENTRY_ENVIRONMENT="staging"
SENTRY_TRACES_SAMPLE_RATE="1.0"

# Backup
BACKUP_DIR="/backups/staging"
RETENTION_DAYS="7"
```

---

## 🐳 STEP 2: DEPLOY WITH COOLIFY

### **2.1: Create Staging Project in Coolify**

1. **Login to Coolify:**
   ```
   http://your-vps-ip:8000
   ```

2. **Create New Project:**
   - Click "New Project"
   - Name: "Smart POS - Staging"
   - Description: "Staging environment for testing"

3. **Add Git Repository:**
   - Repository: `https://github.com/brunowachira001-coder/smart-pos-system`
   - Branch: `main` (or `staging` if you have one)
   - Build Pack: Docker

### **2.2: Configure Backend Service**

1. **Add New Service:**
   - Type: Application
   - Name: "smart-pos-backend-staging"
   - Port: 5000

2. **Build Configuration:**
   ```yaml
   Build Command: cd backend && npm install && npx prisma generate
   Start Command: cd backend && npm start
   Dockerfile: backend/Dockerfile
   ```

3. **Environment Variables:**
   - Add all variables from `.env.staging`
   - Mark sensitive variables as "Secret"

4. **Domain Configuration:**
   - Domain: `staging-api.yourpos.com`
   - Enable SSL: Yes (Let's Encrypt)
   - Force HTTPS: Yes

5. **Health Check:**
   - Path: `/health`
   - Interval: 30s
   - Timeout: 10s
   - Retries: 3

### **2.3: Configure Frontend Service**

1. **Add New Service:**
   - Type: Application
   - Name: "smart-pos-frontend-staging"
   - Port: 3000

2. **Build Configuration:**
   ```yaml
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Environment Variables:**
   ```bash
   NEXT_PUBLIC_API_URL="https://staging-api.yourpos.com"
   NEXT_PUBLIC_ENV="staging"
   ```

4. **Domain Configuration:**
   - Domain: `staging.yourpos.com`
   - Enable SSL: Yes
   - Force HTTPS: Yes

---

## 🗄️ STEP 3: DATABASE SETUP

### **3.1: Create Staging Database**

**Option A: Supabase (Recommended)**
```bash
# Create new Supabase project for staging
# Or use separate database in existing project
```

**Option B: Self-Hosted PostgreSQL**
```bash
# SSH into VPS
ssh deploy@your-vps-ip

# Create staging database
sudo -u postgres psql
CREATE DATABASE smartpos_staging;
CREATE USER smartpos_staging WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE smartpos_staging TO smartpos_staging;
\q
```

### **3.2: Run Database Migrations**

```bash
# SSH into VPS or use Coolify terminal
cd /path/to/smart-pos-system/backend

# Set DATABASE_URL
export DATABASE_URL="your-staging-database-url"

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Verify migrations
npx prisma migrate status
```

### **3.3: Seed Test Data (Optional)**

```bash
# Run seed script
npx prisma db seed

# Or manually create test data
node scripts/seed-staging.js
```

---

## 🚀 STEP 4: DEPLOY SERVICES

### **4.1: Deploy Backend**

1. **In Coolify Dashboard:**
   - Go to "smart-pos-backend-staging"
   - Click "Deploy"
   - Wait for build to complete

2. **Monitor Deployment:**
   - Watch build logs
   - Check for errors
   - Verify health check passes

3. **Verify Deployment:**
   ```bash
   # Test health endpoint
   curl https://staging-api.yourpos.com/health
   
   # Expected response:
   {
     "status": "ok",
     "timestamp": "2026-05-26T...",
     "database": "connected",
     "memory": { "used": "...", "total": "..." }
   }
   ```

### **4.2: Deploy Frontend**

1. **In Coolify Dashboard:**
   - Go to "smart-pos-frontend-staging"
   - Click "Deploy"
   - Wait for build to complete

2. **Verify Deployment:**
   ```bash
   # Test frontend
   curl https://staging.yourpos.com
   
   # Should return HTML
   ```

---

## 🧪 STEP 5: SMOKE TESTS

### **5.1: Backend API Tests**

```bash
# Set variables
STAGING_API="https://staging-api.yourpos.com"
TOKEN="your-test-token"

# Test health
curl $STAGING_API/health

# Test authentication
curl -X POST $STAGING_API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'

# Test products
curl $STAGING_API/api/products \
  -H "Authorization: Bearer $TOKEN"

# Test transaction creation (with idempotency)
curl -X POST $STAGING_API/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "user-id",
    "branchId": "branch-id",
    "items": [
      {
        "productId": "product-id",
        "quantity": 1,
        "unitPrice": 100
      }
    ],
    "paymentMethod": "CASH",
    "idempotencyKey": "test-staging-001"
  }'

# Test idempotency (send same request again)
# Should return same transaction

# Test insufficient stock
curl -X POST $STAGING_API/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "user-id",
    "branchId": "branch-id",
    "items": [
      {
        "productId": "product-id",
        "quantity": 1000,
        "unitPrice": 100
      }
    ],
    "paymentMethod": "CASH"
  }'
# Should return 400 error
```

### **5.2: Frontend Tests**

1. **Open Browser:**
   ```
   https://staging.yourpos.com
   ```

2. **Test User Flows:**
   - [ ] Login page loads
   - [ ] Can login with test credentials
   - [ ] Dashboard displays
   - [ ] Products page loads
   - [ ] Can view product details
   - [ ] Can add product to cart
   - [ ] Can complete checkout
   - [ ] Transaction appears in history

---

## 📊 STEP 6: COMPREHENSIVE API TESTING

### **6.1: Authentication Tests**

```bash
# Test login
# Test logout
# Test token expiry
# Test invalid credentials
# Test rate limiting (5 attempts)
```

### **6.2: Transaction Tests**

```bash
# Test transaction creation
# Test idempotency
# Test insufficient stock
# Test concurrent transactions
# Test refund
# Test double refund prevention
```

### **6.3: Multi-Tenant Tests**

```bash
# Test tenant isolation
# Test cross-tenant access (should fail)
# Test RLS policies
```

### **6.4: Rate Limiting Tests**

```bash
# Test global rate limit (100 req/15min)
# Test auth rate limit (5 req/15min)
```

---

## 🔥 STEP 7: LOAD TESTING

### **7.1: Install Load Testing Tool**

```bash
# Install Artillery
npm install -g artillery

# Or install k6
brew install k6  # macOS
# or download from https://k6.io
```

### **7.2: Create Load Test Script**

**artillery-config.yml:**
```yaml
config:
  target: "https://staging-api.yourpos.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Peak load"
  variables:
    token: "your-test-token"

scenarios:
  - name: "Transaction flow"
    flow:
      - get:
          url: "/api/products"
          headers:
            Authorization: "Bearer {{ token }}"
      - post:
          url: "/api/transactions"
          headers:
            Authorization: "Bearer {{ token }}"
            Content-Type: "application/json"
          json:
            userId: "test-user"
            branchId: "test-branch"
            items:
              - productId: "test-product"
                quantity: 1
                unitPrice: 100
            paymentMethod: "CASH"
            idempotencyKey: "load-test-{{ $randomString() }}"
```

### **7.3: Run Load Tests**

```bash
# Run Artillery test
artillery run artillery-config.yml

# Monitor results
# - Response times (p95, p99)
# - Error rate
# - Throughput (requests/sec)
```

### **7.4: Monitor During Load Test**

```bash
# SSH into VPS
ssh deploy@your-vps-ip

# Monitor resources
htop

# Monitor Docker containers
docker stats

# Check logs
docker logs -f smart-pos-backend-staging

# Monitor database connections
# (in Supabase dashboard or psql)
```

---

## 📈 STEP 8: PERFORMANCE BENCHMARKS

### **Target Metrics:**

| Metric | Target | Acceptable |
|--------|--------|------------|
| **API Response Time (p95)** | < 500ms | < 1000ms |
| **API Response Time (p99)** | < 1000ms | < 2000ms |
| **Database Query Time (p95)** | < 100ms | < 200ms |
| **Concurrent Users** | 200+ | 100+ |
| **Transactions/Second** | 50+ | 25+ |
| **Error Rate** | < 0.1% | < 1% |
| **Memory Usage** | < 4GB | < 6GB |
| **CPU Usage** | < 70% | < 90% |

### **Actual Results:**
```
# Fill in after load testing
API Response Time (p95): ___ms
API Response Time (p99): ___ms
Concurrent Users Supported: ___
Transactions/Second: ___
Error Rate: ___%
Memory Usage: ___GB
CPU Usage: ___%
```

---

## ✅ STEP 9: VALIDATION CHECKLIST

### **Deployment:**
- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] SSL certificates active
- [ ] Health checks passing
- [ ] Logs accessible

### **Functionality:**
- [ ] Authentication works
- [ ] Products CRUD works
- [ ] Customers CRUD works
- [ ] Transactions work (with fixes)
- [ ] Idempotency works
- [ ] Refunds work
- [ ] Inventory updates correctly
- [ ] Multi-tenant isolation works

### **Performance:**
- [ ] Response times acceptable
- [ ] Load test passed
- [ ] No memory leaks
- [ ] Database connections stable

### **Security:**
- [ ] Rate limiting works
- [ ] CORS configured correctly
- [ ] Security headers present
- [ ] Tenant isolation verified

### **Monitoring:**
- [ ] Sentry receiving errors
- [ ] Logs being written
- [ ] Health checks monitored

---

## 🚨 TROUBLESHOOTING

### **Issue: Deployment Failed**

```bash
# Check Coolify logs
docker logs coolify

# Check application logs
docker logs smart-pos-backend-staging

# Check build logs in Coolify dashboard
```

### **Issue: Database Connection Failed**

```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test connection
npx prisma db pull

# Check database is accessible
psql $DATABASE_URL
```

### **Issue: SSL Certificate Failed**

```bash
# Check DNS propagation
dig staging-api.yourpos.com +short

# Check port 80 is open (required for Let's Encrypt)
sudo ufw status | grep 80

# Retry SSL in Coolify
# Or manually with certbot
```

### **Issue: High Response Times**

```bash
# Check database query performance
# Add indexes if needed

# Check memory usage
free -h

# Check CPU usage
htop

# Optimize Prisma queries
# Add connection pooling
```

---

## 📊 STEP 10: STAGING REPORT

### **Deployment Summary:**
- Deployment Date: ___
- Deployment Time: ___ minutes
- Issues Encountered: ___
- Issues Resolved: ___

### **Test Results:**
- Smoke Tests: PASS / FAIL
- API Tests: PASS / FAIL
- Load Tests: PASS / FAIL
- Performance: PASS / FAIL

### **Blockers for Production:**
- [ ] None
- [ ] List any blockers found

### **Recommendations:**
- List any recommendations before production

---

## 🎯 NEXT STEPS

### **If All Tests Pass:**
1. ✅ Document any issues found and resolved
2. ✅ Update production deployment plan
3. ✅ Prepare for Day 5 production deployment
4. ✅ Schedule production deployment window

### **If Tests Fail:**
1. ❌ Document failures
2. ❌ Fix issues
3. ❌ Re-deploy to staging
4. ❌ Re-run tests
5. ❌ Delay production deployment if needed

---

## 📚 USEFUL COMMANDS

```bash
# Coolify
docker logs -f smart-pos-backend-staging
docker logs -f smart-pos-frontend-staging
docker restart smart-pos-backend-staging

# Database
npx prisma studio  # Open database GUI
npx prisma db push  # Push schema changes
npx prisma migrate status  # Check migrations

# Monitoring
curl https://staging-api.yourpos.com/health
htop
docker stats

# Logs
tail -f backend/combined.log
tail -f backend/error.log
```

---

**Deployment Time:** 2 hours  
**Difficulty:** Intermediate  
**Status:** Ready for execution

**Next:** Run all tests and verify staging is production-ready

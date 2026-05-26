# 🔧 PRODUCTION STABILIZATION PLAN
**Smart POS System - Deploy Option A (Current Backend)**

**Date:** May 26, 2026  
**Engineer:** Production Stabilization Team  
**Strategy:** Deploy `backend/` system with minimal risk  
**Timeline:** 5 days  

---

## 🎯 MISSION STATEMENT

Transform the existing 85% production-ready `backend/` system into a stable, secure, deployable production system capable of safely serving real SME businesses with POS, CRM, and M-Pesa transactions.

**NO architectural rewrites. NO database-per-tenant migration. ONLY production hardening.**

---

## 📊 CURRENT STATE ASSESSMENT

### ✅ **CONFIRMED WORKING (backend/)**
- Express.js server with 8 route modules
- Prisma ORM with PostgreSQL
- Supabase integration
- JWT authentication
- Winston logging
- CORS enabled
- 8 business logic modules:
  - `/api/auth` - Authentication
  - `/api/products` - Product management
  - `/api/customers` - Customer management
  - `/api/inventory` - Stock management
  - `/api/transactions` - POS transactions
  - `/api/analytics` - Reports
  - `/api/ai` - AI features
  - `/api/audit` - Audit logs

### ❌ **DEPLOYMENT BLOCKERS IDENTIFIED**

#### **BLOCKER #1: Docker Configuration Mismatch** 🔴 CRITICAL
**File:** `docker-compose.yml` line 113  
**Issue:** Points to `./backend-new` (incomplete system)  
**Impact:** Deployment will fail - wrong backend will be built  
**Fix Required:** Change to `./backend`

#### **BLOCKER #2: GitHub Actions Mismatch** 🔴 CRITICAL
**File:** `.github/workflows/deploy.yml` lines 52, 82  
**Issue:** References `backend-new/` for tests and builds  
**Impact:** CI/CD pipeline will fail  
**Fix Required:** Update all references to `backend/`

#### **BLOCKER #3: No Rate Limiting** 🔴 CRITICAL
**File:** `backend/src/server.js`  
**Issue:** No DDoS protection  
**Impact:** System vulnerable to abuse  
**Fix Required:** Add `express-rate-limit` middleware

#### **BLOCKER #4: No Backup Automation** 🔴 CRITICAL
**File:** Missing `scripts/backup.sh`  
**Issue:** No automated database backups  
**Impact:** Data loss risk  
**Fix Required:** Create backup script + cron job

#### **BLOCKER #5: No Error Monitoring** 🔴 CRITICAL
**File:** `backend/src/server.js`  
**Issue:** No Sentry integration  
**Impact:** Cannot debug production errors  
**Fix Required:** Add Sentry SDK

#### **BLOCKER #6: Secrets in .env Files** 🟡 HIGH
**Files:** `backend/.env`, `backend/.env.local`  
**Issue:** Real credentials committed  
**Impact:** Security risk if leaked  
**Fix Required:** Verify `.gitignore`, use environment variables

---

## 🚀 5-DAY PRODUCTION HARDENING PLAN

### **DAY 1: CRITICAL FIXES & DOCKER CLEANUP**

#### **Task 1.1: Fix Docker Configuration** ⏱️ 30 min
**Priority:** CRITICAL  
**Risk:** HIGH if not fixed

**Actions:**
1. Update `docker-compose.yml` backend service
2. Create `backend/Dockerfile` (currently missing)
3. Test Docker build locally
4. Verify all services start correctly

**Files to Modify:**
- `docker-compose.yml` (line 113)
- Create `backend/Dockerfile`

#### **Task 1.2: Fix GitHub Actions CI/CD** ⏱️ 30 min
**Priority:** CRITICAL  
**Risk:** HIGH if not fixed

**Actions:**
1. Update `.github/workflows/deploy.yml`
2. Change all `backend-new/` references to `backend/`
3. Update test commands
4. Update build context

**Files to Modify:**
- `.github/workflows/deploy.yml`

#### **Task 1.3: Add Rate Limiting** ⏱️ 1 hour
**Priority:** CRITICAL  
**Risk:** MEDIUM - DDoS vulnerability

**Actions:**
1. Install `express-rate-limit`
2. Add global API rate limiter (100 req/15min)
3. Add strict auth rate limiter (5 req/15min)
4. Test rate limiting locally

**Files to Modify:**
- `backend/package.json`
- `backend/src/server.js`

#### **Task 1.4: Add Security Headers** ⏱️ 30 min
**Priority:** HIGH  
**Risk:** MEDIUM - Security vulnerabilities

**Actions:**
1. Install `helmet`
2. Add security headers middleware
3. Configure CORS properly
4. Add request size limits

**Files to Modify:**
- `backend/package.json`
- `backend/src/server.js`

**Day 1 Deliverables:**
- ✅ Docker builds correctly
- ✅ CI/CD pipeline fixed
- ✅ Rate limiting active
- ✅ Security headers added

---

### **DAY 2: MONITORING & BACKUPS**

#### **Task 2.1: Add Sentry Error Monitoring** ⏱️ 1 hour
**Priority:** CRITICAL  
**Risk:** HIGH - Cannot debug production

**Actions:**
1. Create Sentry account (free tier)
2. Install `@sentry/node`
3. Add Sentry initialization
4. Add error handler middleware
5. Test error reporting

**Files to Modify:**
- `backend/package.json`
- `backend/src/server.js`
- `backend/.env.example`

#### **Task 2.2: Implement Backup Automation** ⏱️ 2 hours
**Priority:** CRITICAL  
**Risk:** HIGH - Data loss

**Actions:**
1. Create `scripts/backup.sh`
2. Add PostgreSQL dump logic
3. Add compression
4. Add retention policy (30 days)
5. Test backup/restore locally
6. Document restore procedure

**Files to Create:**
- `scripts/backup.sh`
- `docs/production/BACKUP_RESTORE_GUIDE.md`

#### **Task 2.3: Add Health Check Endpoints** ⏱️ 1 hour
**Priority:** HIGH  
**Risk:** MEDIUM - Cannot monitor uptime

**Actions:**
1. Enhance `/health` endpoint
2. Add database connectivity check
3. Add Redis connectivity check (if used)
4. Add memory/CPU metrics
5. Test health checks

**Files to Modify:**
- `backend/src/server.js`

#### **Task 2.4: Structured Logging** ⏱️ 1 hour
**Priority:** MEDIUM  
**Risk:** LOW - Harder debugging

**Actions:**
1. Verify Winston configuration
2. Add request ID tracking
3. Add tenant ID to all logs
4. Add performance timing logs
5. Configure log rotation

**Files to Modify:**
- `backend/src/server.js`
- `backend/src/middleware/` (if exists)

**Day 2 Deliverables:**
- ✅ Sentry monitoring active
- ✅ Automated backups working
- ✅ Health checks functional
- ✅ Structured logging implemented

---

### **DAY 3: SECURITY HARDENING & VPS SETUP**

#### **Task 3.1: Audit Environment Variables** ⏱️ 1 hour
**Priority:** HIGH  
**Risk:** HIGH - Credential exposure

**Actions:**
1. Verify `.gitignore` excludes `.env*`
2. Check git history for committed secrets
3. Rotate any exposed credentials
4. Document all required env vars
5. Create `.env.production.example`

**Files to Check:**
- `.gitignore`
- `backend/.env`
- `backend/.env.local`
- Git history

#### **Task 3.2: Verify Tenant Isolation** ⏱️ 2 hours
**Priority:** CRITICAL  
**Risk:** CRITICAL - Data leakage

**Actions:**
1. Review `lib/secure-route.ts`
2. Verify RLS policies in Supabase
3. Test cross-tenant access attempts
4. Verify all API routes use `secureRoute`
5. Document tenant isolation strategy

**Files to Review:**
- `lib/secure-route.ts`
- `pages/api/**/*.ts`
- Supabase RLS policies

#### **Task 3.3: Order & Configure Contabo VPS** ⏱️ 2 hours
**Priority:** HIGH  
**Risk:** MEDIUM - Deployment delay

**Actions:**
1. Order Contabo VPS (8GB RAM, 4 vCPU)
2. Install Ubuntu 24.04
3. Configure SSH keys
4. Set up firewall (UFW)
5. Install Docker & Docker Compose
6. Install Coolify

**Deliverables:**
- VPS accessible via SSH
- Docker installed
- Coolify running

#### **Task 3.4: SSL & Domain Setup** ⏱️ 1 hour
**Priority:** HIGH  
**Risk:** MEDIUM - No HTTPS

**Actions:**
1. Point domain DNS to VPS IP
2. Configure Coolify SSL (Let's Encrypt)
3. Verify HTTPS works
4. Set up www redirect

**Day 3 Deliverables:**
- ✅ Secrets secured
- ✅ Tenant isolation verified
- ✅ VPS ready
- ✅ SSL configured

---

### **DAY 4: STAGING DEPLOYMENT & TESTING**

#### **Task 4.1: Deploy to Staging** ⏱️ 2 hours
**Priority:** CRITICAL  
**Risk:** HIGH - Production deployment blocker

**Actions:**
1. Create staging environment in Coolify
2. Set staging environment variables
3. Deploy backend to staging
4. Deploy frontend to staging
5. Verify all services start

**Deliverables:**
- Staging environment live
- All services healthy

#### **Task 4.2: API Testing** ⏱️ 2 hours
**Priority:** CRITICAL  
**Risk:** HIGH - Broken features

**Test Scenarios:**
1. User login (admin, cashier)
2. Product CRUD operations
3. Customer CRUD operations
4. POS checkout flow
5. Inventory updates
6. Reports generation
7. Multi-tenant isolation
8. Rate limiting triggers

**Tools:**
- Postman/Insomnia
- curl scripts
- Manual testing

#### **Task 4.3: Load Testing** ⏱️ 1 hour
**Priority:** MEDIUM  
**Risk:** MEDIUM - Performance issues

**Actions:**
1. Install Artillery or k6
2. Test 100 concurrent users
3. Test checkout flow under load
4. Monitor database connections
5. Monitor memory usage
6. Document performance metrics

#### **Task 4.4: Backup/Restore Testing** ⏱️ 1 hour
**Priority:** CRITICAL  
**Risk:** HIGH - Data loss

**Actions:**
1. Run backup script manually
2. Verify backup file created
3. Test restore to new database
4. Verify data integrity
5. Document restore time

**Day 4 Deliverables:**
- ✅ Staging deployment successful
- ✅ All features tested
- ✅ Load testing passed
- ✅ Backup/restore verified

---

### **DAY 5: PRODUCTION DEPLOYMENT & MONITORING**

#### **Task 5.1: Pre-Deployment Checklist** ⏱️ 1 hour
**Priority:** CRITICAL  
**Risk:** CRITICAL - Deployment failure

**Checklist:**
- [ ] All critical blockers resolved
- [ ] Staging tests passed
- [ ] Backup automation working
- [ ] Monitoring configured
- [ ] SSL certificates valid
- [ ] Environment variables set
- [ ] Rollback plan documented
- [ ] Team notified

#### **Task 5.2: Production Deployment** ⏱️ 2 hours
**Priority:** CRITICAL  
**Risk:** CRITICAL - Business impact

**Actions:**
1. Create production environment in Coolify
2. Set production environment variables
3. Deploy backend to production
4. Deploy frontend to production
5. Run database migrations
6. Verify health checks
7. Test critical flows

#### **Task 5.3: Post-Deployment Monitoring** ⏱️ 4 hours
**Priority:** CRITICAL  
**Risk:** HIGH - Undetected issues

**Monitor for 4 hours:**
1. Sentry error rate
2. API response times
3. Database connections
4. Memory/CPU usage
5. User login success rate
6. Transaction success rate
7. Backup execution

#### **Task 5.4: Documentation & Handoff** ⏱️ 1 hour
**Priority:** HIGH  
**Risk:** LOW - Operational issues

**Actions:**
1. Document deployment process
2. Document rollback procedure
3. Document monitoring dashboards
4. Document incident response
5. Train team on production access

**Day 5 Deliverables:**
- ✅ Production deployment successful
- ✅ System monitored for 4 hours
- ✅ No critical errors
- ✅ Documentation complete

---

## 🔐 SECURITY HARDENING CHECKLIST

### **Authentication & Authorization**
- [ ] JWT tokens use strong secret (32+ chars)
- [ ] Token expiry set (24 hours max)
- [ ] Refresh token strategy exists
- [ ] Password hashing uses bcrypt
- [ ] Rate limiting on auth endpoints
- [ ] RBAC enforced (Admin, Cashier, Manager)
- [ ] Tenant isolation verified

### **API Security**
- [ ] Rate limiting (100 req/15min global)
- [ ] Auth rate limiting (5 req/15min)
- [ ] Request size limits (10MB max)
- [ ] CORS configured properly
- [ ] Security headers (Helmet)
- [ ] SQL injection protection (Prisma)
- [ ] XSS protection
- [ ] CSRF protection (if needed)

### **Data Security**
- [ ] Tenant isolation via RLS
- [ ] No cross-tenant queries possible
- [ ] Sensitive data encrypted at rest
- [ ] Secrets not in code
- [ ] Environment variables secured
- [ ] Database backups encrypted
- [ ] Audit logging enabled

### **Infrastructure Security**
- [ ] Firewall configured (UFW)
- [ ] SSH key-only access
- [ ] fail2ban installed
- [ ] SSL/TLS enabled
- [ ] Non-root user for services
- [ ] Docker containers non-root
- [ ] Secrets in environment variables

---

## 💰 PAYMENT RELIABILITY AUDIT

### **M-Pesa Integration** (If Implemented)
- [ ] Callback URL secured (HTTPS)
- [ ] Webhook signature verification
- [ ] Duplicate callback protection
- [ ] Transaction idempotency keys
- [ ] Timeout handling (30s max)
- [ ] Retry logic for failed callbacks
- [ ] Payment reconciliation process
- [ ] Failed transaction recovery
- [ ] Invoice consistency checks
- [ ] Race condition prevention

### **Transaction Integrity**
- [ ] Atomic database transactions
- [ ] Inventory deduction in transaction
- [ ] Payment confirmation before stock update
- [ ] Rollback on failure
- [ ] Concurrent checkout handling
- [ ] Overselling prevention
- [ ] Refund process safe
- [ ] Audit trail complete

---

## 📊 MONITORING & OBSERVABILITY

### **Error Monitoring (Sentry)**
- [ ] Sentry SDK installed
- [ ] Error tracking active
- [ ] Performance monitoring enabled
- [ ] User context attached
- [ ] Tenant context attached
- [ ] Alert notifications configured

### **Logging**
- [ ] Structured logging (Winston)
- [ ] Request ID tracking
- [ ] Tenant ID in all logs
- [ ] Performance timing logs
- [ ] Error logs captured
- [ ] Log rotation configured
- [ ] Log retention policy (30 days)

### **Health Checks**
- [ ] `/health` endpoint exists
- [ ] Database connectivity check
- [ ] Redis connectivity check (if used)
- [ ] Memory usage reported
- [ ] Uptime reported
- [ ] Docker healthcheck configured

### **Uptime Monitoring**
- [ ] UptimeRobot configured (free tier)
- [ ] Health check every 5 minutes
- [ ] Alert on downtime
- [ ] Alert email configured
- [ ] Status page (optional)

---

## 🔄 BACKUP & DISASTER RECOVERY

### **Backup Strategy**
- [ ] Automated daily backups
- [ ] Backup script tested
- [ ] Backups compressed (gzip)
- [ ] Retention policy (30 days)
- [ ] Backup verification
- [ ] Off-site storage (Cloudflare R2 / S3)

### **Restore Procedure**
- [ ] Restore script documented
- [ ] Restore tested successfully
- [ ] Restore time documented (< 15 min)
- [ ] Point-in-time recovery possible
- [ ] Team trained on restore

### **Rollback Strategy**
- [ ] Previous version tagged in Git
- [ ] Coolify rollback tested
- [ ] Database migration rollback plan
- [ ] Rollback time < 15 minutes
- [ ] Rollback procedure documented

---

## 🎯 SUCCESS CRITERIA

### **Deployment Success**
- ✅ System is live and accessible
- ✅ All core features work
- ✅ No critical errors for 24 hours
- ✅ Response times < 500ms (p95)
- ✅ Uptime > 99.9%
- ✅ Backups running successfully
- ✅ Monitoring shows healthy metrics
- ✅ Multi-tenant isolation verified

### **Performance Benchmarks**
- API response time (p95): < 500ms
- API response time (p99): < 1000ms
- Database query time (p95): < 100ms
- Concurrent users supported: 200+
- Transactions per second: 50+
- Memory usage: < 4GB
- CPU usage: < 70%

### **Security Validation**
- No cross-tenant data access
- Rate limiting blocks abuse
- Authentication works correctly
- Audit logs capture all actions
- Secrets not exposed
- SSL/TLS working
- Firewall configured

---

## 🚨 ROLLBACK TRIGGERS

**Immediately rollback if:**
- Critical errors > 10/minute
- API response time > 5 seconds
- Database connection failures
- Cross-tenant data leakage detected
- Payment processing failures
- System downtime > 5 minutes
- Memory leak detected (> 6GB)
- CPU usage > 90% sustained

---

## 📞 INCIDENT RESPONSE

### **Severity Levels**

**CRITICAL (P0):**
- System down
- Data loss
- Security breach
- Payment failures
- Cross-tenant data leakage

**HIGH (P1):**
- Feature broken
- Performance degradation
- Backup failures
- Monitoring down

**MEDIUM (P2):**
- Minor bugs
- UI issues
- Non-critical features broken

**LOW (P3):**
- Cosmetic issues
- Documentation errors

### **Response Times**
- P0: Immediate (< 15 min)
- P1: < 1 hour
- P2: < 4 hours
- P3: < 24 hours

---

## 📚 DOCUMENTATION DELIVERABLES

1. **PRODUCTION_DEPLOYMENT_GUIDE.md** - Step-by-step deployment
2. **BACKUP_RESTORE_GUIDE.md** - Backup and restore procedures
3. **MONITORING_GUIDE.md** - Monitoring dashboards and alerts
4. **INCIDENT_RESPONSE_GUIDE.md** - Incident handling procedures
5. **ROLLBACK_PROCEDURE.md** - Emergency rollback steps
6. **ENVIRONMENT_VARIABLES.md** - All required env vars
7. **API_DOCUMENTATION.md** - API endpoints and usage

---

## ✅ FINAL GO/NO-GO CHECKLIST

**Before production deployment, ALL must be checked:**

### **Critical Blockers (Must be 100%)**
- [ ] Docker configuration fixed
- [ ] GitHub Actions fixed
- [ ] Rate limiting implemented
- [ ] Backup automation working
- [ ] Error monitoring active
- [ ] Secrets secured
- [ ] Tenant isolation verified
- [ ] Staging tests passed

### **High Priority (Must be 90%)**
- [ ] Security headers added
- [ ] Health checks working
- [ ] Structured logging implemented
- [ ] SSL configured
- [ ] VPS hardened
- [ ] Load testing passed
- [ ] Documentation complete

### **Medium Priority (Should be 80%)**
- [ ] Performance optimized
- [ ] Uptime monitoring configured
- [ ] Rollback tested
- [ ] Team trained
- [ ] Incident response plan ready

---

## 🎓 LESSONS LEARNED (Post-Deployment)

**To be filled after deployment:**

### **What Went Well:**
- TBD

### **What Could Be Improved:**
- TBD

### **Action Items for Next Sprint:**
- TBD

---

**Status:** 🟡 **IN PROGRESS**  
**Next Review:** After Day 1 completion  
**Owner:** Production Stabilization Team

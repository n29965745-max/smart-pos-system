# 🚀 PRODUCTION DEPLOYMENT GUIDE
**Smart POS System - Day 5 Final Deployment**

**Date:** May 26, 2026  
**Environment:** Production  
**Estimated Time:** 4 hours  

---

## 📋 OVERVIEW

This is the final production deployment guide for the Smart POS system. This guide assumes staging tests have passed and the system is ready for production.

**Deployment Strategy:**
- Zero-downtime deployment
- Database migration with backup
- Rollback plan ready
- 4-hour monitoring period

---

## ⚠️ PRE-DEPLOYMENT CHECKLIST

### **Code Readiness:**
- [x] All Day 1-4 fixes implemented
- [x] Payment reliability fixes tested
- [x] Staging tests passed
- [x] Load tests passed
- [x] No critical bugs

### **Infrastructure:**
- [ ] Production VPS ready
- [ ] Domain DNS configured
- [ ] SSL certificates ready
- [ ] Firewall configured
- [ ] Backup system tested

### **Database:**
- [ ] Production database created
- [ ] Backup taken
- [ ] Migration tested in staging
- [ ] Rollback plan ready

### **Monitoring:**
- [ ] Sentry configured
- [ ] Health checks working
- [ ] Alerts configured
- [ ] Team notified

---

## 🎯 DEPLOYMENT PHASES

### **Phase 1: Pre-Deployment** (1 hour)
- Backup production database
- Verify rollback plan
- Team notification
- Final checklist review

### **Phase 2: Deployment** (1 hour)
- Deploy backend
- Deploy frontend
- Run migrations
- Verify health checks

### **Phase 3: Verification** (30 minutes)
- Smoke tests
- Critical flow tests
- Performance check

### **Phase 4: Monitoring** (2 hours)
- Error rate monitoring
- Response time monitoring
- Transaction monitoring
- User feedback

---

## 🗄️ PHASE 1: PRE-DEPLOYMENT

### **1.1: Backup Production Database**

```bash
# SSH into production VPS
ssh deploy@your-production-ip

# Navigate to project
cd /path/to/smart-pos-system

# Run backup script
./scripts/backup.sh

# Verify backup created
ls -lh /backups/
# Should see: smartpos_backup_YYYYMMDD_HHMMSS.sql.gz

# Test backup integrity
gunzip -t /backups/smartpos_backup_*.sql.gz
# Should output: OK
```

### **1.2: Create Rollback Point**

```bash
# Tag current production version
git tag -a v1.0.0-pre-deployment -m "Pre-deployment snapshot"
git push origin v1.0.0-pre-deployment

# Document current state
echo "Deployment started at $(date)" >> deployment.log
echo "Current commit: $(git rev-parse HEAD)" >> deployment.log
echo "Backup file: $(ls -t /backups/*.sql.gz | head -1)" >> deployment.log
```

### **1.3: Team Notification**

**Send to team:**
```
🚀 PRODUCTION DEPLOYMENT STARTING

Time: [Current Time]
Duration: ~2 hours
Expected Downtime: None (zero-downtime deployment)

What's being deployed:
- Payment reliability fixes (atomic transactions)
- Enhanced error handling
- Refund capability
- Security improvements

Monitoring: [Sentry Dashboard URL]
Status Page: [Status Page URL]

Team on standby:
- [Your Name] - Deployment Lead
- [Team Member] - Database
- [Team Member] - Frontend
- [Team Member] - Support

Rollback plan ready if needed.
```

### **1.4: Final Checklist Review**

```bash
# Verify all critical items
cat << EOF
CRITICAL CHECKLIST:
[ ] Backup completed and verified
[ ] Rollback plan documented
[ ] Team notified
[ ] Monitoring dashboards open
[ ] Support team ready
[ ] Database migration tested
[ ] Environment variables ready
[ ] SSL certificates valid
[ ] Health check endpoints working
EOF
```

---

## 🚀 PHASE 2: DEPLOYMENT

### **2.1: Deploy Backend**

**Using Coolify:**

1. **Login to Coolify:**
   ```
   https://your-vps-ip:8000
   ```

2. **Navigate to Production Project:**
   - Select "Smart POS - Production"
   - Go to "smart-pos-backend-production"

3. **Update Environment Variables:**
   ```bash
   # Ensure these are set
   DATABASE_URL=your-production-database-url
   JWT_SECRET=your-production-jwt-secret
   SENTRY_DSN=your-production-sentry-dsn
   SENTRY_ENVIRONMENT=production
   NODE_ENV=production
   ```

4. **Deploy:**
   - Click "Deploy"
   - Select branch: `main`
   - Wait for build to complete
   - Monitor build logs

5. **Run Database Migration:**
   ```bash
   # In Coolify terminal or SSH
   cd /path/to/smart-pos-system/backend
   
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate deploy
   
   # Verify migration
   npx prisma migrate status
   ```

6. **Verify Backend Health:**
   ```bash
   curl https://api.yourpos.com/health
   
   # Expected response:
   {
     "status": "ok",
     "timestamp": "2026-05-26T...",
     "database": "connected",
     "memory": { ... }
   }
   ```

### **2.2: Deploy Frontend**

1. **Navigate to Frontend Service:**
   - Go to "smart-pos-frontend-production"

2. **Update Environment Variables:**
   ```bash
   NEXT_PUBLIC_API_URL=https://api.yourpos.com
   NEXT_PUBLIC_ENV=production
   ```

3. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Monitor build logs

4. **Verify Frontend:**
   ```bash
   curl https://yourpos.com
   # Should return HTML
   ```

### **2.3: Verify SSL/HTTPS**

```bash
# Test SSL certificate
curl -I https://api.yourpos.com
# Should return: HTTP/2 200

curl -I https://yourpos.com
# Should return: HTTP/2 200

# Test SSL strength (optional)
# Visit: https://www.ssllabs.com/ssltest/
# Enter: api.yourpos.com
# Target grade: A or A+
```

---

## 🧪 PHASE 3: VERIFICATION

### **3.1: Smoke Tests**

```bash
# Set variables
PROD_API="https://api.yourpos.com"

# Test 1: Health check
curl $PROD_API/health
# Expected: {"status":"ok",...}

# Test 2: Authentication
curl -X POST $PROD_API/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'
# Expected: {"token":"...","user":{...}}

# Save token
TOKEN="your-token-from-above"

# Test 3: Products
curl $PROD_API/api/products \
  -H "Authorization: Bearer $TOKEN"
# Expected: {"data":[...],"pagination":{...}}

# Test 4: Transaction creation
curl -X POST $PROD_API/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "user-id",
    "branchId": "branch-id",
    "items": [{
      "productId": "product-id",
      "quantity": 1,
      "unitPrice": 100
    }],
    "paymentMethod": "CASH",
    "idempotencyKey": "prod-test-001"
  }'
# Expected: {"id":"...","total":116,...}

# Test 5: Idempotency (send same request)
# Should return same transaction

# Test 6: Insufficient stock
curl -X POST $PROD_API/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "user-id",
    "branchId": "branch-id",
    "items": [{
      "productId": "product-id",
      "quantity": 10000,
      "unitPrice": 100
    }],
    "paymentMethod": "CASH"
  }'
# Expected: 400 error with "Insufficient stock"
```

### **3.2: Critical Flow Tests**

**Test in Browser:**

1. **Login Flow:**
   - Go to https://yourpos.com
   - Click "Login"
   - Enter credentials
   - Verify dashboard loads

2. **POS Flow:**
   - Navigate to POS
   - Add products to cart
   - Complete checkout
   - Verify transaction created
   - Check inventory updated

3. **Reports Flow:**
   - Navigate to Reports
   - View daily sales
   - Verify data displays correctly

4. **Multi-Tenant Test:**
   - Login as different tenant
   - Verify only their data visible
   - Attempt cross-tenant access (should fail)

### **3.3: Performance Check**

```bash
# Test response times
time curl $PROD_API/api/products \
  -H "Authorization: Bearer $TOKEN"
# Target: < 500ms

# Test concurrent requests
for i in {1..10}; do
  curl $PROD_API/health &
done
wait
# All should succeed

# Check server resources
ssh deploy@your-production-ip
htop
# Memory: < 4GB
# CPU: < 70%
```

---

## 📊 PHASE 4: MONITORING (2 hours)

### **4.1: Set Up Monitoring Dashboards**

**Sentry Dashboard:**
- Open: https://sentry.io/organizations/your-org/projects/smart-pos/
- Monitor: Error rate, response times
- Set up: Real-time alerts

**Server Monitoring:**
```bash
# SSH into server
ssh deploy@your-production-ip

# Monitor in real-time
watch -n 5 'docker stats --no-stream'

# Monitor logs
docker logs -f smart-pos-backend-production --tail 100
```

**Database Monitoring:**
- Open Supabase dashboard
- Monitor: Connection count, query performance
- Check: No slow queries

### **4.2: Monitor Key Metrics**

**For 2 hours, track:**

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **Error Rate** | < 0.1% | ___ | ___ |
| **Response Time (p95)** | < 500ms | ___ | ___ |
| **Response Time (p99)** | < 1000ms | ___ | ___ |
| **Transaction Success Rate** | > 99.9% | ___ | ___ |
| **Memory Usage** | < 4GB | ___ | ___ |
| **CPU Usage** | < 70% | ___ | ___ |
| **Database Connections** | < 50 | ___ | ___ |

**Check every 15 minutes:**
```bash
# Error rate (from Sentry)
# Response times (from Sentry)
# Server resources
ssh deploy@your-production-ip 'free -h && uptime'

# Transaction count
curl $PROD_API/api/transactions/stats/branch-id \
  -H "Authorization: Bearer $TOKEN"
```

### **4.3: User Acceptance**

**Monitor user activity:**
- Number of logins
- Number of transactions
- Any support tickets
- User feedback

**Support team checklist:**
- [ ] No critical issues reported
- [ ] Users can login
- [ ] Transactions processing
- [ ] No data issues

---

## 🚨 ROLLBACK PROCEDURE

**If critical issues detected:**

### **Step 1: Assess Severity**

**CRITICAL (Rollback immediately):**
- System down
- Data loss
- Security breach
- Payment failures
- Cross-tenant data leakage

**HIGH (Fix or rollback within 1 hour):**
- Feature broken
- Performance degradation
- High error rate (> 5%)

**MEDIUM (Fix within 4 hours):**
- Minor bugs
- UI issues
- Non-critical features broken

### **Step 2: Execute Rollback**

```bash
# SSH into server
ssh deploy@your-production-ip

# Stop current services
docker stop smart-pos-backend-production
docker stop smart-pos-frontend-production

# Rollback to previous version
cd /path/to/smart-pos-system
git checkout v1.0.0-pre-deployment

# Rollback database
./scripts/restore.sh /backups/smartpos_backup_YYYYMMDD_HHMMSS.sql.gz

# Restart services
docker start smart-pos-backend-production
docker start smart-pos-frontend-production

# Verify health
curl https://api.yourpos.com/health
```

### **Step 3: Notify Team**

```
🚨 ROLLBACK EXECUTED

Time: [Current Time]
Reason: [Brief description]
Status: System restored to pre-deployment state

All transactions after [deployment time] may need review.
Team investigating issue.

ETA for fix: [Estimate]
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

### **Immediate (After 2 hours):**
- [ ] No critical errors in Sentry
- [ ] Response times acceptable
- [ ] Transaction success rate > 99.9%
- [ ] No user complaints
- [ ] Server resources stable
- [ ] Database connections stable

### **Within 24 hours:**
- [ ] Monitor error trends
- [ ] Review transaction logs
- [ ] Check inventory consistency
- [ ] Verify backup ran successfully
- [ ] Update documentation
- [ ] Team retrospective

### **Within 1 week:**
- [ ] Performance optimization if needed
- [ ] Address any minor issues
- [ ] User feedback review
- [ ] Plan next improvements

---

## 📊 DEPLOYMENT REPORT TEMPLATE

```markdown
# PRODUCTION DEPLOYMENT REPORT

**Date:** [Date]
**Time:** [Start Time] - [End Time]
**Duration:** [Duration]
**Deployed By:** [Your Name]

## Deployment Summary
- Backend Version: [Git commit hash]
- Frontend Version: [Git commit hash]
- Database Migrations: [Number] migrations applied
- Downtime: [None/Duration]

## Pre-Deployment
- [x] Backup completed: [Backup file name]
- [x] Team notified: [Time]
- [x] Rollback plan ready: Yes

## Deployment Steps
1. Backend deployed: [Time] - [Status]
2. Frontend deployed: [Time] - [Status]
3. Database migrated: [Time] - [Status]
4. Health checks: [Status]

## Verification
- Smoke tests: [PASS/FAIL]
- Critical flows: [PASS/FAIL]
- Performance: [PASS/FAIL]

## Monitoring (2 hours)
- Error rate: [X%]
- Response time (p95): [Xms]
- Transaction success rate: [X%]
- Memory usage: [XGB]
- CPU usage: [X%]

## Issues Encountered
- [None / List issues]

## Issues Resolved
- [None / List resolutions]

## Post-Deployment Actions
- [ ] Documentation updated
- [ ] Team notified of completion
- [ ] Monitoring continues
- [ ] Backup verified

## Conclusion
[Success / Partial Success / Rollback Required]

**Next Steps:**
- [List any follow-up actions]
```

---

## 🎯 SUCCESS CRITERIA

### **Deployment Successful If:**
- ✅ All services deployed without errors
- ✅ Health checks passing
- ✅ Smoke tests passed
- ✅ No critical errors for 2 hours
- ✅ Response times < 500ms (p95)
- ✅ Transaction success rate > 99.9%
- ✅ No user complaints
- ✅ Server resources stable

### **Deployment Failed If:**
- ❌ Services won't start
- ❌ Database migration failed
- ❌ Critical errors detected
- ❌ Response times > 2000ms
- ❌ Transaction failures > 1%
- ❌ Data inconsistencies
- ❌ Security issues

---

## 📚 USEFUL COMMANDS

```bash
# Health check
curl https://api.yourpos.com/health

# View logs
docker logs -f smart-pos-backend-production
docker logs -f smart-pos-frontend-production

# Server resources
htop
docker stats

# Database status
npx prisma migrate status

# Restart services
docker restart smart-pos-backend-production
docker restart smart-pos-frontend-production

# Rollback
git checkout v1.0.0-pre-deployment
./scripts/restore.sh /backups/backup_file.sql.gz
```

---

## 🎓 LESSONS LEARNED

**Document after deployment:**

### **What Went Well:**
- [To be filled]

### **What Could Be Improved:**
- [To be filled]

### **Action Items for Next Deployment:**
- [To be filled]

---

**Deployment Time:** 4 hours  
**Difficulty:** Advanced  
**Risk Level:** Medium (with rollback plan)  

**Status:** Ready for execution ✅

**Next:** Execute deployment and monitor for 2 hours

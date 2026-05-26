# 🔄 BACKUP & RESTORE GUIDE
**Smart POS System - Database Backup & Recovery**

**Last Updated:** May 26, 2026  
**Status:** ✅ **PRODUCTION READY**  

---

## 📋 OVERVIEW

This guide covers automated database backups, manual backups, and disaster recovery procedures for the Smart POS system.

---

## 🔐 BACKUP STRATEGY

### **Backup Schedule:**
- **Frequency:** Daily at 2:00 AM (server time)
- **Retention:** 30 days
- **Compression:** gzip
- **Location:** `/backups/` directory
- **Verification:** Automatic integrity check

### **Backup Types:**
1. **Automated Daily Backups** - Scheduled via cron
2. **Pre-Deployment Backups** - Before any deployment
3. **On-Demand Backups** - Manual when needed
4. **Pre-Restore Backups** - Automatic before restore

---

## 🚀 AUTOMATED BACKUP SETUP

### **1. Make Scripts Executable**
```bash
chmod +x smart-pos-system/scripts/backup.sh
chmod +x smart-pos-system/scripts/restore.sh
```

### **2. Set Environment Variables**
```bash
export DATABASE_URL="your_supabase_connection_string"
export BACKUP_DIR="/backups"
export RETENTION_DAYS="30"
```

### **3. Test Backup Manually**
```bash
cd smart-pos-system
./scripts/backup.sh
```

Expected output:
```
[2026-05-26 14:30:00] Starting backup process...
[2026-05-26 14:30:00] Backup directory: /backups
[2026-05-26 14:30:00] Retention period: 30 days
[2026-05-26 14:30:05] ✅ Database backup created: smart_pos_backup_20260526_143000.sql
[2026-05-26 14:30:10] ✅ Backup compressed: smart_pos_backup_20260526_143000.sql.gz
[2026-05-26 14:30:12] ✅ Backup integrity verified
[2026-05-26 14:30:12] ✅ Backup completed successfully!
```

### **4. Set Up Cron Job**
```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM)
0 2 * * * cd /path/to/smart-pos-system && ./scripts/backup.sh >> /var/log/pos-backup.log 2>&1
```

### **5. Verify Cron Job**
```bash
# List cron jobs
crontab -l

# Check cron logs
tail -f /var/log/pos-backup.log
```

---

## 💾 MANUAL BACKUP

### **Create Backup Now:**
```bash
cd smart-pos-system
./scripts/backup.sh
```

### **Create Backup with Custom Name:**
```bash
export BACKUP_DIR="/custom/path"
./scripts/backup.sh
```

### **Quick Backup (No Script):**
```bash
pg_dump "$DATABASE_URL" | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

---

## 🔄 RESTORE PROCEDURES

### **⚠️ CRITICAL: Read Before Restoring**

**Restoring will OVERWRITE the current database!**

Always:
1. ✅ Verify you have the correct backup file
2. ✅ Notify team before restoring
3. ✅ Put system in maintenance mode
4. ✅ Create pre-restore backup (automatic)
5. ✅ Test in staging first (if possible)

---

### **RESTORE PROCEDURE**

#### **Step 1: List Available Backups**
```bash
ls -lh /backups/smart_pos_backup_*.sql.gz
```

#### **Step 2: Verify Backup Integrity**
```bash
gunzip -t /backups/smart_pos_backup_20260526_020000.sql.gz
```

#### **Step 3: Run Restore Script**
```bash
cd smart-pos-system
./scripts/restore.sh /backups/smart_pos_backup_20260526_020000.sql.gz
```

#### **Step 4: Confirm Restore**
```
⚠️  WARNING: This will OVERWRITE the current database!
Backup file: /backups/smart_pos_backup_20260526_020000.sql.gz
Database: postgresql://...

Are you sure you want to continue? (type 'yes' to confirm): yes
```

#### **Step 5: Verify Application**
```bash
# Test health check
curl http://localhost:5000/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Check critical data
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM products;"
```

---

## 🚨 DISASTER RECOVERY SCENARIOS

### **Scenario 1: Accidental Data Deletion**

**Symptoms:** User reports missing data  
**Recovery Time:** 15-30 minutes  

**Steps:**
1. Identify when data was deleted
2. Find backup before deletion
3. Put system in maintenance mode
4. Restore from backup
5. Verify data is recovered
6. Resume normal operations

```bash
# Find backup before incident
ls -lt /backups/ | head -10

# Restore
./scripts/restore.sh /backups/smart_pos_backup_YYYYMMDD_HHMMSS.sql.gz
```

---

### **Scenario 2: Database Corruption**

**Symptoms:** Database errors, connection failures  
**Recovery Time:** 15-30 minutes  

**Steps:**
1. Confirm database is corrupted
2. Find latest valid backup
3. Restore from backup
4. Verify integrity
5. Resume operations

```bash
# Test database connectivity
psql "$DATABASE_URL" -c "SELECT 1"

# Restore latest backup
./scripts/restore.sh /backups/smart_pos_backup_$(ls -t /backups/ | head -1)
```

---

### **Scenario 3: Failed Migration**

**Symptoms:** Application errors after deployment  
**Recovery Time:** 10-15 minutes  

**Steps:**
1. Identify failed migration
2. Restore pre-deployment backup
3. Rollback application code
4. Investigate migration issue
5. Fix and redeploy

```bash
# Pre-deployment backups are named with deployment timestamp
./scripts/restore.sh /backups/pre_deploy_backup_YYYYMMDD_HHMMSS.sql.gz
```

---

### **Scenario 4: Complete System Failure**

**Symptoms:** Server down, data center outage  
**Recovery Time:** 1-2 hours  

**Steps:**
1. Provision new VPS
2. Install Docker + dependencies
3. Deploy application
4. Restore latest backup
5. Update DNS
6. Verify functionality

```bash
# On new server
git clone <repository>
cd smart-pos-system
docker-compose up -d

# Restore backup
./scripts/restore.sh /path/to/latest/backup.sql.gz
```

---

## 📊 BACKUP MONITORING

### **Check Backup Status:**
```bash
# List recent backups
ls -lht /backups/ | head -10

# Check backup log
tail -50 /backups/backup.log

# Verify latest backup
gunzip -t /backups/smart_pos_backup_$(ls -t /backups/ | head -1)
```

### **Backup Health Metrics:**
```bash
# Total backups
find /backups -name "smart_pos_backup_*.sql.gz" | wc -l

# Total backup size
du -sh /backups/

# Oldest backup
ls -t /backups/smart_pos_backup_*.sql.gz | tail -1

# Newest backup
ls -t /backups/smart_pos_backup_*.sql.gz | head -1
```

---

## 🔐 BACKUP SECURITY

### **Encryption (Optional):**
```bash
# Encrypt backup
gpg --symmetric --cipher-algo AES256 backup.sql.gz

# Decrypt backup
gpg --decrypt backup.sql.gz.gpg > backup.sql.gz
```

### **Access Control:**
```bash
# Restrict backup directory permissions
chmod 700 /backups
chown postgres:postgres /backups

# Restrict backup file permissions
chmod 600 /backups/*.sql.gz
```

---

## ☁️ CLOUD BACKUP (OPTIONAL)

### **Cloudflare R2 Setup:**
```bash
# Install AWS CLI (compatible with R2)
pip install awscli

# Configure R2
aws configure --profile r2
# Access Key: <your_r2_access_key>
# Secret Key: <your_r2_secret_key>
# Region: auto

# Upload backup
aws s3 cp /backups/backup.sql.gz \
  s3://your-bucket/backups/ \
  --endpoint-url https://<account_id>.r2.cloudflarestorage.com \
  --profile r2
```

### **Automated Cloud Upload:**
Uncomment the cloud upload section in `scripts/backup.sh`:
```bash
export CLOUDFLARE_R2_BUCKET="your-bucket"
export CLOUDFLARE_R2_ENDPOINT="https://<account_id>.r2.cloudflarestorage.com"
```

---

## 📋 BACKUP CHECKLIST

### **Daily (Automated):**
- [ ] Backup runs at 2 AM
- [ ] Backup completes successfully
- [ ] Backup is compressed
- [ ] Integrity verified
- [ ] Old backups cleaned up

### **Weekly (Manual):**
- [ ] Verify backup log
- [ ] Check backup sizes
- [ ] Test restore in staging
- [ ] Verify backup count (7+)

### **Monthly (Manual):**
- [ ] Full restore test
- [ ] Verify disaster recovery plan
- [ ] Update documentation
- [ ] Review retention policy

---

## 🎯 BACKUP SLA

### **Recovery Time Objective (RTO):**
- **Target:** 30 minutes
- **Maximum:** 1 hour

### **Recovery Point Objective (RPO):**
- **Target:** 24 hours (daily backups)
- **Maximum:** 24 hours

### **Backup Success Rate:**
- **Target:** 99.9%
- **Alert:** < 95%

---

## 🚨 TROUBLESHOOTING

### **Problem: Backup Script Fails**
```bash
# Check disk space
df -h /backups

# Check DATABASE_URL
echo $DATABASE_URL

# Check permissions
ls -la /backups

# Run with verbose logging
bash -x ./scripts/backup.sh
```

### **Problem: Restore Fails**
```bash
# Verify backup file
gunzip -t backup.sql.gz

# Check database connectivity
psql "$DATABASE_URL" -c "SELECT 1"

# Check restore log
cat /tmp/restore.log
```

### **Problem: Cron Job Not Running**
```bash
# Check cron service
systemctl status cron

# Check cron logs
grep CRON /var/log/syslog

# Test cron job manually
/bin/bash -c "cd /path/to/smart-pos-system && ./scripts/backup.sh"
```

---

## 📞 EMERGENCY CONTACTS

**Database Issues:**
- Primary: DevOps Team
- Secondary: Database Administrator

**Backup Issues:**
- Primary: System Administrator
- Secondary: DevOps Team

**Disaster Recovery:**
- Primary: Technical Lead
- Secondary: CTO

---

## 📚 RELATED DOCUMENTATION

- **PRODUCTION_STABILIZATION_PLAN.md** - Overall deployment plan
- **MONITORING_GUIDE.md** - Monitoring and alerts
- **INCIDENT_RESPONSE_GUIDE.md** - Incident handling

---

**Status:** ✅ **PRODUCTION READY**  
**Last Tested:** May 26, 2026  
**Next Review:** Monthly  
**Owner:** DevOps Team

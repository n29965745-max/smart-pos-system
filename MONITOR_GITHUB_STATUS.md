# 🔍 GitHub Status Monitor - Auto-Deploy Script

**Automatically monitors GitHub Actions status and triggers deployment when resolved.**

---

## 🚀 Quick Start

### **Run the Monitor:**

```bash
cd smart-pos-system
./scripts/monitor-github-status.sh
```

That's it! The script will:
1. ✅ Check GitHub status every 60 seconds
2. ✅ Detect when the incident is resolved
3. ✅ Automatically trigger deployment
4. ✅ Monitor the deployment progress
5. ✅ Alert you when complete

---

## 📊 What It Does

### **Monitoring Phase:**
```
[2026-05-26 11:00:00] Check #1/120
[2026-05-26 11:00:00] GitHub Status: minor
[2026-05-26 11:00:00] Actions Status: degraded_performance
[2026-05-26 11:00:00] ⚠️  GitHub incident detected - waiting for resolution...
[2026-05-26 11:00:00] Waiting 60s before next check...
```

### **Resolution Detected:**
```
[2026-05-26 11:30:00] Check #30/120
[2026-05-26 11:30:00] GitHub Status: none
[2026-05-26 11:30:00] Actions Status: operational
[2026-05-26 11:30:00] ✅ GitHub incident resolved!
[2026-05-26 11:30:00] Triggering deployment...
```

### **Deployment Phase:**
```
[2026-05-26 11:30:05] Deployment triggered successfully!
[2026-05-26 11:30:05] Monitoring workflow progress...
[2026-05-26 11:30:15] Workflow run ID: 26447500000
[2026-05-26 11:30:15] View at: https://github.com/.../actions/runs/26447500000

✓ Run Tests in 2m 30s
✓ Build Docker Images in 5m 15s
✓ Deploy to Coolify in 3m 45s
✓ Send Notification in 5s

[2026-05-26 11:42:00] ✅ ==========================================
[2026-05-26 11:42:00] ✅ DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉
[2026-05-26 11:42:00] ✅ ==========================================
```

---

## ⚙️ Configuration

Edit the script to customize:

```bash
# Check interval (seconds)
CHECK_INTERVAL=60

# Maximum monitoring time (checks)
MAX_CHECKS=120  # 2 hours total
```

---

## 📝 Log File

All activity is logged to:
```
smart-pos-system/github-status-monitor.log
```

View the log:
```bash
tail -f github-status-monitor.log
```

---

## 🔔 Desktop Notifications

If you have `notify-send` installed (Linux), you'll get desktop notifications:
- ✅ When incident is resolved
- ✅ When deployment completes
- ❌ If deployment fails

---

## 🛑 Stop Monitoring

Press `Ctrl+C` to stop the script at any time.

---

## 📊 Exit Codes

| Code | Meaning |
|------|---------|
| 0 | ✅ Deployment completed successfully |
| 1 | ❌ Deployment failed |
| 2 | ⏰ Maximum monitoring time reached |

---

## 🔧 Manual Trigger (If Needed)

If you want to trigger deployment manually instead:

```bash
cd smart-pos-system

# Trigger workflow
git commit --allow-empty -m "chore: Manual deployment trigger"
git push origin main

# Watch progress
gh run watch
```

---

## 📚 What Happens During Deployment

### **1. Tests (2-3 minutes)**
- Backend tests run
- Frontend tests run
- All must pass

### **2. Build (5-7 minutes)**
- Backend Docker image built
- Frontend Docker image built
- Images cached for faster future builds

### **3. Deploy (3-5 minutes)**
- Coolify webhook triggered
- Images deployed to server
- Health check performed

### **4. Verification**
- API health endpoint checked
- Deployment marked successful

**Total Time:** ~10-15 minutes

---

## ✅ Success Criteria

Deployment is successful when:
- ✅ All tests pass
- ✅ Docker images build successfully
- ✅ Health check returns 200 OK
- ✅ No critical errors in logs

---

## 🚨 If Deployment Fails

The script will show you:
1. Which job failed
2. Link to the workflow run
3. Log file location

**Check the logs:**
```bash
cat github-status-monitor.log
```

**View on GitHub:**
```bash
gh run list --limit 1
gh run view <run-id>
```

---

## 🎯 Alternative: Run in Background

Run the monitor in the background:

```bash
cd smart-pos-system
nohup ./scripts/monitor-github-status.sh > monitor.out 2>&1 &

# Check progress
tail -f monitor.out

# Or check the log
tail -f github-status-monitor.log
```

---

## 📞 What to Do After Deployment

### **1. Verify Deployment:**
```bash
# Check health endpoint
curl https://api.yourpos.com/health

# Should return:
{
  "status": "ok",
  "timestamp": "2026-05-26T...",
  "database": "connected"
}
```

### **2. Test Critical Endpoints:**
```bash
# Test authentication
curl -X POST https://api.yourpos.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "your-password"}'

# Test transaction creation
curl -X POST https://api.yourpos.com/api/transactions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id",
    "branchId": "branch-id",
    "items": [{"productId": "prod-1", "quantity": 1, "unitPrice": 100}],
    "paymentMethod": "CASH",
    "idempotencyKey": "test-001"
  }'
```

### **3. Monitor for 2 Hours:**
- Check Sentry for errors
- Monitor response times
- Verify transactions work
- Check server resources

---

## 🎉 Success!

Once deployment completes successfully:

✅ **System is live and production-ready**  
✅ **All 5-day hardening complete**  
✅ **90/100 production readiness score**  
✅ **Atomic transactions working**  
✅ **Security hardened**  
✅ **Monitoring active**  
✅ **Backups automated**  

**Congratulations! The Smart POS System is now in production! 🚀**

---

## 📚 Reference

**Documentation:**
- `QUICK_START_PRODUCTION.md` - Production deployment guide
- `GITHUB_INCIDENT_CONFIRMED.md` - Incident details
- `PRODUCTION_READY.md` - System status

**Monitoring:**
- GitHub Status: https://www.githubstatus.com/
- Actions: https://github.com/brunowachira001-coder/smart-pos-system/actions

**Support:**
- Check logs: `github-status-monitor.log`
- View workflow: `gh run list`
- Manual deployment: `QUICK_START_PRODUCTION.md`

---

**🔍 The monitor is ready! Just run: `./scripts/monitor-github-status.sh`**

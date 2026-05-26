# ✅ CRITICAL FIXES CHECKLIST
**Before Production Deployment**

---

## 🔴 MUST FIX (Deployment Blockers)

### 1. **Choose Backend Architecture**
```
[ ] Decision made: Option A (current) or Option B (new)
[ ] Team aligned on chosen path
[ ] Timeline confirmed
```

### 2. **Update Docker Configuration**
```bash
# If Option A (Deploy Current):
[ ] Edit docker-compose.yml
[ ] Change: context: ./backend-new
[ ] To:     context: ./backend
[ ] Test: docker-compose build backend
[ ] Verify: docker-compose up -d
```

### 3. **Add Rate Limiting**
```bash
cd backend
[ ] npm install express-rate-limit
[ ] Add to src/server.js (see code below)
[ ] Test: curl -X POST http://localhost:5000/api/auth/login (100 times)
[ ] Verify: Should block after 100 requests
```

```typescript
// backend/src/server.js - Add after line 15
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Apply to all API routes
app.use('/api/', apiLimiter);

// Stricter limit for auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
```

### 4. **Implement Backup Automation**
```bash
[ ] Create scripts/backup.sh
[ ] Make executable: chmod +x scripts/backup.sh
[ ] Test backup: ./scripts/backup.sh
[ ] Set up cron job: crontab -e
[ ] Add: 0 2 * * * /path/to/backup.sh
```

```bash
#!/bin/bash
# scripts/backup.sh

set -e

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "Starting backup at $DATE"
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Compress
gzip $BACKUP_DIR/backup_$DATE.sql

# Delete old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: backup_$DATE.sql.gz"

# Optional: Upload to cloud storage
# aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-bucket/backups/
```

### 5. **Add Error Monitoring**
```bash
cd backend
[ ] npm install @sentry/node
[ ] Get Sentry DSN from sentry.io
[ ] Add to .env: SENTRY_DSN=your_dsn_here
[ ] Add to src/server.js (see code below)
[ ] Test: Trigger an error and check Sentry dashboard
```

```typescript
// backend/src/server.js - Add at top
const Sentry = require('@sentry/node');

// Initialize Sentry (after dotenv.config())
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
  
  // Request handler must be first
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// ... rest of your middleware ...

// Error handler must be before other error middleware
if (process.env.NODE_ENV === 'production') {
  app.use(Sentry.Handlers.errorHandler());
}
```

### 6. **Environment Variables Security**
```bash
[ ] Verify .gitignore includes .env*
[ ] Remove any committed .env files
[ ] Create .env.production template
[ ] Document all required variables
[ ] Use Coolify environment variables (not .env files)
```

```bash
# Check for committed secrets
git log --all --full-history -- "*.env"

# If found, remove from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all
```

---

## 🟡 SHOULD FIX (High Priority)

### 7. **Add Health Check Endpoint**
```typescript
// backend/src/server.js - Already exists, verify it works
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'OK',
      timestamp: new Date(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date(),
      database: 'disconnected'
    });
  }
});
```

### 8. **Add Request Size Limits**
```typescript
// backend/src/server.js - Add after express.json()
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### 9. **Add CORS Configuration**
```typescript
// backend/src/server.js - Update CORS
const cors = require('cors');

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

### 10. **Add Security Headers**
```bash
npm install helmet
```

```typescript
// backend/src/server.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: false, // Adjust based on your needs
  crossOriginEmbedderPolicy: false
}));
```

---

## 🟢 NICE TO HAVE (Improvements)

### 11. **Add Request Logging**
```typescript
// backend/src/server.js - Update logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
});
```

### 12. **Add Graceful Shutdown**
```typescript
// backend/src/server.js - Add at end
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    prisma.$disconnect();
    process.exit(0);
  });
});
```

### 13. **Add API Versioning**
```typescript
// backend/src/server.js
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
// ... etc
```

---

## 🧪 TESTING CHECKLIST

### Before Staging Deployment:
```bash
[ ] All unit tests pass
[ ] Integration tests pass
[ ] Load test with 100 concurrent users
[ ] Security scan (npm audit)
[ ] Dependency vulnerabilities fixed
[ ] Docker build succeeds
[ ] Docker containers start correctly
[ ] Health check returns 200 OK
[ ] Database migrations run successfully
[ ] Backup script works
[ ] Restore from backup works
```

### Before Production Deployment:
```bash
[ ] Staging environment tested for 48 hours
[ ] No critical errors in logs
[ ] Performance benchmarks met
[ ] Security review completed
[ ] Backup automation verified
[ ] Monitoring dashboards configured
[ ] Rollback procedure documented
[ ] Team trained on incident response
[ ] DNS records prepared
[ ] SSL certificates ready
```

---

## 🚀 DEPLOYMENT CHECKLIST

### VPS Setup:
```bash
[ ] Contabo VPS ordered (8GB RAM, 4 vCPU)
[ ] Ubuntu 24.04 installed
[ ] SSH access configured
[ ] Firewall configured (UFW)
[ ] Docker installed
[ ] Docker Compose installed
[ ] Coolify installed
[ ] Domain DNS pointed to VPS
```

### Coolify Configuration:
```bash
[ ] GitHub repo connected
[ ] Environment variables set
[ ] Build command configured
[ ] Start command configured
[ ] Health check configured
[ ] SSL certificate generated
[ ] Staging environment created
[ ] Production environment created
```

### Database Setup:
```bash
[ ] PostgreSQL container running
[ ] Database created
[ ] Migrations run
[ ] Seed data loaded (if needed)
[ ] Backup automation configured
[ ] Connection pooling configured
```

### Monitoring Setup:
```bash
[ ] Sentry configured
[ ] Uptime monitoring (UptimeRobot)
[ ] Log aggregation (optional)
[ ] Alert notifications configured
[ ] Dashboard access shared with team
```

---

## 🔥 EMERGENCY ROLLBACK PROCEDURE

If deployment fails:

```bash
# 1. Revert to previous version in Coolify
# 2. Restore database from backup
pg_restore -d $DATABASE_URL /backups/backup_YYYYMMDD_HHMMSS.sql.gz

# 3. Clear Redis cache
redis-cli FLUSHALL

# 4. Restart services
docker-compose restart

# 5. Verify health check
curl https://api.yourpos.com/health

# 6. Notify team
# 7. Investigate root cause
# 8. Document incident
```

---

## 📊 SUCCESS CRITERIA

Deployment is successful when:
- ✅ Health check returns 200 OK
- ✅ Login works for all user types
- ✅ POS checkout completes successfully
- ✅ Inventory updates correctly
- ✅ Reports generate without errors
- ✅ No errors in Sentry for 1 hour
- ✅ Response times < 500ms (p95)
- ✅ Uptime monitoring shows 100%
- ✅ Backup runs successfully
- ✅ Multi-tenant isolation verified

---

## 📞 SUPPORT CONTACTS

Before deployment, ensure you have:
- [ ] VPS provider support contact
- [ ] Domain registrar support
- [ ] Database admin contact
- [ ] DevOps team contact
- [ ] On-call schedule defined

---

**Last Updated:** May 26, 2026  
**Review Before:** Every deployment  
**Owner:** DevOps Team

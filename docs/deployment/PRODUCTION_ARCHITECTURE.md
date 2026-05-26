# Production Architecture: Contabo VPS + Coolify Deployment

**System:** Smart POS System (Database-Per-Tenant SaaS)  
**Infrastructure:** Contabo VPS + Coolify  
**Status:** Production-Ready  
**Date:** May 22, 2026

---

## TABLE OF CONTENTS

1. [Production Architecture Overview](#1-production-architecture-overview)
2. [Infrastructure Stack](#2-infrastructure-stack)
3. [Service Architecture](#3-service-architecture)
4. [Network & Security](#4-network--security)
5. [Scaling Strategy](#5-scaling-strategy)

---

## 1. PRODUCTION ARCHITECTURE OVERVIEW

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         INTERNET                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (DNS + CDN)                        │
│  - DNS Management                                                │
│  - DDoS Protection                                               │
│  - SSL/TLS Termination (Optional)                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                  CONTABO VPS (Ubuntu 24.04)                      │
│  IP: YOUR_VPS_IP                                                 │
│  RAM: 16GB+ (Recommended)                                        │
│  CPU: 4+ cores                                                   │
│  Storage: 400GB+ SSD                                             │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              COOLIFY (Self-Hosted PaaS)                    │ │
│  │  - Docker Container Orchestration                          │ │
│  │  - Automatic SSL (Let's Encrypt)                           │ │
│  │  - Reverse Proxy (Traefik)                                 │ │
│  │  - GitHub Integration                                      │ │
│  │                                                             │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │           DOCKER CONTAINERS                          │ │ │
│  │  │                                                       │ │ │
│  │  │  ┌─────────────────────────────────────────────┐    │ │ │
│  │  │  │  FRONTEND (Next.js)                         │    │ │ │
│  │  │  │  - Port: 3000 (internal)                    │    │ │ │
│  │  │  │  - Domain: app.yourpos.com                  │    │ │ │
│  │  │  │  - SSR + Static Generation                  │    │ │ │
│  │  │  └─────────────────────────────────────────────┘    │ │ │
│  │  │                                                       │ │ │
│  │  │  ┌─────────────────────────────────────────────┐    │ │ │
│  │  │  │  BACKEND (Node.js/NestJS)                   │    │ │ │
│  │  │  │  - Port: 3001 (internal)                    │    │ │ │
│  │  │  │  - Domain: api.yourpos.com                  │    │ │ │
│  │  │  │  - Tenant Resolution                        │    │ │ │
│  │  │  │  - Database-Per-Tenant Manager              │    │ │ │
│  │  │  └─────────────────────────────────────────────┘    │ │ │
│  │  │                                                       │ │ │
│  │  │  ┌─────────────────────────────────────────────┐    │ │ │
│  │  │  │  WORKER (Background Jobs)                   │    │ │ │
│  │  │  │  - Queue Processing                         │    │ │ │
│  │  │  │  - Scheduled Tasks                          │    │ │ │
│  │  │  │  - Email/SMS Sending                        │    │ │ │
│  │  │  └─────────────────────────────────────────────┘    │ │ │
│  │  │                                                       │ │ │
│  │  │  ┌─────────────────────────────────────────────┐    │ │ │
│  │  │  │  REDIS (Cache + Queue)                      │    │ │ │
│  │  │  │  - Port: 6379 (internal)                    │    │ │ │
│  │  │  │  - Persistent Volume                        │    │ │ │
│  │  │  └─────────────────────────────────────────────┘    │ │ │
│  │  │                                                       │ │ │
│  │  │  ┌─────────────────────────────────────────────┐    │ │ │
│  │  │  │  POSTGRESQL (Central Registry)              │    │ │ │
│  │  │  │  - Port: 5432 (internal)                    │    │ │ │
│  │  │  │  - Database: registry_db                    │    │ │ │
│  │  │  │  - Persistent Volume                        │    │ │ │
│  │  │  └─────────────────────────────────────────────┘    │ │ │
│  │  │                                                       │ │ │
│  │  │  ┌─────────────────────────────────────────────┐    │ │ │
│  │  │  │  POSTGRESQL (Tenant Databases)              │    │ │ │
│  │  │  │  - tenant_shop1_db                          │    │ │ │
│  │  │  │  - tenant_shop2_db                          │    │ │ │
│  │  │  │  - tenant_shopN_db                          │    │ │ │
│  │  │  │  - Created dynamically                      │    │ │ │
│  │  │  └─────────────────────────────────────────────┘    │ │ │
│  │  │                                                       │ │ │
│  │  └───────────────────────────────────────────────────┘ │ │
│  │                                                           │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │  TRAEFIK (Reverse Proxy)                         │   │ │
│  │  │  - Automatic SSL (Let's Encrypt)                 │   │ │
│  │  │  - HTTP → HTTPS Redirect                         │   │ │
│  │  │  - Load Balancing                                │   │ │
│  │  │  - Subdomain Routing                             │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  VOLUMES (Persistent Storage)                          │   │
│  │  - /var/lib/docker/volumes/postgres_data              │   │
│  │  - /var/lib/docker/volumes/redis_data                 │   │
│  │  - /var/lib/docker/volumes/uploads                    │   │
│  │  - /var/lib/docker/volumes/backups                    │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. INFRASTRUCTURE STACK

### 2.1 VPS Specifications (Contabo)

**Recommended Plan:**
- **CPU:** 4-8 vCores
- **RAM:** 16-32 GB
- **Storage:** 400 GB - 1 TB SSD
- **Bandwidth:** Unlimited
- **OS:** Ubuntu 24.04 LTS
- **Cost:** ~€15-30/month

**Minimum Requirements:**
- **CPU:** 2 vCores
- **RAM:** 8 GB
- **Storage:** 200 GB SSD

### 2.2 Software Stack

```
┌─────────────────────────────────────────┐
│  Operating System                        │
│  Ubuntu 24.04 LTS                        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Container Runtime                       │
│  Docker 24.x + Docker Compose            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Platform Management                     │
│  Coolify v4 (Self-Hosted PaaS)          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  Application Services                    │
│  - Next.js Frontend                      │
│  - Node.js/NestJS Backend               │
│  - PostgreSQL 16                         │
│  - Redis 7                               │
│  - Worker Service                        │
└─────────────────────────────────────────┘
```

---

## 3. SERVICE ARCHITECTURE

### 3.1 Service Breakdown

#### Frontend Service (Next.js)
```yaml
Service: smart-pos-frontend
Type: Web Application
Port: 3000 (internal)
Domain: app.yourpos.com
Replicas: 1-2 (for high availability)

Features:
- Server-Side Rendering (SSR)
- Static Site Generation (SSG)
- API Routes (proxied to backend)
- Image Optimization
- Automatic Code Splitting

Environment:
- NEXT_PUBLIC_API_URL=https://api.yourpos.com
- NEXT_PUBLIC_APP_URL=https://app.yourpos.com
- NODE_ENV=production
```

#### Backend Service (Node.js/NestJS)
```yaml
Service: smart-pos-backend
Type: API Server
Port: 3001 (internal)
Domain: api.yourpos.com
Replicas: 1-3 (scalable)

Features:
- RESTful API
- Tenant Resolution Middleware
- Database-Per-Tenant Manager
- JWT Authentication
- Connection Pooling
- Health Check Endpoint

Environment:
- NODE_ENV=production
- PORT=3001
- REGISTRY_DB_URL=postgresql://...
- REDIS_URL=redis://redis:6379
- JWT_SECRET=...
- DB_ENCRYPTION_KEY=...
```

#### Worker Service
```yaml
Service: smart-pos-worker
Type: Background Worker
Port: N/A
Replicas: 1

Features:
- Queue Processing (BullMQ)
- Scheduled Tasks (Cron)
- Email/SMS Sending
- Report Generation
- Data Exports

Environment:
- NODE_ENV=production
- REDIS_URL=redis://redis:6379
- REGISTRY_DB_URL=postgresql://...
```

#### PostgreSQL Service
```yaml
Service: postgres
Type: Database
Port: 5432 (internal)
Version: 16
Persistent Volume: Yes

Databases:
- registry_db (central)
- tenant_shop1_db (dynamic)
- tenant_shop2_db (dynamic)
- ... (created on-demand)

Configuration:
- max_connections=200
- shared_buffers=4GB
- effective_cache_size=12GB
- maintenance_work_mem=1GB
```

#### Redis Service
```yaml
Service: redis
Type: Cache + Queue
Port: 6379 (internal)
Version: 7
Persistent Volume: Yes

Features:
- Tenant Config Caching
- Session Storage
- Queue Management (BullMQ)
- Rate Limiting

Configuration:
- maxmemory=2gb
- maxmemory-policy=allkeys-lru
- appendonly=yes
```

### 3.2 Request Flow

```
1. User Request
   https://shop1.yourpos.com/api/products
   
2. Cloudflare DNS
   - Resolves to VPS IP
   - DDoS protection
   
3. Traefik (Reverse Proxy)
   - SSL termination
   - Routes to backend container
   
4. Backend Container
   - Tenant Resolver extracts: tenant = "shop1"
   - Queries Redis cache for tenant config
   - If not cached, queries registry_db
   - Gets connection to tenant_shop1_db
   
5. Database Query
   - Executes: SELECT * FROM products
   - NO tenant_id filter needed!
   
6. Response
   - Returns data from shop1's database
   - Caches tenant config in Redis
   - Returns JSON to client
```

---

## 4. NETWORK & SECURITY

### 4.1 Port Configuration

```
External (Public):
- 80   → HTTP (redirects to HTTPS)
- 443  → HTTPS (Traefik)
- 22   → SSH (restricted to your IP)

Internal (Docker Network):
- 3000 → Frontend
- 3001 → Backend
- 5432 → PostgreSQL
- 6379 → Redis
- 8000 → Coolify Dashboard
```

### 4.2 Firewall Rules (UFW)

```bash
# Allow SSH (your IP only)
ufw allow from YOUR_IP to any port 22

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow Coolify Dashboard (optional, can use SSH tunnel)
ufw allow 8000/tcp

# Deny all other incoming
ufw default deny incoming
ufw default allow outgoing

# Enable firewall
ufw enable
```

### 4.3 SSL/TLS Configuration

**Automatic SSL via Coolify:**
- Uses Let's Encrypt
- Auto-renewal every 90 days
- Wildcard certificates supported
- HTTP → HTTPS redirect automatic

**Domains:**
```
app.yourpos.com       → Frontend
api.yourpos.com       → Backend
*.yourpos.com         → Tenant subdomains (shop1, shop2, etc.)
coolify.yourpos.com   → Coolify dashboard
```

### 4.4 Security Measures

```
✅ Firewall (UFW) enabled
✅ SSH key-only authentication
✅ Fail2ban for brute force protection
✅ Docker containers isolated
✅ Database not exposed publicly
✅ Redis not exposed publicly
✅ Environment variables encrypted
✅ Regular security updates
✅ Backup encryption
✅ Rate limiting on API
```

---

## 5. SCALING STRATEGY

### 5.1 Vertical Scaling (Single VPS)

**Current Setup:**
- 1 VPS with all services
- Suitable for: 10-100 tenants

**Upgrade Path:**
```
Starter:  4 vCores, 16GB RAM  → 50 tenants
Growth:   8 vCores, 32GB RAM  → 200 tenants
Scale:   16 vCores, 64GB RAM  → 500+ tenants
```

### 5.2 Horizontal Scaling (Future)

**When to Scale:**
- > 500 tenants
- > 10,000 requests/minute
- Database size > 500GB

**Scaling Options:**

#### Option A: Multiple VPS (Load Balanced)
```
┌─────────────────┐
│  Load Balancer  │
│  (Cloudflare)   │
└────────┬────────┘
         │
    ┌────┴────┐
    ↓         ↓
┌───────┐ ┌───────┐
│ VPS 1 │ │ VPS 2 │
│Backend│ │Backend│
└───┬───┘ └───┬───┘
    │         │
    └────┬────┘
         ↓
  ┌─────────────┐
  │ PostgreSQL  │
  │  (Managed)  │
  └─────────────┘
```

#### Option B: Managed Database
```
Application VPS (Coolify)
    ↓
Managed PostgreSQL (Supabase/AWS RDS)
    ↓
Separate DB per tenant
```

#### Option C: Kubernetes (Advanced)
```
- Migrate from Coolify to K8s
- Use Helm charts
- Auto-scaling based on load
- Multi-region deployment
```

### 5.3 Database Scaling

**Per-Tenant Database Limits:**
```
Small Tenant:  < 1GB    → Same VPS
Medium Tenant: 1-10GB   → Same VPS
Large Tenant:  > 10GB   → Dedicated DB server
```

**Connection Pooling:**
```
Registry DB:    20 connections
Per Tenant DB:  10 connections
Total:          20 + (10 × N tenants)

Example:
- 50 tenants = 520 connections
- Requires: max_connections=600 in PostgreSQL
```

---

## 6. MONITORING & OBSERVABILITY

### 6.1 Built-in Monitoring (Coolify)

```
✅ Container health checks
✅ Resource usage (CPU, RAM, Disk)
✅ Application logs
✅ Deployment history
✅ Uptime monitoring
```

### 6.2 External Monitoring (Optional)

**Recommended Tools:**
- **Uptime:** UptimeRobot (free)
- **APM:** New Relic / Sentry
- **Logs:** Better Stack / Papertrail
- **Metrics:** Prometheus + Grafana

### 6.3 Health Check Endpoints

```
GET /health
Response: { status: "healthy", uptime: 3600 }

GET /api/health
Response: { 
  status: "healthy",
  database: "connected",
  redis: "connected",
  tenants: 50
}
```

---

## 7. BACKUP STRATEGY

### 7.1 Automated Backups

**PostgreSQL:**
```bash
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-postgres.sh

# Backup script:
- Dumps all databases
- Compresses with gzip
- Uploads to Cloudflare R2
- Retains: 7 daily, 4 weekly, 12 monthly
```

**Redis:**
```bash
# Hourly snapshot
0 * * * * docker exec redis redis-cli BGSAVE

# Persistent AOF enabled
appendonly yes
```

**Volumes:**
```bash
# Weekly volume backup
0 3 * * 0 /usr/local/bin/backup-volumes.sh
```

### 7.2 Disaster Recovery

**RTO (Recovery Time Objective):** < 1 hour  
**RPO (Recovery Point Objective):** < 24 hours

**Recovery Steps:**
1. Provision new VPS
2. Install Coolify
3. Restore PostgreSQL from backup
4. Restore Redis from backup
5. Deploy application from GitHub
6. Update DNS
7. Verify all tenants

---

## 8. COST ESTIMATION

### 8.1 Monthly Costs

```
Infrastructure:
- Contabo VPS (16GB)        €20/month
- Domain (.com)             €12/year = €1/month
- Cloudflare (Free tier)    €0/month
- Coolify (Self-hosted)     €0/month
- Backups (Cloudflare R2)   €1/month (100GB)
─────────────────────────────────────────
TOTAL:                      €22/month (~$24/month)

Optional Add-ons:
- Monitoring (UptimeRobot)  €0/month (free tier)
- Email (SendGrid)          €0-15/month
- SMS (Twilio)              Pay-as-you-go
```

### 8.2 Scaling Costs

```
50 Tenants:    €22/month  (Starter VPS)
200 Tenants:   €40/month  (Growth VPS)
500 Tenants:   €80/month  (Scale VPS)
1000+ Tenants: €200+/month (Multiple VPS + Managed DB)
```

---

## 9. PRODUCTION CHECKLIST

### Before Deployment

- [ ] VPS provisioned (Contabo)
- [ ] Domain purchased and configured
- [ ] Cloudflare account setup
- [ ] SSH keys generated
- [ ] Firewall rules configured
- [ ] Coolify installed
- [ ] GitHub repository connected
- [ ] Environment variables set
- [ ] SSL certificates issued
- [ ] Database backups configured
- [ ] Monitoring setup
- [ ] Load testing completed

### After Deployment

- [ ] Health checks passing
- [ ] SSL working (HTTPS)
- [ ] Tenant provisioning tested
- [ ] Database connections verified
- [ ] Redis caching working
- [ ] Worker processing jobs
- [ ] Backups running
- [ ] Monitoring alerts configured
- [ ] Documentation updated
- [ ] Team trained

---

**Next:** See `DOCKERIZATION_GUIDE.md` for Docker configuration  
**Next:** See `COOLIFY_SETUP_GUIDE.md` for deployment steps

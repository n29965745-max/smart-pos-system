# Complete Deployment Guide: Production Ready

**System:** Smart POS (Database-Per-Tenant SaaS)  
**Infrastructure:** Contabo VPS + Coolify  
**Time to Deploy:** 2-3 hours  
**Status:** Production-Ready

---

## 🎯 DEPLOYMENT OVERVIEW

This guide will take you from zero to a fully deployed, production-ready Smart POS system with:

✅ Automatic SSL (HTTPS)  
✅ Database-per-tenant architecture  
✅ Zero-downtime deployments  
✅ Automatic backups  
✅ Monitoring & alerts  
✅ CI/CD pipeline  

---

## 📋 PREREQUISITES

### What You Need

- [ ] **Contabo VPS** (16GB RAM, 4 vCores minimum)
- [ ] **Domain name** (e.g., yourpos.com)
- [ ] **Cloudflare account** (free tier)
- [ ] **GitHub account** with repository access
- [ ] **SSH key** generated on your local machine
- [ ] **2-3 hours** of focused time

### Cost Breakdown

```
Contabo VPS (16GB):     €20/month
Domain (.com):          €12/year
Cloudflare:             Free
Coolify:                Free (self-hosted)
Total:                  ~€22/month
```

---

## 🚀 DEPLOYMENT STEPS

### PHASE 1: VPS SETUP (30 minutes)

#### Step 1.1: Order Contabo VPS

1. Go to https://contabo.com
2. Select **VPS** → **Cloud VPS M** (or larger)
3. Choose:
   - **OS:** Ubuntu 24.04
   - **Location:** Closest to your users
   - **Storage:** 400GB SSD
4. Complete purchase
5. Wait for email with VPS credentials

#### Step 1.2: Initial Server Setup

```bash
# 1. SSH into VPS (use credentials from email)
ssh root@YOUR_VPS_IP

# 2. Update system
apt update && apt upgrade -y

# 3. Set timezone
timedatectl set-timezone Africa/Nairobi

# 4. Set hostname
hostnamectl set-hostname smart-pos-prod

# 5. Reboot
reboot
```

#### Step 1.3: Secure SSH

```bash
# 1. SSH back in
ssh root@YOUR_VPS_IP

# 2. Create deploy user
adduser deploy
usermod -aG sudo deploy

# 3. Copy your SSH public key
mkdir -p /home/deploy/.ssh
nano /home/deploy/.ssh/authorized_keys
# Paste your public key (from ~/.ssh/id_rsa.pub on your local machine)

# 4. Set permissions
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# 5. Test login (in new terminal)
ssh deploy@YOUR_VPS_IP

# 6. Disable root SSH (after testing)
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

#### Step 1.4: Configure Firewall

```bash
# Install UFW
sudo apt install ufw -y

# Allow SSH (IMPORTANT!)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow Coolify
sudo ufw allow 8000/tcp

# Enable firewall
sudo ufw enable

# Verify
sudo ufw status
```

#### Step 1.5: Install Docker

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo sh

# Add user to docker group
sudo usermod -aG docker deploy

# Log out and back in
exit
ssh deploy@YOUR_VPS_IP

# Verify Docker
docker --version
docker compose version
```

---

### PHASE 2: COOLIFY INSTALLATION (15 minutes)

#### Step 2.1: Install Coolify

```bash
# Run installer
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# Wait for installation (5-10 minutes)
# Note the admin credentials shown at the end
```

#### Step 2.2: Access Coolify

```bash
# Open in browser
http://YOUR_VPS_IP:8000

# Login with credentials from installation
# Example:
# Email: admin@example.com
# Password: <generated-password>
```

#### Step 2.3: Initial Configuration

1. **Change password** immediately
2. **Update email** to your email
3. **Configure server** (localhost is auto-added)
4. **Add GitHub** integration

---

### PHASE 3: DOMAIN & DNS SETUP (20 minutes)

#### Step 3.1: Add Domain to Cloudflare

1. Go to https://cloudflare.com
2. **Add Site** → Enter your domain
3. Select **Free plan**
4. Copy nameservers shown
5. Update nameservers at your domain registrar
6. Wait for activation (5-60 minutes)

#### Step 3.2: Configure DNS Records

In Cloudflare DNS settings, add:

```
Type    Name    Content         Proxy   TTL
────────────────────────────────────────────
A       @       YOUR_VPS_IP     Yes     Auto
A       app     YOUR_VPS_IP     Yes     Auto
A       api     YOUR_VPS_IP     Yes     Auto
A       *       YOUR_VPS_IP     Yes     Auto
CNAME   www     yourpos.com     Yes     Auto
```

#### Step 3.3: Configure Cloudflare SSL

1. **SSL/TLS** → **Overview**
2. Set mode to: **Full (strict)**
3. **Edge Certificates:**
   - Always Use HTTPS: **On**
   - Automatic HTTPS Rewrites: **On**
   - Minimum TLS Version: **1.2**

---

### PHASE 4: DEPLOY SERVICES (45 minutes)

#### Step 4.1: Connect GitHub Repository

In Coolify:

1. **Projects** → **New Project**
2. **Name:** Smart POS System
3. **Add Source:**
   - Type: **GitHub**
   - Repository: `brunowachira001-coder/smart-pos-system`
   - Branch: `main`
4. **Connect** GitHub account

#### Step 4.2: Deploy PostgreSQL

1. **New Resource** → **Database** → **PostgreSQL 16**
2. **Configuration:**
   ```
   Name: smart-pos-postgres
   Database: registry_db
   Username: postgres
   Password: <generate-strong-password>
   Port: 5432
   Persistent Storage: Yes
   ```
3. **Deploy**
4. **Save connection string:**
   ```
   postgresql://postgres:<password>@smart-pos-postgres:5432/registry_db
   ```

#### Step 4.3: Deploy Redis

1. **New Resource** → **Database** → **Redis 7**
2. **Configuration:**
   ```
   Name: smart-pos-redis
   Password: <generate-strong-password>
   Port: 6379
   Max Memory: 2GB
   Persistent Storage: Yes
   ```
3. **Deploy**
4. **Save connection string:**
   ```
   redis://:password@smart-pos-redis:6379
   ```

#### Step 4.4: Deploy Backend

1. **New Resource** → **Application**
2. **Configuration:**
   ```
   Name: smart-pos-backend
   Source: GitHub (smart-pos-system)
   Branch: main
   Build Pack: Dockerfile
   Dockerfile: backend-new/Dockerfile
   Port: 3001
   Health Check: /health
   ```

3. **Environment Variables:**
   ```bash
   NODE_ENV=production
   PORT=3001
   
   # Database
   REGISTRY_DB_HOST=smart-pos-postgres
   REGISTRY_DB_PORT=5432
   REGISTRY_DB_NAME=registry_db
   REGISTRY_DB_USER=postgres
   REGISTRY_DB_PASSWORD=<postgres-password>
   
   DB_ADMIN_USER=postgres
   DB_ADMIN_PASSWORD=<postgres-password>
   DB_HOST=smart-pos-postgres
   DB_PORT=5432
   
   # Redis
   REDIS_HOST=smart-pos-redis
   REDIS_PORT=6379
   REDIS_PASSWORD=<redis-password>
   
   # Security (generate these!)
   JWT_SECRET=<openssl-rand-hex-32>
   DB_ENCRYPTION_KEY=<openssl-rand-hex-32>
   
   # URLs
   ALLOWED_DOMAINS=yourpos.com,*.yourpos.com
   ALLOWED_ORIGINS=https://app.yourpos.com,https://api.yourpos.com
   ```

4. **Domain:** `api.yourpos.com`
5. **Enable SSL:** Yes
6. **Deploy**

#### Step 4.5: Deploy Frontend

1. **New Resource** → **Application**
2. **Configuration:**
   ```
   Name: smart-pos-frontend
   Source: GitHub (smart-pos-system)
   Branch: main
   Build Pack: Dockerfile
   Dockerfile: Dockerfile
   Port: 3000
   Health Check: /api/health
   ```

3. **Build Arguments:**
   ```
   NEXT_PUBLIC_API_URL=https://api.yourpos.com
   NEXT_PUBLIC_APP_URL=https://app.yourpos.com
   ```

4. **Environment Variables:**
   ```bash
   NODE_ENV=production
   PORT=3000
   NEXT_PUBLIC_API_URL=https://api.yourpos.com
   NEXT_PUBLIC_APP_URL=https://app.yourpos.com
   NEXT_TELEMETRY_DISABLED=1
   ```

5. **Domain:** `app.yourpos.com`
6. **Enable SSL:** Yes
7. **Deploy**

#### Step 4.6: Deploy Worker

1. **New Resource** → **Application**
2. **Configuration:**
   ```
   Name: smart-pos-worker
   Source: GitHub (smart-pos-system)
   Branch: main
   Build Pack: Dockerfile
   Dockerfile: backend-new/Dockerfile
   ```

3. **Start Command:**
   ```bash
   node dist/worker.js
   ```

4. **Environment Variables:** Same as backend
5. **Deploy**

---

### PHASE 5: VERIFICATION (15 minutes)

#### Step 5.1: Check Service Status

In Coolify dashboard:

- [ ] PostgreSQL: **Running** (green)
- [ ] Redis: **Running** (green)
- [ ] Backend: **Running** (green)
- [ ] Frontend: **Running** (green)
- [ ] Worker: **Running** (green)

#### Step 5.2: Test Health Endpoints

```bash
# Backend health
curl https://api.yourpos.com/health

# Expected response:
# {"status":"healthy","uptime":123}

# Frontend health
curl https://app.yourpos.com/api/health

# Expected response:
# {"status":"healthy"}
```

#### Step 5.3: Test Tenant Provisioning

```bash
# Create test tenant
curl -X POST https://api.yourpos.com/api/admin/tenants/provision \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "test-shop",
    "businessName": "Test Shop",
    "ownerEmail": "test@shop.com",
    "plan": "basic"
  }'

# Expected response:
# {"success":true,"tenant":{...}}
```

#### Step 5.4: Access Application

1. Open browser: `https://app.yourpos.com`
2. Should see login page
3. SSL certificate should be valid (green padlock)
4. No errors in browser console

---

### PHASE 6: CI/CD SETUP (10 minutes)

#### Step 6.1: Get Coolify Webhook URL

In Coolify:

1. Go to **Backend Service**
2. **Webhooks** tab
3. Copy webhook URL
4. Example: `https://coolify.yourpos.com/api/v1/deploy/webhook/abc123`

#### Step 6.2: Add GitHub Secrets

In GitHub repository:

1. **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**
3. Add secrets:
   ```
   COOLIFY_WEBHOOK_URL=<webhook-url>
   API_URL=https://api.yourpos.com
   NEXT_PUBLIC_API_URL=https://api.yourpos.com
   NEXT_PUBLIC_APP_URL=https://app.yourpos.com
   ```

#### Step 6.3: Test CI/CD

```bash
# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: CI/CD pipeline"
git push origin main

# Watch GitHub Actions
# Go to: https://github.com/your-repo/actions

# Coolify will auto-deploy
# Check Coolify dashboard for deployment progress
```

---

### PHASE 7: BACKUPS & MONITORING (15 minutes)

#### Step 7.1: Configure Backups

In Coolify:

1. **Settings** → **Backups**
2. **Add Backup Destination:**
   - Type: **S3 Compatible**
   - Provider: **Cloudflare R2** (or AWS S3)
   - Bucket: `smart-pos-backups`
   - Access Key: `<your-key>`
   - Secret Key: `<your-secret>`
3. **Schedule:**
   - PostgreSQL: Daily at 2 AM
   - Redis: Hourly snapshots
   - Retention: 7 daily, 4 weekly, 12 monthly

#### Step 7.2: Setup Monitoring

**Option A: Built-in (Coolify)**
- Already enabled
- View in dashboard

**Option B: External (Recommended)**

1. **UptimeRobot** (Free):
   - Add monitor: `https://api.yourpos.com/health`
   - Check interval: 5 minutes
   - Alert via email/SMS

2. **Sentry** (Error Tracking):
   - Create project
   - Add DSN to environment variables
   - Automatic error reporting

#### Step 7.3: Setup Alerts

In Coolify:

1. **Settings** → **Notifications**
2. **Add Channel:**
   - Email: your@email.com
   - Slack: webhook URL (optional)
3. **Configure Alerts:**
   - Service down
   - High CPU (> 80%)
   - High RAM (> 90%)
   - Deployment failures

---

## ✅ POST-DEPLOYMENT CHECKLIST

### Security

- [ ] Firewall configured (UFW)
- [ ] SSH key-only authentication
- [ ] Root login disabled
- [ ] Strong passwords set
- [ ] SSL certificates valid
- [ ] Environment variables secured
- [ ] Database not publicly accessible
- [ ] Redis not publicly accessible

### Functionality

- [ ] All services running
- [ ] Health checks passing
- [ ] Can create tenant
- [ ] Can login to system
- [ ] Can create products
- [ ] Can process sales
- [ ] Worker processing jobs
- [ ] Logs accessible

### Monitoring

- [ ] Uptime monitoring configured
- [ ] Error tracking enabled
- [ ] Alerts configured
- [ ] Backups running
- [ ] CI/CD pipeline working

### Documentation

- [ ] Credentials documented (securely)
- [ ] Team trained
- [ ] Runbooks created
- [ ] Emergency contacts listed

---

## 🔧 MAINTENANCE

### Daily

- Check Coolify dashboard
- Review error logs
- Monitor resource usage

### Weekly

- Review backup status
- Check for security updates
- Review performance metrics

### Monthly

- Update dependencies
- Review and optimize database
- Test disaster recovery
- Review costs

---

## 🆘 TROUBLESHOOTING

### Service Won't Start

```bash
# Check logs
docker logs <container-name>

# Restart service
# In Coolify → Service → Restart

# Check environment variables
# In Coolify → Service → Environment
```

### SSL Certificate Issues

```bash
# Verify DNS
dig app.yourpos.com

# Check Traefik logs
docker logs coolify-proxy

# Force SSL renewal
# In Coolify → Service → SSL → Renew
```

### Database Connection Failed

```bash
# Check PostgreSQL
docker ps | grep postgres

# Test connection
docker exec smart-pos-postgres psql -U postgres -d registry_db -c "SELECT 1;"

# Check network
docker network inspect coolify
```

### High Resource Usage

```bash
# Check usage
docker stats

# Identify heavy containers
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Restart if needed
# In Coolify → Service → Restart
```

---

## 📞 SUPPORT

### Documentation

- Architecture: `docs/deployment/PRODUCTION_ARCHITECTURE.md`
- Coolify Setup: `docs/deployment/COOLIFY_SETUP_GUIDE.md`
- Docker Guide: `docs/deployment/DOCKERIZATION_GUIDE.md`

### Community

- Coolify Docs: https://coolify.io/docs
- Coolify Discord: https://discord.gg/coolify
- GitHub Issues: https://github.com/your-repo/issues

### Emergency

- Check logs first
- Review troubleshooting section
- Contact: bmwachira12345@gmail.com

---

## 🎉 SUCCESS!

Your Smart POS System is now:

✅ **Deployed** on production VPS  
✅ **Secured** with SSL and firewall  
✅ **Monitored** with health checks  
✅ **Backed up** automatically  
✅ **Scalable** and ready for growth  

**Next Steps:**
1. Create your first tenant
2. Invite team members
3. Start processing sales
4. Monitor and optimize

**Welcome to production!** 🚀

# Coolify Setup Guide: Complete Deployment

**Platform:** Coolify v4  
**VPS:** Contabo Ubuntu 24.04  
**System:** Smart POS (Database-Per-Tenant)  
**Time:** 60 minutes

---

## TABLE OF CONTENTS

1. [VPS Initial Setup](#1-vps-initial-setup)
2. [Install Coolify](#2-install-coolify)
3. [Configure Coolify](#3-configure-coolify)
4. [Deploy Application](#4-deploy-application)
5. [Configure Services](#5-configure-services)
6. [Setup Domains & SSL](#6-setup-domains--ssl)
7. [Environment Variables](#7-environment-variables)
8. [Monitoring & Logs](#8-monitoring--logs)

---

## 1. VPS INITIAL SETUP

### 1.1 Connect to VPS

```bash
# SSH into your Contabo VPS
ssh root@YOUR_VPS_IP

# Update system
apt update && apt upgrade -y

# Set timezone
timedatectl set-timezone Africa/Nairobi  # or your timezone

# Set hostname
hostnamectl set-hostname smart-pos-prod
```

### 1.2 Create Non-Root User

```bash
# Create user
adduser deploy
usermod -aG sudo deploy

# Setup SSH for new user
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Test login
# ssh deploy@YOUR_VPS_IP
```

### 1.3 Configure Firewall

```bash
# Install UFW
apt install ufw -y

# Allow SSH (IMPORTANT: Do this first!)
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow Coolify dashboard
ufw allow 8000/tcp

# Enable firewall
ufw enable

# Check status
ufw status
```

### 1.4 Install Prerequisites

```bash
# Install required packages
apt install -y \
    curl \
    wget \
    git \
    ca-certificates \
    gnupg \
    lsb-release

# Install Docker
curl -fsSL https://get.docker.com | sh

# Add user to docker group
usermod -aG docker deploy

# Start Docker
systemctl enable docker
systemctl start docker

# Verify Docker
docker --version
docker compose version
```

---

## 2. INSTALL COOLIFY

### 2.1 Run Coolify Installer

```bash
# Switch to deploy user
su - deploy

# Install Coolify
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# This will:
# - Install Coolify
# - Setup Docker networks
# - Start Coolify services
# - Generate admin credentials
```

### 2.2 Access Coolify Dashboard

```bash
# Coolify runs on port 8000
# Open in browser:
http://YOUR_VPS_IP:8000

# Default credentials will be shown in terminal
# Example:
# Email: admin@example.com
# Password: <generated-password>
```

### 2.3 Initial Coolify Configuration

1. **Login** with generated credentials
2. **Change password** immediately
3. **Setup email** (optional but recommended)
4. **Configure server** settings

---

## 3. CONFIGURE COOLIFY

### 3.1 Add Server (Localhost)

Coolify automatically adds localhost server. Verify:

1. Go to **Servers** tab
2. Click on **localhost**
3. Verify status is **Connected**

### 3.2 Configure Docker Network

Coolify creates networks automatically:
- `coolify` - Main network
- `coolify-proxy` - Traefik network

No manual configuration needed.

### 3.3 Setup Cloudflare (Optional but Recommended)

1. Go to **Settings** → **Cloudflare**
2. Add Cloudflare API Token
3. This enables:
   - Automatic DNS management
   - Wildcard SSL certificates
   - DDoS protection

---

## 4. DEPLOY APPLICATION

### 4.1 Connect GitHub Repository

1. **Go to Projects** → **New Project**
2. **Name:** Smart POS System
3. **Add Source:**
   - Type: GitHub
   - Repository: `https://github.com/brunowachira001-coder/smart-pos-system`
   - Branch: `main`
4. **Connect** your GitHub account

### 4.2 Create Services

Coolify supports two deployment methods:

#### Method A: Docker Compose (Recommended)

1. **New Resource** → **Docker Compose**
2. **Name:** smart-pos-stack
3. **Source:** GitHub repository
4. **Docker Compose File:** `docker-compose.yml`
5. **Deploy**

#### Method B: Individual Services

Create each service separately:

---

## 5. CONFIGURE SERVICES

### 5.1 PostgreSQL Service

**Create Database Service:**

1. **New Resource** → **Database** → **PostgreSQL**
2. **Configuration:**
   ```
   Name: smart-pos-postgres
   Version: 16
   Database Name: registry_db
   Username: postgres
   Password: <generate-strong-password>
   Port: 5432 (internal)
   Persistent Storage: Yes
   Volume: /var/lib/postgresql/data
   ```
3. **Deploy**

**Get Connection String:**
```
postgresql://postgres:<password>@smart-pos-postgres:5432/registry_db
```

### 5.2 Redis Service

**Create Redis Service:**

1. **New Resource** → **Database** → **Redis**
2. **Configuration:**
   ```
   Name: smart-pos-redis
   Version: 7
   Password: <generate-strong-password>
   Port: 6379 (internal)
   Persistent Storage: Yes
   Max Memory: 2GB
   ```
3. **Deploy**

**Get Connection String:**
```
redis://:password@smart-pos-redis:6379
```

### 5.3 Backend Service

**Create Backend Application:**

1. **New Resource** → **Application**
2. **Configuration:**
   ```
   Name: smart-pos-backend
   Source: GitHub
   Repository: smart-pos-system
   Branch: main
   Build Pack: Dockerfile
   Dockerfile Location: backend-new/Dockerfile
   Port: 3001
   Health Check: /health
   ```

3. **Build Command:**
   ```bash
   # Automatic from Dockerfile
   ```

4. **Start Command:**
   ```bash
   node dist/server.js
   ```

5. **Environment Variables:** (See Section 7)

6. **Domain:**
   ```
   api.yourpos.com
   ```

7. **Deploy**

### 5.4 Frontend Service

**Create Frontend Application:**

1. **New Resource** → **Application**
2. **Configuration:**
   ```
   Name: smart-pos-frontend
   Source: GitHub
   Repository: smart-pos-system
   Branch: main
   Build Pack: Dockerfile
   Dockerfile Location: Dockerfile
   Port: 3000
   Health Check: /api/health
   ```

3. **Build Arguments:**
   ```
   NEXT_PUBLIC_API_URL=https://api.yourpos.com
   NEXT_PUBLIC_APP_URL=https://app.yourpos.com
   ```

4. **Domain:**
   ```
   app.yourpos.com
   ```

5. **Deploy**

### 5.5 Worker Service

**Create Worker Service:**

1. **New Resource** → **Application**
2. **Configuration:**
   ```
   Name: smart-pos-worker
   Source: GitHub
   Repository: smart-pos-system
   Branch: main
   Build Pack: Dockerfile
   Dockerfile Location: backend-new/Dockerfile
   Port: None (background service)
   ```

3. **Start Command:**
   ```bash
   node dist/worker.js
   ```

4. **Environment Variables:** Same as backend

5. **Deploy**

---

## 6. SETUP DOMAINS & SSL

### 6.1 Configure DNS (Cloudflare)

**Add DNS Records:**

```
Type    Name        Content         Proxy   TTL
────────────────────────────────────────────────
A       @           YOUR_VPS_IP     Yes     Auto
A       app         YOUR_VPS_IP     Yes     Auto
A       api         YOUR_VPS_IP     Yes     Auto
A       *           YOUR_VPS_IP     Yes     Auto
CNAME   www         yourpos.com     Yes     Auto
```

**Cloudflare Settings:**
- SSL/TLS Mode: **Full (strict)**
- Always Use HTTPS: **On**
- Automatic HTTPS Rewrites: **On**
- Minimum TLS Version: **1.2**

### 6.2 Configure Domains in Coolify

**For Each Service:**

1. Go to service settings
2. **Domains** tab
3. Add domain:
   ```
   Backend:  api.yourpos.com
   Frontend: app.yourpos.com
   ```
4. **Enable SSL:** Yes (automatic Let's Encrypt)
5. **Force HTTPS:** Yes
6. **Save**

Coolify will automatically:
- Request SSL certificate
- Configure Traefik
- Setup HTTP → HTTPS redirect

### 6.3 Wildcard SSL (For Tenant Subdomains)

**Option A: Cloudflare (Recommended)**
- Cloudflare provides automatic wildcard SSL
- No additional configuration needed

**Option B: Let's Encrypt Wildcard**
1. Requires DNS challenge
2. Configure in Coolify settings
3. Add Cloudflare API token

---

## 7. ENVIRONMENT VARIABLES

### 7.1 Backend Environment Variables

**In Coolify → Backend Service → Environment:**

```bash
# Application
NODE_ENV=production
PORT=3001

# Database (Central Registry)
REGISTRY_DB_HOST=smart-pos-postgres
REGISTRY_DB_PORT=5432
REGISTRY_DB_NAME=registry_db
REGISTRY_DB_USER=postgres
REGISTRY_DB_PASSWORD=<postgres-password>

# PostgreSQL Admin (for creating tenant DBs)
DB_ADMIN_USER=postgres
DB_ADMIN_PASSWORD=<postgres-password>
DB_HOST=smart-pos-postgres
DB_PORT=5432

# Redis
REDIS_HOST=smart-pos-redis
REDIS_PORT=6379
REDIS_PASSWORD=<redis-password>

# Security (GENERATE THESE!)
JWT_SECRET=<generate-with-openssl-rand-hex-32>
DB_ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>

# Application URLs
ALLOWED_DOMAINS=yourpos.com,*.yourpos.com
ALLOWED_ORIGINS=https://app.yourpos.com,https://api.yourpos.com

# Logging
LOG_LEVEL=info
```

**Generate Secrets:**
```bash
# On your local machine
openssl rand -hex 32  # For JWT_SECRET
openssl rand -hex 32  # For DB_ENCRYPTION_KEY
```

### 7.2 Frontend Environment Variables

**In Coolify → Frontend Service → Environment:**

```bash
# Application
NODE_ENV=production
PORT=3000

# Public URLs (available in browser)
NEXT_PUBLIC_API_URL=https://api.yourpos.com
NEXT_PUBLIC_APP_URL=https://app.yourpos.com

# Disable telemetry
NEXT_TELEMETRY_DISABLED=1
```

### 7.3 Worker Environment Variables

Same as backend environment variables.

---

## 8. MONITORING & LOGS

### 8.1 View Logs

**In Coolify Dashboard:**

1. Go to service
2. Click **Logs** tab
3. View real-time logs
4. Filter by level (info, error, etc.)

**Via CLI:**
```bash
# SSH into VPS
ssh deploy@YOUR_VPS_IP

# View logs
docker logs smart-pos-backend -f
docker logs smart-pos-frontend -f
docker logs smart-pos-worker -f
```

### 8.2 Resource Monitoring

**In Coolify Dashboard:**

1. Go to **Server** → **localhost**
2. View:
   - CPU usage
   - RAM usage
   - Disk usage
   - Network traffic

### 8.3 Health Checks

Coolify automatically monitors health checks:

```
Backend:  GET /health
Frontend: GET /api/health
```

If health check fails:
- Service marked as unhealthy
- Alert sent (if configured)
- Auto-restart attempted

### 8.4 Setup Alerts (Optional)

1. **Settings** → **Notifications**
2. Add notification channel:
   - Email
   - Slack
   - Discord
   - Telegram
3. Configure alerts for:
   - Service down
   - High CPU/RAM
   - Deployment failures

---

## 9. DEPLOYMENT WORKFLOW

### 9.1 Automatic Deployment

**Coolify watches GitHub repository:**

1. Push code to `main` branch
2. Coolify detects changes
3. Automatically builds and deploys
4. Zero-downtime deployment

**Configure Auto-Deploy:**

1. Go to service settings
2. **Deployment** tab
3. Enable **Auto Deploy**
4. Select branch: `main`
5. Save

### 9.2 Manual Deployment

**Via Coolify Dashboard:**

1. Go to service
2. Click **Deploy** button
3. Select branch/commit
4. Deploy

**Via CLI:**
```bash
# Trigger deployment via webhook
curl -X POST https://coolify.yourpos.com/api/v1/deploy/webhook/<service-id>
```

### 9.3 Rollback

**If deployment fails:**

1. Go to service
2. **Deployments** tab
3. View deployment history
4. Click **Rollback** on previous version

---

## 10. POST-DEPLOYMENT CHECKLIST

### Verify Deployment

- [ ] All services running (green status)
- [ ] Health checks passing
- [ ] SSL certificates issued
- [ ] Domains resolving correctly
- [ ] Backend API responding
- [ ] Frontend loading
- [ ] Database connected
- [ ] Redis connected
- [ ] Worker processing jobs

### Test Functionality

- [ ] Create test tenant
- [ ] Login to system
- [ ] Create product
- [ ] Process sale
- [ ] View reports
- [ ] Check logs

### Security

- [ ] Firewall configured
- [ ] SSH key-only auth
- [ ] Strong passwords set
- [ ] Environment variables secured
- [ ] Backups configured
- [ ] Monitoring enabled

---

## 11. TROUBLESHOOTING

### Service Won't Start

```bash
# Check logs
docker logs <container-name>

# Check environment variables
# In Coolify → Service → Environment

# Verify database connection
docker exec smart-pos-backend node -e "console.log(process.env.REGISTRY_DB_HOST)"
```

### SSL Certificate Issues

```bash
# Check Traefik logs
docker logs coolify-proxy

# Verify DNS
dig app.yourpos.com
dig api.yourpos.com

# Force SSL renewal
# In Coolify → Service → SSL → Renew
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test connection
docker exec smart-pos-postgres psql -U postgres -d registry_db -c "SELECT 1;"

# Check network
docker network inspect coolify
```

### High Memory Usage

```bash
# Check resource usage
docker stats

# Restart service
# In Coolify → Service → Restart

# Increase VPS resources if needed
```

---

## 12. MAINTENANCE

### Update Application

```bash
# Push to GitHub
git push origin main

# Coolify auto-deploys
# Or manually deploy in dashboard
```

### Update Coolify

```bash
# SSH into VPS
ssh deploy@YOUR_VPS_IP

# Update Coolify
curl -fsSL https://cdn.coollabs.io/coolify/upgrade.sh | bash
```

### Backup Database

```bash
# Manual backup
docker exec smart-pos-postgres pg_dump -U postgres registry_db > backup.sql

# Automated backups configured in Coolify
# Settings → Backups
```

---

## 13. SCALING

### Vertical Scaling (Upgrade VPS)

1. Upgrade Contabo VPS plan
2. No code changes needed
3. Restart services

### Horizontal Scaling (Multiple Instances)

1. Deploy backend on multiple servers
2. Use Cloudflare Load Balancer
3. Share PostgreSQL and Redis

---

**Next Steps:**
1. Complete VPS setup
2. Install Coolify
3. Deploy services
4. Configure domains
5. Test thoroughly
6. Go live!

**Support:** Check Coolify docs at https://coolify.io/docs

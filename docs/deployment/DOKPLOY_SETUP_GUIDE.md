# 🚀 Dokploy Setup Guide - Smart POS System

**Complete guide to deploying your POS system with Dokploy**

---

## 📋 Table of Contents

1. [Why Dokploy](#why-dokploy)
2. [Prerequisites](#prerequisites)
3. [VPS Setup](#vps-setup)
4. [Install Dokploy](#install-dokploy)
5. [Configure Application](#configure-application)
6. [Setup Database](#setup-database)
7. [Configure GitHub Integration](#configure-github-integration)
8. [Environment Variables](#environment-variables)
9. [Deploy Application](#deploy-application)
10. [Verify Deployment](#verify-deployment)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Why Dokploy

**Dokploy is the best choice for your POS system because:**

✅ **Lightweight** - Uses ~500MB RAM (vs 1GB+ for alternatives)  
✅ **Stable** - Fewer bugs, more reliable for financial transactions  
✅ **Simple** - Clean UI, easier to manage  
✅ **Cost-Effective** - Can run on $5-10/month VPS  
✅ **Better Database Management** - Built-in PostgreSQL tools  
✅ **Production-Ready** - Perfect for multi-tenant POS systems  

---

## 📦 Prerequisites

### **What You Need:**

1. **VPS Server** (minimum specs):
   - 2 CPU cores
   - 2GB RAM (4GB recommended)
   - 20GB storage (40GB recommended)
   - Ubuntu 22.04 LTS

2. **Domain Name** (optional but recommended):
   - Example: `pos.yourdomain.com`
   - For SSL/HTTPS

3. **GitHub Account**:
   - Repository access
   - Personal access token

4. **5 Minutes of Your Time**:
   - Dokploy installation is super fast!

### **Recommended VPS Providers:**

| Provider | Cost | Specs | Link |
|----------|------|-------|------|
| **Contabo** | €5/month | 4 vCPU, 6GB RAM | contabo.com |
| **Hetzner** | €5/month | 2 vCPU, 4GB RAM | hetzner.com |
| **DigitalOcean** | $12/month | 2 vCPU, 2GB RAM | digitalocean.com |
| **Vultr** | $12/month | 2 vCPU, 4GB RAM | vultr.com |

**Recommendation:** Contabo for best value, Hetzner for best performance.

---

## 🖥️ VPS Setup

### **Step 1: Create VPS**

1. Sign up with your chosen provider
2. Create a new VPS with Ubuntu 22.04 LTS
3. Note down:
   - IP address
   - Root password
   - SSH access details

### **Step 2: Initial Server Setup**

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Update system
apt update && apt upgrade -y

# Create a new user (optional but recommended)
adduser deploy
usermod -aG sudo deploy

# Setup firewall
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw allow 3000  # Dokploy UI
ufw enable

# Switch to deploy user
su - deploy
```

### **Step 3: Install Docker**

```bash
# Install Docker (required for Dokploy)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Verify installation
docker --version

# Log out and back in for group changes to take effect
exit
ssh deploy@YOUR_SERVER_IP
```

---

## 🚀 Install Dokploy

### **One-Command Installation:**

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

That's it! Dokploy will:
- ✅ Install all dependencies
- ✅ Setup Docker networks
- ✅ Configure Traefik (reverse proxy)
- ✅ Start Dokploy dashboard
- ✅ Setup SSL (Let's Encrypt)

**Installation takes ~2-3 minutes.**

### **Access Dokploy Dashboard:**

```
http://YOUR_SERVER_IP:3000
```

**First-Time Setup:**

1. Create admin account
2. Set strong password
3. Note down credentials

---

## 🔧 Configure Application

### **Step 1: Create New Project**

1. Click **"New Project"**
2. Name: `smart-pos-system`
3. Description: `Production POS System`
4. Click **"Create"**

### **Step 2: Add Application**

1. Inside project, click **"New Application"**
2. Choose **"Docker Compose"**
3. Name: `smart-pos-production`
4. Click **"Create"**

### **Step 3: Configure Docker Compose**

In the application settings, paste your `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: smart-pos-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - pos-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: smart-pos-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      ENCRYPTION_KEY: ${ENCRYPTION_KEY}
      SENTRY_DSN: ${SENTRY_DSN}
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - pos-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend (Next.js)
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    container_name: smart-pos-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
    depends_on:
      - backend
    networks:
      - pos-network

volumes:
  postgres_data:
    driver: local

networks:
  pos-network:
    driver: bridge
```

---

## 🗄️ Setup Database

### **Option 1: Use Dokploy's Built-in PostgreSQL**

1. In your project, click **"Add Database"**
2. Choose **"PostgreSQL"**
3. Name: `smart-pos-db`
4. Version: `16`
5. Set credentials:
   - Username: `posuser`
   - Password: (generate strong password)
   - Database: `smart_pos_production`
6. Click **"Create"**

Dokploy will:
- ✅ Create PostgreSQL container
- ✅ Setup automatic backups
- ✅ Configure networking
- ✅ Provide connection string

### **Option 2: Use External Database**

If using external PostgreSQL (Supabase, AWS RDS, etc.):

1. Get connection string
2. Add to environment variables
3. Skip database creation in Dokploy

---

## 🔗 Configure GitHub Integration

### **Step 1: Connect GitHub Repository**

1. In application settings, go to **"Git"** tab
2. Click **"Connect Repository"**
3. Choose **"GitHub"**
4. Authorize Dokploy
5. Select repository: `brunowachira001-coder/smart-pos-system`
6. Branch: `main`
7. Click **"Connect"**

### **Step 2: Setup Webhook**

Dokploy automatically creates a webhook, but verify:

1. Go to GitHub repository settings
2. Click **"Webhooks"**
3. You should see Dokploy webhook
4. Verify it's active

### **Step 3: Get Webhook URL**

In Dokploy application settings:

1. Go to **"Deployments"** tab
2. Copy **"Webhook URL"**
3. Save it for GitHub Actions

Example:
```
https://your-server.com/api/deploy/webhook/abc123xyz
```

---

## 🔐 Environment Variables

### **Step 1: Add Environment Variables**

In Dokploy application settings, go to **"Environment"** tab:

**Required Variables:**

```bash
# Database
POSTGRES_USER=posuser
POSTGRES_PASSWORD=your-strong-password-here
POSTGRES_DB=smart_pos_production
DATABASE_URL=postgresql://posuser:your-password@postgres:5432/smart_pos_production

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_KEY=your-encryption-key-32-bytes

# API URLs
NEXT_PUBLIC_API_URL=https://api.yourpos.com
API_URL=https://api.yourpos.com

# Sentry (optional but recommended)
SENTRY_DSN=your-sentry-dsn

# Node Environment
NODE_ENV=production
```

**Generate Secure Secrets:**

```bash
# On your local machine
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY
```

### **Step 2: Save Variables**

Click **"Save"** - Dokploy will encrypt and store them securely.

---

## 🚀 Deploy Application

### **Manual Deployment:**

1. In Dokploy dashboard, go to your application
2. Click **"Deploy"** button
3. Dokploy will:
   - Pull latest code from GitHub
   - Build Docker images
   - Run database migrations
   - Start containers
   - Configure SSL
   - Setup health checks

**Deployment takes ~5-10 minutes.**

### **Monitor Deployment:**

Watch the logs in real-time:

1. Click **"Logs"** tab
2. See build progress
3. Check for errors

### **Automatic Deployment (via GitHub Actions):**

Already configured! When you push to `main`:

1. GitHub Actions runs tests
2. Triggers Dokploy webhook
3. Dokploy deploys automatically

---

## ✅ Verify Deployment

### **Step 1: Check Application Status**

In Dokploy dashboard:
- ✅ All containers should be **"Running"**
- ✅ Health checks should be **"Healthy"**

### **Step 2: Test Health Endpoint**

```bash
curl https://api.yourpos.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2026-05-26T...",
  "database": "connected",
  "memory": {...}
}
```

### **Step 3: Test Authentication**

```bash
curl -X POST https://api.yourpos.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your-password"
  }'

# Should return JWT token
```

### **Step 4: Access Frontend**

Open browser:
```
https://yourpos.com
```

You should see the login page.

### **Step 5: Run Database Migrations**

In Dokploy, open terminal for backend container:

```bash
npx prisma migrate deploy
npx prisma db seed  # Optional: seed initial data
```

---

## 🔧 Configure Domain & SSL

### **Step 1: Point Domain to Server**

In your domain registrar (Namecheap, GoDaddy, etc.):

**A Records:**
```
@ → YOUR_SERVER_IP
api → YOUR_SERVER_IP
www → YOUR_SERVER_IP
```

**Wait 5-10 minutes for DNS propagation.**

### **Step 2: Configure SSL in Dokploy**

1. Go to application settings
2. Click **"Domains"** tab
3. Add domains:
   - `yourpos.com`
   - `api.yourpos.com`
   - `www.yourpos.com`
4. Enable **"Auto SSL"** (Let's Encrypt)
5. Click **"Save"**

Dokploy will automatically:
- ✅ Request SSL certificates
- ✅ Configure HTTPS
- ✅ Setup auto-renewal
- ✅ Redirect HTTP to HTTPS

**SSL setup takes ~2-3 minutes.**

---

## 📊 Setup Monitoring

### **Built-in Monitoring:**

Dokploy provides:
- ✅ Container stats (CPU, RAM, Network)
- ✅ Application logs
- ✅ Health check status
- ✅ Deployment history

### **External Monitoring (Recommended):**

**1. Sentry (Error Tracking):**
- Already configured in code
- Add `SENTRY_DSN` to environment variables
- Monitor at: sentry.io

**2. Uptime Monitoring:**
- Use UptimeRobot (free)
- Monitor: `https://api.yourpos.com/health`
- Get alerts if down

**3. Server Monitoring:**
- Install Netdata (optional):
```bash
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```
- Access at: `http://YOUR_SERVER_IP:19999`

---

## 🔄 Setup Automated Backups

### **Database Backups:**

Dokploy has built-in backup features:

1. Go to database settings
2. Click **"Backups"** tab
3. Enable **"Automatic Backups"**
4. Schedule: Daily at 2 AM
5. Retention: 30 days
6. Click **"Save"**

### **Manual Backup:**

```bash
# SSH into server
ssh deploy@YOUR_SERVER_IP

# Backup database
docker exec smart-pos-postgres pg_dump -U posuser smart_pos_production > backup_$(date +%Y%m%d).sql

# Download backup
scp deploy@YOUR_SERVER_IP:~/backup_*.sql ./
```

### **Restore from Backup:**

```bash
# Upload backup to server
scp backup_20260526.sql deploy@YOUR_SERVER_IP:~/

# SSH into server
ssh deploy@YOUR_SERVER_IP

# Restore database
docker exec -i smart-pos-postgres psql -U posuser smart_pos_production < backup_20260526.sql
```

---

## 🔍 Troubleshooting

### **Issue: Deployment Fails**

**Check logs:**
```bash
# In Dokploy dashboard
1. Go to application
2. Click "Logs" tab
3. Look for error messages
```

**Common fixes:**
- Verify environment variables are set
- Check Docker images build successfully
- Ensure database is running
- Verify network connectivity

### **Issue: Database Connection Failed**

**Check database status:**
```bash
# In Dokploy, check database container
# Should show "Running" and "Healthy"
```

**Verify connection string:**
```bash
# In application environment variables
# DATABASE_URL should match database credentials
```

**Test connection:**
```bash
# SSH into server
docker exec -it smart-pos-postgres psql -U posuser -d smart_pos_production

# Should connect successfully
```

### **Issue: SSL Certificate Not Working**

**Verify DNS:**
```bash
# Check if domain points to server
dig yourpos.com

# Should return your server IP
```

**Force SSL renewal:**
```bash
# In Dokploy dashboard
1. Go to application domains
2. Click "Renew SSL"
3. Wait 2-3 minutes
```

### **Issue: Application Not Accessible**

**Check firewall:**
```bash
sudo ufw status

# Should show:
# 80/tcp ALLOW
# 443/tcp ALLOW
# 3000/tcp ALLOW
```

**Check containers:**
```bash
docker ps

# All containers should be "Up"
```

**Check logs:**
```bash
docker logs smart-pos-backend
docker logs smart-pos-frontend
```

### **Issue: High Memory Usage**

**Check resource usage:**
```bash
docker stats

# Shows CPU and RAM per container
```

**Optimize if needed:**
- Increase VPS RAM
- Reduce container resources
- Enable swap memory

---

## 📚 Additional Resources

### **Dokploy Documentation:**
- Official Docs: https://docs.dokploy.com
- GitHub: https://github.com/Dokploy/dokploy
- Discord: https://discord.gg/dokploy

### **Your POS System Docs:**
- `QUICK_START_PRODUCTION.md` - Quick deployment
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Detailed guide
- `BACKUP_RESTORE_GUIDE.md` - Backup procedures
- `SECURITY_AUDIT_REPORT.md` - Security details

### **Support:**
- Dokploy Community: Discord
- GitHub Issues: Report bugs
- Email: support@dokploy.com

---

## 🎉 Success Checklist

After completing this guide, you should have:

- ✅ Dokploy installed and running
- ✅ Application deployed and accessible
- ✅ Database configured and connected
- ✅ SSL certificates active (HTTPS)
- ✅ Automated backups enabled
- ✅ Monitoring setup
- ✅ GitHub integration working
- ✅ Health checks passing

**Your Smart POS System is now live in production! 🚀**

---

## 🔄 Next Steps

1. **Test all features** - Verify transactions, inventory, etc.
2. **Monitor for 24 hours** - Watch for errors
3. **Setup staging environment** - For testing updates
4. **Train your team** - On the new system
5. **Celebrate!** 🎉 - You've deployed a production POS system!

---

**Need help?** Check the troubleshooting section or reach out to the Dokploy community.

**Happy deploying! 🚀**

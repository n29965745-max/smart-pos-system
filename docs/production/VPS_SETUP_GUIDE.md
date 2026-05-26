# 🖥️ VPS SETUP GUIDE
**Smart POS System - Contabo VPS + Coolify Deployment**

**Date:** May 26, 2026  
**Target:** Contabo VPS with Coolify  
**Estimated Time:** 2-3 hours  

---

## 📋 OVERVIEW

This guide walks you through setting up a production-ready VPS on Contabo with Docker and Coolify for deploying the Smart POS system.

**What You'll Set Up:**
- Contabo VPS (8GB RAM, 4 vCPU)
- Ubuntu 24.04 LTS
- SSH key authentication
- UFW firewall
- Docker & Docker Compose
- Coolify (self-hosted PaaS)
- SSL certificates (Let's Encrypt)

---

## 🛒 STEP 1: ORDER CONTABO VPS

### **Recommended Specifications:**

**VPS Plan:** VPS M (or higher)
- **RAM:** 8GB
- **CPU:** 4 vCPU cores
- **Storage:** 200GB NVMe SSD
- **Bandwidth:** Unlimited
- **Cost:** ~€10-15/month

### **Order Process:**

1. **Visit:** https://contabo.com/en/vps/
2. **Select:** VPS M plan
3. **Choose Region:** 
   - Europe: Germany (Frankfurt/Nuremberg)
   - US: New York/Seattle
   - Asia: Singapore/Tokyo
   - *Choose closest to your users*
4. **Operating System:** Ubuntu 24.04 LTS
5. **Add-ons:** None required (we'll configure manually)
6. **Complete Order:** Payment via credit card/PayPal

### **After Order:**

You'll receive an email (within 24 hours) with:
- Server IP address
- Root password
- SSH access details

**Example:**
```
IP Address: 123.45.67.89
Username: root
Password: TempPassword123!
```

---

## 🔐 STEP 2: INITIAL SERVER ACCESS

### **2.1: First Login**

```bash
# SSH into your server
ssh root@123.45.67.89

# Enter the password from email
# You'll be prompted to change it on first login
```

### **2.2: Update System**

```bash
# Update package lists
apt update

# Upgrade all packages
apt upgrade -y

# Install essential tools
apt install -y curl wget git vim ufw fail2ban
```

### **2.3: Create Non-Root User**

```bash
# Create deployment user
adduser deploy

# Add to sudo group
usermod -aG sudo deploy

# Switch to deploy user
su - deploy
```

---

## 🔑 STEP 3: SSH KEY AUTHENTICATION

### **3.1: Generate SSH Key (On Your Local Machine)**

```bash
# On your local machine (not the server)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Save to: ~/.ssh/contabo_pos
# Set a passphrase (recommended)
```

### **3.2: Copy Public Key to Server**

```bash
# On your local machine
ssh-copy-id -i ~/.ssh/contabo_pos.pub deploy@123.45.67.89

# Or manually:
cat ~/.ssh/contabo_pos.pub
# Copy the output
```

```bash
# On the server (as deploy user)
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste your public key
chmod 600 ~/.ssh/authorized_keys
```

### **3.3: Test SSH Key Login**

```bash
# On your local machine
ssh -i ~/.ssh/contabo_pos deploy@123.45.67.89

# Should login without password ✅
```

### **3.4: Disable Password Authentication**

```bash
# On the server (as root or with sudo)
sudo nano /etc/ssh/sshd_config

# Find and change these lines:
PasswordAuthentication no
PermitRootLogin no
PubkeyAuthentication yes

# Save and restart SSH
sudo systemctl restart sshd
```

---

## 🔥 STEP 4: CONFIGURE FIREWALL (UFW)

### **4.1: Set Up UFW Rules**

```bash
# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow 22/tcp comment 'SSH'

# Allow HTTP (for Let's Encrypt verification)
sudo ufw allow 80/tcp comment 'HTTP'

# Allow HTTPS
sudo ufw allow 443/tcp comment 'HTTPS'

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

**Expected Output:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere                  # SSH
80/tcp                     ALLOW       Anywhere                  # HTTP
443/tcp                    ALLOW       Anywhere                  # HTTPS
```

### **4.2: Configure fail2ban**

```bash
# Install fail2ban (already installed in Step 2)
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create local config
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Configure SSH protection:
[sshd]
enabled = true
port = 22
maxretry = 3
bantime = 3600
findtime = 600

# Restart fail2ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status sshd
```

---

## 🐳 STEP 5: INSTALL DOCKER

### **5.1: Install Docker Engine**

```bash
# Remove old versions (if any)
sudo apt remove docker docker-engine docker.io containerd runc

# Install dependencies
sudo apt install -y \
  ca-certificates \
  curl \
  gnupg \
  lsb-release

# Add Docker's official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
sudo docker --version
# Expected: Docker version 24.0.x or higher
```

### **5.2: Configure Docker for Non-Root User**

```bash
# Add deploy user to docker group
sudo usermod -aG docker deploy

# Apply group changes (logout and login again)
exit
ssh -i ~/.ssh/contabo_pos deploy@123.45.67.89

# Test Docker without sudo
docker ps
# Should work without errors ✅
```

### **5.3: Configure Docker Daemon**

```bash
# Create daemon config
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
```

```bash
# Restart Docker
sudo systemctl restart docker
sudo systemctl enable docker
```

---

## 🚀 STEP 6: INSTALL COOLIFY

### **6.1: What is Coolify?**

Coolify is a self-hosted Heroku/Vercel alternative that:
- Manages Docker deployments
- Handles SSL certificates automatically
- Provides a web UI for deployments
- Supports GitHub/GitLab integration
- Manages environment variables
- Provides monitoring and logs

### **6.2: Install Coolify**

```bash
# Run Coolify installation script
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash

# This will:
# - Install Coolify
# - Set up Docker networks
# - Start Coolify services
# - Generate admin credentials

# Wait for installation to complete (2-5 minutes)
```

**Installation Output:**
```
✅ Coolify installed successfully!

Access Coolify at: http://123.45.67.89:8000
Default credentials:
  Email: admin@example.com
  Password: <generated-password>

IMPORTANT: Change these credentials immediately!
```

### **6.3: Access Coolify Dashboard**

```bash
# Open in browser
http://123.45.67.89:8000

# Login with credentials from installation
# You'll be prompted to change password
```

### **6.4: Initial Coolify Configuration**

1. **Change Admin Password:**
   - Settings → Profile → Change Password
   - Use a strong password (20+ characters)

2. **Configure Email (Optional):**
   - Settings → Email
   - Add SMTP settings for notifications

3. **Add SSH Key:**
   - Settings → SSH Keys
   - Add your deployment SSH key

4. **Configure Domain:**
   - Settings → Instance
   - Set your domain (e.g., coolify.yourpos.com)

---

## 🌐 STEP 7: DOMAIN & DNS CONFIGURATION

### **7.1: Point Domain to VPS**

**In Your Domain Registrar (e.g., Namecheap, GoDaddy, Cloudflare):**

Add these DNS records:

```
Type    Name              Value              TTL
A       @                 123.45.67.89       300
A       www               123.45.67.89       300
A       api               123.45.67.89       300
A       coolify           123.45.67.89       300
CNAME   *.yourpos.com     yourpos.com        300
```

**Example for Smart POS:**
```
A       @                 123.45.67.89       300
A       www               123.45.67.89       300
A       api               123.45.67.89       300
A       app               123.45.67.89       300
```

### **7.2: Verify DNS Propagation**

```bash
# Check DNS resolution (on your local machine)
dig yourpos.com +short
# Should return: 123.45.67.89

# Or use online tool:
# https://dnschecker.org
```

**Note:** DNS propagation can take 5 minutes to 48 hours

---

## 🔒 STEP 8: SSL CERTIFICATE SETUP

### **8.1: SSL via Coolify (Recommended)**

Coolify automatically handles SSL certificates using Let's Encrypt.

**In Coolify Dashboard:**

1. **Go to:** Project → Your Application
2. **Click:** Domains
3. **Add Domain:** api.yourpos.com
4. **Enable SSL:** Toggle "Enable SSL"
5. **Wait:** Coolify will automatically:
   - Request Let's Encrypt certificate
   - Configure HTTPS
   - Set up auto-renewal

**Verification:**
```bash
# Check SSL certificate
curl -I https://api.yourpos.com

# Should return:
HTTP/2 200
```

### **8.2: Manual SSL Setup (Alternative)**

If you prefer manual setup:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Request certificate
sudo certbot certonly --standalone -d api.yourpos.com -d www.yourpos.com

# Certificates saved to:
# /etc/letsencrypt/live/api.yourpos.com/fullchain.pem
# /etc/letsencrypt/live/api.yourpos.com/privkey.pem

# Set up auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### **8.3: Test SSL Configuration**

```bash
# Test SSL strength
# Visit: https://www.ssllabs.com/ssltest/

# Enter your domain: api.yourpos.com
# Target grade: A or A+
```

---

## 📊 STEP 9: SYSTEM MONITORING SETUP

### **9.1: Install Monitoring Tools**

```bash
# Install htop for system monitoring
sudo apt install -y htop

# Install ncdu for disk usage
sudo apt install -y ncdu

# Install netdata for real-time monitoring (optional)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access Netdata at: http://123.45.67.89:19999
```

### **9.2: Configure Log Rotation**

```bash
# Create logrotate config for application logs
sudo nano /etc/logrotate.d/smartpos
```

```
/var/log/smartpos/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        docker restart smartpos-backend 2>/dev/null || true
    endscript
}
```

```bash
# Test logrotate
sudo logrotate -d /etc/logrotate.d/smartpos
```

---

## 🔍 STEP 10: VERIFY SETUP

### **10.1: System Check**

```bash
# Check system resources
free -h
df -h
htop

# Check Docker
docker --version
docker ps
docker network ls

# Check firewall
sudo ufw status

# Check fail2ban
sudo fail2ban-client status
```

### **10.2: Security Check**

```bash
# Verify SSH config
sudo sshd -T | grep -E 'passwordauthentication|permitrootlogin'
# Should show:
# passwordauthentication no
# permitrootlogin no

# Check open ports
sudo ss -tulpn | grep LISTEN

# Should only show:
# 22 (SSH)
# 80 (HTTP)
# 443 (HTTPS)
# 8000 (Coolify - can be firewalled after setup)
```

### **10.3: Performance Baseline**

```bash
# CPU info
lscpu

# Memory info
free -h

# Disk speed test
sudo hdparm -Tt /dev/sda

# Network speed test
curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3 -
```

---

## 📋 SETUP CHECKLIST

### **Infrastructure:**
- [ ] Contabo VPS ordered and accessible
- [ ] Ubuntu 24.04 installed
- [ ] System updated (`apt update && apt upgrade`)
- [ ] Non-root user created (`deploy`)
- [ ] SSH key authentication configured
- [ ] Password authentication disabled
- [ ] Root login disabled

### **Security:**
- [ ] UFW firewall enabled
- [ ] Only ports 22, 80, 443 open
- [ ] fail2ban configured and running
- [ ] SSH hardened (no password, no root)

### **Docker:**
- [ ] Docker Engine installed
- [ ] Docker Compose installed
- [ ] Deploy user in docker group
- [ ] Docker daemon configured

### **Coolify:**
- [ ] Coolify installed
- [ ] Admin password changed
- [ ] SSH keys added
- [ ] Domain configured

### **DNS & SSL:**
- [ ] Domain DNS pointed to VPS IP
- [ ] DNS propagation verified
- [ ] SSL certificate obtained
- [ ] HTTPS working

### **Monitoring:**
- [ ] htop installed
- [ ] Log rotation configured
- [ ] Netdata installed (optional)

---

## 🚨 TROUBLESHOOTING

### **Issue: Can't SSH into server**

```bash
# Check if SSH service is running
sudo systemctl status sshd

# Check firewall
sudo ufw status

# Check SSH logs
sudo tail -f /var/log/auth.log
```

### **Issue: Docker permission denied**

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
exit
ssh -i ~/.ssh/contabo_pos deploy@123.45.67.89
```

### **Issue: Coolify not accessible**

```bash
# Check Coolify status
docker ps | grep coolify

# Check Coolify logs
docker logs coolify

# Restart Coolify
cd /data/coolify/source
docker compose restart
```

### **Issue: SSL certificate failed**

```bash
# Check DNS resolution
dig api.yourpos.com +short

# Check port 80 is open (required for Let's Encrypt)
sudo ufw status | grep 80

# Check Coolify logs
docker logs coolify | grep -i ssl
```

---

## 📚 NEXT STEPS

After completing this setup:

1. **Deploy Application:**
   - Follow `COOLIFY_DEPLOYMENT_GUIDE.md`
   - Configure environment variables
   - Deploy backend and frontend

2. **Configure Backups:**
   - Set up automated database backups
   - Configure off-site backup storage

3. **Set Up Monitoring:**
   - Configure Sentry
   - Set up uptime monitoring
   - Configure alerts

4. **Test Deployment:**
   - Run smoke tests
   - Verify all features work
   - Test SSL/HTTPS

---

## 🔗 USEFUL COMMANDS

```bash
# System monitoring
htop                          # Interactive process viewer
df -h                         # Disk usage
free -h                       # Memory usage
sudo ufw status               # Firewall status

# Docker management
docker ps                     # Running containers
docker logs <container>       # View logs
docker stats                  # Resource usage
docker system prune -a        # Clean up unused resources

# Coolify management
cd /data/coolify/source
docker compose logs -f        # View Coolify logs
docker compose restart        # Restart Coolify

# SSL certificate renewal
sudo certbot renew --dry-run  # Test renewal
sudo certbot certificates     # List certificates

# Security
sudo fail2ban-client status   # Check banned IPs
sudo tail -f /var/log/auth.log # Monitor SSH attempts
```

---

## 📞 SUPPORT RESOURCES

- **Contabo Support:** https://contabo.com/support/
- **Coolify Docs:** https://coolify.io/docs
- **Docker Docs:** https://docs.docker.com
- **Ubuntu Server Guide:** https://ubuntu.com/server/docs
- **Let's Encrypt:** https://letsencrypt.org/docs/

---

**Setup Time:** 2-3 hours  
**Difficulty:** Intermediate  
**Status:** Production-Ready ✅

**Next:** Deploy Smart POS application using Coolify

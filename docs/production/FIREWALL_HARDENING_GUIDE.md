# 🔥 FIREWALL HARDENING GUIDE
**Smart POS System - VPS Security Configuration**

**Date:** May 26, 2026  
**Target:** Ubuntu 24.04 VPS  
**Estimated Time:** 1 hour  

---

## 📋 OVERVIEW

This guide covers comprehensive firewall configuration and security hardening for your Smart POS production VPS using UFW (Uncomplicated Firewall) and additional security measures.

**Security Layers:**
1. UFW firewall rules
2. fail2ban intrusion prevention
3. SSH hardening
4. Port security
5. DDoS protection
6. Network monitoring

---

## 🔥 STEP 1: UFW FIREWALL SETUP

### **1.1: Install UFW**

```bash
# UFW is pre-installed on Ubuntu 24.04
# Verify installation
sudo ufw version

# If not installed:
sudo apt update
sudo apt install -y ufw
```

### **1.2: Default Policies**

```bash
# Deny all incoming traffic by default
sudo ufw default deny incoming

# Allow all outgoing traffic by default
sudo ufw default allow outgoing

# Verify defaults
sudo ufw status verbose
```

### **1.3: Allow Essential Services**

```bash
# CRITICAL: Allow SSH first (before enabling firewall)
sudo ufw allow 22/tcp comment 'SSH'

# Allow HTTP (for Let's Encrypt verification)
sudo ufw allow 80/tcp comment 'HTTP'

# Allow HTTPS
sudo ufw allow 443/tcp comment 'HTTPS'

# Optional: Allow Coolify dashboard (can be removed after setup)
sudo ufw allow 8000/tcp comment 'Coolify Dashboard'
```

### **1.4: Enable Firewall**

```bash
# Enable UFW
sudo ufw enable

# Verify status
sudo ufw status numbered
```

**Expected Output:**
```
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     ALLOW IN    Anywhere                  # SSH
[ 2] 80/tcp                     ALLOW IN    Anywhere                  # HTTP
[ 3] 443/tcp                    ALLOW IN    Anywhere                  # HTTPS
[ 4] 8000/tcp                   ALLOW IN    Anywhere                  # Coolify Dashboard
```

### **1.5: Remove Coolify Dashboard Access (After Setup)**

```bash
# After Coolify is configured, remove public access
sudo ufw delete allow 8000/tcp

# Or restrict to specific IP
sudo ufw allow from YOUR_IP_ADDRESS to any port 8000 comment 'Coolify Admin'
```

---

## 🛡️ STEP 2: ADVANCED UFW RULES

### **2.1: Rate Limiting for SSH**

```bash
# Limit SSH connections to prevent brute force
sudo ufw limit 22/tcp comment 'SSH Rate Limit'

# This allows max 6 connections per 30 seconds from same IP
```

### **2.2: Allow Specific IP Ranges (Optional)**

```bash
# Allow admin access from specific IP
sudo ufw allow from 203.0.113.10 to any port 22 comment 'Admin SSH'

# Allow office network
sudo ufw allow from 203.0.113.0/24 comment 'Office Network'

# Allow Cloudflare IPs (if using Cloudflare)
# Get latest IPs from: https://www.cloudflare.com/ips/
sudo ufw allow from 173.245.48.0/20 comment 'Cloudflare'
sudo ufw allow from 103.21.244.0/22 comment 'Cloudflare'
# ... add all Cloudflare IP ranges
```

### **2.3: Block Specific IPs**

```bash
# Block malicious IP
sudo ufw deny from 198.51.100.50 comment 'Blocked IP'

# Block IP range
sudo ufw deny from 198.51.100.0/24 comment 'Blocked Range'
```

### **2.4: Logging**

```bash
# Enable logging (medium level)
sudo ufw logging medium

# Log levels: off, low, medium, high, full
# Recommended: medium (balance between detail and disk usage)

# View logs
sudo tail -f /var/log/ufw.log
```

---

## 🚫 STEP 3: FAIL2BAN CONFIGURATION

### **3.1: Install fail2ban**

```bash
# Install fail2ban
sudo apt update
sudo apt install -y fail2ban

# Enable and start service
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### **3.2: Configure fail2ban**

```bash
# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local
```

**Add/modify these settings:**

```ini
[DEFAULT]
# Ban time: 1 hour
bantime = 3600

# Find time: 10 minutes
findtime = 600

# Max retries before ban
maxretry = 3

# Email notifications (optional)
destemail = admin@yourpos.com
sendername = Fail2Ban
action = %(action_mwl)s

[sshd]
enabled = true
port = 22
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
findtime = 600

[nginx-http-auth]
enabled = true
port = http,https
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
port = http,https
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
maxretry = 5

[nginx-botsearch]
enabled = true
port = http,https
filter = nginx-botsearch
logpath = /var/log/nginx/access.log
maxretry = 2
```

### **3.3: Create Custom Filters**

**API Rate Limit Filter:**

```bash
# Create filter for API abuse
sudo nano /etc/fail2ban/filter.d/api-abuse.conf
```

```ini
[Definition]
failregex = ^<HOST> .* "POST /api/.* HTTP/.*" 429 .*$
            ^<HOST> .* "POST /api/auth/login.* HTTP/.*" 401 .*$
ignoreregex =
```

**Add jail for API abuse:**

```bash
sudo nano /etc/fail2ban/jail.local
```

```ini
[api-abuse]
enabled = true
port = http,https
filter = api-abuse
logpath = /var/log/nginx/access.log
maxretry = 10
findtime = 300
bantime = 1800
```

### **3.4: Restart fail2ban**

```bash
# Restart fail2ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status

# Check specific jail
sudo fail2ban-client status sshd
```

### **3.5: Manage Banned IPs**

```bash
# List banned IPs
sudo fail2ban-client status sshd

# Unban IP
sudo fail2ban-client set sshd unbanip 198.51.100.50

# Ban IP manually
sudo fail2ban-client set sshd banip 198.51.100.50
```

---

## 🔐 STEP 4: SSH HARDENING

### **4.1: SSH Configuration**

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config
```

**Recommended settings:**

```bash
# Disable root login
PermitRootLogin no

# Disable password authentication
PasswordAuthentication no
PubkeyAuthentication yes

# Disable empty passwords
PermitEmptyPasswords no

# Disable X11 forwarding
X11Forwarding no

# Disable TCP forwarding (if not needed)
AllowTcpForwarding no

# Set login grace time
LoginGraceTime 30

# Max authentication attempts
MaxAuthTries 3

# Max sessions per connection
MaxSessions 2

# Allowed users (optional)
AllowUsers deploy

# Use strong ciphers only
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr

# Use strong MACs
MACs hmac-sha2-512-etm@openssh.com,hmac-sha2-256-etm@openssh.com,hmac-sha2-512,hmac-sha2-256

# Use strong key exchange algorithms
KexAlgorithms curve25519-sha256,curve25519-sha256@libssh.org,diffie-hellman-group-exchange-sha256

# Disable weak algorithms
HostKeyAlgorithms ssh-ed25519,rsa-sha2-512,rsa-sha2-256
```

### **4.2: Restart SSH**

```bash
# Test configuration
sudo sshd -t

# If no errors, restart SSH
sudo systemctl restart sshd
```

### **4.3: Change SSH Port (Optional)**

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Change port (e.g., to 2222)
Port 2222

# Update firewall
sudo ufw allow 2222/tcp comment 'SSH Custom Port'
sudo ufw delete allow 22/tcp

# Restart SSH
sudo systemctl restart sshd

# Test new port before closing current session
ssh -p 2222 deploy@your-server-ip
```

---

## 🌐 STEP 5: NETWORK SECURITY

### **5.1: Disable IPv6 (If Not Used)**

```bash
# Edit sysctl config
sudo nano /etc/sysctl.conf

# Add these lines
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1
net.ipv6.conf.lo.disable_ipv6 = 1

# Apply changes
sudo sysctl -p
```

### **5.2: Enable SYN Cookies (DDoS Protection)**

```bash
# Edit sysctl config
sudo nano /etc/sysctl.conf

# Add these lines
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 2048
net.ipv4.tcp_synack_retries = 2
net.ipv4.tcp_syn_retries = 5

# Apply changes
sudo sysctl -p
```

### **5.3: IP Spoofing Protection**

```bash
# Edit sysctl config
sudo nano /etc/sysctl.conf

# Add these lines
net.ipv4.conf.all.rp_filter = 1
net.ipv4.conf.default.rp_filter = 1

# Apply changes
sudo sysctl -p
```

### **5.4: Ignore ICMP Redirects**

```bash
# Edit sysctl config
sudo nano /etc/sysctl.conf

# Add these lines
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Apply changes
sudo sysctl -p
```

### **5.5: Enable IP Forwarding (For Docker)**

```bash
# Edit sysctl config
sudo nano /etc/sysctl.conf

# Add this line
net.ipv4.ip_forward = 1

# Apply changes
sudo sysctl -p
```

---

## 📊 STEP 6: MONITORING & ALERTS

### **6.1: Install Monitoring Tools**

```bash
# Install netstat and ss
sudo apt install -y net-tools

# Install iftop for network monitoring
sudo apt install -y iftop

# Install vnstat for bandwidth monitoring
sudo apt install -y vnstat
sudo systemctl enable vnstat
sudo systemctl start vnstat
```

### **6.2: Monitor Open Ports**

```bash
# List all listening ports
sudo ss -tulpn | grep LISTEN

# Expected output (only these ports):
# 22 (SSH)
# 80 (HTTP)
# 443 (HTTPS)
# 127.0.0.1:5432 (PostgreSQL - local only)
# 127.0.0.1:6379 (Redis - local only, if used)
```

### **6.3: Monitor Active Connections**

```bash
# Show active connections
sudo netstat -antp

# Show connections by state
sudo ss -s

# Monitor in real-time
sudo watch -n 1 'ss -s'
```

### **6.4: Set Up Log Monitoring**

```bash
# Install logwatch
sudo apt install -y logwatch

# Configure logwatch
sudo nano /etc/logwatch/conf/logwatch.conf

# Set these values:
Output = mail
Format = html
MailTo = admin@yourpos.com
MailFrom = logwatch@yourpos.com
Detail = High

# Run logwatch manually
sudo logwatch --detail High --mailto admin@yourpos.com --service All --range today

# Add to cron for daily reports
sudo crontab -e
# Add: 0 6 * * * /usr/sbin/logwatch --detail High --mailto admin@yourpos.com --service All --range yesterday
```

---

## 🚨 STEP 7: INTRUSION DETECTION

### **7.1: Install AIDE (Advanced Intrusion Detection)**

```bash
# Install AIDE
sudo apt install -y aide

# Initialize AIDE database
sudo aideinit

# Move database
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Run check
sudo aide --check

# Add to cron for daily checks
sudo crontab -e
# Add: 0 3 * * * /usr/bin/aide --check | mail -s "AIDE Report" admin@yourpos.com
```

### **7.2: Install rkhunter (Rootkit Hunter)**

```bash
# Install rkhunter
sudo apt install -y rkhunter

# Update database
sudo rkhunter --update

# Run scan
sudo rkhunter --check --skip-keypress

# Add to cron for weekly scans
sudo crontab -e
# Add: 0 4 * * 0 /usr/bin/rkhunter --check --skip-keypress --report-warnings-only | mail -s "rkhunter Report" admin@yourpos.com
```

---

## 🔍 STEP 8: SECURITY AUDIT

### **8.1: Run Security Audit**

```bash
# Install Lynis
sudo apt install -y lynis

# Run audit
sudo lynis audit system

# Review results
sudo cat /var/log/lynis.log

# Target score: 80+ (hardening index)
```

### **8.2: Check for Vulnerabilities**

```bash
# Update package lists
sudo apt update

# Check for security updates
sudo apt list --upgradable

# Install security updates only
sudo unattended-upgrades --dry-run
sudo unattended-upgrades
```

### **8.3: Enable Automatic Security Updates**

```bash
# Install unattended-upgrades
sudo apt install -y unattended-upgrades

# Configure
sudo dpkg-reconfigure -plow unattended-upgrades

# Edit config
sudo nano /etc/apt/apt.conf.d/50unattended-upgrades

# Enable these lines:
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::Automatic-Reboot "false";
Unattended-Upgrade::Mail "admin@yourpos.com";
```

---

## 📋 SECURITY CHECKLIST

### **Firewall:**
- [ ] UFW installed and enabled
- [ ] Default deny incoming
- [ ] Only ports 22, 80, 443 open
- [ ] SSH rate limiting enabled
- [ ] Logging enabled (medium level)

### **Intrusion Prevention:**
- [ ] fail2ban installed and configured
- [ ] SSH jail enabled
- [ ] API abuse filter configured
- [ ] Email notifications set up

### **SSH Security:**
- [ ] Root login disabled
- [ ] Password authentication disabled
- [ ] Key-based authentication only
- [ ] Strong ciphers configured
- [ ] Max auth attempts limited

### **Network Security:**
- [ ] SYN cookies enabled
- [ ] IP spoofing protection enabled
- [ ] ICMP redirects disabled
- [ ] IPv6 disabled (if not used)

### **Monitoring:**
- [ ] Monitoring tools installed
- [ ] Log monitoring configured
- [ ] Daily security reports enabled
- [ ] Intrusion detection active

### **Updates:**
- [ ] System fully updated
- [ ] Automatic security updates enabled
- [ ] Security audit passed (Lynis 80+)

---

## 🚨 INCIDENT RESPONSE

### **If Server is Compromised:**

1. **Isolate Server:**
   ```bash
   # Block all incoming traffic
   sudo ufw default deny incoming
   sudo ufw reload
   ```

2. **Check for Backdoors:**
   ```bash
   # Check for unauthorized users
   cat /etc/passwd
   
   # Check for unauthorized SSH keys
   cat ~/.ssh/authorized_keys
   
   # Check for suspicious processes
   ps aux | grep -v "\[" | sort -k3 -r | head -20
   
   # Check for suspicious network connections
   sudo netstat -antp | grep ESTABLISHED
   ```

3. **Review Logs:**
   ```bash
   # Check auth logs
   sudo tail -100 /var/log/auth.log
   
   # Check UFW logs
   sudo tail -100 /var/log/ufw.log
   
   # Check fail2ban logs
   sudo tail -100 /var/log/fail2ban.log
   ```

4. **Restore from Backup:**
   ```bash
   # Follow BACKUP_RESTORE_GUIDE.md
   ```

---

## 🔧 USEFUL COMMANDS

```bash
# Firewall management
sudo ufw status numbered          # Show rules with numbers
sudo ufw delete [number]          # Delete rule by number
sudo ufw reload                   # Reload firewall
sudo ufw reset                    # Reset to defaults

# fail2ban management
sudo fail2ban-client status       # Show all jails
sudo fail2ban-client status sshd  # Show SSH jail status
sudo fail2ban-client set sshd unbanip IP  # Unban IP

# Network monitoring
sudo ss -tulpn                    # Show listening ports
sudo netstat -antp                # Show active connections
sudo iftop                        # Real-time bandwidth monitor
vnstat -d                         # Daily bandwidth stats

# Security auditing
sudo lynis audit system           # Run security audit
sudo rkhunter --check             # Check for rootkits
sudo aide --check                 # Check file integrity
```

---

## 📚 ADDITIONAL RESOURCES

- **UFW Documentation:** https://help.ubuntu.com/community/UFW
- **fail2ban Documentation:** https://www.fail2ban.org/wiki/index.php/Main_Page
- **SSH Hardening Guide:** https://www.ssh.com/academy/ssh/hardening
- **Lynis Documentation:** https://cisofy.com/lynis/
- **OWASP Server Security:** https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html

---

**Hardening Time:** 1-2 hours  
**Difficulty:** Intermediate  
**Security Level:** Production-Grade ✅

**Next:** Deploy Smart POS application

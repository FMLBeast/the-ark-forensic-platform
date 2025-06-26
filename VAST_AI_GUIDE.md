# 🚀 The Ark - Vast.ai Deployment Guide

## Complete Full-Stack Deployment for Vast.ai

### 🎯 **Step 1: Create Vast.ai Instance**

1. Go to https://vast.ai/console/create/
2. **Recommended specs**:
   - **GPU**: Any (CPU-only is sufficient)
   - **RAM**: 8GB+ recommended for full stack  
   - **Disk**: 30GB+ (includes backend, database, uploads)
   - **Image**: `ubuntu:20.04` or `ubuntu:22.04`
3. **Open ports**: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (Backend API)
4. **Instance type**: On-demand (recommended for production)

### 🔧 **Step 2: Connect to Instance**

```bash
# SSH to your instance (replace with your instance details)
ssh root@[INSTANCE_IP] -p [SSH_PORT]
```

### 🚀 **Step 3: Run Automated Full-Stack Setup**

**Option A: Direct GitHub Clone (Recommended)**
```bash
# SSH to your instance
ssh root@[INSTANCE_IP] -p [SSH_PORT]

# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/FMLBeast/the-ark-forensic-platform/main/scripts/vast-ai-full-setup.sh -o setup.sh
chmod +x setup.sh
./setup.sh
```

**Option B: Manual Upload + Setup**
```bash
# From your local machine, upload the project
scp -P [SSH_PORT] -r /path/to/ark_react root@[INSTANCE_IP]:/opt/the-ark

# SSH to instance and run setup
ssh root@[INSTANCE_IP] -p [SSH_PORT]
cd /opt/the-ark
chmod +x scripts/vast-ai-full-setup.sh
./scripts/vast-ai-full-setup.sh
```

The automated setup will:
- ✅ Install Node.js 18, PM2, Nginx, SQLite
- ✅ Install forensic tools (exiftool, file, steghide, zsteg)
- ✅ Clone latest code from GitHub
- ✅ Install frontend and backend dependencies
- ✅ Build The Ark frontend
- ✅ Configure environment variables
- ✅ Set up database and file storage
- ✅ Configure Nginx with API proxy
- ✅ Start backend with PM2 process manager
- ✅ Set up firewall and security
- ✅ Create management scripts

### 🌐 **Step 4: Access Your Application**

After setup completes, you'll have access to:
```
🌐 Frontend:     http://[INSTANCE_IP]
🔧 Backend API:  http://[INSTANCE_IP]/api
💓 Health Check: http://[INSTANCE_IP]/health
🔌 WebSocket:    ws://[INSTANCE_IP]/ws
```

**Default Login Credentials:**
- Username: `admin`
- Password: `admin123`

---

## 🛠️ **Management Commands**

Once deployed, use these commands on your instance:

```bash
# Check full application status
ark-status

# Restart all services
ark-restart

# View application logs
ark-logs

# Update from GitHub
ark-update

# Monitor backend processes
pm2 monit

# Manual service management
sudo systemctl restart nginx    # Restart web server
pm2 restart ark-backend        # Restart backend only
pm2 logs ark-backend          # View backend logs

# System monitoring
df -h                         # Check disk usage
free -h                       # Check memory usage
htop                         # Process monitor
```

---

## 🔧 **Configuration Options**

### **Environment Variables**
Edit `/opt/the-ark/.env.production`:
```bash
nano /opt/the-ark/.env.production
```

### **Nginx Configuration**
Edit Nginx config:
```bash
sudo nano /etc/nginx/sites-enabled/default
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### **Custom Domain** (Optional)
1. Point your domain to the instance IP
2. Update Nginx config with your domain
3. Set up SSL with Let's Encrypt:
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 📊 **Resource Usage**

### **Typical Resource Requirements**
- **CPU**: 1-2 cores (frontend only)
- **RAM**: 2-4GB for build, 1GB for runtime
- **Disk**: 10GB for application + dependencies
- **Bandwidth**: Minimal (static frontend)

### **GPU Usage**
- **Not required** for the frontend
- **Available** for future ML/AI features
- **Cost optimization**: Choose CPU-only instances

---

## 🔍 **Troubleshooting**

### **Common Issues**

1. **Port not accessible**:
   ```bash
   # Check if Nginx is running
   sudo systemctl status nginx
   
   # Check firewall
   sudo ufw status
   ```

2. **Build fails**:
   ```bash
   # Check Node.js version
   node --version  # Should be 18+
   
   # Clear npm cache
   npm cache clean --force
   npm install
   ```

3. **Out of disk space**:
   ```bash
   # Check disk usage
   df -h
   
   # Clean up
   docker system prune -a
   npm cache clean --force
   ```

### **Debug Mode**
```bash
# Check all services
systemctl status nginx
systemctl status docker

# Test Nginx config
sudo nginx -t

# Check application files
ls -la /var/www/the-ark/

# View detailed logs
journalctl -u nginx -f
```

---

## 🚀 **Performance Optimization**

### **Nginx Tuning**
```bash
# Edit nginx.conf for high-traffic
sudo nano /etc/nginx/nginx.conf

# Increase worker processes
worker_processes auto;
worker_connections 1024;
```

### **Caching**
- Static assets cached for 1 year
- HTML no-cache for updates
- Gzip compression enabled

### **Monitoring**
```bash
# Install htop for monitoring
apt-get install htop

# Monitor resources
htop
```

---

## 💰 **Cost Optimization**

### **Instance Selection**
- **CPU-only instances**: $0.10-0.50/hour
- **With GPU**: $0.20-2.00/hour (not needed)
- **Interruptible**: 50-90% cost savings

### **Auto-shutdown**
```bash
# Auto-shutdown after 1 hour of inactivity
echo "sudo shutdown -h +60" | at now
```

### **Spot Instances**
- Use interruptible instances for testing
- Set up auto-backup for important data

---

## 🎯 **Production Checklist**

### **Before Going Live**
- [ ] Instance has stable IP or domain
- [ ] SSL certificate configured (optional)
- [ ] Backup strategy in place
- [ ] Monitoring set up
- [ ] Firewall properly configured

### **Security**
- [ ] SSH key authentication
- [ ] Firewall enabled (ufw)
- [ ] Regular updates scheduled
- [ ] Non-root user (if needed)

### **Testing**
- [ ] Login functionality works
- [ ] Challenge system loads
- [ ] All routes accessible
- [ ] Mobile responsiveness
- [ ] Performance acceptable

---

## 🌟 **Your Ark is Ready!**

Once deployed on Vast.ai, your complete forensic investigation platform will be accessible globally with:

✅ **Real Agent Orchestration** - File analysis, steganography, cryptography, intelligence agents  
✅ **Full Backend API** - Complete Node.js/Express server with SQLite database  
✅ **Authentication System** - JWT-based login with role-based access control  
✅ **File Upload & Analysis** - Real-time forensic analysis with entropy calculation  
✅ **Investigation Management** - Collaborative case management and evidence tracking  
✅ **WebSocket Updates** - Real-time progress tracking and notifications  
✅ **Security Features** - Rate limiting, CORS protection, input validation  
✅ **Professional UI** - Matrix-themed responsive interface  
✅ **Production Ready** - PM2 process management, Nginx proxy, monitoring tools  

**Access your live application at**: `http://[YOUR_VAST_INSTANCE_IP]`

**Full Stack Endpoints:**
- Frontend: `http://[IP]`
- Backend API: `http://[IP]/api`
- WebSocket: `ws://[IP]/ws`
- Health Check: `http://[IP]/health`

Ready for serious forensic investigation! 🔍🛡️
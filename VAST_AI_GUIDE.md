# 🚀 The Ark - Vast.ai Deployment Guide

## Quick Setup for Vast.ai GPU Instances

### 🎯 **Step 1: Create Vast.ai Instance**

1. Go to https://vast.ai/console/create/
2. **Recommended specs**:
   - **GPU**: Any (CPU-only is fine for this app)
   - **RAM**: 8GB+ recommended  
   - **Disk**: 20GB+ 
   - **Image**: `pytorch/pytorch:latest` or `ubuntu:20.04`
3. **Open ports**: 22 (SSH), 80 (HTTP), 443 (HTTPS)
4. **Instance type**: On-demand or Interruptible

### 🔧 **Step 2: Connect to Instance**

```bash
# SSH to your instance (replace with your instance details)
ssh root@[INSTANCE_IP] -p [SSH_PORT]
```

### 📦 **Step 3: Upload Application**

**Option A: SCP Upload (Recommended)**
```bash
# From your local machine, upload the entire project
scp -P [SSH_PORT] -r /home/beast/dev/ark_react root@[INSTANCE_IP]:/opt/the-ark
```

**Option B: Git Clone**
```bash
# On the instance, clone your repository
cd /opt
git clone [YOUR_GITHUB_REPO] the-ark
```

**Option C: Vast.ai File Manager**
1. Use Vast.ai web interface file manager
2. Upload files to `/opt/the-ark/`

### 🚀 **Step 4: Run Automated Setup**

```bash
# SSH to your instance
ssh root@[INSTANCE_IP] -p [SSH_PORT]

# Navigate to app directory
cd /opt/the-ark

# Make setup script executable
chmod +x vast-ai-setup.sh

# Run the automated setup
./vast-ai-setup.sh
```

The script will:
- ✅ Install Node.js 18, Nginx, Docker
- ✅ Install application dependencies
- ✅ Build The Ark frontend
- ✅ Configure Nginx for production
- ✅ Set up firewall rules
- ✅ Start all services

### 🌐 **Step 5: Access Your Application**

After setup completes:
```
🌟 Your application is live at: http://[INSTANCE_IP]
```

---

## 🛠️ **Management Commands**

Once deployed, use these commands on your instance:

```bash
# Check application status
ark-status

# Update application (if using git)
update-ark

# Restart web server
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check disk usage
df -h
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

Once deployed on Vast.ai, your sophisticated steganographic ARG platform will be accessible globally with:

✅ **12 Pre-filled Challenges** from your technical briefing  
✅ **6-Phase ARG System** (Bitplane → VM → GPG → Network → Archaeology → Final Assembly)  
✅ **Challenge Management** for collaborative puzzle-solving  
✅ **Agent Dashboard** for AI orchestration  
✅ **Matrix-themed UI** with full responsiveness  
✅ **Demo Authentication** ready for backend integration  

**Access your live application at**: `http://[YOUR_VAST_INSTANCE_IP]`

Happy puzzle solving! 🧩✨
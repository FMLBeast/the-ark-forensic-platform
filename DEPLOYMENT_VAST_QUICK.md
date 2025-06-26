# 🚀 The Ark - Quick Vast.ai Deployment

## One-Command Deployment

### Step 1: Create Vast.ai Instance
1. Go to https://vast.ai/console/create/
2. **Recommended specs**:
   - **Image**: `ubuntu:20.04` or `ubuntu:22.04`
   - **RAM**: 8GB+
   - **Disk**: 30GB+
   - **Open ports**: 22, 80, 443, 3000
3. Launch instance and note the IP and SSH port

### Step 2: Connect and Deploy
```bash
# SSH to your instance
ssh root@[INSTANCE_IP] -p [SSH_PORT]

# Run one-command deployment
curl -fsSL https://raw.githubusercontent.com/FMLBeast/the-ark-forensic-platform/main/deploy-vast.sh | bash
```

### Step 3: Access Your Application
After deployment (5-10 minutes):
- **Frontend**: http://[INSTANCE_IP]
- **Backend API**: http://[INSTANCE_IP]/api
- **Login**: admin / admin123

## What Gets Deployed

✅ **Complete Full-Stack Application**
- React frontend with Matrix-themed UI
- Node.js/Express backend with real agent orchestration
- SQLite database with forensic data schema
- PM2 process management for backend
- Nginx proxy server with WebSocket support

✅ **Real Forensic Analysis Agents**
- File Analysis Agent (entropy, metadata, file type detection)
- Steganography Agent (LSB analysis, zsteg, steghide integration)
- Cryptography Agent (XOR analysis, Base64 detection)
- Intelligence Agent (pattern synthesis, correlation)

✅ **Production Features**
- JWT authentication with role-based access
- File upload with security validation
- WebSocket real-time updates
- Investigation management system
- Rate limiting and CORS protection
- SSL-ready configuration

✅ **Forensic Tools Installed**
- exiftool (metadata extraction)
- file (file type detection)
- steghide (steganography analysis)
- zsteg (image steganography detection)

## Management Commands

Once deployed, use these commands on your instance:

```bash
# Check application status
ark-status

# Restart all services
ark-restart

# View logs
ark-logs

# Update from GitHub
ark-update

# Monitor backend processes
pm2 monit
```

## Alternative: Docker Deployment

If you prefer Docker:

```bash
# Clone repository
git clone https://github.com/FMLBeast/the-ark-forensic-platform.git
cd the-ark-forensic-platform

# Build and start with Docker Compose
docker-compose up -d

# Access at http://[INSTANCE_IP]
```

## Troubleshooting

### Common Issues

**Port not accessible:**
```bash
# Check if services are running
ark-status
sudo systemctl status nginx
pm2 status
```

**Backend not starting:**
```bash
# Check backend logs
pm2 logs ark-backend
# Restart backend
pm2 restart ark-backend
```

**Out of disk space:**
```bash
# Check disk usage
df -h
# Clean up if needed
docker system prune -a  # If using Docker
npm cache clean --force
```

## Cost Optimization

- **CPU-only instances**: $0.10-0.50/hour (sufficient)
- **Interruptible instances**: 50-90% cost savings
- **Auto-shutdown**: Set up auto-shutdown for testing

## Security Notes

- Default login is admin/admin123 - change in production
- Firewall configured for ports 22, 80, 443, 3000
- Environment variables auto-generated with secure secrets
- Rate limiting and input validation enabled

## What's Next

1. **Upload files** for forensic analysis
2. **Create investigations** and manage cases
3. **Test agent orchestration** with real files
4. **Explore WebSocket features** for real-time updates
5. **Set up custom domain** and SSL if needed

Your complete forensic investigation platform is ready! 🔍🛡️
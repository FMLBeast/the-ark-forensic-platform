#!/bin/bash

# The Ark - Complete Vast.ai Deployment Script
# Full-stack deployment with backend and frontend

set -e

echo "🚀 The Ark - Complete Vast.ai Deployment"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/opt/the-ark"
BACKEND_PORT="3000"
FRONTEND_PORT="80"

# System information
echo -e "${BLUE}📊 System Information:${NC}"
echo "OS: $(lsb_release -d | cut -f2 2>/dev/null || echo 'Unknown')"
echo "Architecture: $(uname -m)"
echo "Memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $4}' | sed 's/G/ GB/')"
if command -v nvidia-smi &> /dev/null; then
    echo "GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader,nounits | head -1)"
fi
echo ""

# Check if we're root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Running as root. This is fine for Vast.ai instances.${NC}"
fi

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
apt-get update -qq
apt-get install -y curl wget git unzip nginx certbot sqlite3 build-essential

# Install Node.js 18 (if not present)
if ! command -v node &> /dev/null || [ "$(node --version | cut -d'.' -f1 | cut -d'v' -f2)" -lt "18" ]; then
    echo -e "${BLUE}📦 Installing Node.js 18...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✅ NPM version: $(npm --version)${NC}"

# Install PM2 for process management
echo -e "${BLUE}📦 Installing PM2...${NC}"
npm install -g pm2

# Install forensic tools (optional but recommended)
echo -e "${BLUE}🔧 Installing forensic tools...${NC}"
apt-get install -y exiftool file steghide || echo -e "${YELLOW}⚠️  Some forensic tools couldn't be installed${NC}"

# Try to install zsteg (Ruby gem)
if command -v gem &> /dev/null; then
    gem install zsteg || echo -e "${YELLOW}⚠️  zsteg installation failed${NC}"
else
    echo -e "${YELLOW}⚠️  Ruby not available, skipping zsteg installation${NC}"
fi

# Create app directory
echo -e "${BLUE}📁 Creating application directory: $APP_DIR${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Check if we need to clone or if files are already present
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}📥 Application files not found. Cloning from GitHub...${NC}"
    git clone https://github.com/FMLBeast/the-ark-forensic-platform.git .
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to clone repository. Please upload your files manually.${NC}"
        echo -e "${BLUE}💡 You can:${NC}"
        echo "1. Use 'scp' to copy files from your local machine"
        echo "2. Upload via Vast.ai file manager to $APP_DIR"
        echo "3. Run this script again after uploading files"
        exit 1
    fi
fi

# Install frontend dependencies
echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
npm install

# Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend
npm install
cd ..

# Create environment files
echo -e "${BLUE}⚙️  Setting up environment configuration...${NC}"

# Backend environment
cat > backend/.env << EOF
NODE_ENV=production
PORT=3000
DB_PATH=/opt/the-ark/data/ark.db
SESSION_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=http://$(curl -s ifconfig.me),http://localhost,http://127.0.0.1
MAX_UPLOAD_SIZE=104857600
UPLOAD_PATH=/opt/the-ark/uploads
ANALYSIS_TIMEOUT=300000
CONCURRENT_ANALYSIS_LIMIT=5
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOF

# Frontend environment
cat > .env.production << EOF
VITE_API_URL=http://$(curl -s ifconfig.me):3000/api
VITE_LLM_AVAILABLE=true
VITE_WEBSOCKET_URL=ws://$(curl -s ifconfig.me):3000/ws
EOF

# Create necessary directories
mkdir -p data uploads logs

# Build the frontend
echo -e "${BLUE}🔨 Building The Ark frontend...${NC}"
npm run build

# Set up PM2 ecosystem file
echo -e "${BLUE}⚙️  Setting up PM2 configuration...${NC}"
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'ark-backend',
      script: './backend/src/app.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      log_file: './logs/backend.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log'
    }
  ]
};
EOF

# Set up Nginx configuration
echo -e "${BLUE}🌐 Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/the-ark << 'EOF'
# The Ark - Nginx Configuration
server {
    listen 80;
    listen [::]:80;
    server_name _;
    
    client_max_body_size 100M;
    
    # Frontend (React app)
    location / {
        root /var/www/the-ark;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File uploads endpoint
    location /uploads/ {
        alias /opt/the-ark/uploads/;
        expires 1h;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/the-ark /etc/nginx/sites-enabled/default

# Copy built files to web root
echo -e "${BLUE}📂 Deploying frontend files...${NC}"
mkdir -p /var/www/the-ark
cp -r dist/* /var/www/the-ark/
chown -R www-data:www-data /var/www/the-ark

# Test Nginx configuration
nginx -t

# Set up file permissions
echo -e "${BLUE}🔐 Setting up file permissions...${NC}"
chown -R www-data:www-data $APP_DIR/uploads
chmod 755 $APP_DIR/uploads
chmod 755 $APP_DIR/data

# Start backend with PM2
echo -e "${BLUE}🚀 Starting backend services...${NC}"
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash || echo -e "${YELLOW}⚠️  PM2 startup setup may need manual configuration${NC}"

# Start Nginx
echo -e "${BLUE}🌐 Starting Nginx...${NC}"
systemctl enable nginx
systemctl restart nginx

# Get the public IP
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "Unable to detect")

# Wait for backend to start
echo -e "${BLUE}⏳ Waiting for backend to start...${NC}"
sleep 5

# Test backend health
if curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Backend may still be starting...${NC}"
fi

# Create management scripts
echo -e "${BLUE}🛠️  Creating management scripts...${NC}"

# Status script
cat > /usr/local/bin/ark-status << 'EOF'
#!/bin/bash
echo "🌟 The Ark - Full Stack Status"
echo "=============================="
echo ""
echo "📊 Services:"
echo "Nginx: $(systemctl is-active nginx)"
echo "Backend: $(pm2 describe ark-backend | grep -o 'online\|stopped\|errored' | head -1 || echo 'not running')"
echo ""
echo "🌐 URLs:"
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP')
echo "Frontend: http://$PUBLIC_IP"
echo "Backend API: http://$PUBLIC_IP/api"
echo "Health Check: http://$PUBLIC_IP/health"
echo "WebSocket: ws://$PUBLIC_IP/ws"
echo ""
echo "📁 Directories:"
echo "Application: /opt/the-ark ($(du -sh /opt/the-ark 2>/dev/null | cut -f1 || echo 'N/A'))"
echo "Web Root: /var/www/the-ark ($(du -sh /var/www/the-ark 2>/dev/null | cut -f1 || echo 'N/A'))"
echo "Database: /opt/the-ark/data/ark.db ($([ -f /opt/the-ark/data/ark.db ] && du -sh /opt/the-ark/data/ark.db | cut -f1 || echo 'Not created'))"
echo "Uploads: /opt/the-ark/uploads ($(du -sh /opt/the-ark/uploads 2>/dev/null | cut -f1 || echo 'Empty'))"
echo ""
echo "🔧 Management Commands:"
echo "ark-restart    # Restart all services"
echo "ark-logs       # View application logs"
echo "ark-update     # Update from GitHub"
echo "pm2 monit      # Monitor backend processes"
EOF

# Restart script
cat > /usr/local/bin/ark-restart << 'EOF'
#!/bin/bash
echo "🔄 Restarting The Ark services..."
pm2 restart ark-backend
systemctl restart nginx
sleep 2
echo "✅ Services restarted"
ark-status
EOF

# Logs script
cat > /usr/local/bin/ark-logs << 'EOF'
#!/bin/bash
echo "📋 The Ark Logs"
echo "==============="
echo ""
echo "🔍 Choose log to view:"
echo "1) Backend logs (PM2)"
echo "2) Nginx access logs"
echo "3) Nginx error logs"
echo "4) All backend logs (live tail)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1) pm2 logs ark-backend --lines 50 ;;
    2) tail -50 /var/log/nginx/access.log ;;
    3) tail -50 /var/log/nginx/error.log ;;
    4) pm2 logs ark-backend ;;
    *) echo "Invalid choice" ;;
esac
EOF

# Update script
cat > /usr/local/bin/ark-update << 'EOF'
#!/bin/bash
echo "🔄 Updating The Ark from GitHub..."
cd /opt/the-ark

# Backup current version
echo "📦 Creating backup..."
tar -czf /tmp/ark-backup-$(date +%Y%m%d-%H%M%S).tar.gz . || echo "⚠️  Backup failed"

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Update dependencies
echo "📦 Updating dependencies..."
npm install
cd backend && npm install && cd ..

# Rebuild frontend
echo "🔨 Rebuilding frontend..."
npm run build

# Deploy new frontend
echo "📂 Deploying frontend..."
cp -r dist/* /var/www/the-ark/

# Restart services
echo "🚀 Restarting services..."
pm2 restart ark-backend
systemctl reload nginx

echo "✅ Update completed successfully!"
ark-status
EOF

# Make scripts executable
chmod +x /usr/local/bin/ark-status
chmod +x /usr/local/bin/ark-restart
chmod +x /usr/local/bin/ark-logs
chmod +x /usr/local/bin/ark-update

# Setup firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    echo -e "${BLUE}🔥 Configuring firewall...${NC}"
    ufw --force enable
    ufw allow 22    # SSH
    ufw allow 80    # HTTP
    ufw allow 443   # HTTPS
    ufw allow 3000  # Backend (for direct access if needed)
fi

# Final status check
echo ""
echo -e "${GREEN}🎉 The Ark deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "🌐 Frontend URL: ${GREEN}http://$PUBLIC_IP${NC}"
echo -e "🔧 Backend API: ${GREEN}http://$PUBLIC_IP/api${NC}"
echo -e "💓 Health Check: ${GREEN}http://$PUBLIC_IP/health${NC}"
echo -e "🔌 WebSocket: ${GREEN}ws://$PUBLIC_IP/ws${NC}"
echo ""
echo -e "${BLUE}📁 Important Paths:${NC}"
echo -e "Application: ${YELLOW}$APP_DIR${NC}"
echo -e "Web Root: ${YELLOW}/var/www/the-ark${NC}"
echo -e "Database: ${YELLOW}$APP_DIR/data/ark.db${NC}"
echo -e "Uploads: ${YELLOW}$APP_DIR/uploads${NC}"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "ark-status     # Check application status"
echo "ark-restart    # Restart all services"
echo "ark-logs       # View application logs"
echo "ark-update     # Update from GitHub"
echo "pm2 monit      # Monitor backend processes"
echo ""
echo -e "${BLUE}🔑 Default Login:${NC}"
echo "Username: admin"
echo "Password: admin123"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Open http://$PUBLIC_IP in your browser"
echo "2. Login with admin/admin123"
echo "3. Upload files for forensic analysis"
echo "4. Test agent orchestration features"
echo "5. Explore investigation management"
echo ""
echo -e "${GREEN}🌟 The Ark is ready for forensic investigation!${NC}"
echo ""

# Show final status
ark-status
#!/bin/bash

# The Ark - Vast.ai Deployment Script
# Automated setup for Vast.ai GPU instances

set -e

echo "🚀 The Ark - Vast.ai Deployment Setup"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# System information
echo -e "${BLUE}📊 System Information:${NC}"
echo "OS: $(lsb_release -d | cut -f2)"
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
apt-get install -y curl wget git unzip nginx certbot

# Install Node.js 18 (if not present)
if ! command -v node &> /dev/null; then
    echo -e "${BLUE}📦 Installing Node.js 18...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✅ NPM version: $(npm --version)${NC}"

# Install Docker (if not present)
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}🐳 Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
fi

echo -e "${GREEN}✅ Docker version: $(docker --version)${NC}"

# Create app directory
APP_DIR="/opt/the-ark"
echo -e "${BLUE}📁 Creating application directory: $APP_DIR${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

# Check if we need to clone or if files are already present
if [ ! -f "package.json" ]; then
    echo -e "${YELLOW}📥 Application files not found. Please upload your code to $APP_DIR${NC}"
    echo -e "${BLUE}💡 You can:${NC}"
    echo "1. Use 'scp' to copy files from your local machine"
    echo "2. Clone from GitHub: git clone <your-repo-url> ."
    echo "3. Upload via Vast.ai file manager"
    echo ""
    echo -e "${BLUE}📋 Manual setup commands:${NC}"
    echo "cd $APP_DIR"
    echo "# Upload your files here, then run:"
    echo "npm install"
    echo "npm run build"
    echo "./vast-ai-setup.sh"
    exit 0
fi

# Install dependencies
echo -e "${BLUE}📦 Installing application dependencies...${NC}"
npm install

# Build the application
echo -e "${BLUE}🔨 Building The Ark...${NC}"
npm run build

# Set up Nginx
echo -e "${BLUE}🌐 Configuring Nginx...${NC}"
cp nginx.conf /etc/nginx/sites-available/the-ark
ln -sf /etc/nginx/sites-available/the-ark /etc/nginx/sites-enabled/default

# Update Nginx config for Vast.ai
sed -i 's/listen 80;/listen 80;\n    listen [::]:80;/' /etc/nginx/sites-enabled/default
sed -i "s|/usr/share/nginx/html|$APP_DIR/dist|g" /etc/nginx/sites-enabled/default

# Copy built files
echo -e "${BLUE}📂 Deploying application files...${NC}"
mkdir -p /var/www/the-ark
cp -r dist/* /var/www/the-ark/
chown -R www-data:www-data /var/www/the-ark

# Update Nginx config to use /var/www/the-ark
sed -i "s|$APP_DIR/dist|/var/www/the-ark|g" /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Start services
echo -e "${BLUE}🚀 Starting services...${NC}"
systemctl enable nginx
systemctl restart nginx

# Get the public IP
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip || echo "Unable to detect")

# Create a simple status script
cat > /usr/local/bin/ark-status << 'EOF'
#!/bin/bash
echo "🌟 The Ark Status"
echo "================="
echo "Nginx: $(systemctl is-active nginx)"
echo "Public IP: $(curl -s ifconfig.me 2>/dev/null || echo 'Unable to detect')"
echo "Application: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP')"
echo "Files: /var/www/the-ark ($(du -sh /var/www/the-ark | cut -f1))"
echo ""
echo "🔧 Management commands:"
echo "sudo systemctl restart nginx  # Restart web server"
echo "sudo nginx -t                 # Test configuration"
echo "sudo tail -f /var/log/nginx/error.log  # View logs"
EOF

chmod +x /usr/local/bin/ark-status

# Setup firewall (if ufw is available)
if command -v ufw &> /dev/null; then
    echo -e "${BLUE}🔥 Configuring firewall...${NC}"
    ufw --force enable
    ufw allow 22    # SSH
    ufw allow 80    # HTTP
    ufw allow 443   # HTTPS
fi

# Create update script
cat > /usr/local/bin/update-ark << 'EOF'
#!/bin/bash
cd /opt/the-ark
git pull origin main  # or your branch
npm install
npm run build
cp -r dist/* /var/www/the-ark/
systemctl restart nginx
echo "✅ The Ark updated successfully!"
EOF

chmod +x /usr/local/bin/update-ark

echo ""
echo -e "${GREEN}🎉 The Ark deployment completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Deployment Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "🌐 Application URL: ${GREEN}http://$PUBLIC_IP${NC}"
echo -e "📁 Application files: ${YELLOW}$APP_DIR${NC}"
echo -e "🌍 Web root: ${YELLOW}/var/www/the-ark${NC}"
echo -e "⚙️  Nginx config: ${YELLOW}/etc/nginx/sites-enabled/default${NC}"
echo ""
echo -e "${BLUE}🔧 Management Commands:${NC}"
echo "ark-status           # Check application status"
echo "update-ark          # Update application from git"
echo "sudo systemctl restart nginx  # Restart web server"
echo "sudo tail -f /var/log/nginx/access.log  # View access logs"
echo "sudo tail -f /var/log/nginx/error.log   # View error logs"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "1. Open http://$PUBLIC_IP in your browser"
echo "2. Login with any username/password (demo mode)"
echo "3. Navigate to Forensics → ⚡ to access challenges"
echo "4. Configure backend API URLs if needed"
echo ""
echo -e "${GREEN}🌟 The Ark is ready for your steganographic ARG!${NC}"
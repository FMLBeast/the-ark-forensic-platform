#!/bin/bash

# The Ark - One-Command Deployment Script
# Supports: Local Dev, Docker, Vast.ai, VPS, and Production deployments

set -e

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="The Ark Forensic Platform"
VERSION="2.0.0"
NODE_VERSION="18"
REQUIRED_DISK_GB=10
REQUIRED_RAM_GB=4

# Deployment modes
DEPLOY_MODE=""
PUBLIC_IP=""
DOMAIN=""
SSL_ENABLED=false
FORENSIC_DB_PATH=""

# Print banner
print_banner() {
    echo -e "${PURPLE}"
    echo "  ████████╗██╗  ██╗███████╗     █████╗ ██████╗ ██╗  ██╗"
    echo "  ╚══██╔══╝██║  ██║██╔════╝    ██╔══██╗██╔══██╗██║ ██╔╝"
    echo "     ██║   ███████║█████╗      ███████║██████╔╝█████╔╝ "
    echo "     ██║   ██╔══██║██╔══╝      ██╔══██║██╔══██╗██╔═██╗ "
    echo "     ██║   ██║  ██║███████╗    ██║  ██║██║  ██║██║  ██╗"
    echo "     ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝"
    echo -e "${NC}"
    echo -e "${WHITE}$APP_NAME - Version $VERSION${NC}"
    echo -e "${CYAN}Advanced Forensic Investigation Platform${NC}"
    echo "=================================================================="
    echo ""
}

# Check system requirements
check_requirements() {
    echo -e "${BLUE}🔍 Checking system requirements...${NC}"
    
    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo -e "${GREEN}✅ Linux detected${NC}"
        OS_TYPE="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${GREEN}✅ macOS detected${NC}"
        OS_TYPE="macos"
    else
        echo -e "${YELLOW}⚠️  Unknown OS: $OSTYPE${NC}"
        OS_TYPE="unknown"
    fi
    
    # Check available memory
    if command -v free &> /dev/null; then
        AVAILABLE_RAM_GB=$(free -g | awk '/^Mem:/{print $2}')
        echo -e "${GREEN}✅ Available RAM: ${AVAILABLE_RAM_GB}GB${NC}"
        if [ "$AVAILABLE_RAM_GB" -lt "$REQUIRED_RAM_GB" ]; then
            echo -e "${YELLOW}⚠️  Low RAM detected. Recommended: ${REQUIRED_RAM_GB}GB+${NC}"
        fi
    fi
    
    # Check available disk space
    AVAILABLE_DISK_GB=$(df -BG . | tail -1 | awk '{print $4}' | sed 's/G//')
    echo -e "${GREEN}✅ Available disk: ${AVAILABLE_DISK_GB}GB${NC}"
    if [ "$AVAILABLE_DISK_GB" -lt "$REQUIRED_DISK_GB" ]; then
        echo -e "${RED}❌ Insufficient disk space. Required: ${REQUIRED_DISK_GB}GB+${NC}"
        exit 1
    fi
    
    # Check for required commands
    REQUIRED_COMMANDS=("curl" "git")
    for cmd in "${REQUIRED_COMMANDS[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            echo -e "${GREEN}✅ $cmd available${NC}"
        else
            echo -e "${RED}❌ $cmd not found${NC}"
            exit 1
        fi
    done
    
    echo ""
}

# Install system dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing system dependencies...${NC}"
    
    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        echo -e "${BLUE}📦 Updating package manager...${NC}"
        sudo apt-get update -qq
        
        echo -e "${BLUE}📦 Installing essential packages...${NC}"
        sudo apt-get install -y curl wget git unzip build-essential python3 python3-pip
        
        if [ "$DEPLOY_MODE" = "production" ] || [ "$DEPLOY_MODE" = "vps" ]; then
            echo -e "${BLUE}📦 Installing production dependencies...${NC}"
            sudo apt-get install -y nginx certbot python3-certbot-nginx sqlite3
        fi
        
        # Install forensic tools
        echo -e "${BLUE}🔧 Installing forensic analysis tools...${NC}"
        sudo apt-get install -y exiftool file steghide binwalk hexdump xxd || echo -e "${YELLOW}⚠️  Some forensic tools may not be available${NC}"
        
    elif command -v brew &> /dev/null; then
        # macOS
        echo -e "${BLUE}📦 Installing via Homebrew...${NC}"
        brew install curl wget git python3
        
        if [ "$DEPLOY_MODE" = "production" ]; then
            brew install nginx sqlite3
        fi
        
        # Install forensic tools
        brew install exiftool binwalk || echo -e "${YELLOW}⚠️  Some forensic tools may not be available${NC}"
        
    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        echo -e "${BLUE}📦 Installing via YUM...${NC}"
        sudo yum update -y
        sudo yum install -y curl wget git unzip gcc gcc-c++ make python3 python3-pip
        
        if [ "$DEPLOY_MODE" = "production" ] || [ "$DEPLOY_MODE" = "vps" ]; then
            sudo yum install -y nginx certbot sqlite
        fi
    fi
    
    echo ""
}

# Install Node.js
install_nodejs() {
    echo -e "${BLUE}📦 Installing Node.js ${NODE_VERSION}...${NC}"
    
    if command -v node &> /dev/null; then
        CURRENT_NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
        if [ "$CURRENT_NODE_VERSION" -ge "$NODE_VERSION" ]; then
            echo -e "${GREEN}✅ Node.js ${NODE_VERSION}+ already installed: $(node --version)${NC}"
            return 0
        fi
    fi
    
    # Install Node.js via NodeSource
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif command -v brew &> /dev/null; then
        brew install node@${NODE_VERSION}
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
        sudo yum install -y nodejs
    else
        echo -e "${RED}❌ Unable to install Node.js automatically${NC}"
        echo "Please install Node.js ${NODE_VERSION}+ manually and re-run this script"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"
    echo -e "${GREEN}✅ NPM installed: $(npm --version)${NC}"
    echo ""
}

# Install PM2 for process management
install_pm2() {
    if [ "$DEPLOY_MODE" = "production" ] || [ "$DEPLOY_MODE" = "vps" ] || [ "$DEPLOY_MODE" = "vast" ]; then
        echo -e "${BLUE}📦 Installing PM2 process manager...${NC}"
        if ! command -v pm2 &> /dev/null; then
            npm install -g pm2
            echo -e "${GREEN}✅ PM2 installed${NC}"
        else
            echo -e "${GREEN}✅ PM2 already installed${NC}"
        fi
        echo ""
    fi
}

# Setup application files
setup_application() {
    echo -e "${BLUE}📁 Setting up application...${NC}"
    
    # Create app directory if needed
    if [ "$DEPLOY_MODE" = "production" ] || [ "$DEPLOY_MODE" = "vps" ] || [ "$DEPLOY_MODE" = "vast" ]; then
        APP_DIR="/opt/the-ark"
        sudo mkdir -p "$APP_DIR"
        sudo chown -R $USER:$USER "$APP_DIR" 2>/dev/null || sudo chown -R $USER "$APP_DIR"
        cd "$APP_DIR"
    fi
    
    # Install dependencies
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    npm install --production=false
    
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    cd backend
    npm install --production=false
    cd ..
    
    # Create necessary directories
    mkdir -p data uploads logs
    
    echo -e "${GREEN}✅ Application dependencies installed${NC}"
    echo ""
}

# Configure environment
configure_environment() {
    echo -e "${BLUE}⚙️  Configuring environment...${NC}"
    
    # Get public IP if needed
    if [ "$DEPLOY_MODE" = "production" ] || [ "$DEPLOY_MODE" = "vps" ] || [ "$DEPLOY_MODE" = "vast" ]; then
        if [ -z "$PUBLIC_IP" ]; then
            PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
        fi
        echo -e "${GREEN}✅ Public IP detected: $PUBLIC_IP${NC}"
    fi
    
    # Backend environment
    cat > backend/.env << EOF
NODE_ENV=${DEPLOY_MODE}
PORT=3000
HOST=0.0.0.0
DB_PATH=$(pwd)/data/ark.db
SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || date | md5sum | cut -d' ' -f1)
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || date | sha256sum | cut -d' ' -f1)
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
MAX_UPLOAD_SIZE=104857600
UPLOAD_PATH=$(pwd)/uploads
ANALYSIS_TIMEOUT=300000
CONCURRENT_ANALYSIS_LIMIT=5
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOF

    # Add forensic database configuration if provided
    if [ -n "$FORENSIC_DB_PATH" ]; then
        cat >> backend/.env << EOF

# Forensic Database Integration
FORENSIC_DB_PATH=${FORENSIC_DB_PATH}
ENABLE_FORENSIC_ANALYSIS=true
MAX_FORENSIC_QUERY_RESULTS=1000
FORENSIC_CACHE_ENABLED=true
EOF
        echo -e "${GREEN}✅ Forensic database configured: $FORENSIC_DB_PATH${NC}"
    fi
    
    # Add allowed origins
    if [ "$DEPLOY_MODE" = "dev" ]; then
        echo "ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000" >> backend/.env
    elif [ "$DEPLOY_MODE" = "docker" ]; then
        echo "ALLOWED_ORIGINS=http://localhost,http://127.0.0.1,http://host.docker.internal" >> backend/.env
    else
        echo "ALLOWED_ORIGINS=http://${PUBLIC_IP},https://${PUBLIC_IP},http://localhost,http://127.0.0.1" >> backend/.env
        if [ -n "$DOMAIN" ]; then
            echo "ALLOWED_ORIGINS=http://${PUBLIC_IP},https://${PUBLIC_IP},http://${DOMAIN},https://${DOMAIN},http://localhost" >> backend/.env
        fi
    fi
    
    # Frontend environment
    if [ "$DEPLOY_MODE" = "dev" ]; then
        cat > .env.development << EOF
VITE_API_URL=http://localhost:3000/api
VITE_LLM_AVAILABLE=true
VITE_WEBSOCKET_URL=ws://localhost:3000/ws
EOF
    else
        cat > .env.production << EOF
VITE_API_URL=http://${PUBLIC_IP}:3000/api
VITE_LLM_AVAILABLE=true
VITE_WEBSOCKET_URL=ws://${PUBLIC_IP}:3000/ws
EOF
        if [ -n "$DOMAIN" ]; then
            cat > .env.production << EOF
VITE_API_URL=https://${DOMAIN}/api
VITE_LLM_AVAILABLE=true
VITE_WEBSOCKET_URL=wss://${DOMAIN}/ws
EOF
        fi
    fi
    
    echo -e "${GREEN}✅ Environment configured${NC}"
    echo ""
}

# Build application
build_application() {
    if [ "$DEPLOY_MODE" != "dev" ]; then
        echo -e "${BLUE}🔨 Building application...${NC}"
        
        # Type check
        echo -e "${BLUE}🔍 Running TypeScript checks...${NC}"
        npm run type-check
        
        # Build frontend
        echo -e "${BLUE}🏗️  Building frontend...${NC}"
        npm run build
        
        echo -e "${GREEN}✅ Application built successfully${NC}"
        echo ""
    fi
}

# Setup Nginx (for production deployments)
setup_nginx() {
    if [ "$DEPLOY_MODE" = "production" ] || [ "$DEPLOY_MODE" = "vps" ] || [ "$DEPLOY_MODE" = "vast" ]; then
        echo -e "${BLUE}🌐 Configuring Nginx...${NC}"
        
        # Create Nginx configuration
        sudo tee /etc/nginx/sites-available/the-ark > /dev/null << EOF
# The Ark - Nginx Configuration
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN:-_};
    
    client_max_body_size 100M;
    
    # Frontend (React app)
    location / {
        root /var/www/the-ark;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:3000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # File uploads endpoint
    location /uploads/ {
        alias $(pwd)/uploads/;
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
        sudo ln -sf /etc/nginx/sites-available/the-ark /etc/nginx/sites-enabled/default
        
        # Test Nginx configuration
        sudo nginx -t
        
        # Deploy frontend files
        sudo mkdir -p /var/www/the-ark
        if [ -d "dist" ]; then
            sudo cp -r dist/* /var/www/the-ark/
        fi
        sudo chown -R www-data:www-data /var/www/the-ark 2>/dev/null || sudo chown -R nginx:nginx /var/www/the-ark
        
        echo -e "${GREEN}✅ Nginx configured${NC}"
        echo ""
    fi
}

# Setup SSL with Let's Encrypt
setup_ssl() {
    if [ "$SSL_ENABLED" = true ] && [ -n "$DOMAIN" ]; then
        echo -e "${BLUE}🔒 Setting up SSL certificate...${NC}"
        
        if command -v certbot &> /dev/null; then
            sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"
            echo -e "${GREEN}✅ SSL certificate installed${NC}"
        else
            echo -e "${YELLOW}⚠️  Certbot not available, SSL setup skipped${NC}"
        fi
        echo ""
    fi
}

# Create PM2 ecosystem file
create_pm2_config() {
    if [ "$DEPLOY_MODE" = "production" ] || [ "$DEPLOY_MODE" = "vps" ] || [ "$DEPLOY_MODE" = "vast" ]; then
        echo -e "${BLUE}⚙️  Creating PM2 configuration...${NC}"
        
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
        NODE_ENV: '${DEPLOY_MODE}',
        PORT: 3000
      },
      log_file: './logs/backend.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
EOF
        
        echo -e "${GREEN}✅ PM2 configuration created${NC}"
        echo ""
    fi
}

# Start services
start_services() {
    echo -e "${BLUE}🚀 Starting services...${NC}"
    
    if [ "$DEPLOY_MODE" = "dev" ]; then
        echo -e "${BLUE}🔄 Starting development servers...${NC}"
        echo "Backend will run on: http://localhost:3000"
        echo "Frontend will run on: http://localhost:5173"
        echo ""
        echo "Run the following commands in separate terminals:"
        echo "  Backend:  cd backend && npm run dev"
        echo "  Frontend: npm run dev"
        
    elif [ "$DEPLOY_MODE" = "docker" ]; then
        echo -e "${BLUE}🐳 Starting Docker containers...${NC}"
        docker-compose up -d
        echo -e "${GREEN}✅ Docker containers started${NC}"
        
    else
        # Production deployment
        echo -e "${BLUE}🚀 Starting backend with PM2...${NC}"
        pm2 start ecosystem.config.js
        pm2 save
        pm2 startup | grep -E '^sudo' | sh || echo -e "${YELLOW}⚠️  PM2 startup configuration may need manual setup${NC}"
        
        if command -v systemctl &> /dev/null; then
            echo -e "${BLUE}🌐 Starting Nginx...${NC}"
            sudo systemctl enable nginx
            sudo systemctl restart nginx
        fi
        
        echo -e "${GREEN}✅ Services started${NC}"
    fi
    
    echo ""
}

# Create management scripts
create_management_scripts() {
    if [ "$DEPLOY_MODE" = "production" ] || [ "$DEPLOY_MODE" = "vps" ] || [ "$DEPLOY_MODE" = "vast" ]; then
        echo -e "${BLUE}🛠️  Creating management scripts...${NC}"
        
        # Status script
        sudo tee /usr/local/bin/ark-status > /dev/null << 'EOF'
#!/bin/bash
echo "🌟 The Ark - Status Report"
echo "=========================="
echo ""
echo "📊 Services:"
echo "Backend: $(pm2 describe ark-backend | grep -o 'online\|stopped\|errored' | head -1 || echo 'not running')"
if command -v systemctl &> /dev/null; then
    echo "Nginx: $(systemctl is-active nginx 2>/dev/null || echo 'not available')"
fi
echo ""
echo "🌐 URLs:"
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_IP')
echo "Frontend: http://$PUBLIC_IP"
echo "Backend API: http://$PUBLIC_IP/api"
echo "Health Check: http://$PUBLIC_IP/health"
echo ""
echo "🔧 Quick Commands:"
echo "ark-restart    # Restart all services"
echo "ark-logs       # View application logs"
echo "ark-update     # Update from repository"
echo "pm2 monit      # Monitor processes"
EOF
        
        # Restart script
        sudo tee /usr/local/bin/ark-restart > /dev/null << 'EOF'
#!/bin/bash
echo "🔄 Restarting The Ark services..."
pm2 restart ark-backend
if command -v systemctl &> /dev/null; then
    sudo systemctl restart nginx
fi
sleep 2
echo "✅ Services restarted"
ark-status
EOF
        
        # Logs script
        sudo tee /usr/local/bin/ark-logs > /dev/null << 'EOF'
#!/bin/bash
echo "📋 The Ark Logs"
echo "==============="
echo ""
echo "Choose log to view:"
echo "1) Backend logs (PM2)"
echo "2) Nginx access logs"
echo "3) Nginx error logs"
echo "4) Live backend logs"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1) pm2 logs ark-backend --lines 50 ;;
    2) tail -50 /var/log/nginx/access.log 2>/dev/null || echo "Nginx logs not available" ;;
    3) tail -50 /var/log/nginx/error.log 2>/dev/null || echo "Nginx logs not available" ;;
    4) pm2 logs ark-backend ;;
    *) echo "Invalid choice" ;;
esac
EOF
        
        # Update script
        sudo tee /usr/local/bin/ark-update > /dev/null << 'EOF'
#!/bin/bash
echo "🔄 Updating The Ark..."
cd /opt/the-ark 2>/dev/null || cd $(dirname $(realpath $0))

# Backup current version
echo "📦 Creating backup..."
tar -czf /tmp/ark-backup-$(date +%Y%m%d-%H%M%S).tar.gz . 2>/dev/null || echo "⚠️  Backup failed"

# Update code
echo "📥 Pulling latest changes..."
git pull origin main

# Update dependencies
echo "📦 Updating dependencies..."
npm install
cd backend && npm install && cd ..

# Rebuild
echo "🔨 Rebuilding..."
npm run build

# Deploy frontend
if [ -d "/var/www/the-ark" ]; then
    echo "📂 Deploying frontend..."
    sudo cp -r dist/* /var/www/the-ark/
fi

# Restart services
echo "🚀 Restarting services..."
pm2 restart ark-backend
if command -v systemctl &> /dev/null; then
    sudo systemctl reload nginx
fi

echo "✅ Update completed!"
ark-status
EOF
        
        # Make scripts executable
        sudo chmod +x /usr/local/bin/ark-status
        sudo chmod +x /usr/local/bin/ark-restart
        sudo chmod +x /usr/local/bin/ark-logs
        sudo chmod +x /usr/local/bin/ark-update
        
        echo -e "${GREEN}✅ Management scripts created${NC}"
        echo ""
    fi
}

# Setup firewall
setup_firewall() {
    if [ "$DEPLOY_MODE" = "production" ] || [ "$DEPLOY_MODE" = "vps" ] || [ "$DEPLOY_MODE" = "vast" ]; then
        if command -v ufw &> /dev/null; then
            echo -e "${BLUE}🔥 Configuring firewall...${NC}"
            sudo ufw --force enable 2>/dev/null || true
            sudo ufw allow 22    # SSH
            sudo ufw allow 80    # HTTP
            sudo ufw allow 443   # HTTPS
            sudo ufw allow 3000  # Backend (for direct access)
            echo -e "${GREEN}✅ Firewall configured${NC}"
            echo ""
        fi
    fi
}

# Final status and instructions
show_final_status() {
    echo ""
    echo -e "${GREEN}🎉 ${APP_NAME} deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Deployment Summary:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ "$DEPLOY_MODE" = "dev" ]; then
        echo -e "🔗 Frontend: ${GREEN}http://localhost:5173${NC}"
        echo -e "🔗 Backend API: ${GREEN}http://localhost:3000/api${NC}"
        echo -e "💓 Health Check: ${GREEN}http://localhost:3000/health${NC}"
    elif [ "$DEPLOY_MODE" = "docker" ]; then
        echo -e "🔗 Frontend: ${GREEN}http://localhost${NC}"
        echo -e "🔗 Backend API: ${GREEN}http://localhost/api${NC}"
        echo -e "💓 Health Check: ${GREEN}http://localhost/health${NC}"
    else
        if [ -n "$DOMAIN" ] && [ "$SSL_ENABLED" = true ]; then
            echo -e "🔗 Frontend: ${GREEN}https://${DOMAIN}${NC}"
            echo -e "🔗 Backend API: ${GREEN}https://${DOMAIN}/api${NC}"
            echo -e "💓 Health Check: ${GREEN}https://${DOMAIN}/health${NC}"
        elif [ -n "$DOMAIN" ]; then
            echo -e "🔗 Frontend: ${GREEN}http://${DOMAIN}${NC}"
            echo -e "🔗 Backend API: ${GREEN}http://${DOMAIN}/api${NC}"
            echo -e "💓 Health Check: ${GREEN}http://${DOMAIN}/health${NC}"
        else
            echo -e "🔗 Frontend: ${GREEN}http://${PUBLIC_IP}${NC}"
            echo -e "🔗 Backend API: ${GREEN}http://${PUBLIC_IP}/api${NC}"
            echo -e "💓 Health Check: ${GREEN}http://${PUBLIC_IP}/health${NC}"
        fi
    fi
    
    echo ""
    echo -e "${BLUE}🔑 Default Credentials:${NC}"
    echo "Username: admin"
    echo "Password: admin123"
    echo ""
    
    if [ -n "$FORENSIC_DB_PATH" ]; then
        echo -e "${BLUE}🔍 Forensic Database:${NC}"
        echo "Path: $FORENSIC_DB_PATH"
        echo "Integration: Enabled"
        echo ""
    fi
    
    if [ "$DEPLOY_MODE" != "dev" ] && [ "$DEPLOY_MODE" != "docker" ]; then
        echo -e "${BLUE}🛠️  Management Commands:${NC}"
        echo "ark-status     # Check application status"
        echo "ark-restart    # Restart all services"
        echo "ark-logs       # View application logs"
        echo "ark-update     # Update from repository"
        echo "pm2 monit      # Monitor backend processes"
        echo ""
    fi
    
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    if [ "$DEPLOY_MODE" = "dev" ]; then
        echo "1. Start backend: cd backend && npm run dev"
        echo "2. Start frontend: npm run dev"
        echo "3. Open http://localhost:5173 in your browser"
    else
        echo "1. Open your application URL in a browser"
        echo "2. Login with admin/admin123"
        echo "3. Upload forensic files for analysis"
        echo "4. Explore agent orchestration features"
        echo "5. Test collaboration tools"
    fi
    echo ""
    echo -e "${GREEN}🌟 The Ark is ready for forensic investigation!${NC}"
    echo ""
}

# Show usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Deployment modes:"
    echo "  dev         Development setup (default)"
    echo "  docker      Docker deployment"
    echo "  production  Full production deployment"
    echo "  vps         VPS deployment"
    echo "  vast        Vast.ai deployment"
    echo ""
    echo "Options:"
    echo "  -m, --mode MODE          Deployment mode"
    echo "  -d, --domain DOMAIN      Domain name for production"
    echo "  -s, --ssl                Enable SSL with Let's Encrypt"
    echo "  -f, --forensic-db PATH   Path to forensic database"
    echo "  -h, --help               Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 --mode dev                           # Development setup"
    echo "  $0 --mode docker                        # Docker deployment"
    echo "  $0 --mode production --domain ark.com   # Production with domain"
    echo "  $0 --mode vast --forensic-db /path/db   # Vast.ai with forensic DB"
    echo ""
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -m|--mode)
                DEPLOY_MODE="$2"
                shift 2
                ;;
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -s|--ssl)
                SSL_ENABLED=true
                shift
                ;;
            -f|--forensic-db)
                FORENSIC_DB_PATH="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Set default mode if not specified
    if [ -z "$DEPLOY_MODE" ]; then
        DEPLOY_MODE="dev"
    fi
    
    # Validate deployment mode
    case $DEPLOY_MODE in
        dev|docker|production|vps|vast)
            ;;
        *)
            echo "Invalid deployment mode: $DEPLOY_MODE"
            show_usage
            exit 1
            ;;
    esac
}

# Main deployment flow
main() {
    # Parse arguments
    parse_args "$@"
    
    # Show banner
    print_banner
    
    echo -e "${WHITE}Deployment Mode: ${YELLOW}$DEPLOY_MODE${NC}"
    if [ -n "$DOMAIN" ]; then
        echo -e "${WHITE}Domain: ${YELLOW}$DOMAIN${NC}"
    fi
    if [ "$SSL_ENABLED" = true ]; then
        echo -e "${WHITE}SSL: ${GREEN}Enabled${NC}"
    fi
    if [ -n "$FORENSIC_DB_PATH" ]; then
        echo -e "${WHITE}Forensic DB: ${YELLOW}$FORENSIC_DB_PATH${NC}"
    fi
    echo ""
    
    # Confirm deployment
    if [ "$DEPLOY_MODE" != "dev" ]; then
        read -p "Continue with $DEPLOY_MODE deployment? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Deployment cancelled."
            exit 0
        fi
        echo ""
    fi
    
    # Execute deployment steps
    check_requirements
    
    if [ "$DEPLOY_MODE" != "docker" ]; then
        install_dependencies
        install_nodejs
        install_pm2
    fi
    
    setup_application
    configure_environment
    build_application
    
    if [ "$DEPLOY_MODE" = "docker" ]; then
        echo -e "${BLUE}🐳 Docker deployment detected${NC}"
        if [ ! -f "docker-compose.yml" ]; then
            echo -e "${RED}❌ docker-compose.yml not found${NC}"
            exit 1
        fi
    else
        setup_nginx
        setup_ssl
        create_pm2_config
        create_management_scripts
        setup_firewall
    fi
    
    start_services
    
    # Wait for services to start
    if [ "$DEPLOY_MODE" != "dev" ]; then
        echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
        sleep 5
    fi
    
    show_final_status
}

# Run main function with all arguments
main "$@"
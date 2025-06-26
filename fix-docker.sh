#!/bin/bash

# The Ark - Docker Fix Script
# Fixes common Docker deployment issues on Ubuntu

echo "🔧 The Ark - Docker Fix Script"
echo "=============================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📊 Checking Docker installation...${NC}"

# Check if we're root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ This script must be run as root${NC}"
    echo "Please run: sudo ./fix-docker.sh"
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker not found. Installing Docker...${NC}"
    
    # Install Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    
    # Start and enable Docker
    systemctl start docker
    systemctl enable docker
    
    echo -e "${GREEN}✅ Docker installed successfully${NC}"
else
    echo -e "${GREEN}✅ Docker is installed${NC}"
fi

# Check Docker daemon
if ! systemctl is-active --quiet docker; then
    echo -e "${YELLOW}⚠️  Starting Docker daemon...${NC}"
    systemctl start docker
    sleep 5
fi

echo "Docker version: $(docker --version)"

# Check for old docker-compose and remove it
if [ -f "/usr/local/bin/docker-compose" ]; then
    echo -e "${YELLOW}⚠️  Removing old docker-compose...${NC}"
    rm -f /usr/local/bin/docker-compose
fi

if [ -f "/usr/bin/docker-compose" ]; then
    echo -e "${YELLOW}⚠️  Removing system docker-compose...${NC}"
    apt-get remove -y docker-compose
fi

# Install Docker Compose Plugin (recommended method)
echo -e "${BLUE}📦 Installing Docker Compose Plugin...${NC}"

# Update package list
apt-get update -qq

# Install Docker Compose Plugin
apt-get install -y docker-compose-plugin

echo -e "${GREEN}✅ Docker Compose Plugin installed${NC}"
echo "Docker Compose version: $(docker compose version)"

# Test Docker
echo -e "${BLUE}🧪 Testing Docker installation...${NC}"

if docker run --rm hello-world > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker is working correctly${NC}"
else
    echo -e "${RED}❌ Docker test failed${NC}"
    echo "Please check Docker installation manually"
    exit 1
fi

# Fix Docker socket permissions if needed
echo -e "${BLUE}🔐 Checking Docker socket permissions...${NC}"
if [ -S /var/run/docker.sock ]; then
    chmod 666 /var/run/docker.sock
    echo -e "${GREEN}✅ Docker socket permissions fixed${NC}"
fi

# Create a simple Docker Compose file for testing
echo -e "${BLUE}📝 Creating simplified deployment configuration...${NC}"

cat > docker-compose.simple.yml << 'EOF'
version: '3.8'

services:
  ark-backend:
    image: node:18-alpine
    container_name: ark-backend
    working_dir: /app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    volumes:
      - ./backend:/app/backend
      - ./data:/app/data
      - ./uploads:/app/uploads
    command: sh -c "cd backend && npm install && node src/app.js"
    restart: unless-stopped
    networks:
      - ark-network

  ark-frontend:
    image: nginx:alpine
    container_name: ark-frontend
    ports:
      - "80:80"
    volumes:
      - ./dist:/usr/share/nginx/html
      - ./nginx-simple.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - ark-backend
    restart: unless-stopped
    networks:
      - ark-network

networks:
  ark-network:
    driver: bridge
EOF

# Create simple nginx config
cat > nginx-simple.conf << 'EOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 100M;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://ark-backend:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://ark-backend:3000/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo -e "${GREEN}✅ Simplified configuration created${NC}"

# Create deployment script that uses the new Docker Compose
cat > deploy-simple.sh << 'EOF'
#!/bin/bash

echo "🚀 The Ark - Simple Docker Deployment"
echo "====================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create necessary directories
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p data uploads logs
chmod 755 data uploads logs

# Build frontend if not already built
if [ ! -d "dist" ]; then
    echo -e "${BLUE}🔨 Building frontend...${NC}"
    npm install
    npm run build
fi

# Create backend environment
echo -e "${BLUE}⚙️  Setting up backend environment...${NC}"
cat > backend/.env << ENVEOF
NODE_ENV=production
PORT=3000
DB_PATH=/app/data/ark.db
UPLOAD_PATH=/app/uploads
SESSION_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
ALLOWED_ORIGINS=http://$(curl -s ifconfig.me 2>/dev/null || echo localhost),http://localhost,http://127.0.0.1
MAX_UPLOAD_SIZE=104857600
ANALYSIS_TIMEOUT=300000
CONCURRENT_ANALYSIS_LIMIT=5
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
ENVEOF

# Start services
echo -e "${BLUE}🚀 Starting services...${NC}"
docker compose -f docker-compose.simple.yml down 2>/dev/null
docker compose -f docker-compose.simple.yml up -d

if [ $? -eq 0 ]; then
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
    echo ""
    echo -e "${GREEN}🎉 The Ark deployed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Access Information:${NC}"
    echo "Frontend: http://$PUBLIC_IP"
    echo "Backend API: http://$PUBLIC_IP/api"
    echo "Health Check: http://$PUBLIC_IP/health"
    echo ""
    echo -e "${BLUE}🔑 Default Login:${NC}"
    echo "Username: admin"
    echo "Password: admin123"
    echo ""
    echo -e "${BLUE}🛠️  Management:${NC}"
    echo "docker compose -f docker-compose.simple.yml ps     # Check status"
    echo "docker compose -f docker-compose.simple.yml logs   # View logs"
    echo "docker compose -f docker-compose.simple.yml down   # Stop services"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check logs with: docker compose -f docker-compose.simple.yml logs"
fi
EOF

chmod +x deploy-simple.sh

echo ""
echo -e "${GREEN}🎉 Docker fix completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Build and deploy: ./deploy-simple.sh"
echo "2. Or use Docker Compose Plugin: docker compose up -d"
echo "3. Check status: docker compose ps"
echo ""
echo -e "${BLUE}🔧 What was fixed:${NC}"
echo "• Removed old docker-compose"
echo "• Installed Docker Compose Plugin"
echo "• Fixed Docker socket permissions"
echo "• Created simplified deployment configuration"
echo "• Added fallback deployment script"
echo ""
echo -e "${GREEN}✅ Ready for deployment!${NC}"
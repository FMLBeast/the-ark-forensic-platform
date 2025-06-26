#!/bin/bash

# The Ark - Docker Deployment Script
# Simple Docker Compose deployment

echo "🐳 The Ark - Docker Deployment"
echo "==============================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker first:"
    echo "curl -fsSL https://get.docker.com | sh"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first"
    exit 1
fi

echo -e "${BLUE}📋 System Check:${NC}"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker-compose --version 2>/dev/null || docker compose version 2>/dev/null)"
echo ""

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")

echo -e "${BLUE}🌐 Detected IP: ${GREEN}$PUBLIC_IP${NC}"
echo ""

# Create environment file for Docker
echo -e "${BLUE}⚙️  Creating environment configuration...${NC}"

cat > .env << EOF
# The Ark - Docker Environment
NODE_ENV=production
POSTGRES_DB=ark_db
POSTGRES_USER=ark_user
POSTGRES_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
PUBLIC_IP=$PUBLIC_IP
EOF

echo -e "${GREEN}✅ Environment configured${NC}"

# Create necessary directories
echo -e "${BLUE}📁 Creating data directories...${NC}"
mkdir -p data uploads logs
chmod 755 data uploads logs

# Update docker-compose with correct environment
echo -e "${BLUE}⚙️  Updating Docker Compose configuration...${NC}"

cat > docker-compose.yml << EOF
version: '3.8'

services:
  ark-backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: ark-backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DB_PATH=/app/data/ark.db
      - UPLOAD_PATH=/app/uploads
      - ALLOWED_ORIGINS=http://$PUBLIC_IP,http://localhost,http://127.0.0.1
      - JWT_SECRET=\${JWT_SECRET}
      - SESSION_SECRET=\${SESSION_SECRET}
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - ark-network

  ark-frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: ark-frontend
    ports:
      - "80:80"
    environment:
      - NGINX_BACKEND_URL=http://ark-backend:3000
    depends_on:
      ark-backend:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - ark-network

networks:
  ark-network:
    driver: bridge

volumes:
  ark-data:
  ark-uploads:
  ark-logs:
EOF

echo -e "${GREEN}✅ Docker Compose updated${NC}"

# Build and start services
echo -e "${BLUE}🔨 Building and starting services...${NC}"
echo "This may take 5-10 minutes for the first build..."
echo ""

# Stop any existing containers
docker-compose down 2>/dev/null || docker compose down 2>/dev/null

# Build and start
if command -v docker-compose &> /dev/null; then
    docker-compose up --build -d
else
    docker compose up --build -d
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 The Ark deployment completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Deployment Summary:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "🌐 Frontend:     ${GREEN}http://$PUBLIC_IP${NC}"
    echo -e "🔧 Backend API:  ${GREEN}http://$PUBLIC_IP/api${NC}"
    echo -e "💓 Health Check: ${GREEN}http://$PUBLIC_IP/health${NC}"
    echo ""
    echo -e "${BLUE}🔑 Default Login:${NC}"
    echo "Username: admin"
    echo "Password: admin123"
    echo ""
    echo -e "${BLUE}🛠️  Management Commands:${NC}"
    echo "docker-compose logs -f           # View logs"
    echo "docker-compose restart          # Restart services"
    echo "docker-compose down             # Stop services"
    echo "docker-compose up -d            # Start services"
    echo "docker-compose ps               # Check status"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo "1. Open http://$PUBLIC_IP in your browser"
    echo "2. Login with admin/admin123"
    echo "3. Upload files for forensic analysis"
    echo "4. Test agent orchestration features"
    echo ""
    
    # Wait for services to be ready
    echo -e "${BLUE}⏳ Waiting for services to be ready...${NC}"
    sleep 10
    
    # Check if services are running
    if curl -s http://localhost/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ All services are running and healthy!${NC}"
    else
        echo -e "${YELLOW}⚠️  Services may still be starting up...${NC}"
        echo "Check status with: docker-compose ps"
        echo "View logs with: docker-compose logs -f"
    fi
    
    echo ""
    echo -e "${GREEN}🌟 The Ark is ready for forensic investigation!${NC}"
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo "Check the logs with: docker-compose logs"
    exit 1
fi
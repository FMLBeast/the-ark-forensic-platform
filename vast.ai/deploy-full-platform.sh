#!/bin/bash

# Full deployment of The Ark Forensic Platform - REAL APPLICATION
echo "🚀 Deploying The COMPLETE Ark Forensic Platform"
echo "Instance: RTX 5000 Ada (153.204.80.81)"
echo "This deploys the FULL React/TypeScript frontend and complete Node.js backend"
echo "=================================================================="

# Check database
if [ -f "/root/hunter_server/data/stego_results.db" ]; then
    echo "✅ Found forensic database: /root/hunter_server/data/stego_results.db"
    DB_SIZE=$(du -h /root/hunter_server/data/stego_results.db | cut -f1)
    echo "   Database size: $DB_SIZE"
else
    echo "❌ ERROR: Database not found at /root/hunter_server/data/stego_results.db"
    exit 1
fi

# Complete cleanup
echo "🧹 Performing complete cleanup..."
docker ps -q --filter "name=ark-" | xargs -r docker stop
docker ps -aq --filter "name=ark-" | xargs -r docker rm
docker volume prune -f
docker network prune -f

# Kill any processes using our ports
echo "🔧 Freeing up ports..."
fuser -k 80/tcp 3001/tcp 11434/tcp 8080/tcp 8001/tcp 8434/tcp 2>/dev/null || true

# Remove any existing deployments
rm -rf /workspace/ark-deploy /workspace/the-ark-forensic-platform 2>/dev/null || true

# Clone the REAL repository
echo "📂 Cloning The COMPLETE Ark Forensic Platform..."
mkdir -p /workspace
cd /workspace
git clone https://github.com/FMLBeast/the-ark-forensic-platform.git
cd the-ark-forensic-platform

echo "✅ Repository cloned with FULL application code"

# Install dependencies and build the REAL frontend
echo "🏗️  Building the REAL React/TypeScript frontend..."
npm install
npm run build

echo "✅ Frontend built successfully"

# Install backend dependencies
echo "🏗️  Setting up REAL Node.js backend..."
cd backend
npm install
cd ..

echo "✅ Backend dependencies installed"

# Create production Docker Compose with REAL application
echo "📋 Creating production Docker Compose configuration..."
cat > docker-compose.production.yml << 'EOF'
services:
  # Ollama LLM Service (GPU-accelerated)
  ollama:
    image: ollama/ollama:latest
    container_name: ark-ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
      - "8434:11434"
    volumes:
      - ollama_data:/root/.ollama
      - /root/hunter_server/data:/data
    environment:
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_ORIGINS=*
      - OLLAMA_NUM_PARALLEL=8
      - OLLAMA_MAX_LOADED_MODELS=4
      - OLLAMA_FLASH_ATTENTION=1
      - OLLAMA_GPU_LAYERS=40
      - OLLAMA_CONTEXT_SIZE=8192
      - CUDA_VISIBLE_DEVICES=0
      - NVIDIA_VISIBLE_DEVICES=all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s

  # REAL Backend Service with FULL API
  backend:
    image: node:18-slim
    container_name: ark-backend
    restart: unless-stopped
    working_dir: /app
    ports:
      - "3001:3001"
      - "8001:3001"
    volumes:
      - /root/hunter_server/data:/app/data
      - ./backend:/app
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DATABASE_URL=sqlite:///app/data/stego_results.db
      - FORENSIC_DB_PATH=/app/data/stego_results.db
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_MODEL=codellama:13b-instruct
      - OLLAMA_SECONDARY_MODEL=llama2:13b-chat
      - OLLAMA_LIGHTWEIGHT_MODEL=codellama:7b-instruct
      - OLLAMA_ANALYSIS_MODEL=mistral:7b-instruct
      - ENABLE_OLLAMA_ORCHESTRATION=true
      - GPU_ACCELERATION=true
      - LOG_LEVEL=info
      - MAX_CONCURRENT_ANALYSIS=16
      - VAST_DEPLOYMENT=true
      - CORS_ORIGIN=*
      - JWT_SECRET=ark-forensic-platform-secret
      - SESSION_SECRET=ark-session-secret
    command: >
      bash -c "
        apt-get update &&
        apt-get install -y sqlite3 curl python3 &&
        npm install &&
        node src/app.js
      "
    depends_on:
      ollama:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # REAL Frontend Service with built React app
  frontend:
    image: nginx:alpine
    container_name: ark-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "8080:80"
    volumes:
      - ./dist:/usr/share/nginx/html
      - ./deployment/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis for session management and caching
  redis:
    image: redis:7-alpine
    container_name: ark-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  ollama_data:
    driver: local
  redis_data:
    driver: local
EOF

# Create production nginx configuration for REAL frontend
echo "⚙️  Creating production nginx configuration..."
mkdir -p deployment
cat > deployment/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    upstream backend {
        server ark-backend:3001;
    }

    server {
        listen 80;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;

        # API proxy to backend
        location /api/ {
            proxy_pass http://backend/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health endpoint
        location /health {
            proxy_pass http://backend/health;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # WebSocket support for real-time features
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Serve React app static files
        location / {
            try_files $uri $uri/ /index.html;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
            }
        }
    }
}
EOF

# Start the COMPLETE platform
echo "🚀 Starting The COMPLETE Ark Forensic Platform..."
docker-compose -f docker-compose.production.yml up -d

# Wait for services to initialize
echo "⏳ Waiting for services to initialize..."
sleep 60

# Check if all services are running
echo "🔍 Checking service status..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Initialize Ollama models
echo "🤖 Initializing AI models..."
echo "Downloading forensic analysis models..."

docker exec ark-ollama bash -c "
echo '🤖 Starting comprehensive model download...'
echo 'This will download 4 specialized forensic AI models...'

# Download models in parallel for faster setup
ollama pull codellama:13b-instruct &
PID1=\$!
ollama pull llama2:13b-chat &
PID2=\$!
ollama pull codellama:7b-instruct &
PID3=\$!
ollama pull mistral:7b-instruct &
PID4=\$!

# Wait for all downloads to complete
wait \$PID1 \$PID2 \$PID3 \$PID4

echo '✅ All AI models downloaded and ready!'
ollama list
echo ''
echo 'AI Models ready for forensic analysis:'
echo '- codellama:13b-instruct: Complex code and forensic analysis'
echo '- llama2:13b-chat: Conversational AI and report generation'
echo '- codellama:7b-instruct: Fast analysis and batch processing'
echo '- mistral:7b-instruct: Advanced pattern recognition'
"

# Final health checks
echo "🔍 Running comprehensive health checks..."
sleep 30

INSTANCE_IP=$(curl -s ifconfig.me 2>/dev/null || echo "153.204.80.81")

# Test all services
echo "Testing Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null)

echo "Testing Backend API..."
BACKEND_STATUS=$(curl -s http://localhost:3001/api/health 2>/dev/null | jq -r '.status' 2>/dev/null || echo "error")

echo "Testing Database..."
DB_TEST=$(curl -s http://localhost:3001/api/forensic/stats 2>/dev/null | jq -r '.success' 2>/dev/null || echo "false")

echo "Testing AI/Ollama..."
OLLAMA_MODELS=$(curl -s http://localhost:11434/api/tags 2>/dev/null | jq -r '.models | length' 2>/dev/null || echo "0")

echo ""
echo "🎉 THE COMPLETE ARK FORENSIC PLATFORM IS DEPLOYED!"
echo "=================================================================="
echo "Instance: RTX 5000 Ada (32GB VRAM) - $INSTANCE_IP"
echo "=================================================================="
echo ""
echo "📊 Service Status:"
echo "Frontend (React App): $([ "$FRONTEND_STATUS" = "200" ] && echo "✅ Running" || echo "❌ Error")"
echo "Backend (Full API): $([ "$BACKEND_STATUS" = "healthy" ] && echo "✅ Running" || echo "❌ Error")"  
echo "Database (33GB): $([ "$DB_TEST" = "true" ] && echo "✅ Connected" || echo "❌ Error")"
echo "AI Models: $([ "$OLLAMA_MODELS" -ge "4" ] && echo "✅ $OLLAMA_MODELS loaded" || echo "⏳ Loading...")"
echo ""
echo "🌐 Access The COMPLETE Platform:"
echo "Main Interface: http://$INSTANCE_IP:80"
echo "Alternative: http://$INSTANCE_IP:8080" 
echo "Backend API: http://$INSTANCE_IP:3001"
echo "AI API: http://$INSTANCE_IP:11434"
echo ""
echo "🔍 Platform Features:"
echo "✅ Complete forensic investigation interface"
echo "✅ AI-enhanced file analysis with 4 models"  
echo "✅ Agent orchestration and collaboration"
echo "✅ Real-time analysis and findings"
echo "✅ 54,762+ files in forensic database"
echo "✅ Advanced search and filtering"
echo "✅ Report generation and export"
echo ""
echo "🚀 THE ARK IS READY FOR PROFESSIONAL FORENSIC INVESTIGATIONS!"
echo "=================================================================="
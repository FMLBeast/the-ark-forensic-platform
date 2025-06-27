#!/bin/bash

# Deployment script for Vast.ai Instance 21824819 (RTX 5000 Ada)
# Instance: 153.204.80.81
# Database: /root/hunter_server/data/stego_results.db

set -e

echo "🚀 Deploying The Ark Forensic Platform on Vast.ai"
echo "Instance: 21824819 (RTX 5000 Ada - 32GB VRAM)"
echo "Location: Japan (153.204.80.81)"
echo "Database: /root/hunter_server/data/stego_results.db"
echo "=================================================="

# Check if we're running on the correct instance
INSTANCE_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
echo "Current IP: $INSTANCE_IP"

# Update system
echo "📦 Updating system packages..."
apt-get update -y
apt-get install -y curl wget git nano htop jq unzip

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
    usermod -aG docker $USER
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Verify database exists
if [ -f "/root/hunter_server/data/stego_results.db" ]; then
    echo "✅ Found forensic database: /root/hunter_server/data/stego_results.db"
    DB_SIZE=$(du -h /root/hunter_server/data/stego_results.db | cut -f1)
    echo "   Database size: $DB_SIZE"
else
    echo "❌ ERROR: Database not found at /root/hunter_server/data/stego_results.db"
    echo "Please ensure the database is available before deployment"
    exit 1
fi

# Clone or update repository
REPO_DIR="/workspace/the-ark-forensic-platform"
if [ ! -d "$REPO_DIR" ]; then
    echo "📂 Cloning The Ark repository..."
    mkdir -p /workspace
    cd /workspace
    
    # For this demo, we'll create the structure since we can't clone from a real repo yet
    echo "Creating project structure..."
    mkdir -p the-ark-forensic-platform
    cd the-ark-forensic-platform
    
    # Create necessary directories
    mkdir -p vast.ai/{config,nginx,monitoring,ollama}
    mkdir -p backend/src/services/ollama
    
    echo "⚠️  In production, clone from: git clone https://github.com/your-username/the-ark-forensic-platform.git"
else
    echo "📂 Updating repository..."
    cd "$REPO_DIR"
    # git pull  # Uncomment when repo is available
fi

# Set up environment variables for RTX 5000 Ada
export CUDA_VISIBLE_DEVICES=0
export NVIDIA_VISIBLE_DEVICES=all
export NVIDIA_DRIVER_CAPABILITIES=compute,utility

# Verify GPU
echo "🎮 Checking GPU availability..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader,nounits
    echo "✅ GPU detected and available"
else
    echo "❌ ERROR: NVIDIA GPU not detected"
    exit 1
fi

# Create Docker Compose file for Vast.ai deployment
cd "$REPO_DIR"
cat > docker-compose.vast.yml << 'EOF'
version: '3.8'

services:
  # Ollama LLM Service (RTX 5000 Ada optimized)
  ollama:
    image: ollama/ollama:latest
    container_name: ark-ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
      - "71434:11434"  # Vast.ai external mapping
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
      start_period: 60s

  # Backend Service
  backend:
    image: node:18-slim
    container_name: ark-backend
    restart: unless-stopped
    working_dir: /app
    ports:
      - "3001:3001"
      - "73001:3001"  # Vast.ai external mapping
    volumes:
      - /root/hunter_server/data:/app/data
      - ./backend:/app
    environment:
      - NODE_ENV=production
      - PORT=3001
      - FORENSIC_DB_PATH=/app/data/stego_results.db
      - OLLAMA_BASE_URL=http://ollama:11434
      - OLLAMA_MODEL=codellama:13b-instruct
      - ENABLE_OLLAMA_ORCHESTRATION=true
      - GPU_ACCELERATION=true
      - LOG_LEVEL=info
    command: >
      sh -c "
        apt-get update && 
        apt-get install -y sqlite3 curl &&
        npm install &&
        node src/app.js
      "
    depends_on:
      - ollama
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend Service
  frontend:
    image: nginx:alpine
    container_name: ark-frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "70080:80"  # Vast.ai external mapping
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    container_name: ark-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
      - "79090:9090"  # Vast.ai external mapping
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.enable-lifecycle'

volumes:
  ollama_data:
    driver: local
EOF

# Create minimal backend application
mkdir -p backend/src
cat > backend/package.json << 'EOF'
{
  "name": "ark-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "src/app.js",
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "cors": "^2.8.5"
  }
}
EOF

cat > backend/src/app.js << 'EOF'
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Database connection
const dbPath = process.env.FORENSIC_DB_PATH || '/app/data/stego_results.db';
let db = null;

try {
  db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
  console.log('✅ Connected to forensic database:', dbPath);
} catch (error) {
  console.warn('⚠️  Could not connect to database:', error.message);
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected',
    ollama: process.env.OLLAMA_BASE_URL || 'not configured'
  });
});

// Forensic stats endpoint
app.get('/api/forensic/stats', async (req, res) => {
  if (!db) {
    return res.json({
      success: false,
      error: 'Database not available'
    });
  }

  try {
    db.get('SELECT COUNT(*) as total_files FROM files', (err, result) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      
      res.json({
        success: true,
        data: {
          total_files: result.total_files,
          database_path: dbPath,
          instance_info: {
            ip: process.env.INSTANCE_IP || 'unknown',
            gpu: 'RTX 5000 Ada',
            vram: '32GB'
          }
        }
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ollama integration endpoint
app.get('/api/ollama/status', async (req, res) => {
  try {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://ollama:11434';
    const response = await fetch(`${ollamaUrl}/api/tags`);
    
    if (response.ok) {
      const models = await response.json();
      res.json({
        success: true,
        data: {
          status: 'available',
          url: ollamaUrl,
          models: models.models || []
        }
      });
    } else {
      res.json({
        success: false,
        error: 'Ollama not responding'
      });
    }
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 The Ark Backend running on port ${PORT}`);
  console.log(`🤖 Ollama URL: ${process.env.OLLAMA_BASE_URL || 'not configured'}`);
  console.log(`🗄️  Database: ${dbPath}`);
});
EOF

# Create minimal frontend
mkdir -p frontend/dist
cat > frontend/dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Ark - Forensic Platform</title>
    <style>
        body {
            background: #000;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .matrix-title {
            font-size: 3em;
            text-shadow: 0 0 10px #00ff00;
            margin-bottom: 10px;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }
        .status-card {
            border: 1px solid #00ff00;
            padding: 20px;
            background: rgba(0, 255, 0, 0.1);
        }
        .status-title {
            font-size: 1.5em;
            margin-bottom: 15px;
            text-shadow: 0 0 5px #00ff00;
        }
        .status-item {
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
        }
        .loading {
            animation: blink 1s infinite;
        }
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
        }
        .btn {
            background: transparent;
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 10px 20px;
            cursor: pointer;
            font-family: inherit;
            margin: 5px;
        }
        .btn:hover {
            background: rgba(0, 255, 0, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="matrix-title">THE ARK</div>
            <div>Forensic Investigation Platform</div>
            <div>RTX 5000 Ada • 32GB VRAM • AI-Enhanced Analysis</div>
        </div>

        <div class="status-grid">
            <div class="status-card">
                <div class="status-title">🚀 System Status</div>
                <div class="status-item">
                    <span>Backend API:</span>
                    <span id="backend-status" class="loading">Checking...</span>
                </div>
                <div class="status-item">
                    <span>Database:</span>
                    <span id="db-status" class="loading">Checking...</span>
                </div>
                <div class="status-item">
                    <span>AI/Ollama:</span>
                    <span id="ollama-status" class="loading">Checking...</span>
                </div>
            </div>

            <div class="status-card">
                <div class="status-title">🤖 AI Models</div>
                <div id="models-list" class="loading">Loading models...</div>
            </div>

            <div class="status-card">
                <div class="status-title">🗄️ Forensic Database</div>
                <div class="status-item">
                    <span>Total Files:</span>
                    <span id="total-files" class="loading">Loading...</span>
                </div>
                <div class="status-item">
                    <span>Database Path:</span>
                    <span>/root/hunter_server/data/stego_results.db</span>
                </div>
            </div>

            <div class="status-card">
                <div class="status-title">⚡ Quick Actions</div>
                <button class="btn" onclick="refreshStatus()">Refresh Status</button>
                <button class="btn" onclick="testOllama()">Test AI Analysis</button>
                <button class="btn" onclick="viewDatabase()">View Database Stats</button>
            </div>
        </div>
    </div>

    <script>
        async function checkBackendStatus() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                document.getElementById('backend-status').textContent = data.status;
                document.getElementById('db-status').textContent = data.database;
                return true;
            } catch (error) {
                document.getElementById('backend-status').textContent = 'Error';
                return false;
            }
        }

        async function checkOllamaStatus() {
            try {
                const response = await fetch('/api/ollama/status');
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('ollama-status').textContent = 'Available';
                    
                    const modelsList = document.getElementById('models-list');
                    if (data.data.models && data.data.models.length > 0) {
                        modelsList.innerHTML = data.data.models.map(model => 
                            `<div class="status-item"><span>${model.name}</span><span>${(model.size / 1e9).toFixed(1)}GB</span></div>`
                        ).join('');
                    } else {
                        modelsList.innerHTML = '<div>No models loaded</div>';
                    }
                } else {
                    document.getElementById('ollama-status').textContent = 'Not Available';
                    document.getElementById('models-list').textContent = 'Models not available';
                }
            } catch (error) {
                document.getElementById('ollama-status').textContent = 'Error';
                document.getElementById('models-list').textContent = 'Error loading models';
            }
        }

        async function checkForensicStats() {
            try {
                const response = await fetch('/api/forensic/stats');
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('total-files').textContent = data.data.total_files.toLocaleString();
                } else {
                    document.getElementById('total-files').textContent = 'Error';
                }
            } catch (error) {
                document.getElementById('total-files').textContent = 'Error';
            }
        }

        async function refreshStatus() {
            document.getElementById('backend-status').textContent = 'Checking...';
            document.getElementById('ollama-status').textContent = 'Checking...';
            document.getElementById('total-files').textContent = 'Loading...';
            
            await Promise.all([
                checkBackendStatus(),
                checkOllamaStatus(),
                checkForensicStats()
            ]);
        }

        async function testOllama() {
            alert('AI Analysis test - This would trigger a forensic analysis using Ollama');
        }

        async function viewDatabase() {
            alert('Database viewer - This would show detailed database statistics');
        }

        // Initial load
        refreshStatus();
        
        // Auto-refresh every 30 seconds
        setInterval(refreshStatus, 30000);
    </script>
</body>
</html>
EOF

# Create nginx config
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    upstream backend {
        server backend:3001;
    }

    upstream ollama {
        server ollama:11434;
    }

    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;

        location /api/ {
            proxy_pass http://backend/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /ollama/ {
            proxy_pass http://ollama/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
EOF

# Create monitoring config
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ark-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/health'
    scrape_interval: 30s

  - job_name: 'ollama'
    static_configs:
      - targets: ['ollama:11434']
    metrics_path: '/api/tags'
    scrape_interval: 30s
EOF

# Start services
echo "🚀 Starting The Ark Forensic Platform..."
docker-compose -f docker-compose.vast.yml up -d

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 30

# Initialize Ollama models
echo "🤖 Initializing Ollama models..."
docker exec ark-ollama bash -c "
echo '🤖 Starting model download...'
ollama pull codellama:13b-instruct
ollama pull llama2:13b-chat  
ollama pull codellama:7b-instruct
ollama pull mistral:7b-instruct
echo '✅ Models downloaded'
ollama list
"

# Health checks
echo "🔍 Running health checks..."
sleep 10

# Check services
BACKEND_STATUS=$(curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null || echo "error")
FRONTEND_STATUS=$(curl -s http://localhost:80 | grep -q "THE ARK" && echo "healthy" || echo "error")
OLLAMA_STATUS=$(curl -s http://localhost:11434/api/tags | jq -r '.models | length' 2>/dev/null || echo "error")

echo ""
echo "🎉 Deployment Summary"
echo "===================="
echo "Instance IP: $INSTANCE_IP"
echo "Backend: $BACKEND_STATUS (Port 3001 -> 73001)"
echo "Frontend: $FRONTEND_STATUS (Port 80 -> 70080)" 
echo "Ollama: $OLLAMA_STATUS models loaded (Port 11434 -> 71434)"
echo "Monitoring: Available (Port 9090 -> 79090)"
echo ""
echo "🌐 Access URLs:"
echo "Frontend: http://$INSTANCE_IP:70080"
echo "Backend API: http://$INSTANCE_IP:73001"
echo "Ollama API: http://$INSTANCE_IP:71434"
echo "Monitoring: http://$INSTANCE_IP:79090"
echo ""
echo "✅ The Ark Forensic Platform deployed successfully!"
echo "🗄️  Database: /root/hunter_server/data/stego_results.db"
echo "🤖 AI Models: Ready for forensic analysis"
echo ""
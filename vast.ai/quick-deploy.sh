#!/bin/bash

# Quick deployment script for Vast.ai - fixes port issues
echo "🚀 Quick Deployment Fix for The Ark Forensic Platform"
echo "Instance: RTX 5000 Ada (153.204.80.81)"
echo "=================================================="

# Check database
if [ -f "/root/hunter_server/data/stego_results.db" ]; then
    echo "✅ Found forensic database: /root/hunter_server/data/stego_results.db"
    DB_SIZE=$(du -h /root/hunter_server/data/stego_results.db | cut -f1)
    echo "   Database size: $DB_SIZE"
else
    echo "❌ ERROR: Database not found at /root/hunter_server/data/stego_results.db"
    exit 1
fi

# Create workspace
mkdir -p /workspace
cd /workspace

# Clone the repository properly
if [ ! -d "the-ark-forensic-platform" ]; then
    echo "📂 Cloning The Ark repository..."
    git clone https://github.com/FMLBeast/the-ark-forensic-platform.git
fi

cd the-ark-forensic-platform/vast.ai

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.vast.yml down 2>/dev/null || true
docker-compose -f docker-compose.simple.yml down 2>/dev/null || true

# Start with the simple configuration
echo "🚀 Starting services with corrected configuration..."
docker-compose -f docker-compose.simple.yml up -d

# Wait for services
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

INSTANCE_IP=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
BACKEND_STATUS=$(curl -s http://localhost:3001/health | jq -r '.status' 2>/dev/null || echo "error")
FRONTEND_STATUS=$(curl -s http://localhost:80 | grep -q "THE ARK" && echo "healthy" || echo "error")
OLLAMA_STATUS=$(curl -s http://localhost:11434/api/tags | jq -r '.models | length' 2>/dev/null || echo "error")

echo ""
echo "🎉 Deployment Summary"
echo "===================="
echo "Instance IP: $INSTANCE_IP"
echo "Backend: $BACKEND_STATUS (Port 3001)"
echo "Frontend: $FRONTEND_STATUS (Port 80)" 
echo "Ollama: $OLLAMA_STATUS models loaded (Port 11434)"
echo "Monitoring: Available (Port 9090)"
echo ""
echo "🌐 Access URLs:"
echo "Frontend: http://$INSTANCE_IP:80"
echo "Backend API: http://$INSTANCE_IP:3001"
echo "Ollama API: http://$INSTANCE_IP:11434"
echo "Monitoring: http://$INSTANCE_IP:9090"
echo ""
echo "✅ The Ark Forensic Platform deployed successfully!"
echo "🗄️  Database: /root/hunter_server/data/stego_results.db"
echo "🤖 AI Models: Ready for forensic analysis"
echo ""
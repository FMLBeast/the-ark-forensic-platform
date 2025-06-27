#!/bin/bash

# Vast.ai deployment script for The Ark Forensic Platform with Ollama
# Deploys GPU-accelerated forensic analysis platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
VAST_INSTANCE_TYPE=${VAST_INSTANCE_TYPE:-"RTX 4090"}
VAST_IMAGE=${VAST_IMAGE:-"pytorch/pytorch:2.0.1-cuda11.7-cudnn8-devel"}
VAST_DISK_SIZE=${VAST_DISK_SIZE:-50}
VAST_BANDWIDTH=${VAST_BANDWIDTH:-100}
OLLAMA_MODEL=${OLLAMA_MODEL:-"codellama:7b-instruct"}
BACKUP_MODEL=${BACKUP_MODEL:-"llama2:7b-chat"}

echo -e "${PURPLE}🚀 The Ark Forensic Platform - Vast.ai Deployment${NC}"
echo "=================================================="
echo ""

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    case "$status" in
        "INFO") echo -e "${BLUE}ℹ️  $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        *) echo -e "${NC}$message" ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    print_status "INFO" "Checking prerequisites..."
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_status "ERROR" "Docker is required but not installed"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_status "ERROR" "Docker Compose is required but not installed"
        exit 1
    fi
    
    # Check if vast CLI is available (optional)
    if command -v vastai &> /dev/null; then
        print_status "SUCCESS" "Vast.ai CLI detected"
        VAST_CLI_AVAILABLE=true
    else
        print_status "WARNING" "Vast.ai CLI not detected. Manual instance creation required."
        VAST_CLI_AVAILABLE=false
    fi
    
    print_status "SUCCESS" "Prerequisites check completed"
}

# Create Vast.ai configuration
create_vast_config() {
    print_status "INFO" "Creating Vast.ai configuration..."
    
    mkdir -p vast.ai/config
    mkdir -p vast.ai/nginx
    mkdir -p vast.ai/monitoring
    mkdir -p vast.ai/ollama/models
    
    # Create Ollama initialization script
    cat > vast.ai/ollama/init-models.sh << 'EOF'
#!/bin/bash
echo "🤖 Initializing Ollama models..."

# Wait for Ollama to start
while ! curl -f http://localhost:11434/api/tags > /dev/null 2>&1; do
    echo "Waiting for Ollama to start..."
    sleep 5
done

# Pull primary model
echo "📥 Pulling primary model: $OLLAMA_MODEL"
ollama pull $OLLAMA_MODEL

# Pull backup model
echo "📥 Pulling backup model: $BACKUP_MODEL"
ollama pull $BACKUP_MODEL

# List available models
echo "📋 Available models:"
ollama list

echo "✅ Ollama models initialized successfully"
EOF
    
    chmod +x vast.ai/ollama/init-models.sh
    
    # Create monitoring configuration
    cat > vast.ai/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'ark-backend'
    static_configs:
      - targets: ['backend:3001']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'ark-frontend'
    static_configs:
      - targets: ['frontend:80']
    metrics_path: '/health'
    scrape_interval: 30s

  - job_name: 'ollama'
    static_configs:
      - targets: ['ollama:11434']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'nvidia-gpu'
    static_configs:
      - targets: ['nvidia-exporter:9445']
    scrape_interval: 10s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
    scrape_interval: 30s
EOF
    
    print_status "SUCCESS" "Vast.ai configuration created"
}

# Build optimized images
build_images() {
    print_status "INFO" "Building optimized Docker images for Vast.ai..."
    
    # Build backend with Ollama integration
    print_status "INFO" "Building backend image..."
    docker build -f backend/Dockerfile.vast -t ark-backend:vast ./backend
    
    # Build frontend
    print_status "INFO" "Building frontend image..."
    docker build -f Dockerfile.vast -t ark-frontend:vast .
    
    print_status "SUCCESS" "Docker images built successfully"
}

# Create deployment package
create_deployment_package() {
    print_status "INFO" "Creating deployment package..."
    
    # Create startup script for Vast.ai
    cat > vast.ai/startup.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting The Ark Forensic Platform on Vast.ai"

# Update system
apt-get update
apt-get install -y curl wget git nano htop

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Clone or update repository
if [ ! -d "/workspace/the-ark-forensic-platform" ]; then
    cd /workspace
    git clone https://github.com/your-username/the-ark-forensic-platform.git
    cd the-ark-forensic-platform
else
    cd /workspace/the-ark-forensic-platform
    git pull
fi

# Set up environment
export CUDA_VISIBLE_DEVICES=0
export NVIDIA_VISIBLE_DEVICES=all
export NVIDIA_DRIVER_CAPABILITIES=compute,utility

# Start services
cd vast.ai
docker-compose -f docker-compose.vast.yml up -d

# Initialize Ollama models
docker exec ark-ollama bash /models/init-models.sh

echo "✅ The Ark Forensic Platform deployed successfully!"
echo "🌐 Frontend: http://$(curl -s ifconfig.me):80"
echo "🔧 Backend API: http://$(curl -s ifconfig.me):3001"
echo "🤖 Ollama: http://$(curl -s ifconfig.me):11434"
echo "📊 Monitoring: http://$(curl -s ifconfig.me):9090"
EOF
    
    chmod +x vast.ai/startup.sh
    
    # Create deployment documentation
    cat > vast.ai/README.md << 'EOF'
# The Ark Forensic Platform - Vast.ai Deployment

## Quick Deployment

1. **Create Vast.ai Instance:**
   ```bash
   vastai create instance $INSTANCE_ID \
     --image pytorch/pytorch:2.0.1-cuda11.7-cudnn8-devel \
     --disk 50 \
     --args "bash -c 'curl -fsSL https://raw.githubusercontent.com/your-username/the-ark-forensic-platform/main/vast.ai/startup.sh | bash'"
   ```

2. **Manual Deployment:**
   - SSH into your Vast.ai instance
   - Run: `curl -fsSL https://raw.githubusercontent.com/your-username/the-ark-forensic-platform/main/vast.ai/startup.sh | bash`

## Services

- **Frontend**: Port 80 (Main application)
- **Backend API**: Port 3001 (REST API)
- **Ollama LLM**: Port 11434 (Local LLM)
- **Monitoring**: Port 9090 (Prometheus)
- **GPU Metrics**: Port 9445 (NVIDIA exporter)

## Environment Variables

```bash
export OLLAMA_MODEL="codellama:7b-instruct"
export BACKUP_MODEL="llama2:7b-chat"
export CUDA_VISIBLE_DEVICES=0
export NVIDIA_VISIBLE_DEVICES=all
```

## Monitoring

Access Prometheus metrics at `http://your-instance-ip:9090`
View GPU utilization in real-time
Monitor application performance and resource usage

## Troubleshooting

```bash
# Check service status
docker-compose -f docker-compose.vast.yml ps

# View logs
docker-compose -f docker-compose.vast.yml logs

# Restart services
docker-compose -f docker-compose.vast.yml restart

# Check GPU availability
nvidia-smi

# Test Ollama
curl http://localhost:11434/api/tags
```
EOF
    
    print_status "SUCCESS" "Deployment package created"
}

# Generate Vast.ai search command
generate_vast_search() {
    print_status "INFO" "Generating Vast.ai instance search..."
    
    cat > vast.ai/search-instances.sh << EOF
#!/bin/bash

echo "🔍 Searching for suitable Vast.ai instances..."

# Search for instances with GPU and sufficient resources
vastai search offers \
    --type rtx4090 \
    --min-gpu-ram 16 \
    --min-gpu-util 0 \
    --min-disk-space ${VAST_DISK_SIZE} \
    --max-price 1.0 \
    --sort-by 'price' \
    --limit 10

echo ""
echo "💡 Recommended command to create instance:"
echo "vastai create instance INSTANCE_ID \\"
echo "  --image ${VAST_IMAGE} \\"
echo "  --disk ${VAST_DISK_SIZE} \\"
echo "  --args \"bash -c 'curl -fsSL https://raw.githubusercontent.com/your-username/the-ark-forensic-platform/main/vast.ai/startup.sh | bash'\""
EOF
    
    chmod +x vast.ai/search-instances.sh
    
    if [ "$VAST_CLI_AVAILABLE" = true ]; then
        print_status "INFO" "Running instance search..."
        bash vast.ai/search-instances.sh
    else
        print_status "INFO" "Instance search script created: vast.ai/search-instances.sh"
    fi
}

# Test deployment locally
test_deployment() {
    print_status "INFO" "Testing deployment locally..."
    
    cd vast.ai
    
    # Start services
    docker-compose -f docker-compose.vast.yml up -d
    
    # Wait for services to start
    sleep 30
    
    # Health checks
    local services=("frontend:80" "backend:3001" "ollama:11434")
    local all_healthy=true
    
    for service in "${services[@]}"; do
        IFS=':' read -r name port <<< "$service"
        if curl -f http://localhost:$port/health > /dev/null 2>&1 || curl -f http://localhost:$port > /dev/null 2>&1; then
            print_status "SUCCESS" "$name service is healthy"
        else
            print_status "ERROR" "$name service is not responding"
            all_healthy=false
        fi
    done
    
    if [ "$all_healthy" = true ]; then
        print_status "SUCCESS" "All services are healthy!"
        print_status "INFO" "Frontend: http://localhost:80"
        print_status "INFO" "Backend: http://localhost:3001"
        print_status "INFO" "Ollama: http://localhost:11434"
    else
        print_status "ERROR" "Some services are not healthy"
        docker-compose -f docker-compose.vast.yml logs
    fi
    
    cd ..
}

# Main deployment function
deploy() {
    print_status "INFO" "Starting Vast.ai deployment process..."
    
    check_prerequisites
    create_vast_config
    build_images
    create_deployment_package
    generate_vast_search
    
    if [ "${TEST_LOCAL:-false}" = "true" ]; then
        test_deployment
    fi
    
    print_status "SUCCESS" "Vast.ai deployment preparation completed!"
    
    echo ""
    echo -e "${GREEN}🎉 Deployment Summary:${NC}"
    echo "===================="
    echo "📁 Configuration: ./vast.ai/"
    echo "🐳 Docker images: ark-frontend:vast, ark-backend:vast"
    echo "🚀 Startup script: ./vast.ai/startup.sh"
    echo "📖 Documentation: ./vast.ai/README.md"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Create Vast.ai instance using provided commands"
    echo "2. Run startup script on the instance"
    echo "3. Access your deployed application"
    echo ""
    echo -e "${BLUE}Need help? Check ./vast.ai/README.md for detailed instructions${NC}"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --test-local)
            TEST_LOCAL=true
            shift
            ;;
        --model)
            OLLAMA_MODEL="$2"
            shift 2
            ;;
        --instance-type)
            VAST_INSTANCE_TYPE="$2"
            shift 2
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --test-local       Test deployment locally"
            echo "  --model MODEL      Ollama model to use (default: codellama:7b-instruct)"
            echo "  --instance-type    Vast.ai instance type (default: RTX 4090)"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            print_status "ERROR" "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run deployment
deploy
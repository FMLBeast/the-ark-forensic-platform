#!/bin/bash

# The Ark - Quick Installation Script
# One-command installation for development and production

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
NODE_VERSION="18"
INSTALL_MODE="dev"
SKIP_DEPS=false
FORENSIC_DB_PATH=""

# Print banner
print_banner() {
    echo -e "${PURPLE}"
    echo "████████╗██╗  ██╗███████╗     █████╗ ██████╗ ██╗  ██╗"
    echo "╚══██╔══╝██║  ██║██╔════╝    ██╔══██╗██╔══██╗██║ ██╔╝"
    echo "   ██║   ███████║█████╗      ███████║██████╔╝█████╔╝ "
    echo "   ██║   ██╔══██║██╔══╝      ██╔══██║██╔══██╗██╔═██╗ "
    echo "   ██║   ██║  ██║███████╗    ██║  ██║██║  ██║██║  ██╗"
    echo "   ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝"
    echo -e "${NC}"
    echo -e "${WHITE}The Ark Forensic Platform - Quick Install${NC}"
    echo -e "${CYAN}Advanced Forensic Investigation Platform${NC}"
    echo "=================================================="
    echo ""
}

# Show usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Installation modes:"
    echo "  dev         Development setup (default)"
    echo "  production  Production setup"
    echo ""
    echo "Options:"
    echo "  -m, --mode MODE          Installation mode (dev|production)"
    echo "  -s, --skip-deps          Skip system dependency installation"
    echo "  -f, --forensic-db PATH   Path to forensic database"
    echo "  -h, --help               Show this help"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Development setup"
    echo "  $0 --mode production                 # Production setup"
    echo "  $0 --forensic-db /path/to/stego.db   # With forensic database"
    echo ""
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -m|--mode)
                INSTALL_MODE="$2"
                shift 2
                ;;
            -s|--skip-deps)
                SKIP_DEPS=true
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

    # Validate mode
    if [[ "$INSTALL_MODE" != "dev" && "$INSTALL_MODE" != "production" ]]; then
        echo -e "${RED}❌ Invalid mode: $INSTALL_MODE${NC}"
        show_usage
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

    # Check if we're in the right directory
    if [[ ! -f "$SCRIPT_DIR/package.json" ]]; then
        echo -e "${RED}❌ Not in The Ark project directory${NC}"
        echo "Please run this script from the project root directory"
        exit 1
    fi

    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo -e "${GREEN}✅ Linux detected${NC}"
        OS_TYPE="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${GREEN}✅ macOS detected${NC}"
        OS_TYPE="macos"
    else
        echo -e "${YELLOW}⚠️  Unsupported OS: $OSTYPE${NC}"
        OS_TYPE="unknown"
    fi

    # Check required commands
    REQUIRED_COMMANDS=("curl" "git")
    for cmd in "${REQUIRED_COMMANDS[@]}"; do
        if command -v "$cmd" &> /dev/null; then
            echo -e "${GREEN}✅ $cmd available${NC}"
        else
            echo -e "${RED}❌ $cmd not found${NC}"
            echo "Please install $cmd and try again"
            exit 1
        fi
    done

    # Check forensic database if provided
    if [[ -n "$FORENSIC_DB_PATH" ]]; then
        if [[ -f "$FORENSIC_DB_PATH" ]]; then
            echo -e "${GREEN}✅ Forensic database found: $FORENSIC_DB_PATH${NC}"
        else
            echo -e "${YELLOW}⚠️  Forensic database not found: $FORENSIC_DB_PATH${NC}"
            echo "Installation will continue without forensic database integration"
            FORENSIC_DB_PATH=""
        fi
    fi

    echo ""
}

# Install system dependencies
install_system_deps() {
    if [[ "$SKIP_DEPS" == true ]]; then
        echo -e "${YELLOW}⏭️  Skipping system dependency installation${NC}"
        return 0
    fi

    echo -e "${BLUE}📦 Installing system dependencies...${NC}"

    if command -v apt-get &> /dev/null; then
        # Ubuntu/Debian
        echo -e "${BLUE}📦 Updating package manager...${NC}"
        if [[ "$INSTALL_MODE" == "production" ]]; then
            sudo apt-get update -qq
            sudo apt-get install -y curl wget git unzip build-essential sqlite3
        else
            echo "For development mode, please ensure you have: curl, wget, git, build-essential"
        fi

    elif command -v brew &> /dev/null; then
        # macOS
        echo -e "${BLUE}📦 Installing via Homebrew...${NC}"
        brew install curl wget git sqlite3 || echo -e "${YELLOW}⚠️  Some packages may already be installed${NC}"

    elif command -v yum &> /dev/null; then
        # CentOS/RHEL
        echo -e "${BLUE}📦 Installing via YUM...${NC}"
        if [[ "$INSTALL_MODE" == "production" ]]; then
            sudo yum update -y
            sudo yum install -y curl wget git unzip gcc gcc-c++ make sqlite
        fi

    else
        echo -e "${YELLOW}⚠️  Unknown package manager. Please install dependencies manually:${NC}"
        echo "Required: curl, wget, git, build-essential, sqlite3"
    fi

    echo ""
}

# Install Node.js
install_nodejs() {
    echo -e "${BLUE}📦 Checking Node.js installation...${NC}"

    if command -v node &> /dev/null; then
        CURRENT_NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
        if [[ "$CURRENT_NODE_VERSION" -ge "$NODE_VERSION" ]]; then
            echo -e "${GREEN}✅ Node.js ${NODE_VERSION}+ already installed: $(node --version)${NC}"
            echo -e "${GREEN}✅ NPM version: $(npm --version)${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Node.js version too old: $(node --version)${NC}"
        fi
    fi

    echo -e "${BLUE}📦 Installing Node.js ${NODE_VERSION}...${NC}"

    if command -v apt-get &> /dev/null; then
        # Install via NodeSource
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs

    elif command -v brew &> /dev/null; then
        # Install via Homebrew
        brew install node@${NODE_VERSION} || brew upgrade node

    elif command -v yum &> /dev/null; then
        # Install via NodeSource for RHEL/CentOS
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
        sudo yum install -y nodejs

    else
        echo -e "${RED}❌ Unable to install Node.js automatically${NC}"
        echo "Please install Node.js ${NODE_VERSION}+ manually from https://nodejs.org/"
        echo "Then re-run this script"
        exit 1
    fi

    # Verify installation
    if command -v node &> /dev/null; then
        echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"
        echo -e "${GREEN}✅ NPM installed: $(npm --version)${NC}"
    else
        echo -e "${RED}❌ Node.js installation failed${NC}"
        exit 1
    fi

    echo ""
}

# Install project dependencies
install_project_deps() {
    echo -e "${BLUE}📦 Installing project dependencies...${NC}"

    cd "$SCRIPT_DIR"

    # Install frontend dependencies
    echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
    npm install

    # Install backend dependencies
    echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd ..

    echo -e "${GREEN}✅ Project dependencies installed${NC}"
    echo ""
}

# Setup environment files
setup_environment() {
    echo -e "${BLUE}⚙️  Setting up environment configuration...${NC}"

    cd "$SCRIPT_DIR"

    # Frontend environment
    if [[ "$INSTALL_MODE" == "dev" ]]; then
        if [[ ! -f ".env.development" ]]; then
            echo -e "${BLUE}📝 Creating frontend development environment...${NC}"
            cat > .env.development << EOF
# The Ark Frontend - Development Environment
VITE_API_URL=http://localhost:3000/api
VITE_WEBSOCKET_URL=ws://localhost:3000/ws
VITE_LLM_AVAILABLE=true
VITE_FORENSIC_ANALYSIS_ENABLED=true
VITE_DEBUG_MODE=true
EOF
        else
            echo -e "${GREEN}✅ Frontend development environment already exists${NC}"
        fi
    else
        if [[ ! -f ".env.production" ]]; then
            echo -e "${BLUE}📝 Creating frontend production environment...${NC}"
            cp .env.example .env.production 2>/dev/null || cat > .env.production << EOF
# The Ark Frontend - Production Environment
VITE_API_URL=/api
VITE_WEBSOCKET_URL=/ws
VITE_LLM_AVAILABLE=true
VITE_FORENSIC_ANALYSIS_ENABLED=true
VITE_DEBUG_MODE=false
EOF
        else
            echo -e "${GREEN}✅ Frontend production environment already exists${NC}"
        fi
    fi

    # Backend environment
    cd backend
    if [[ ! -f ".env" ]]; then
        echo -e "${BLUE}📝 Creating backend environment...${NC}"
        
        # Generate random secrets
        SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || date | md5sum | cut -d' ' -f1)
        JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || date | sha256sum | cut -d' ' -f1)

        cat > .env << EOF
# The Ark Backend - Environment Configuration
NODE_ENV=${INSTALL_MODE}
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_PATH=./data/ark.db

# Security Configuration
SESSION_SECRET=${SESSION_SECRET}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12

# File Upload Settings
MAX_UPLOAD_SIZE=104857600
UPLOAD_PATH=./uploads

# CORS Settings
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000

# Analysis Settings
ANALYSIS_TIMEOUT=300000
CONCURRENT_ANALYSIS_LIMIT=5
MAX_FORENSIC_QUERY_RESULTS=1000
FORENSIC_CACHE_ENABLED=true

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
EOF

        # Add forensic database configuration if provided
        if [[ -n "$FORENSIC_DB_PATH" ]]; then
            cat >> .env << EOF

# Forensic Database Integration
FORENSIC_DB_PATH=${FORENSIC_DB_PATH}
ENABLE_FORENSIC_ANALYSIS=true
EOF
            echo -e "${GREEN}✅ Forensic database integrated: $FORENSIC_DB_PATH${NC}"
        fi

        echo -e "${GREEN}✅ Backend environment created${NC}"
    else
        echo -e "${GREEN}✅ Backend environment already exists${NC}"
        
        # Add forensic database if provided and not already configured
        if [[ -n "$FORENSIC_DB_PATH" ]] && ! grep -q "FORENSIC_DB_PATH" .env; then
            echo -e "${BLUE}📝 Adding forensic database configuration...${NC}"
            cat >> .env << EOF

# Forensic Database Integration
FORENSIC_DB_PATH=${FORENSIC_DB_PATH}
ENABLE_FORENSIC_ANALYSIS=true
EOF
            echo -e "${GREEN}✅ Forensic database integrated: $FORENSIC_DB_PATH${NC}"
        fi
    fi

    cd ..

    # Create necessary directories
    echo -e "${BLUE}📁 Creating project directories...${NC}"
    mkdir -p data uploads logs backend/data backend/uploads backend/logs

    echo -e "${GREEN}✅ Environment setup complete${NC}"
    echo ""
}

# Build for production
build_production() {
    if [[ "$INSTALL_MODE" == "production" ]]; then
        echo -e "${BLUE}🔨 Building for production...${NC}"
        
        cd "$SCRIPT_DIR"
        
        # Type check
        echo -e "${BLUE}🔍 Running TypeScript checks...${NC}"
        npm run type-check

        # Build frontend
        echo -e "${BLUE}🏗️  Building frontend...${NC}"
        npm run build

        echo -e "${GREEN}✅ Production build complete${NC}"
        echo ""
    fi
}

# Create startup scripts
create_startup_scripts() {
    echo -e "${BLUE}🛠️  Creating startup scripts...${NC}"

    cd "$SCRIPT_DIR"

    # Development startup script
    cat > start-dev.sh << 'EOF'
#!/bin/bash

# The Ark - Development Startup Script

echo "🚀 Starting The Ark in development mode..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ and try again."
    exit 1
fi

# Create necessary directories
mkdir -p data uploads logs backend/data backend/uploads backend/logs

echo "📊 Backend will run on: http://localhost:3000"
echo "🌐 Frontend will run on: http://localhost:5173"
echo ""
echo "🔑 Default credentials:"
echo "  Username: admin"
echo "  Password: admin123"
echo ""
echo "Open separate terminals and run:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: npm run dev"
echo ""
echo "Or use the following commands to start both:"
echo ""

# Check if we can run both in parallel
if command -v gnome-terminal &> /dev/null; then
    echo "gnome-terminal --tab --title='Backend' -- bash -c 'cd backend && npm run dev; exec bash' --tab --title='Frontend' -- bash -c 'npm run dev; exec bash'"
elif command -v osascript &> /dev/null; then
    echo "osascript -e 'tell app \"Terminal\" to do script \"cd $(pwd)/backend && npm run dev\"' -e 'tell app \"Terminal\" to do script \"cd $(pwd) && npm run dev\"'"
else
    echo "# Terminal 1:"
    echo "cd backend && npm run dev"
    echo ""
    echo "# Terminal 2:"
    echo "npm run dev"
fi
EOF

    # Production startup script
    if [[ "$INSTALL_MODE" == "production" ]]; then
        cat > start-production.sh << 'EOF'
#!/bin/bash

# The Ark - Production Startup Script

echo "🚀 Starting The Ark in production mode..."

# Check if PM2 is available
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Stop any existing processes
pm2 delete ark-backend 2>/dev/null || true

# Start backend with PM2
echo "🚀 Starting backend..."
cd backend
pm2 start src/app.js --name "ark-backend" --watch --ignore-watch="node_modules data uploads logs"

# Show status
pm2 status

echo ""
echo "✅ The Ark is running in production mode!"
echo "🌐 Backend API: http://localhost:3000/api"
echo "💓 Health check: http://localhost:3000/health"
echo ""
echo "🛠️  Management commands:"
echo "  pm2 status         # Check status"
echo "  pm2 logs ark-backend  # View logs"
echo "  pm2 restart ark-backend  # Restart"
echo "  pm2 stop ark-backend     # Stop"
echo ""
EOF
        chmod +x start-production.sh
    fi

    chmod +x start-dev.sh

    echo -e "${GREEN}✅ Startup scripts created${NC}"
    echo ""
}

# Show completion message
show_completion() {
    echo ""
    echo -e "${GREEN}🎉 The Ark installation completed successfully!${NC}"
    echo ""
    echo -e "${BLUE}📋 Installation Summary:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "Mode: ${YELLOW}$INSTALL_MODE${NC}"
    echo -e "Node.js: ${GREEN}$(node --version)${NC}"
    echo -e "NPM: ${GREEN}$(npm --version)${NC}"
    
    if [[ -n "$FORENSIC_DB_PATH" ]]; then
        echo -e "Forensic DB: ${GREEN}$FORENSIC_DB_PATH${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    
    if [[ "$INSTALL_MODE" == "dev" ]]; then
        echo "1. Start development servers:"
        echo "   ./start-dev.sh"
        echo ""
        echo "2. Open your browser:"
        echo "   Frontend: http://localhost:5173"
        echo "   Backend API: http://localhost:3000/api"
        echo ""
        echo "3. Login with default credentials:"
        echo "   Username: admin"
        echo "   Password: admin123"
        
    else
        echo "1. Start production server:"
        echo "   ./start-production.sh"
        echo ""
        echo "2. Configure reverse proxy (Nginx/Apache)"
        echo "3. Set up SSL certificates"
        echo "4. Configure firewall rules"
        echo ""
        echo "📖 For full production deployment, run:"
        echo "   ./deploy.sh --mode production"
    fi
    
    echo ""
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo "• README.md - Project overview"
    echo "• DEPLOYMENT_GUIDE.md - Deployment instructions"
    echo "• backend/.env - Backend configuration"
    echo "• .env.development/.env.production - Frontend configuration"
    
    echo ""
    echo -e "${BLUE}🛠️  Troubleshooting:${NC}"
    echo "• Check logs in ./logs/ directory"
    echo "• Verify environment variables in .env files"
    echo "• Ensure ports 3000 and 5173 are available"
    echo "• Run 'npm run type-check' for TypeScript issues"
    
    echo ""
    echo -e "${GREEN}🌟 The Ark is ready for forensic investigation!${NC}"
    echo ""
}

# Main installation flow
main() {
    # Parse arguments
    parse_args "$@"
    
    # Show banner
    print_banner
    
    echo -e "${WHITE}Installation Mode: ${YELLOW}$INSTALL_MODE${NC}"
    if [[ -n "$FORENSIC_DB_PATH" ]]; then
        echo -e "${WHITE}Forensic Database: ${YELLOW}$FORENSIC_DB_PATH${NC}"
    fi
    if [[ "$SKIP_DEPS" == true ]]; then
        echo -e "${WHITE}Skip Dependencies: ${YELLOW}Yes${NC}"
    fi
    echo ""
    
    # Confirm installation
    if [[ "$INSTALL_MODE" == "production" ]]; then
        read -p "Continue with production installation? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Installation cancelled."
            exit 0
        fi
        echo ""
    fi
    
    # Execute installation steps
    check_prerequisites
    install_system_deps
    install_nodejs
    install_project_deps
    setup_environment
    build_production
    create_startup_scripts
    
    # Show completion message
    show_completion
}

# Run main function with all arguments
main "$@"
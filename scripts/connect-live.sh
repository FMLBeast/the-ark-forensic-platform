#!/bin/bash

cat << "EOF"
🕴️ THE ARK - BUILD YOUR OWN F*KING BOAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      ████████╗██╗  ██╗███████╗     █████╗ ██████╗ ██╗  ██╗
      ╚══██╔══╝██║  ██║██╔════╝    ██╔══██╗██╔══██╗██║ ██╔╝
         ██║   ███████║█████╗      ███████║██████╔╝█████╔╝ 
         ██║   ██╔══██║██╔══╝      ██╔══██║██╔══██╗██╔═██╗ 
         ██║   ██║  ██║███████╗    ██║  ██║██║  ██║██║  ██╗
         ╚═╝   ╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF

echo "🔗 Establishing secure Matrix connection..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if React build exists
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️ Production build not found. Building React app...${NC}"
    npm run build
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Build failed. Please fix errors and try again.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ React app built successfully${NC}"
fi

# Function to start local services
start_local_services() {
    echo -e "${BLUE}🚀 Starting local React development server...${NC}"
    
    # Set production environment for live connection
    export NODE_ENV=production
    export VITE_API_URL=http://localhost:3000/api
    
    # Start React dev server on different port to avoid conflict
    npm run dev -- --port 3001 &
    LOCAL_DEV_PID=$!
    
    echo -e "${GREEN}✅ Local React server started on port 3001${NC}"
    echo -e "${BLUE}   Access at: http://localhost:3001${NC}"
    
    return $LOCAL_DEV_PID
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Disconnecting from The Matrix...${NC}"
    if [ ! -z "$LOCAL_DEV_PID" ]; then
        kill $LOCAL_DEV_PID 2>/dev/null
        echo -e "${GREEN}✅ Local services stopped${NC}"
    fi
    echo -e "${GREEN}🕴️ Connection terminated. You are now back in the real world.${NC}"
}

# Set up signal trap for cleanup
trap cleanup EXIT INT TERM

# Start local services
start_local_services
LOCAL_DEV_PID=$!

echo "🎯 Investigation Platforms:"
echo -e "${GREEN}   http://localhost:3001  - The Ark React Frontend (Local Dev)${NC}"
echo -e "${BLUE}   http://localhost:3000  - The Ark (Main Platform via SSH)${NC}"
echo -e "${BLUE}   http://localhost:8080  - Forensic LLM Interface${NC}"
echo -e "${BLUE}   http://localhost:8081  - Deep Analysis Engine${NC}"
echo -e "${BLUE}   http://localhost:11434 - Direct Ollama API${NC}"
echo ""
echo -e "${YELLOW}🕴️ Choose your identity and jack in...${NC}"
echo -e "${RED}🛑 Press Ctrl+C to disconnect from both local and remote${NC}"
echo ""

# Establish SSH tunnel with port forwarding
ssh -N -p 51414 root@153.204.80.81 \
  -L 3000:localhost:3000 \
  -L 8080:localhost:80 \
  -L 8081:localhost:8000 \
  -L 11434:localhost:11434
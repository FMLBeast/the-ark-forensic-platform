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
                   DEVELOPMENT + PRODUCTION LLM
EOF

echo "🧠 Initializing development environment with production LLM access..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Check if LLM environment file exists
if [ ! -f ".env.development.with-llm" ]; then
    echo -e "${RED}❌ .env.development.with-llm not found!${NC}"
    echo "This file is required for LLM testing mode."
    exit 1
fi

# Copy LLM environment for this session
cp .env.development.with-llm .env.local
echo -e "${GREEN}✅ LLM development environment configured${NC}"

echo -e "${CYAN}🌐 Setting up SSH tunnel to production LLM...${NC}"

# Function to setup SSH tunnel for LLM access
setup_llm_tunnel() {
    echo -e "${BLUE}🔗 Establishing LLM connection tunnel...${NC}"
    
    # Start SSH tunnel for LLM services in background
    ssh -N -p 51414 root@153.204.80.81 \
        -L 8080:localhost:80 \
        -L 8081:localhost:8000 \
        -L 11434:localhost:11434 \
        -o ConnectTimeout=10 \
        -o ExitOnForwardFailure=yes &
    
    SSH_PID=$!
    
    echo -e "${GREEN}✅ SSH tunnel established (PID: $SSH_PID)${NC}"
    echo -e "${CYAN}   LLM API: http://localhost:8080${NC}"
    echo -e "${CYAN}   Analysis: http://localhost:8081${NC}"
    echo -e "${CYAN}   Ollama: http://localhost:11434${NC}"
    
    # Wait for tunnel to establish
    echo -e "${YELLOW}⏳ Waiting for tunnel to stabilize...${NC}"
    sleep 5
    
    # Test LLM connection
    if curl -s --connect-timeout 5 http://localhost:8080 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ LLM services are accessible${NC}"
        LLM_AVAILABLE=true
    else
        echo -e "${YELLOW}⚠️ LLM services may still be connecting...${NC}"
        LLM_AVAILABLE=false
    fi
    
    return $SSH_PID
}

# Function to start local backend
start_local_backend() {
    echo -e "${CYAN}🐍 Checking local Flask backend...${NC}"
    if [ -d "../ark_rawjs" ]; then
        echo -e "${GREEN}✅ Flask backend found${NC}"
        
        cd ../ark_rawjs
        
        # Set environment variables for backend
        export FORENSIC_DB_PATH="/home/database/stego_results.db"
        export INVESTIGATION_DB_PATH="/home/database/investigation.db"
        export FLASK_ENV=development
        export FLASK_DEBUG=1
        
        # Enable LLM integration in backend
        export LLM_API_URL="http://localhost:8080"
        export OLLAMA_API_URL="http://localhost:11434"
        export ENABLE_LLM_ANALYSIS=true
        
        echo -e "${BLUE}🐍 Starting Flask backend with LLM integration...${NC}"
        python updated_ark_main_app.py > ../ark_react/flask-llm.log 2>&1 &
        FLASK_PID=$!
        
        cd ../ark_react
        echo -e "${GREEN}✅ Flask backend started with LLM support (PID: $FLASK_PID)${NC}"
        
        # Wait for Flask to start
        sleep 3
        
        return $FLASK_PID
    else
        echo -e "${YELLOW}⚠️ Flask backend not found, frontend-only mode${NC}"
        return 0
    fi
}

# Function to start React frontend
start_frontend() {
    echo -e "${BLUE}⚛️ Starting React frontend with LLM features...${NC}"
    
    # Start React dev server
    npm run dev > react-llm.log 2>&1 &
    REACT_PID=$!
    
    echo -e "${GREEN}✅ React frontend started (PID: $REACT_PID)${NC}"
    
    # Wait for React to compile
    sleep 5
    
    return $REACT_PID
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down development environment with LLM...${NC}"
    
    if [ ! -z "$SSH_PID" ]; then
        kill $SSH_PID 2>/dev/null
        echo -e "${GREEN}✅ SSH tunnel closed${NC}"
    fi
    
    if [ ! -z "$FLASK_PID" ]; then
        kill $FLASK_PID 2>/dev/null
        echo -e "${GREEN}✅ Flask backend stopped${NC}"
    fi
    
    if [ ! -z "$REACT_PID" ]; then
        kill $REACT_PID 2>/dev/null
        echo -e "${GREEN}✅ React frontend stopped${NC}"
    fi
    
    # Clean up temporary files
    [ -f ".env.local" ] && rm .env.local
    [ -f "flask-llm.log" ] && rm flask-llm.log
    [ -f "react-llm.log" ] && rm react-llm.log
    
    echo ""
    echo -e "${PURPLE}🧠 LLM development session terminated${NC}"
    echo -e "${GREEN}   The Matrix connection has been severed.${NC}"
    echo ""
}

# Set up signal trap for cleanup
trap cleanup EXIT INT TERM

# Start services in order
setup_llm_tunnel
SSH_PID=$?

start_local_backend
FLASK_PID=$?

start_frontend
REACT_PID=$?

echo ""
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🧠 THE ARK DEVELOPMENT + LLM ENVIRONMENT IS READY!${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Local Services:${NC}"
echo -e "${GREEN}   http://localhost:3001  - The Ark React Frontend${NC}"
echo -e "${GREEN}   http://localhost:5000  - Flask API Backend${NC}"
echo ""
echo -e "${BLUE}🧠 Production LLM Services (via SSH):${NC}"
echo -e "${CYAN}   http://localhost:8080  - LLM Analysis API${NC}"
echo -e "${CYAN}   http://localhost:8081  - Deep Analysis Engine${NC}"
echo -e "${CYAN}   http://localhost:11434 - Ollama API${NC}"
echo ""
echo -e "${YELLOW}🧠 LLM Features Available:${NC}"
echo -e "${CYAN}   ✅ Continuous Database Learning${NC}"
echo -e "${CYAN}   ✅ Pattern Recognition${NC}"
echo -e "${CYAN}   ✅ Connection Discovery${NC}"
echo -e "${CYAN}   ✅ Anomaly Detection${NC}"
echo -e "${CYAN}   ✅ Real-time Analysis${NC}"
echo ""
echo -e "${YELLOW}📊 Database: /home/database${NC}"
echo -e "${YELLOW}🔄 LLM Analysis: Every 1 minute (testing mode)${NC}"
echo -e "${YELLOW}🐛 Debug Mode: Enabled${NC}"
echo ""
echo -e "${PURPLE}🕴️ The Matrix is learning... watch for AI insights!${NC}"
echo ""
echo -e "${RED}🛑 Press Ctrl+C to disconnect and shut down all services${NC}"
echo ""

# Monitor services
while true; do
    # Check if services are still running
    if [ ! -z "$REACT_PID" ] && ! kill -0 $REACT_PID 2>/dev/null; then
        echo -e "${RED}❌ React frontend has stopped${NC}"
        break
    fi
    
    if [ ! -z "$FLASK_PID" ] && ! kill -0 $FLASK_PID 2>/dev/null; then
        echo -e "${RED}❌ Flask backend has stopped${NC}"
        break
    fi
    
    if [ ! -z "$SSH_PID" ] && ! kill -0 $SSH_PID 2>/dev/null; then
        echo -e "${RED}❌ SSH tunnel has disconnected${NC}"
        break
    fi
    
    sleep 10
done
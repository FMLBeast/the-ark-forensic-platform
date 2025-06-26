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
                     DEVELOPMENT ENVIRONMENT
EOF

echo "🛠️ Initializing local development Matrix..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# ASCII Matrix-style loading
echo -e "${GREEN}🔍 Scanning environment...${NC}"
sleep 1

# Check if database exists
echo -e "${CYAN}📊 Checking database connection...${NC}"
if [ -d "/home/database" ]; then
    echo -e "${GREEN}✅ Database directory found at /home/database${NC}"
    if [ -f "/home/database/stego_results.db" ]; then
        echo -e "${GREEN}✅ Forensic database located${NC}"
    else
        echo -e "${YELLOW}⚠️ Creating forensic database structure...${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Database directory not found. Creating...${NC}"
    mkdir -p /home/database
    echo -e "${GREEN}✅ Database directory created${NC}"
fi

# Check Flask backend
echo -e "${CYAN}🐍 Checking Flask backend...${NC}"
if [ -d "../ark_rawjs" ]; then
    echo -e "${GREEN}✅ Flask backend found at ../ark_rawjs${NC}"
    
    # Check Python dependencies
    if python3 -c "import flask" 2>/dev/null; then
        echo -e "${GREEN}✅ Flask dependencies available${NC}"
    else
        echo -e "${YELLOW}⚠️ Installing Flask dependencies...${NC}"
        cd ../ark_rawjs
        pip install -r requirements.txt 2>/dev/null || echo -e "${RED}❌ Failed to install dependencies${NC}"
        cd ../ark_react
    fi
    
    BACKEND_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️ Flask backend not found at ../ark_rawjs${NC}"
    echo -e "${YELLOW}   Frontend will run in standalone mode${NC}"
    BACKEND_AVAILABLE=false
fi

# Check React dependencies
echo -e "${CYAN}⚛️ Checking React frontend...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ React dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️ Installing React dependencies...${NC}"
    npm install
fi

echo ""
echo -e "${PURPLE}🚀 LAUNCHING THE ARK DEVELOPMENT ENVIRONMENT${NC}"
echo ""

# Function to start Flask backend
start_backend() {
    if [ "$BACKEND_AVAILABLE" = true ]; then
        echo -e "${BLUE}🐍 Starting Flask backend...${NC}"
        cd ../ark_rawjs
        
        # Set environment variables for backend
        export FORENSIC_DB_PATH="/home/database/stego_results.db"
        export INVESTIGATION_DB_PATH="/home/database/investigation.db"
        export FLASK_ENV=development
        export FLASK_DEBUG=1
        export FLASK_PORT=5000
        
        # Start Flask in background with output redirect
        echo -e "${CYAN}   Database: /home/database/stego_results.db${NC}"
        echo -e "${CYAN}   API: http://localhost:5000${NC}"
        
        python updated_ark_main_app.py > ../ark_react/flask.log 2>&1 &
        FLASK_PID=$!
        
        # Return to React directory
        cd ../ark_react
        
        echo -e "${GREEN}✅ Flask backend started (PID: $FLASK_PID)${NC}"
        echo -e "${CYAN}   Logs: ./flask.log${NC}"
        
        # Wait for Flask to start
        echo -e "${YELLOW}⏳ Waiting for Flask to initialize...${NC}"
        sleep 3
        
        # Test Flask connection
        if curl -s http://localhost:5000 >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Flask backend is responding${NC}"
        else
            echo -e "${YELLOW}⚠️ Flask backend may still be starting...${NC}"
        fi
    else
        echo -e "${YELLOW}⏭️ Skipping backend startup (not available)${NC}"
        FLASK_PID=""
    fi
}

# Function to start React frontend
start_frontend() {
    echo -e "${BLUE}⚛️ Starting React frontend...${NC}"
    
    # Set development environment
    export NODE_ENV=development
    export VITE_API_URL=http://localhost:5000/api
    export VITE_DATABASE_PATH=/home/database
    
    echo -e "${CYAN}   Frontend: http://localhost:3001${NC}"
    echo -e "${CYAN}   API Proxy: http://localhost:5000/api${NC}"
    
    # Start React dev server
    npm run dev > react.log 2>&1 &
    REACT_PID=$!
    
    echo -e "${GREEN}✅ React frontend started (PID: $REACT_PID)${NC}"
    echo -e "${CYAN}   Logs: ./react.log${NC}"
    
    # Wait for React to start
    echo -e "${YELLOW}⏳ Waiting for React to compile...${NC}"
    sleep 5
    
    # Test React connection
    if curl -s http://localhost:3001 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ React frontend is responding${NC}"
    else
        echo -e "${YELLOW}⚠️ React frontend may still be compiling...${NC}"
    fi
}

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down The Ark development environment...${NC}"
    
    if [ ! -z "$FLASK_PID" ]; then
        kill $FLASK_PID 2>/dev/null
        echo -e "${GREEN}✅ Flask backend stopped${NC}"
    fi
    
    if [ ! -z "$REACT_PID" ]; then
        kill $REACT_PID 2>/dev/null
        echo -e "${GREEN}✅ React frontend stopped${NC}"
    fi
    
    # Clean up log files
    [ -f "flask.log" ] && rm flask.log
    [ -f "react.log" ] && rm react.log
    
    echo ""
    echo -e "${PURPLE}🕴️ The Ark development environment has been terminated${NC}"
    echo -e "${GREEN}   Welcome back to reality, Neo.${NC}"
    echo ""
}

# Set up signal trap for cleanup
trap cleanup EXIT INT TERM

# Start services
start_backend
start_frontend

echo ""
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎯 THE ARK DEVELOPMENT ENVIRONMENT IS READY!${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Investigation Platforms:${NC}"
echo -e "${GREEN}   http://localhost:3001  - The Ark React Frontend${NC}"
if [ "$BACKEND_AVAILABLE" = true ]; then
    echo -e "${GREEN}   http://localhost:5000  - Flask API Backend${NC}"
    echo -e "${CYAN}   API Status: http://localhost:5000/api/health${NC}"
fi
echo ""
echo -e "${YELLOW}📊 System Information:${NC}"
echo -e "${CYAN}   Database: /home/database${NC}"
echo -e "${CYAN}   Environment: Development${NC}"
echo -e "${CYAN}   Mode: Local Development${NC}"
echo ""
echo -e "${PURPLE}🕴️ Access The Ark with your authorized credentials...${NC}"
echo ""
echo -e "${YELLOW}📋 Authentication:${NC}"
echo -e "${CYAN}   Use your assigned operative credentials${NC}"
echo -e "${CYAN}   Contact system administrator for access${NC}"
echo ""
echo -e "${RED}🛑 Press Ctrl+C to disconnect and shut down all services${NC}"
echo ""

# Monitor services and wait
while true; do
    # Check if services are still running
    if [ ! -z "$REACT_PID" ] && ! kill -0 $REACT_PID 2>/dev/null; then
        echo -e "${RED}❌ React frontend has stopped unexpectedly${NC}"
        break
    fi
    
    if [ ! -z "$FLASK_PID" ] && ! kill -0 $FLASK_PID 2>/dev/null; then
        echo -e "${RED}❌ Flask backend has stopped unexpectedly${NC}"
        break
    fi
    
    sleep 10
done
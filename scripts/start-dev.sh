#!/bin/bash

# The Ark Development Startup Script
echo "🕴️ Starting The Ark Development Environment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if database exists
if [ -d "/home/database" ]; then
    echo -e "${GREEN}✅ Database directory found at /home/database${NC}"
else
    echo -e "${YELLOW}⚠️ Database directory not found at /home/database${NC}"
    echo "Creating database directory..."
    mkdir -p /home/database
fi

# Check if Flask backend exists
if [ -d "../ark_rawjs" ]; then
    echo -e "${GREEN}✅ Flask backend found at ../ark_rawjs${NC}"
    
    # Start Flask backend in background
    echo -e "${BLUE}🚀 Starting Flask backend...${NC}"
    cd ../ark_rawjs
    
    # Set environment variables for backend
    export FORENSIC_DB_PATH="/home/database/stego_results.db"
    export INVESTIGATION_DB_PATH="/home/database/investigation.db"
    export FLASK_ENV=development
    
    # Start Flask in background
    python updated_ark_main_app.py &
    FLASK_PID=$!
    
    echo -e "${GREEN}✅ Flask backend started with PID: $FLASK_PID${NC}"
    
    # Return to React directory
    cd ../ark_react
else
    echo -e "${YELLOW}⚠️ Flask backend not found at ../ark_rawjs${NC}"
    echo "Starting frontend only..."
fi

# Wait a moment for Flask to start
sleep 3

# Start React frontend
echo -e "${BLUE}🚀 Starting React frontend...${NC}"
npm run dev &
REACT_PID=$!

echo -e "${GREEN}✅ React frontend started with PID: $REACT_PID${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down development environment...${NC}"
    if [ ! -z "$FLASK_PID" ]; then
        kill $FLASK_PID 2>/dev/null
        echo -e "${GREEN}✅ Flask backend stopped${NC}"
    fi
    if [ ! -z "$REACT_PID" ]; then
        kill $REACT_PID 2>/dev/null
        echo -e "${GREEN}✅ React frontend stopped${NC}"
    fi
    echo -e "${GREEN}🕴️ The Ark development environment has been shut down${NC}"
}

# Set up signal trap for cleanup
trap cleanup EXIT INT TERM

echo -e "\n${GREEN}🎯 The Ark Development Environment is Ready!${NC}"
echo -e "${BLUE}Frontend: http://localhost:3001${NC}"
echo -e "${BLUE}Backend API: http://localhost:5000${NC}"
echo -e "${YELLOW}Database: /home/database${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop both servers${NC}\n"

# Wait for user to stop
wait
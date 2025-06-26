#!/bin/bash

# The Ark - Forensic Investigation Platform Startup Script

echo "🚀 Starting The Ark - Forensic Investigation Platform"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if port is available
port_available() {
    ! nc -z localhost $1 2>/dev/null
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ required. Current version: $(node --version)${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"
echo -e "${GREEN}✅ npm $(npm --version) found${NC}"

# Check if forensic tools are available (optional but recommended)
echo -e "${BLUE}Checking forensic tools...${NC}"

if command_exists exiftool; then
    echo -e "${GREEN}✅ exiftool found${NC}"
else
    echo -e "${YELLOW}⚠️  exiftool not found - metadata extraction will be limited${NC}"
    echo -e "${YELLOW}   Install with: sudo apt-get install exiftool${NC}"
fi

if command_exists file; then
    echo -e "${GREEN}✅ file command found${NC}"
else
    echo -e "${YELLOW}⚠️  file command not found - file type detection will be limited${NC}"
    echo -e "${YELLOW}   Install with: sudo apt-get install file${NC}"
fi

if command_exists zsteg; then
    echo -e "${GREEN}✅ zsteg found${NC}"
else
    echo -e "${YELLOW}⚠️  zsteg not found - steganography analysis will be limited${NC}"
    echo -e "${YELLOW}   Install with: gem install zsteg${NC}"
fi

if command_exists steghide; then
    echo -e "${GREEN}✅ steghide found${NC}"
else
    echo -e "${YELLOW}⚠️  steghide not found - steganography analysis will be limited${NC}"
    echo -e "${YELLOW}   Install with: sudo apt-get install steghide${NC}"
fi

# Check port availability
echo -e "${BLUE}Checking port availability...${NC}"

if ! port_available 3000; then
    echo -e "${RED}❌ Port 3000 is already in use. Please stop other services or change the port.${NC}"
    exit 1
fi

if ! port_available 5173; then
    echo -e "${RED}❌ Port 5173 is already in use. Please stop other services or change the port.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Ports 3000 and 5173 are available${NC}"

# Install backend dependencies
echo -e "${BLUE}Installing backend dependencies...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install backend dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Backend dependencies already installed${NC}"
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${BLUE}Creating backend .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env file from template${NC}"
    echo -e "${YELLOW}⚠️  Please review and update .env file with your settings${NC}"
fi

cd ..

# Install frontend dependencies
echo -e "${BLUE}Installing frontend dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Frontend dependencies already installed${NC}"
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down The Ark...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${BLUE}Starting backend server...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ! port_available 3000; then
    echo -e "${GREEN}✅ Backend server started on port 3000${NC}"
else
    echo -e "${RED}❌ Backend server failed to start${NC}"
    exit 1
fi

# Start frontend
echo -e "${BLUE}Starting frontend development server...${NC}"
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

# Check if frontend started successfully
if ! port_available 5173; then
    echo -e "${GREEN}✅ Frontend server started on port 5173${NC}"
else
    echo -e "${RED}❌ Frontend server failed to start${NC}"
    cleanup
    exit 1
fi

# Create logs directory
mkdir -p logs

echo ""
echo -e "${GREEN}🎉 The Ark is now running!${NC}"
echo ""
echo -e "${BLUE}📱 Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}🔧 Backend API:${NC} http://localhost:3000/api"
echo -e "${BLUE}💾 Database:${NC} ./backend/data/ark.db"
echo -e "${BLUE}📁 Uploads:${NC} ./backend/uploads/"
echo ""
echo -e "${BLUE}Default Login:${NC}"
echo -e "   Username: admin"
echo -e "   Password: admin123"
echo ""
echo -e "${YELLOW}📋 Features Available:${NC}"
echo -e "   • File upload and analysis"
echo -e "   • Real agent orchestration"
echo -e "   • Steganography detection"
echo -e "   • Cryptography analysis"
echo -e "   • Investigation management"
echo -e "   • Real-time WebSocket updates"
echo ""
echo -e "${BLUE}📊 Logs:${NC}"
echo -e "   • Backend: ./logs/backend.log"
echo -e "   • Frontend: ./logs/frontend.log"
echo ""
echo -e "${RED}Press Ctrl+C to stop The Ark${NC}"
echo ""

# Wait for user interrupt
wait
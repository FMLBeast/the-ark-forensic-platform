#!/bin/bash

# The Ark - One-Command Vast.ai Deployment
# Run this script on your Vast.ai instance for instant deployment

echo "🚀 The Ark - One-Command Vast.ai Deployment"
echo "============================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}This script will:${NC}"
echo "• Download the latest code from GitHub"
echo "• Install all dependencies and tools"
echo "• Set up the complete full-stack application"
echo "• Configure Nginx, PM2, and security"
echo "• Start all services"
echo ""
echo -e "${YELLOW}Requirements:${NC}"
echo "• Ubuntu 20.04+ instance with root access"
echo "• At least 8GB RAM and 30GB disk space"
echo "• Ports 22, 80, 443, 3000 open"
echo ""

read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}📥 Downloading deployment script...${NC}"

# Download the full setup script
curl -fsSL https://raw.githubusercontent.com/FMLBeast/the-ark-forensic-platform/main/scripts/vast-ai-full-setup.sh -o /tmp/vast-ai-full-setup.sh

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to download deployment script${NC}"
    echo "Please check your internet connection and try again."
    exit 1
fi

# Make it executable
chmod +x /tmp/vast-ai-full-setup.sh

echo -e "${GREEN}✅ Download complete${NC}"
echo ""
echo -e "${BLUE}🚀 Starting full deployment...${NC}"
echo ""

# Run the deployment script
/tmp/vast-ai-full-setup.sh

# Clean up
rm -f /tmp/vast-ai-full-setup.sh

echo ""
echo -e "${GREEN}🎉 Deployment script completed!${NC}"
echo ""
echo -e "${BLUE}📋 Quick Start:${NC}"
echo "1. Open http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_INSTANCE_IP') in your browser"
echo "2. Login with admin/admin123"
echo "3. Upload files and start forensic analysis"
echo ""
echo -e "${BLUE}🛠️  Management:${NC}"
echo "• ark-status   - Check application status"
echo "• ark-restart  - Restart all services"
echo "• ark-logs     - View application logs"
echo "• ark-update   - Update from GitHub"
echo ""
echo -e "${GREEN}🌟 The Ark is ready for forensic investigation!${NC}"
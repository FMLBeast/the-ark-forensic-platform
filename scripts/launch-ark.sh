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

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🕴️ Welcome to The Matrix Investigation Platform${NC}"
echo ""
echo -e "${YELLOW}Choose your reality:${NC}"
echo ""
echo -e "${GREEN}1) 💻 Development Mode${NC}"
echo -e "${CYAN}   - Local Flask backend + React frontend${NC}"
echo -e "${CYAN}   - Database: /home/database${NC}"
echo -e "${CYAN}   - Full development environment${NC}"
echo ""
echo -e "${BLUE}2) 🌐 Live Server Mode${NC}"
echo -e "${CYAN}   - SSH tunnel to live investigation server${NC}"
echo -e "${CYAN}   - Remote: 153.204.80.81:51414${NC}"
echo -e "${CYAN}   - Port forwarding for all services${NC}"
echo ""
echo -e "${YELLOW}3) ⚛️ Frontend Only${NC}"
echo -e "${CYAN}   - React development server only${NC}"
echo -e "${CYAN}   - For UI development and testing${NC}"
echo ""
echo -e "${RED}0) 🚪 Exit${NC}"
echo ""

read -p "Enter your choice (0-3): " choice

case $choice in
    1)
        echo -e "${GREEN}🚀 Launching Development Mode...${NC}"
        ./start-ark-dev.sh
        ;;
    2)
        echo -e "${BLUE}🌐 Connecting to Live Server...${NC}"
        ./connect-live.sh
        ;;
    3)
        echo -e "${YELLOW}⚛️ Starting Frontend Only...${NC}"
        echo -e "${CYAN}Starting React development server...${NC}"
        npm run dev
        ;;
    0)
        echo -e "${RED}🚪 Exiting The Matrix...${NC}"
        echo -e "${GREEN}Until next time, Neo.${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice. Please enter 0, 1, 2, or 3.${NC}"
        echo -e "${YELLOW}Try again...${NC}"
        sleep 2
        ./launch-ark.sh
        ;;
esac
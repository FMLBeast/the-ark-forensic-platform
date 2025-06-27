#!/bin/bash

# PREPARE PROJECT FOR CLAUDE CODE
echo "🤖 Preparing The Ark Forensic Platform for Claude Code"
echo "======================================================"

# Set up project directory
PROJECT_DIR="/workspace/the-ark-forensic-platform"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "📂 Project directory not found at $PROJECT_DIR"
    echo "   Creating directory and cloning repository..."
    mkdir -p /workspace
    cd /workspace
    git clone https://github.com/FMLBeast/the-ark-forensic-platform.git
    cd the-ark-forensic-platform
else
    echo "📂 Found project directory at $PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # Pull latest changes
    echo "🔄 Pulling latest changes..."
    git pull origin main
fi

# Verify Claude configuration files exist
if [ ! -f ".clauderc" ]; then
    echo "❌ .clauderc not found - please ensure the repository has been updated"
    exit 1
fi

if [ ! -f "CLAUDE.md" ]; then
    echo "❌ CLAUDE.md not found - please ensure the repository has been updated"
    exit 1
fi

# Install Node.js if not present (needed for the project)
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Install backend dependencies
cd backend
npm install
cd ..

echo ""
echo "✅ Project Setup Complete!"
echo "========================="
echo ""
echo "📋 Claude Code Configuration Ready:"
echo "   .clauderc - Claude Code settings"
echo "   CLAUDE.md - Project context and documentation"
echo ""
echo "📁 Project Structure:"
echo "   Frontend: React/TypeScript application"
echo "   Backend: Node.js/Express API server"
echo "   Database: 33GB forensic analysis data"
echo "   AI: Ollama LLM integration"
echo ""
echo "🔧 When Claude Code becomes available:"
echo "   1. Install Claude Code CLI"
echo "   2. Run: claude-code auth login"
echo "   3. Run: claude-code (in this directory)"
echo ""
echo "🌐 Platform Access:"
echo "   Frontend: http://localhost:8888"
echo "   Backend: http://localhost:3002"
echo "   AI API: http://localhost:11435"
echo ""
echo "🚀 Project is ready for Claude Code integration!"
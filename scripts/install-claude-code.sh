#!/bin/bash

# INSTALL CLAUDE CODE ON VAST.AI SERVER
echo "🤖 Installing Claude Code on The Ark Forensic Platform"
echo "======================================================"

# Check if running on server
if [ ! -f "/root/hunter_server/data/stego_results.db" ]; then
    echo "⚠️  Warning: This appears to be a development environment"
    echo "   For local installation, use: npm install -g @anthropic/claude-code"
    echo "   Then run: claude-code auth login"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update system
echo "📦 Updating system packages..."
apt-get update -qq

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install Claude Code globally
echo "🤖 Installing Claude Code CLI..."
npm install -g @anthropic/claude-code

# Verify installation
if command -v claude-code &> /dev/null; then
    echo "✅ Claude Code installed successfully!"
    echo "   Version: $(claude-code --version)"
else
    echo "❌ Installation failed"
    exit 1
fi

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

echo ""
echo "🎉 Claude Code Setup Complete!"
echo "=============================="
echo ""
echo "📋 Next Steps:"
echo "1. Authenticate Claude Code:"
echo "   claude-code auth login"
echo ""
echo "2. Start Claude Code in project directory:"
echo "   cd $PROJECT_DIR"
echo "   claude-code"
echo ""
echo "📁 Project Structure:"
echo "   Frontend: React/TypeScript application"
echo "   Backend: Node.js/Express API server"
echo "   Database: 33GB forensic analysis data"
echo "   AI: Ollama LLM integration"
echo ""
echo "🔧 Configuration Files:"
echo "   .clauderc - Claude Code settings"
echo "   CLAUDE.md - Project context and documentation"
echo ""
echo "🌐 Platform Access:"
echo "   Frontend: http://localhost:8888"
echo "   Backend: http://localhost:3002"
echo "   AI API: http://localhost:11435"
echo ""
echo "🚀 Ready for AI-enhanced forensic development!"
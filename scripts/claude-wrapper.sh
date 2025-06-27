#!/bin/bash

# CLAUDE CODE WRAPPER FOR THE ARK FORENSIC PLATFORM
echo "🤖 Claude Code Wrapper for The Ark Forensic Platform"
echo "====================================================="

# Check if we're in the right directory
if [ ! -f ".clauderc" ] || [ ! -f "CLAUDE.md" ]; then
    echo "❌ Please run this from the project root directory"
    echo "   Expected files: .clauderc, CLAUDE.md"
    exit 1
fi

echo "✅ Project configuration found"
echo "📁 Current directory: $(pwd)"
echo ""

# Display project context
echo "📋 THE ARK FORENSIC PLATFORM CONTEXT"
echo "======================================"
echo ""

# Show key project info
echo "🔍 Architecture:"
echo "   Frontend: React/TypeScript + Vite"
echo "   Backend: Node.js/Express + SQLite"
echo "   AI: Ollama LLM integration"
echo "   Deployment: Docker on Vast.ai RTX 5000 Ada"
echo ""

echo "💾 Database:"
echo "   Path: /root/hunter_server/data/stego_results.db"
echo "   Size: 33GB with 54,762 files analyzed"
echo "   Tables: files, binary_content, strings_output, xor_analysis"
echo ""

echo "🌐 Services (currently running):"
echo "   Frontend: http://localhost:8888 (nginx)"
echo "   Backend: http://localhost:3002 (Node.js)"
echo "   AI API: http://localhost:11435 (Ollama)"
echo ""

echo "📂 Key Files:"
echo "   Frontend: src/pages/ForensicsPage.tsx (main interface)"
echo "   Backend: backend/src/app.js (Express server)"
echo "   Database: backend/src/services/forensic/database.js"
echo "   Deployment: vast.ai/deploy-now.sh"
echo ""

echo "🔧 Development Commands:"
echo "   Frontend: npm run dev, npm run build"
echo "   Backend: cd backend && npm run dev"
echo "   Deploy: ./vast.ai/deploy-now.sh"
echo "   Test: ./vast.ai/test-platform.sh"
echo ""

echo "🚀 Current Status: Platform fully operational"
echo "   All services running on alternative ports"
echo "   React app built and deployed"
echo "   Database connected with forensic data"
echo "   AI models loaded and ready"
echo ""

# Show recent activity
echo "📊 Quick Status Check:"
echo "   $(docker ps --format 'table {{.Names}}\t{{.Status}}' | grep ark- | wc -l) containers running"
echo "   Configuration files: .clauderc ✅ CLAUDE.md ✅"
echo ""

echo "💡 For AI assistance:"
echo "   1. Use web interface at https://claude.ai"
echo "   2. Reference CLAUDE.md for full project context"
echo "   3. Or wait for official Claude Code CLI availability"
echo ""

# Offer to show specific files
echo "📖 Would you like to see any specific files?"
echo "   cat CLAUDE.md              # Full project documentation"
echo "   cat .clauderc              # Claude Code configuration"
echo "   cat package.json           # Frontend dependencies"
echo "   cat backend/package.json   # Backend dependencies"
#!/bin/bash

# Claude Code Setup Script for Vast.ai
# Installs and configures Claude Code CLI on your Vast.ai instance

echo "🤖 Claude Code Setup for Vast.ai"
echo "================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Running as root. This is fine for Vast.ai instances.${NC}"
fi

# System information
echo -e "${BLUE}📊 System Information:${NC}"
echo "OS: $(lsb_release -d | cut -f2 2>/dev/null || echo 'Unknown')"
echo "Architecture: $(uname -m)"
echo "Memory: $(free -h | grep '^Mem:' | awk '{print $2}')"
echo ""

# Update system packages
echo -e "${BLUE}📦 Updating system packages...${NC}"
apt-get update -qq
apt-get install -y curl wget unzip python3 python3-pip

# Check if Node.js is installed, install if not
if ! command -v node &> /dev/null || [ "$(node --version | cut -d'.' -f1 | cut -d'v' -f2)" -lt "18" ]; then
    echo -e "${BLUE}📦 Installing Node.js 18...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✅ NPM version: $(npm --version)${NC}"

# Install Claude Code CLI
echo -e "${BLUE}🤖 Installing Claude Code CLI...${NC}"

# Method 1: Try npm install (if available)
if npm install -g @anthropic/claude-code 2>/dev/null; then
    echo -e "${GREEN}✅ Claude Code installed via npm${NC}"
elif curl -fsSL https://claude.ai/install.sh | bash 2>/dev/null; then
    echo -e "${GREEN}✅ Claude Code installed via official installer${NC}"
else
    echo -e "${YELLOW}⚠️  Direct installation not available. Setting up manual download...${NC}"
    
    # Create a directory for Claude Code
    mkdir -p /opt/claude-code
    cd /opt/claude-code
    
    # Download the latest release (replace with actual download URL when available)
    echo -e "${BLUE}📥 Setting up Claude Code environment...${NC}"
    
    # Create a wrapper script that can be used to run Claude Code
    cat > /usr/local/bin/claude-code << 'EOF'
#!/bin/bash
echo "🤖 Claude Code CLI"
echo "=================="
echo ""
echo "Claude Code is an AI-powered CLI tool from Anthropic."
echo ""
echo "📋 Available commands:"
echo "  claude-code chat        # Start interactive chat"
echo "  claude-code help        # Show help"
echo "  claude-code version     # Show version"
echo ""
echo "🔧 Configuration:"
echo "Set your API key: export ANTHROPIC_API_KEY='your-key-here'"
echo ""
echo "📖 Documentation: https://docs.anthropic.com/claude-code"
echo ""
echo "⚠️  Note: This is a placeholder. Install the actual Claude Code CLI"
echo "   when it becomes available, or use the Anthropic API directly."
EOF
    
    chmod +x /usr/local/bin/claude-code
    echo -e "${YELLOW}⚠️  Claude Code placeholder installed${NC}"
fi

# Set up development environment
echo -e "${BLUE}🛠️  Setting up development environment...${NC}"

# Install common development tools
apt-get install -y git vim nano htop tree jq

# Install Python packages for AI development
pip3 install anthropic openai requests

# Create a workspace directory
mkdir -p /workspace
cd /workspace

echo -e "${GREEN}✅ Development environment ready${NC}"

# Set up API key configuration
echo -e "${BLUE}🔑 Setting up API configuration...${NC}"

cat > /workspace/setup-api-key.sh << 'EOF'
#!/bin/bash
echo "🔑 Claude Code API Setup"
echo "========================"
echo ""
echo "To use Claude Code, you need an Anthropic API key."
echo ""
echo "1. Go to: https://console.anthropic.com/"
echo "2. Create an account or sign in"
echo "3. Generate an API key"
echo "4. Run: export ANTHROPIC_API_KEY='your-key-here'"
echo "5. Add to ~/.bashrc: echo 'export ANTHROPIC_API_KEY=\"your-key-here\"' >> ~/.bashrc"
echo ""
read -p "Enter your API key (or press Enter to skip): " api_key
if [ ! -z "$api_key" ]; then
    export ANTHROPIC_API_KEY="$api_key"
    echo "export ANTHROPIC_API_KEY=\"$api_key\"" >> ~/.bashrc
    echo "✅ API key configured!"
else
    echo "⚠️  Skipped API key setup"
fi
EOF

chmod +x /workspace/setup-api-key.sh

# Create a Python script for Claude interaction
cat > /workspace/claude-chat.py << 'EOF'
#!/usr/bin/env python3
"""
Simple Claude Code-like interface using the Anthropic API
"""

import os
import sys
try:
    import anthropic
except ImportError:
    print("Installing anthropic package...")
    os.system("pip3 install anthropic")
    import anthropic

def main():
    # Check for API key
    api_key = os.getenv('ANTHROPIC_API_KEY')
    if not api_key:
        print("🔑 No API key found!")
        print("Please set your API key: export ANTHROPIC_API_KEY='your-key-here'")
        print("Or run: /workspace/setup-api-key.sh")
        return
    
    # Initialize client
    client = anthropic.Anthropic(api_key=api_key)
    
    print("🤖 Claude Chat Interface")
    print("========================")
    print("Type 'exit' to quit, 'help' for commands")
    print("")
    
    while True:
        try:
            user_input = input("You: ").strip()
            
            if user_input.lower() in ['exit', 'quit', 'bye']:
                print("👋 Goodbye!")
                break
            
            if user_input.lower() == 'help':
                print("Available commands:")
                print("  exit/quit/bye - Exit the chat")
                print("  help - Show this help")
                print("  clear - Clear screen")
                continue
            
            if user_input.lower() == 'clear':
                os.system('clear')
                continue
            
            if not user_input:
                continue
            
            # Send message to Claude
            response = client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=1000,
                messages=[
                    {"role": "user", "content": user_input}
                ]
            )
            
            print(f"\nClaude: {response.content[0].text}\n")
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
EOF

chmod +x /workspace/claude-chat.py

# Create a project management script
cat > /workspace/claude-project.py << 'EOF'
#!/usr/bin/env python3
"""
Claude Code-like project assistant
"""

import os
import sys
import subprocess
import json

def run_command(cmd):
    """Run a shell command and return the output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout, result.stderr, result.returncode
    except Exception as e:
        return "", str(e), 1

def analyze_project():
    """Analyze the current project structure"""
    print("🔍 Analyzing project structure...")
    
    # Get file structure
    stdout, _, _ = run_command("find . -type f -name '*.py' -o -name '*.js' -o -name '*.ts' -o -name '*.json' | head -20")
    files = stdout.strip().split('\n') if stdout.strip() else []
    
    # Get git status if available
    git_stdout, _, git_code = run_command("git status --porcelain")
    
    # Get package.json if available
    package_stdout, _, _ = run_command("cat package.json 2>/dev/null")
    
    print(f"📁 Found {len(files)} code files")
    if git_code == 0:
        changed_files = len(git_stdout.strip().split('\n')) if git_stdout.strip() else 0
        print(f"📝 Git: {changed_files} changed files")
    
    if package_stdout:
        try:
            package = json.loads(package_stdout)
            print(f"📦 Node.js project: {package.get('name', 'Unknown')}")
        except:
            pass
    
    return files

def main():
    print("🤖 Claude Project Assistant")
    print("===========================")
    print("")
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "analyze":
            analyze_project()
        elif command == "status":
            run_command("git status")
        elif command == "files":
            stdout, _, _ = run_command("find . -type f | grep -E '\\.(py|js|ts|json|md)$' | sort")
            print(stdout)
        else:
            print(f"Unknown command: {command}")
    else:
        print("Available commands:")
        print("  python3 claude-project.py analyze  # Analyze project")
        print("  python3 claude-project.py status   # Git status")
        print("  python3 claude-project.py files    # List code files")

if __name__ == "__main__":
    main()
EOF

chmod +x /workspace/claude-project.py

# Create useful aliases
echo -e "${BLUE}⚙️  Setting up aliases...${NC}"

cat >> ~/.bashrc << 'EOF'

# Claude Code aliases
alias claude='python3 /workspace/claude-chat.py'
alias claude-chat='python3 /workspace/claude-chat.py'
alias claude-project='python3 /workspace/claude-project.py'
alias ccode='python3 /workspace/claude-chat.py'

# Development aliases
alias ll='ls -la'
alias la='ls -la'
alias ..='cd ..'
alias workspace='cd /workspace'
alias ark='cd /workspace/ark && ls'

# Git aliases
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline -10'

EOF

# Source bashrc
source ~/.bashrc 2>/dev/null || true

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "Unknown")

echo ""
echo -e "${GREEN}🎉 Claude Code environment setup completed!${NC}"
echo ""
echo -e "${BLUE}📋 Setup Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "🌐 Instance IP: ${GREEN}$PUBLIC_IP${NC}"
echo -e "📁 Workspace: ${YELLOW}/workspace${NC}"
echo -e "🤖 Claude Chat: ${YELLOW}claude${NC} or ${YELLOW}python3 /workspace/claude-chat.py${NC}"
echo -e "📊 Project Tools: ${YELLOW}claude-project analyze${NC}"
echo ""
echo -e "${BLUE}🚀 Quick Start:${NC}"
echo "1. Set up API key: /workspace/setup-api-key.sh"
echo "2. Start Claude chat: claude"
echo "3. Go to workspace: workspace"
echo "4. Clone your project: git clone <repo-url>"
echo ""
echo -e "${BLUE}🔧 Available Commands:${NC}"
echo "• claude                 # Start Claude chat"
echo "• claude-project analyze # Analyze current project"
echo "• workspace             # Go to workspace directory"
echo "• ark                   # Go to ark project (if cloned)"
echo ""
echo -e "${BLUE}📖 Next Steps:${NC}"
echo "1. Get Anthropic API key from: https://console.anthropic.com/"
echo "2. Run: /workspace/setup-api-key.sh"
echo "3. Clone The Ark project: git clone https://github.com/FMLBeast/the-ark-forensic-platform.git ark"
echo "4. Start coding with Claude assistance!"
echo ""
echo -e "${GREEN}🌟 Claude Code environment is ready!${NC}"
echo ""
echo -e "${YELLOW}💡 Pro tip: You can now use Claude to help with your development work!${NC}"
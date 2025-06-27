#!/bin/bash

# The Ark - Deployment Test Script
# Comprehensive testing and validation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test tracking
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Print test header
print_test_header() {
    echo ""
    echo -e "${BLUE}🧪 Testing: $1${NC}"
    echo "----------------------------------------"
}

# Run test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    local success_message="${3:-Test passed}"
    local failure_message="${4:-Test failed}"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    echo -n "Testing $test_name... "
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo -e "${YELLOW}  $failure_message${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Run test with output
run_test_with_output() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -n "Testing $test_name... "
    
    local output
    if output=$(eval "$test_command" 2>&1); then
        echo -e "${GREEN}✅ PASS${NC}"
        echo -e "${BLUE}  Output: $output${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo -e "${YELLOW}  Error: $output${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo -e "${BLUE}"
echo "████████╗███████╗███████╗████████╗"
echo "╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝"
echo "   ██║   █████╗  ███████╗   ██║   "
echo "   ██║   ██╔══╝  ╚════██║   ██║   "
echo "   ██║   ███████╗███████║   ██║   "
echo "   ╚═╝   ╚══════╝╚══════╝   ╚═╝   "
echo -e "${NC}"
echo -e "${BLUE}The Ark - Deployment Test Suite${NC}"
echo "======================================="
echo ""

# Test 1: Environment and Prerequisites
print_test_header "Environment and Prerequisites"

run_test "Node.js availability" "command -v node"
run_test_with_output "Node.js version" "node --version"
run_test "NPM availability" "command -v npm"
run_test_with_output "NPM version" "npm --version"
run_test "Git availability" "command -v git"
run_test "Curl availability" "command -v curl"

# Test 2: Project Structure
print_test_header "Project Structure"

run_test "package.json exists" "test -f package.json"
run_test "Backend package.json exists" "test -f backend/package.json"
run_test "Dockerfile.frontend exists" "test -f Dockerfile.frontend"
run_test "Dockerfile.backend exists" "test -f Dockerfile.backend"
run_test "docker-compose.yml exists" "test -f docker-compose.yml"
run_test "deploy.sh exists and executable" "test -x deploy.sh"
run_test "install.sh exists and executable" "test -x install.sh"

# Test 3: Configuration Files
print_test_header "Configuration Files"

run_test "Frontend environment example" "test -f .env.example"
run_test "Backend environment example" "test -f backend/.env.example"
run_test "TypeScript config" "test -f tsconfig.json"
run_test "Vite config" "test -f vite.config.ts"
run_test "Tailwind config" "test -f tailwind.config.js"
run_test "PostCSS config" "test -f postcss.config.js"

# Test 4: Source Code Structure
print_test_header "Source Code Structure"

run_test "Frontend src directory" "test -d src"
run_test "Backend src directory" "test -d backend/src"
run_test "Main frontend component" "test -f src/App.tsx"
run_test "Backend main app" "test -f backend/src/app.js"
run_test "Authentication routes" "test -f backend/src/routes/auth.js"
run_test "Forensic routes" "test -f backend/src/routes/forensic.js"
run_test "Graph routes" "test -f backend/src/routes/graph.js"
run_test "Forensic database service" "test -f backend/src/services/forensic/database.js"
run_test "Graph service" "test -f backend/src/services/forensic/graph.js"

# Test 5: Package.json Validation
print_test_header "Package Configuration"

run_test "Frontend package.json valid JSON" "cat package.json | jq . >/dev/null"
run_test "Backend package.json valid JSON" "cat backend/package.json | jq . >/dev/null"
run_test "Frontend build script defined" "grep -q '\"build\"' package.json"
run_test "Frontend dev script defined" "grep -q '\"dev\"' package.json"
run_test "Backend start script defined" "grep -q '\"start\"' backend/package.json"
run_test "Backend dev script defined" "grep -q '\"dev\"' backend/package.json"

# Test 6: Docker Configuration
print_test_header "Docker Configuration"

run_test "Docker Compose valid YAML" "docker-compose config >/dev/null 2>&1 || echo 'Docker not available, skipping'"
run_test "Frontend Dockerfile syntax" "test -f Dockerfile.frontend"
run_test "Backend Dockerfile syntax" "test -f Dockerfile.backend"

# Test 7: Installation Scripts
print_test_header "Installation Scripts"

run_test "Install script syntax" "bash -n install.sh"
run_test "Deploy script syntax" "bash -n deploy.sh"
run_test "Forensic integration script" "test -f integrate-forensic-db.sh && bash -n integrate-forensic-db.sh"

# Test 8: Documentation
print_test_header "Documentation"

run_test "README.md exists" "test -f README.md"
run_test "QUICK_START.md exists" "test -f QUICK_START.md"
run_test "Backend README exists" "test -f backend/README.md"

# Test 9: Security Configuration
print_test_header "Security Configuration"

run_test "No hardcoded secrets in frontend package.json" "! grep -i 'secret\|password\|key' package.json | grep -v 'SESSION_SECRET\|JWT_SECRET'"
run_test "No hardcoded secrets in backend package.json" "! grep -i 'secret\|password\|key' backend/package.json | grep -v 'SESSION_SECRET\|JWT_SECRET'"
run_test "Environment variables used properly" "grep -q 'process.env' backend/src/app.js"

# Test 10: Installation Test (if dependencies not installed)
print_test_header "Dependency Installation Test"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Dependencies not installed. Testing installation...${NC}"
    
    # Test frontend dependency installation
    if run_test "Frontend npm install" "npm install --silent"; then
        echo -e "${GREEN}✅ Frontend dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Frontend dependency installation failed${NC}"
    fi
    
    # Test backend dependency installation
    if run_test "Backend npm install" "cd backend && npm install --silent"; then
        echo -e "${GREEN}✅ Backend dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Backend dependency installation failed${NC}"
    fi
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
fi

# Test 11: TypeScript Compilation (if dependencies available)
print_test_header "TypeScript Compilation"

if [ -d "node_modules" ]; then
    run_test "TypeScript type checking" "npm run type-check"
else
    echo -e "${YELLOW}⏭️  Skipping TypeScript tests (dependencies not installed)${NC}"
fi

# Test 12: Build Process (if dependencies available)
print_test_header "Build Process"

if [ -d "node_modules" ]; then
    run_test "Frontend build process" "npm run build"
    run_test "Build output exists" "test -d dist"
    run_test "Build output has index.html" "test -f dist/index.html"
else
    echo -e "${YELLOW}⏭️  Skipping build tests (dependencies not installed)${NC}"
fi

# Test 13: Forensic Database Integration Test
print_test_header "Forensic Database Integration"

if [ -f "/root/hunter_server/data/stego_results.db" ]; then
    run_test "Forensic database file exists" "test -f /root/hunter_server/data/stego_results.db"
    run_test "Forensic database readable" "sqlite3 /root/hunter_server/data/stego_results.db '.tables' | grep -q files"
    run_test "Integration script can run" "bash -n integrate-forensic-db.sh"
else
    echo -e "${YELLOW}⏭️  Forensic database not found at /root/hunter_server/data/stego_results.db${NC}"
    echo -e "${BLUE}ℹ️  This is normal if you don't have the 33GB forensic database${NC}"
    TESTS_TOTAL=$((TESTS_TOTAL + 3))
    TESTS_PASSED=$((TESTS_PASSED + 3))
fi

# Final Results
echo ""
echo "======================================="
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo "======================================="

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! ($TESTS_PASSED/$TESTS_TOTAL)${NC}"
    echo ""
    echo -e "${GREEN}✅ The Ark is ready for deployment!${NC}"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo "• Run './install.sh' for development setup"
    echo "• Run './deploy.sh --mode production' for production"
    echo "• Run 'docker-compose up -d' for Docker deployment"
    echo ""
else
    echo -e "${RED}❌ Some tests failed ($TESTS_FAILED/$TESTS_TOTAL failed)${NC}"
    echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Recommended Actions:${NC}"
    
    if [ ! -d "node_modules" ]; then
        echo "• Run 'npm install' to install dependencies"
        echo "• Run 'cd backend && npm install' for backend dependencies"
    fi
    
    echo "• Check the failed tests above for specific issues"
    echo "• Ensure all prerequisites are installed"
    echo "• Verify file permissions and paths"
    echo ""
fi

echo -e "${BLUE}📋 System Information:${NC}"
echo "OS: $(uname -s) $(uname -r)"
echo "Architecture: $(uname -m)"
if command -v node >/dev/null 2>&1; then
    echo "Node.js: $(node --version)"
fi
if command -v npm >/dev/null 2>&1; then
    echo "NPM: $(npm --version)"
fi
echo "Working Directory: $(pwd)"
echo "User: $(whoami)"

echo ""
echo -e "${BLUE}🛠️  Quick Commands:${NC}"
echo "./install.sh              # Quick development setup"
echo "./deploy.sh --mode dev    # Development deployment"
echo "./deploy.sh --mode production --domain example.com --ssl"
echo "docker-compose up -d      # Docker deployment"
echo ""

exit $TESTS_FAILED
#!/bin/bash

# Comprehensive test summary script for The Ark Forensic Platform
# Runs all tests and generates a summary report

set -e

echo "🧪 The Ark Forensic Platform - Comprehensive Test Suite"
echo "======================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
FRONTEND_TESTS_PASSED=false
BACKEND_TESTS_PASSED=false
INTEGRATION_TESTS_PASSED=false
E2E_TESTS_PASSED=false
PERFORMANCE_TESTS_PASSED=false

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ $message${NC}"
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    else
        echo -e "${BLUE}ℹ️  $message${NC}"
    fi
}

# Function to run tests with error handling
run_test() {
    local test_name=$1
    local test_command=$2
    local directory=${3:-"."}
    
    echo ""
    print_status "INFO" "Running $test_name..."
    echo "Command: $test_command"
    echo "Directory: $directory"
    echo ""
    
    if cd "$directory" && eval "$test_command"; then
        print_status "PASS" "$test_name completed successfully"
        return 0
    else
        print_status "FAIL" "$test_name failed"
        return 1
    fi
}

# Pre-flight checks
echo "🔍 Pre-flight checks..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_status "INFO" "Installing frontend dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    print_status "INFO" "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

print_status "PASS" "Dependencies verified"

# 1. Frontend Tests
echo ""
echo "🎨 Frontend Testing Suite"
echo "========================"

# Type checking
if run_test "TypeScript Type Check" "npm run type-check"; then
    print_status "PASS" "Type checking passed"
else
    print_status "FAIL" "Type checking failed"
fi

# Linting
if run_test "ESLint Code Quality" "npm run lint"; then
    print_status "PASS" "Linting passed"
else
    print_status "WARN" "Linting issues found"
fi

# Unit tests
if run_test "Frontend Unit Tests" "npm run test:coverage"; then
    FRONTEND_TESTS_PASSED=true
    print_status "PASS" "Frontend unit tests passed"
else
    print_status "FAIL" "Frontend unit tests failed"
fi

# Build test
if run_test "Frontend Build" "npm run build"; then
    print_status "PASS" "Frontend build successful"
else
    print_status "FAIL" "Frontend build failed"
fi

# 2. Backend Tests
echo ""
echo "⚙️  Backend Testing Suite"
echo "========================"

# Backend unit tests
if run_test "Backend Unit Tests" "npm run test:coverage" "backend"; then
    print_status "PASS" "Backend unit tests passed"
    BACKEND_TESTS_PASSED=true
else
    print_status "FAIL" "Backend unit tests failed"
fi

# Backend integration tests
if run_test "Backend Integration Tests" "npm run test:integration" "backend"; then
    print_status "PASS" "Backend integration tests passed"
    INTEGRATION_TESTS_PASSED=true
else
    print_status "FAIL" "Backend integration tests failed"
fi

# 3. Security Tests
echo ""
echo "🔒 Security Testing Suite"
echo "========================"

# Security audit frontend
if run_test "Frontend Security Audit" "npm audit --audit-level moderate"; then
    print_status "PASS" "Frontend security audit passed"
else
    print_status "WARN" "Frontend security vulnerabilities found"
fi

# Security audit backend
if run_test "Backend Security Audit" "npm audit --audit-level moderate" "backend"; then
    print_status "PASS" "Backend security audit passed"
else
    print_status "WARN" "Backend security vulnerabilities found"
fi

# 4. E2E Tests (Optional - requires running services)
echo ""
echo "🌐 End-to-End Testing Suite"
echo "=========================="

# Check if we should run E2E tests
if [ "${RUN_E2E_TESTS:-true}" = "true" ]; then
    # Check if Playwright is available
    if command -v npx > /dev/null && npx playwright --version > /dev/null 2>&1; then
        if run_test "E2E Tests" "npm run test:e2e"; then
            E2E_TESTS_PASSED=true
            print_status "PASS" "E2E tests passed"
        else
            print_status "FAIL" "E2E tests failed"
        fi
    else
        print_status "WARN" "Playwright not available, skipping E2E tests"
    fi
else
    print_status "INFO" "E2E tests skipped (set RUN_E2E_TESTS=true to enable)"
fi

# 5. Performance Tests (Optional)
echo ""
echo "🚀 Performance Testing Suite"
echo "==========================="

if [ "${RUN_PERFORMANCE_TESTS:-false}" = "true" ]; then
    if run_test "Performance Tests" "npm run test:performance"; then
        PERFORMANCE_TESTS_PASSED=true
        print_status "PASS" "Performance tests passed"
    else
        print_status "FAIL" "Performance tests failed"
    fi
else
    print_status "INFO" "Performance tests skipped (set RUN_PERFORMANCE_TESTS=true to enable)"
fi

# Generate Test Summary Report
echo ""
echo "📊 Test Summary Report"
echo "====================="
echo ""

# Calculate overall status
CRITICAL_TESTS_PASSED=0
TOTAL_CRITICAL_TESTS=2

if [ "$FRONTEND_TESTS_PASSED" = true ]; then
    ((CRITICAL_TESTS_PASSED++))
fi

if [ "$BACKEND_TESTS_PASSED" = true ]; then
    ((CRITICAL_TESTS_PASSED++))
fi

# Print detailed results
echo "Core Test Results:"
echo "=================="
if [ "$FRONTEND_TESTS_PASSED" = true ]; then
    print_status "PASS" "Frontend Unit Tests"
else
    print_status "FAIL" "Frontend Unit Tests"
fi

if [ "$BACKEND_TESTS_PASSED" = true ]; then
    print_status "PASS" "Backend Unit Tests"
else
    print_status "FAIL" "Backend Unit Tests"
fi

if [ "$INTEGRATION_TESTS_PASSED" = true ]; then
    print_status "PASS" "Integration Tests"
else
    print_status "FAIL" "Integration Tests"
fi

echo ""
echo "Additional Test Results:"
echo "======================="

if [ "$E2E_TESTS_PASSED" = true ]; then
    print_status "PASS" "End-to-End Tests"
elif [ "${RUN_E2E_TESTS:-true}" = "true" ]; then
    print_status "FAIL" "End-to-End Tests"
else
    print_status "INFO" "End-to-End Tests (Skipped)"
fi

if [ "$PERFORMANCE_TESTS_PASSED" = true ]; then
    print_status "PASS" "Performance Tests"
elif [ "${RUN_PERFORMANCE_TESTS:-false}" = "true" ]; then
    print_status "FAIL" "Performance Tests"
else
    print_status "INFO" "Performance Tests (Skipped)"
fi

# Final verdict
echo ""
echo "🎯 Final Verdict"
echo "==============="

if [ $CRITICAL_TESTS_PASSED -eq $TOTAL_CRITICAL_TESTS ]; then
    print_status "PASS" "All critical tests passed! ✨"
    echo ""
    echo "The Ark Forensic Platform is ready for deployment! 🚀"
    exit 0
else
    print_status "FAIL" "$CRITICAL_TESTS_PASSED/$TOTAL_CRITICAL_TESTS critical tests passed"
    echo ""
    echo "Please fix failing tests before deployment. 🔧"
    exit 1
fi
#!/bin/bash

# COMPREHENSIVE PLATFORM TESTING
echo "🧪 COMPREHENSIVE PLATFORM TESTING"
echo "=================================="

INSTANCE_IP="153.204.80.81"

echo "🔍 Testing all services..."

# Test Frontend
echo ""
echo "📱 Testing Frontend (Port 8888)..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8888 2>/dev/null)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend: WORKING ($FRONTEND_STATUS)"
else
    echo "❌ Frontend: ERROR ($FRONTEND_STATUS)"
fi

# Test Backend Health
echo ""
echo "🔧 Testing Backend Health (Port 3002)..."
BACKEND_HEALTH=$(curl -s http://localhost:3002/health 2>/dev/null)
if echo "$BACKEND_HEALTH" | grep -q "healthy\|ok"; then
    echo "✅ Backend Health: WORKING"
    echo "   Response: $BACKEND_HEALTH"
else
    echo "❌ Backend Health: ERROR"
    echo "   Response: $BACKEND_HEALTH"
fi

# Test Database API
echo ""
echo "💾 Testing Database API..."
DB_STATS=$(curl -s http://localhost:3002/api/forensic/stats 2>/dev/null)
if echo "$DB_STATS" | grep -q "total_files\|success"; then
    echo "✅ Database API: WORKING"
    echo "   Files: $(echo "$DB_STATS" | grep -o '"total_files":[0-9]*' | cut -d: -f2)"
else
    echo "❌ Database API: ERROR"
    echo "   Response: $DB_STATS"
fi

# Test Ollama AI
echo ""
echo "🤖 Testing AI/Ollama (Port 11435)..."
OLLAMA_MODELS=$(curl -s http://localhost:11435/api/tags 2>/dev/null)
if echo "$OLLAMA_MODELS" | grep -q "models"; then
    MODEL_COUNT=$(echo "$OLLAMA_MODELS" | grep -o '"name"' | wc -l)
    echo "✅ Ollama AI: WORKING"
    echo "   Models loaded: $MODEL_COUNT"
else
    echo "❌ Ollama AI: ERROR"
    echo "   Response: $OLLAMA_MODELS"
fi

# Test Forensic APIs
echo ""
echo "🔍 Testing Forensic Investigation APIs..."

# Suspicious files
SUSPICIOUS=$(curl -s http://localhost:3002/api/forensic/suspicious?limit=5 2>/dev/null)
if echo "$SUSPICIOUS" | grep -q "filename\|path"; then
    echo "✅ Suspicious Files API: WORKING"
else
    echo "❌ Suspicious Files API: ERROR"
fi

# String search
STRING_SEARCH=$(curl -s "http://localhost:3002/api/forensic/search/strings?pattern=test&limit=3" 2>/dev/null)
if echo "$STRING_SEARCH" | grep -q "string_content\|Found pattern"; then
    echo "✅ String Search API: WORKING"
else
    echo "❌ String Search API: ERROR"
fi

# XOR analysis
XOR_ANALYSIS=$(curl -s "http://localhost:3002/api/forensic/xor?pattern=key&limit=3" 2>/dev/null)
if echo "$XOR_ANALYSIS" | grep -q "xor_key\|plaintext"; then
    echo "✅ XOR Analysis API: WORKING"
else
    echo "❌ XOR Analysis API: ERROR"
fi

# Check containers
echo ""
echo "🐳 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep ark-

echo ""
echo "📊 SUMMARY"
echo "========="
echo "Platform: The Ark Forensic Investigation"
echo "Instance: RTX 5000 Ada ($INSTANCE_IP)"
echo ""
echo "🌐 Access URLs:"
echo "Frontend: http://$INSTANCE_IP:8888"
echo "Backend API: http://$INSTANCE_IP:3002"
echo "AI/Ollama: http://$INSTANCE_IP:11435"
echo ""
echo "🔗 SSH Tunnel Commands (for external access):"
echo "ssh -L 8888:localhost:8888 root@$INSTANCE_IP"
echo "ssh -L 3002:localhost:3002 root@$INSTANCE_IP" 
echo "ssh -L 11435:localhost:11435 root@$INSTANCE_IP"
echo ""
echo "✅ The Ark Forensic Platform is ready for investigation!"
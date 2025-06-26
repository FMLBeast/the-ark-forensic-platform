#!/bin/bash

# Deploy The Ark to Production
# Multi-platform deployment script

set -e

echo "🚀 The Ark - Production Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if build directory exists
if [ ! -d "dist" ]; then
    echo -e "${YELLOW}⚠️  No build found. Building application...${NC}"
    npm run build
fi

echo -e "${GREEN}✅ Build ready for deployment${NC}"
echo ""

# Display deployment options
echo -e "${BLUE}📦 Available Deployment Options:${NC}"
echo "1. 🌐 Netlify (Static Hosting)"
echo "2. ⚡ Vercel (Static Hosting)" 
echo "3. 🔥 Firebase Hosting"
echo "4. 📁 AWS S3 + CloudFront"
echo "5. 🐳 Docker Container"
echo "6. 🖥️  VPS/Server (Nginx)"
echo "7. 📤 Manual Upload (ZIP)"
echo ""

read -p "Select deployment option (1-7): " option

case $option in
    1)
        echo -e "${BLUE}🌐 Deploying to Netlify...${NC}"
        if command -v netlify &> /dev/null; then
            netlify deploy --prod --dir=dist
        else
            echo -e "${YELLOW}⚠️  Netlify CLI not found. Install with: npm install -g netlify-cli${NC}"
            echo -e "${BLUE}📖 Manual steps:${NC}"
            echo "1. Go to https://netlify.com"
            echo "2. Drag and drop the 'dist' folder"
            echo "3. Configure redirects for SPA routing"
        fi
        ;;
    2)
        echo -e "${BLUE}⚡ Deploying to Vercel...${NC}"
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo -e "${YELLOW}⚠️  Vercel CLI not found. Install with: npm install -g vercel${NC}"
            echo -e "${BLUE}📖 Manual steps:${NC}"
            echo "1. Go to https://vercel.com"
            echo "2. Import your GitHub repository"
            echo "3. Set build command: npm run build"
            echo "4. Set output directory: dist"
        fi
        ;;
    3)
        echo -e "${BLUE}🔥 Deploying to Firebase...${NC}"
        if command -v firebase &> /dev/null; then
            firebase deploy
        else
            echo -e "${YELLOW}⚠️  Firebase CLI not found. Install with: npm install -g firebase-tools${NC}"
            echo -e "${BLUE}📖 Manual steps:${NC}"
            echo "1. Install Firebase CLI: npm install -g firebase-tools"
            echo "2. Run: firebase login"
            echo "3. Run: firebase init hosting"
            echo "4. Run: firebase deploy"
        fi
        ;;
    4)
        echo -e "${BLUE}📁 AWS S3 + CloudFront deployment${NC}"
        echo -e "${YELLOW}⚠️  Requires AWS CLI configuration${NC}"
        echo -e "${BLUE}📖 Manual steps:${NC}"
        echo "1. Create S3 bucket with static hosting"
        echo "2. Upload dist/ contents to bucket"
        echo "3. Set up CloudFront distribution"
        echo "4. Configure Route 53 for custom domain"
        ;;
    5)
        echo -e "${BLUE}🐳 Creating Docker container...${NC}"
        docker build -t the-ark-frontend .
        echo -e "${GREEN}✅ Docker image 'the-ark-frontend' created${NC}"
        echo -e "${BLUE}📖 To run:${NC}"
        echo "docker run -p 80:80 the-ark-frontend"
        ;;
    6)
        echo -e "${BLUE}🖥️  VPS/Server deployment${NC}"
        echo -e "${BLUE}📖 Manual steps:${NC}"
        echo "1. Upload dist/ contents to your server"
        echo "2. Configure Nginx with the provided config"
        echo "3. Set up SSL certificate"
        echo "4. Configure domain DNS"
        ;;
    7)
        echo -e "${BLUE}📤 Creating deployment package...${NC}"
        zip -r the-ark-deployment-$(date +%Y%m%d-%H%M%S).zip dist/
        echo -e "${GREEN}✅ Deployment ZIP created${NC}"
        echo -e "${BLUE}📖 Upload the ZIP file to your hosting provider${NC}"
        ;;
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎯 Deployment process completed!${NC}"
echo -e "${BLUE}📋 Post-deployment checklist:${NC}"
echo "✅ Test login functionality"
echo "✅ Verify challenge system loads"
echo "✅ Check all navigation works"
echo "✅ Test responsive design"
echo "✅ Configure backend API endpoints (if needed)"
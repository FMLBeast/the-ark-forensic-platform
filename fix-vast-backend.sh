#!/bin/bash
# Fix script for The Ark backend on Vast.ai

cd /root/the-ark-forensic-platform

echo "🔧 Fixing backend issues..."

# Backup current files
cp backend/src/database/init.js backend/src/database/init.js.backup2
cp backend/src/app.js backend/src/app.js.backup2

# Fix bcrypt import in database init
echo "Fixing bcrypt import..."
sed -i '6i import bcrypt from '\''bcryptjs'\'';' backend/src/database/init.js
sed -i 's/const bcrypt = await import.*bcryptjs.*;//g' backend/src/database/init.js

# Add health endpoint to app.js
echo "Adding health endpoint..."
sed -i '/\/\/ Static file serving for uploads/i app.get("/health", (req, res) => { res.json({ status: "healthy", timestamp: new Date().toISOString(), version: "1.0.0", environment: process.env.NODE_ENV || "development" }); });' backend/src/app.js

# Copy frontend files for serving
echo "Setting up frontend files..."
mkdir -p backend/public
cp -r dist/* backend/public/

# Add static file serving to app.js
sed -i '/app.use.*uploads.*express.static/a app.use(express.static("public"));' backend/src/app.js

# Restart backend
echo "Restarting backend..."
pm2 restart ark-backend

# Wait for startup
sleep 5

# Test endpoints
echo "Testing endpoints..."
echo "Health check:"
curl -s http://localhost:3000/health | python3 -m json.tool

echo -e "\nFrontend test:"
curl -I http://localhost:3000

echo -e "\nGetting public IP..."
PUBLIC_IP=$(curl -s ifconfig.me)

echo -e "\n🎉 Backend fixed! Access at:"
echo "Frontend: http://$PUBLIC_IP:3000"
echo "Health: http://$PUBLIC_IP:3000/health"
echo "API: http://$PUBLIC_IP:3000/api"
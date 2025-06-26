#!/bin/bash
# Clean fix for The Ark backend - removes duplicates and fixes imports

cd /root/the-ark-forensic-platform

echo "🔧 Clean fixing backend..."

# Stop the backend first
pm2 stop ark-backend

# Restore from the original backup files
echo "Restoring original files..."
cp backend/src/app.js.backup backend/src/app.js
cp backend/src/database/init.js.backup backend/src/database/init.js

# Fix the database init file properly - replace the problematic line
echo "Fixing database init..."
sed -i '228s/.*/    const hashedPassword = await bcrypt.hash(defaultPassword, config.security.bcryptRounds);/' backend/src/database/init.js
sed -i '5a import bcrypt from '\''bcryptjs'\'';' backend/src/database/init.js

# Add health endpoint to app.js (clean insertion)
echo "Adding health endpoint..."
sed -i '92a\\n// Health check endpoint\napp.get("/health", (req, res) => {\n  res.json({\n    status: "healthy",\n    timestamp: new Date().toISOString(),\n    version: "1.0.0",\n    environment: process.env.NODE_ENV || "development"\n  });\n});' backend/src/app.js

# Copy frontend files
echo "Setting up frontend serving..."
mkdir -p backend/public
cp -r dist/* backend/public/

# Add static file serving (clean insertion after uploads line)
sed -i '93a app.use(express.static("public"));' backend/src/app.js

# Start the backend
echo "Starting backend..."
pm2 start ark-backend

# Wait for startup
sleep 5

# Test
echo "Testing..."
curl -s http://localhost:3000/health

# Get public IP and show URLs
PUBLIC_IP=$(curl -s ifconfig.me)
echo -e "\n✅ Access your app at:"
echo "http://$PUBLIC_IP:3000"
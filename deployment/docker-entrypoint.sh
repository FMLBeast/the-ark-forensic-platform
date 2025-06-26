#!/bin/sh

# Docker entrypoint script for The Ark Frontend

echo "🚀 Starting The Ark Frontend..."

# Replace environment variables in built files if needed
if [ ! -z "$VITE_API_URL" ]; then
    echo "📡 Configuring API URL: $VITE_API_URL"
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|__VITE_API_URL__|$VITE_API_URL|g" {} \;
fi

if [ ! -z "$VITE_WS_URL" ]; then
    echo "🔌 Configuring WebSocket URL: $VITE_WS_URL"
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|__VITE_WS_URL__|$VITE_WS_URL|g" {} \;
fi

# Display startup information
echo "🌟 The Ark Frontend is ready!"
echo "📂 Serving files from: /usr/share/nginx/html"
echo "🌐 Available at: http://localhost"
echo "🔧 Nginx config: /etc/nginx/conf.d/default.conf"

# Execute the main command
exec "$@"
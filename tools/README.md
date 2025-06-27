# The Ark Forensic Platform - SSH Tunnel Tool

This tool creates secure SSH tunnels to access your Vast.ai deployment locally.

## Quick Start

```bash
# Make sure you're in the project directory
cd /path/to/the-ark-forensic-platform

# Run the tunnel manager
python3 tools/ark_tunnel.py
```

## What It Does

The tunnel manager creates secure SSH connections that forward local ports to your Vast.ai instance:

- **Port 8080** → Frontend (The Ark Web Interface)
- **Port 8001** → Backend API (REST endpoints)  
- **Port 8434** → Ollama AI API (LLM services)

## Access URLs

Once tunnels are active, access your services at:

- 🌐 **Frontend**: http://localhost:8080
- ⚙️ **Backend API**: http://localhost:8001
- 🤖 **Ollama AI**: http://localhost:8434/api/tags

## Features

- ✅ **Auto-reconnection** - Automatically restarts failed tunnels
- ✅ **Health monitoring** - Tests service availability
- ✅ **Graceful shutdown** - Clean exit with Ctrl+C
- ✅ **Service status** - Shows AI models loaded and database connection
- ✅ **Error handling** - Clear error messages and troubleshooting tips

## Requirements

- Python 3.6+
- SSH client installed
- SSH key configured for your Vast.ai instance

## SSH Key Setup

If you get connection errors, set up your SSH key:

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copy key to Vast.ai instance
ssh-copy-id -p 51414 root@153.204.80.81

# Or manually add your public key to the instance
cat ~/.ssh/id_ed25519.pub
# Then paste into /root/.ssh/authorized_keys on the instance
```

## Troubleshooting

### Connection Refused
- Verify SSH port (currently set to 51414)
- Check if your SSH key is added to the instance
- Ensure the Vast.ai instance is running

### Service Not Responding
- Check if Docker containers are running on the instance:
  ```bash
  ssh -p 51414 root@153.204.80.81 "docker ps"
  ```
- Restart services if needed:
  ```bash
  ssh -p 51414 root@153.204.80.81 "cd /workspace/ark-deploy && docker-compose restart"
  ```

### Port Already in Use
- Kill processes using the ports:
  ```bash
  lsof -ti:8080,8001,8434 | xargs kill -9
  ```

## Advanced Usage

### Custom Configuration

Edit `ark_tunnel.py` to modify:
- SSH connection details (host, port, user)
- Port mappings
- Service names and URLs

### Manual SSH Tunneling

If the script doesn't work, you can create tunnels manually:

```bash
# Create all tunnels
ssh -N -L 8080:localhost:8080 -L 8001:localhost:8001 -L 8434:localhost:8434 -p 51414 root@153.204.80.81

# Or create individual tunnels
ssh -N -L 8080:localhost:8080 -p 51414 root@153.204.80.81 &
ssh -N -L 8001:localhost:8001 -p 51414 root@153.204.80.81 &  
ssh -N -L 8434:localhost:8434 -p 51414 root@153.204.80.81 &
```

## Security Notes

- Tunnels create secure encrypted connections
- Only accessible from your local machine
- No data is exposed over the internet
- SSH key authentication recommended over passwords
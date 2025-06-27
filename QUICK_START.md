# 🚀 The Ark - Quick Start Guide

Get The Ark Forensic Platform running in under 5 minutes with zero configuration hassles.

## ⚡ One-Command Installation

### Development Setup (Recommended for first-time users)
```bash
./install.sh
```

### Production Deployment
```bash
./deploy.sh --mode production
```

### With Forensic Database Integration
```bash
./install.sh --forensic-db /path/to/stego_results.db
```

## 🎯 Quick Deploy Options

### 1. 🐳 Docker (Fastest)
```bash
# One command - everything included
docker-compose up -d

# Access at http://localhost
```

### 2. 💻 Local Development
```bash
# Install dependencies
./install.sh

# Start development servers
./start-dev.sh

# Frontend: http://localhost:5173
# Backend:  http://localhost:3000
```

### 3. ☁️ Cloud/VPS Deployment
```bash
# One command production deployment
./deploy.sh --mode production --domain your-domain.com --ssl

# Access at https://your-domain.com
```

### 4. 🖥️ Vast.ai GPU Instance
```bash
# Download and run on Vast.ai
curl -fsSL https://raw.githubusercontent.com/FMLBeast/the-ark-forensic-platform/main/deploy-vast.sh | bash
```

## 🔐 Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

> ⚠️ **Change these credentials immediately after first login!**

## 🧰 Prerequisites

**Automatic Installation (Recommended)**
- Linux/macOS/WSL
- `curl` and `git` installed
- Internet connection

**Manual Requirements**
- Node.js 18+
- NPM 8+
- 4GB+ RAM
- 10GB+ disk space

## 🗄️ Forensic Database Integration

### Connecting Your 33GB Database

```bash
# Option 1: During installation
./install.sh --forensic-db /path/to/stego_results.db

# Option 2: After installation
./integrate-forensic-db.sh

# Option 3: Docker with database
FORENSIC_DB_PATH=/path/to/stego_results.db docker-compose up -d
```

### Supported Database Schema
The platform expects a SQLite database with these tables:
- `files` - File metadata (54K+ records)
- `binary_content` - Binary analysis data
- `strings_output` - Extracted strings (34M+ records)
- `xor_analysis` - XOR decryption attempts (554K+ records)
- `file_signatures` - File signatures (337K+ records)
- `bitplane_analysis` - Steganographic analysis (9K+ records)

## 🎮 First Steps After Installation

1. **Access the Platform**
   ```
   http://localhost:5173  (Development)
   http://localhost       (Docker)
   ```

2. **Login**
   - Username: `admin`
   - Password: `admin123`

3. **Upload Test Files**
   - Go to Files section
   - Upload images, documents, or binary files
   - Watch real-time analysis

4. **Explore Features**
   - **Agent Dashboard**: AI-powered analysis
   - **Forensics Page**: Interactive file tree
   - **Collaboration**: Live chat and annotations
   - **Investigation**: Case management

## 🛠️ Management Commands

### Development
```bash
./start-dev.sh           # Start development servers
npm run dev              # Frontend only
cd backend && npm run dev # Backend only
```

### Production (with PM2)
```bash
pm2 start ecosystem.config.js  # Start services
pm2 status                     # Check status
pm2 logs ark-backend          # View logs
pm2 restart ark-backend       # Restart
```

### Docker
```bash
docker-compose up -d          # Start containers
docker-compose logs -f        # View logs
docker-compose restart        # Restart
docker-compose down           # Stop
```

### System Management (Auto-installed)
```bash
ark-status          # Check application status
ark-restart         # Restart all services
ark-logs           # View application logs
ark-update         # Update from GitHub
```

## 🔧 Configuration

### Environment Variables

**Frontend** (`.env.development` / `.env.production`)
```env
VITE_API_URL=http://localhost:3000/api
VITE_WEBSOCKET_URL=ws://localhost:3000/ws
VITE_LLM_AVAILABLE=true
VITE_FORENSIC_ANALYSIS_ENABLED=true
```

**Backend** (`backend/.env`)
```env
NODE_ENV=production
PORT=3000
DB_PATH=./data/ark.db
FORENSIC_DB_PATH=/path/to/stego_results.db
SESSION_SECRET=your-secret-here
JWT_SECRET=your-jwt-secret-here
```

## 🚨 Troubleshooting

### Common Issues

**"Port already in use"**
```bash
# Check what's using the port
lsof -i :3000
lsof -i :5173

# Kill the process
kill -9 <PID>
```

**"Module not found"**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

cd backend
rm -rf node_modules package-lock.json
npm install
```

**"Database connection failed"**
```bash
# Check database path
ls -la /path/to/stego_results.db

# Check permissions
chmod 644 /path/to/stego_results.db

# Test database
sqlite3 /path/to/stego_results.db ".tables"
```

**"Build failed"**
```bash
# Clear cache and rebuild
npm run clean
npm run type-check
npm run build
```

### Getting Help

1. **Check Logs**
   ```bash
   # Development
   Check browser console and terminal output
   
   # Production
   ark-logs
   pm2 logs ark-backend
   ```

2. **Verify Installation**
   ```bash
   node --version    # Should be 18+
   npm --version     # Should be 8+
   ```

3. **Test API Health**
   ```bash
   curl http://localhost:3000/health
   ```

## 🌟 Advanced Features

### Agent Orchestration
- **File Analysis Agent**: Entropy, metadata, signatures
- **Steganography Agent**: LSB, DCT, bitplane analysis
- **Cryptography Agent**: XOR, frequency analysis
- **Intelligence Agent**: Pattern correlation, insights

### Forensic Analysis
- **33GB Database Integration**: Query millions of forensic records
- **Graph Visualization**: Relationship mapping between files
- **String Correlation**: Cross-file pattern matching
- **XOR Key Analysis**: Decryption key correlation

### Collaboration Tools
- **Live Chat**: Multi-room real-time communication
- **File Annotations**: Collaborative markup system
- **Investigation Management**: Team case tracking
- **Real-time Updates**: WebSocket-powered synchronization

## 📚 Next Steps

- Read the [Full Documentation](README.md)
- Explore [Deployment Guide](DEPLOYMENT_GUIDE.md) for production
- Check [API Documentation](backend/README.md) for integration
- Visit [Contributing Guide](CONTRIBUTING.md) for development

---

**Need help?** Open an issue at [GitHub Issues](https://github.com/FMLBeast/the-ark-forensic-platform/issues)

**🌟 The Ark is ready for forensic investigation!**
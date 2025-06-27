# 🚀 The Ark Forensic Platform - Vast.ai Deployment Guide

Deploy The Ark Forensic Platform on your RTX 5000 Ada Vast.ai instance with AI-powered analysis using Ollama.

## 📋 Instance Information

- **Instance ID**: 21824819
- **GPU**: RTX 5000 Ada (32GB VRAM)
- **Location**: Japan (153.204.80.81)
- **Database**: `/root/hunter_server/data/stego_results.db`

## 🎯 Quick Deployment

### Option 1: One-Command Deployment

SSH into your Vast.ai instance and run:

```bash
curl -fsSL https://raw.githubusercontent.com/your-username/the-ark-forensic-platform/main/vast.ai/deploy-on-instance.sh | bash
```

### Option 2: Manual Deployment

1. **SSH into your instance:**
   ```bash
   ssh root@153.204.80.81 -p YOUR_SSH_PORT
   ```

2. **Clone and deploy:**
   ```bash
   cd /root
   git clone https://github.com/your-username/the-ark-forensic-platform.git
   cd the-ark-forensic-platform/vast.ai
   chmod +x deploy-on-instance.sh
   ./deploy-on-instance.sh
   ```

## 🔧 Vast.ai Docker Configuration

When creating your instance, use these Docker options to expose the required ports:

```bash
-p 70080:80 -p 73001:3001 -p 71434:11434 -p 79090:9090
```

This will map:
- `70080` → Frontend (The Ark Web Interface)
- `73001` → Backend API (REST API)
- `71434` → Ollama (AI/LLM API)
- `79090` → Monitoring (Prometheus)

## 🌐 Access Your Deployment

After deployment, access your services at:

- **🎨 Frontend**: `http://153.204.80.81:70080`
- **⚙️ Backend API**: `http://153.204.80.81:73001`
- **🤖 Ollama API**: `http://153.204.80.81:71434`
- **📊 Monitoring**: `http://153.204.80.81:79090`

## 🤖 AI Models Configuration

The deployment includes these optimized models for your RTX 5000 Ada:

### Primary Models (RTX 5000 Ada - 32GB VRAM)
- **codellama:13b-instruct** - Complex forensic analysis
- **llama2:13b-chat** - Conversational AI and reports
- **codellama:7b-instruct** - Fast analysis and batch processing
- **mistral:7b-instruct** - Advanced pattern recognition

### Model Usage
```bash
# Check available models
curl http://153.204.80.81:71434/api/tags

# Test AI analysis
curl -X POST http://153.204.80.81:71434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "codellama:13b-instruct",
    "prompt": "Analyze this suspicious file signature: 4D5A90000300000004000000FFFF0000",
    "stream": false
  }'
```

## 🗄️ Database Integration

Your forensic database is automatically mounted:
- **Path**: `/root/hunter_server/data/stego_results.db`
- **Size**: ~33GB with 8 tables
- **Records**: 54,762 files, 34M+ strings, 337K+ signatures

### Database Tables
- `files` - 54,762 analyzed files
- `binary_content` - Binary analysis data
- `strings_output` - 34.6M extracted strings
- `file_signatures` - 337K+ file signatures
- `xor_analysis` - 554K+ XOR decryption attempts
- `bitplane_analysis` - 9,848 steganographic extractions

## 🔍 Health Checks & Monitoring

### Check System Status
```bash
# Backend health
curl http://153.204.80.81:73001/health

# Database stats
curl http://153.204.80.81:73001/api/forensic/stats

# AI status
curl http://153.204.80.81:73001/api/ollama/status
```

### Monitor GPU Usage
```bash
# SSH into instance
nvidia-smi -l 1

# View GPU utilization in real-time
watch -n 1 nvidia-smi
```

### View Container Logs
```bash
# View all service logs
docker-compose -f docker-compose.vast.yml logs

# View specific service logs
docker logs ark-ollama
docker logs ark-backend
docker logs ark-frontend
```

## 🎮 Advanced Usage

### Custom AI Analysis
```javascript
// Frontend JavaScript example
const analyzeWithAI = async (fileData) => {
  const response = await fetch('/api/ollama/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      analysisType: 'file_analysis',
      data: fileData,
      model: 'codellama:13b-instruct'
    })
  });
  return await response.json();
};
```

### Database Queries
```bash
# SSH into backend container
docker exec -it ark-backend bash

# Query database directly
sqlite3 /app/data/stego_results.db

# Example queries
SELECT COUNT(*) FROM files WHERE entropy > 7.5;
SELECT * FROM strings_output WHERE is_suspicious = 1 LIMIT 10;
SELECT signature_name, COUNT(*) FROM file_signatures GROUP BY signature_name ORDER BY COUNT(*) DESC LIMIT 10;
```

## 🛠️ Troubleshooting

### Service Not Starting
```bash
# Check service status
docker-compose ps

# Restart specific service
docker-compose restart ollama
docker-compose restart backend

# View detailed logs
docker-compose logs ollama
```

### GPU Issues
```bash
# Check GPU availability
nvidia-smi

# Restart Ollama with GPU
docker-compose restart ollama

# Check Ollama GPU usage
docker exec ark-ollama nvidia-smi
```

### Database Issues
```bash
# Check database file
ls -la /root/hunter_server/data/stego_results.db

# Test database connection
docker exec ark-backend sqlite3 /app/data/stego_results.db ".tables"

# Check database size
du -h /root/hunter_server/data/stego_results.db
```

### Model Loading Issues
```bash
# Check available models
docker exec ark-ollama ollama list

# Manually pull models
docker exec ark-ollama ollama pull codellama:13b-instruct
docker exec ark-ollama ollama pull mistral:7b-instruct

# Test model
docker exec ark-ollama ollama run codellama:13b-instruct "Test message"
```

## 🔒 Security Considerations

- **Database Access**: Read-only mount for safety
- **Network**: Services isolated in Docker network
- **GPU**: Dedicated GPU access for Ollama
- **Monitoring**: Real-time performance tracking

## 📈 Performance Optimization

### RTX 5000 Ada Optimizations
- **VRAM**: 32GB allows multiple large models
- **Parallel Processing**: 8 concurrent requests
- **Flash Attention**: Enabled for faster inference
- **Context Size**: 8192 tokens for complex analysis

### Monitoring Performance
```bash
# GPU memory usage
nvidia-smi --query-gpu=memory.used,memory.free --format=csv,noheader,nounits

# Container resource usage
docker stats

# Ollama performance
curl http://153.204.80.81:71434/api/ps
```

## 🆘 Support

If you encounter issues:

1. **Check Health Status**: Visit `http://153.204.80.81:70080`
2. **View Logs**: `docker-compose logs`
3. **Restart Services**: `docker-compose restart`
4. **Monitor GPU**: `nvidia-smi`
5. **Database Check**: Verify `/root/hunter_server/data/stego_results.db` exists

## 🎉 Success Indicators

✅ **Frontend accessible** at port 70080  
✅ **Backend API responding** at port 73001  
✅ **Ollama models loaded** at port 71434  
✅ **Database connected** (54,762+ files)  
✅ **GPU utilized** for AI inference  
✅ **Monitoring active** at port 79090  

---

**🚀 The Ark Forensic Platform is now running with AI-enhanced analysis on your RTX 5000 Ada!**

**Instance**: `153.204.80.81` | **GPU**: RTX 5000 Ada | **Database**: 33GB Forensic Data | **AI**: Ollama LLM
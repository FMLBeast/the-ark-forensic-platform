#!/bin/bash

# Ollama model initialization for RTX 5000 Ada (32GB VRAM)
# Optimized for forensic analysis workloads

echo "🤖 Initializing Ollama models for The Ark Forensic Platform..."
echo "GPU: RTX 5000 Ada (32GB VRAM)"
echo "Location: Japan (153.204.80.81)"

# Wait for Ollama to start
echo "⏳ Waiting for Ollama service to start..."
while ! curl -f http://localhost:11434/api/tags > /dev/null 2>&1; do
    echo "   Waiting for Ollama..."
    sleep 5
done

echo "✅ Ollama service is running"

# Check GPU availability
echo "🔍 Checking GPU availability..."
nvidia-smi --query-gpu=name,memory.total,memory.free --format=csv,noheader,nounits

# Set GPU configuration
export CUDA_VISIBLE_DEVICES=0
export OLLAMA_GPU_LAYERS=40

# Download models optimized for 32GB VRAM

echo ""
echo "📥 Downloading primary analysis model: codellama:13b-instruct"
echo "   This model provides sophisticated code and forensic analysis"
ollama pull codellama:13b-instruct

echo ""
echo "📥 Downloading secondary chat model: llama2:13b-chat"
echo "   This model provides conversational AI capabilities"
ollama pull llama2:13b-chat

echo ""
echo "📥 Downloading lightweight model: codellama:7b-instruct"
echo "   This model provides fast analysis for simple tasks"
ollama pull codellama:7b-instruct

echo ""
echo "📥 Downloading specialized analysis model: mistral:7b-instruct"
echo "   This model provides advanced pattern recognition"
ollama pull mistral:7b-instruct

# Optional: Download additional forensic-specialized models if available
echo ""
echo "📥 Checking for additional forensic models..."

# Try to pull security-focused models
echo "   Attempting to pull security analysis models..."
ollama pull deepseek-coder:6.7b-instruct 2>/dev/null && echo "   ✅ deepseek-coder downloaded" || echo "   ⚠️  deepseek-coder not available"
ollama pull wizardlm:13b 2>/dev/null && echo "   ✅ wizardlm downloaded" || echo "   ⚠️  wizardlm not available"

# Create model configuration file
echo ""
echo "📝 Creating model configuration..."
cat > /models/model-config.json << 'EOF'
{
  "forensic_models": {
    "primary": {
      "name": "codellama:13b-instruct",
      "use_case": "Complex forensic analysis, code analysis, pattern recognition",
      "vram_usage": "~13GB",
      "context_size": 8192,
      "recommended_for": ["file_analysis", "code_analysis", "intelligence_synthesis"]
    },
    "secondary": {
      "name": "llama2:13b-chat",
      "use_case": "Conversational analysis, report generation, explanation",
      "vram_usage": "~13GB", 
      "context_size": 4096,
      "recommended_for": ["report_generation", "user_interaction", "explanation"]
    },
    "lightweight": {
      "name": "codellama:7b-instruct",
      "use_case": "Fast analysis, simple tasks, batch processing",
      "vram_usage": "~7GB",
      "context_size": 4096,
      "recommended_for": ["quick_analysis", "batch_processing", "preprocessing"]
    },
    "specialized": {
      "name": "mistral:7b-instruct",
      "use_case": "Advanced pattern recognition, steganography, cryptanalysis",
      "vram_usage": "~7GB",
      "context_size": 8192,
      "recommended_for": ["steganography", "cryptanalysis", "pattern_matching"]
    }
  },
  "deployment_info": {
    "gpu": "RTX 5000 Ada",
    "vram_total": "32GB",
    "vram_available": "~30GB",
    "concurrent_models": 4,
    "max_parallel_requests": 8,
    "location": "Japan",
    "instance_id": "21824819"
  }
}
EOF

# Test models
echo ""
echo "🧪 Testing model functionality..."

echo "Testing codellama:13b-instruct..."
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "codellama:13b-instruct",
    "prompt": "Analyze this hexadecimal string for potential malware signatures: 4D5A90000300000004000000FFFF0000",
    "stream": false,
    "options": {"max_tokens": 100}
  }' 2>/dev/null | jq -r '.response' | head -3

echo "Testing mistral:7b-instruct..."
curl -X POST http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model": "mistral:7b-instruct",
    "prompt": "What forensic techniques can detect steganography in JPEG files?",
    "stream": false,
    "options": {"max_tokens": 50}
  }' 2>/dev/null | jq -r '.response' | head -2

# List all available models
echo ""
echo "📋 Available models summary:"
echo "==========================="
ollama list

# Show GPU memory usage
echo ""
echo "💾 GPU Memory Usage:"
echo "==================="
nvidia-smi --query-gpu=memory.used,memory.free,memory.total --format=csv,noheader,nounits

# Performance optimization
echo ""
echo "⚡ Applying performance optimizations..."
echo "Setting GPU performance mode..."
nvidia-smi -pm 1 2>/dev/null || echo "   ⚠️  Could not set persistence mode"
nvidia-smi -acp DEFAULT 2>/dev/null || echo "   ⚠️  Could not set application clock policy"

echo ""
echo "✅ Ollama model initialization completed successfully!"
echo ""
echo "🚀 The Ark Forensic Platform is ready for AI-enhanced analysis!"
echo "   Primary Model: codellama:13b-instruct (Complex analysis)"
echo "   Secondary Model: llama2:13b-chat (Conversational AI)"
echo "   Lightweight Model: codellama:7b-instruct (Fast processing)"
echo "   Specialized Model: mistral:7b-instruct (Pattern recognition)"
echo ""
echo "🌐 Ollama API available at: http://153.204.80.81:11434"
echo "📊 Model management: curl http://153.204.80.81:11434/api/tags"
echo ""
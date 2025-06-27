# The Ark Forensic Platform - Claude Code Context

## Project Overview
The Ark is a modern, AI-enhanced forensic investigation platform built with React/TypeScript frontend and Node.js backend. It provides professional-grade tools for analyzing forensic data with AI assistance.

## Architecture

### Frontend (`/`)
- **Framework**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Framer Motion + Lucide React
- **State**: Zustand + TanStack Query
- **Key Components**:
  - `src/pages/ForensicsPage.tsx` - Main investigation interface (618 lines)
  - `src/components/` - Reusable UI components
  - `src/stores/` - State management
  - `src/services/` - API integration

### Backend (`/backend`)
- **Framework**: Node.js + Express.js
- **Database**: SQLite with 33GB forensic data (54,762 files)
- **AI**: Ollama LLM integration for enhanced analysis
- **Key Files**:
  - `src/app.js` - Main Express application
  - `src/routes/forensic.js` - Forensic API endpoints
  - `src/services/forensic/database.js` - Database operations

### Deployment (`/vast.ai`)
- **Platform**: Vast.ai RTX 5000 Ada (32GB VRAM)
- **Containerization**: Docker Compose
- **Services**: Frontend (nginx), Backend (Node.js), AI (Ollama)
- **Ports**: 8888 (frontend), 3002 (backend), 11435 (AI)

## Database Schema
The forensic database contains:
- `files` - File metadata and paths
- `binary_content` - Binary analysis results
- `strings_output` - Extracted strings and suspicious patterns
- `xor_analysis` - XOR decryption attempts
- `file_signatures` - File signature analysis
- `bitplane_analysis` - Steganography detection

## AI Integration
- **Models**: codellama:7b-instruct, mistral:7b-instruct
- **Use Cases**: Pattern recognition, suspicious file analysis, automated reporting
- **API**: RESTful endpoints for AI-enhanced analysis

## Development Commands

### Frontend
```bash
npm run dev          # Development server (port 5173)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
```

### Backend
```bash
npm run dev          # Development server (port 3001)
npm run start        # Production server
npm run test         # Jest tests
npm run lint         # ESLint
```

### Deployment
```bash
./vast.ai/deploy-now.sh       # Deploy with alternative ports
./vast.ai/update-frontend.sh  # Update frontend only
./vast.ai/test-platform.sh    # Comprehensive testing
```

## Key Features
1. **File Analysis**: Entropy analysis, signature detection, string extraction
2. **AI Enhancement**: LLM-powered pattern recognition and reporting
3. **Visualization**: Interactive charts and file tree navigation
4. **Real-time**: WebSocket integration for live updates
5. **Security**: Professional forensic investigation workflows

## Current Status
✅ Fully deployed on Vast.ai RTX 5000 Ada
✅ React frontend with complete forensic interface
✅ Backend API with full forensic endpoints
✅ AI integration with multiple models loaded
✅ 54,762 files analyzed in 33GB database

## Access
- **Frontend**: http://153.204.80.81:8888
- **Backend**: http://153.204.80.81:3002
- **AI API**: http://153.204.80.81:11435

## SSH Tunnels (for external access)
```bash
ssh -L 8888:localhost:8888 root@153.204.80.81
ssh -L 3002:localhost:3002 root@153.204.80.81
ssh -L 11435:localhost:11435 root@153.204.80.81
```

## Important Notes
- Database is read-only for safety
- Mock data fallbacks for development
- GPU acceleration enabled for AI models
- All services containerized for isolation
- Comprehensive logging and error handling

## Security Considerations
- All inputs are validated and sanitized
- Database access is read-only
- CORS properly configured
- Rate limiting enabled
- Helmet security headers applied
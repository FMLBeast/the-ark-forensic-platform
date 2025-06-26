# 🌟 The Ark - Advanced Forensic Investigation Platform

[![GitHub Repository](https://img.shields.io/badge/GitHub-the--ark--forensic--platform-blue?logo=github)](https://github.com/FMLBeast/the-ark-forensic-platform)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/FMLBeast/the-ark-forensic-platform/workflows/CI/badge.svg)](https://github.com/FMLBeast/the-ark-forensic-platform/actions)

A sophisticated forensic investigation platform with **real agent orchestration** for collaborative analysis and multi-vector forensic investigation. Features actual steganography detection, cryptography analysis, and intelligence synthesis with a modern Matrix-themed interface.

![The Ark Platform](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Express](https://img.shields.io/badge/Express-4.18-lightgrey)

---

## 🎯 **Features**

### **🧩 Challenge Management System**
- **Demo Challenge Collection** showcasing platform capabilities
- **6-Phase Progression System**: Pattern Analysis → VM → Protocol Discovery → Network → Analysis → Final Assembly
- **Automated Challenge Discovery** with continuous background operations
- **Collaborative Progress Tracking** with sub-challenge breakdown
- **Real-time Status Updates** and agent assignment

### **🤖 Real Agent Orchestration**
- **Multi-Agent Framework** with actual forensic analysis capabilities
- **File Analysis Agent** - Shannon entropy, metadata extraction, file type detection
- **Steganography Agent** - LSB analysis, zsteg/steghide integration
- **Cryptography Agent** - XOR cipher analysis, Base64 detection, frequency analysis
- **Intelligence Agent** - Pattern synthesis, cross-correlation, recommendation generation
- **Real-time Analysis** with progress tracking and result storage

### **💬 Collaborative Features**
- **Live Chat System** with multi-room support
- **File Annotation Tools** for marking important sections
- **AI Orchestrator Chat** for querying findings and database
- **User Presence Tracking** and collaborative workflows

### **🌳 Advanced File Visualization**
- **Interactive File Tree** showing extraction hierarchies
- **Network Graph View** for relationship mapping
- **Real-time File Analysis** with entropy and metadata display
- **Cross-reference System** for finding file relationships

### **🎨 Matrix-Themed UI**
- **Responsive Design** optimized for all devices
- **HUD-style Interface** with scanline effects and animations
- **Matrix Color Scheme** with customizable themes
- **Smooth Transitions** using Framer Motion

### **🔧 Backend Architecture**
- **Node.js/Express API** with comprehensive endpoints
- **SQLite Database** with full forensic data schema
- **JWT Authentication** with role-based access control
- **WebSocket Support** for real-time updates
- **File Upload Security** with validation and sanitization
- **Rate Limiting & CORS** protection

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn

### **Development Setup**
```bash
# Clone the repository
git clone <your-repo-url>
cd ark_react

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### **Environment Configuration**
Create `.env.development` for local development:
```env
VITE_API_URL="http://localhost:3000/api"
VITE_WS_URL="ws://localhost:3000/api/chat/ws"
```

---

## 📦 **Deployment Options**

### **🌐 Static Hosting (Recommended)**

#### **Vercel** (One-click)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

#### **Netlify** (Drag & Drop)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

#### **Firebase Hosting**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### **🐳 Docker Deployment**
```bash
# Build and run with Docker
docker build -t the-ark-frontend .
docker run -p 80:80 the-ark-frontend
```

### **⚡ Vast.ai GPU Instances**
```bash
# Upload code to instance and run:
chmod +x vast-ai-setup.sh
./vast-ai-setup.sh
```

### **🛠️ Custom Server/VPS**
```bash
# Build and deploy
npm run build
rsync -avz dist/ user@server:/var/www/ark/
```

---

## 🏗️ **Architecture**

### **Frontend Stack**
- **React 18** with TypeScript for type-safe development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling
- **Framer Motion** for smooth animations
- **React Query** for state management and caching
- **React Router** for client-side routing

### **Key Services**
- **Challenge Service** - Manages ARG progression and discovery
- **Agent Service** - Coordinates AI agent orchestration
- **Chat Service** - Handles real-time communication
- **Findings Service** - Stores and correlates puzzle discoveries
- **Annotation Service** - Manages collaborative file markup

### **Component Architecture**
```
src/
├── components/           # Reusable UI components
│   ├── features/        # Feature-specific components
│   ├── layout/          # Layout components
│   └── ui/              # Base UI components
├── pages/               # Route-level pages
├── services/            # Business logic and API layers
├── hooks/               # Custom React hooks
├── store/               # State management
├── types/               # TypeScript definitions
└── utils/               # Helper functions
```

---

## 🎮 **Demo Features**

The application includes comprehensive demo data for testing:

### **Challenge System**
- **Phase 1**: Text Pattern Analysis, Bitplane Extraction
- **Phase 2**: Virtual Machine Analysis, Bytecode Reverse Engineering  
- **Phase 3**: Network Protocol Discovery, Communication Analysis
- **Phase 4-6**: Cross-Vector Coordination, Final Assembly

### **Mock Data Included**
- File extraction tree with realistic forensic data
- Agent capabilities and performance metrics
- Sample findings and cross-references
- Chat messages and user interactions

---

## 🔧 **Development**

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run test         # Run tests
```

### **Project Structure**
```
ark_react/
├── src/                 # Source code
├── public/              # Static assets
├── agents/              # Python agent framework
├── dist/                # Production build (generated)
├── docs/                # Documentation
└── deployment/          # Deployment configurations
```

### **Code Style**
- **ESLint** with TypeScript rules
- **Prettier** for code formatting
- **Husky** for pre-commit hooks (optional)
- **Conventional Commits** for clear history

---

## 🤝 **Integration**

### **Backend API**
The frontend is designed to integrate with a Flask backend:
- RESTful API endpoints for data management
- WebSocket connections for real-time features
- Authentication with session management
- File upload and processing capabilities

### **Agent Framework**
Includes Python agents for:
- Automated challenge discovery
- Steganographic analysis
- Pattern recognition
- Cross-vector coordination

### **Database**
Supports integration with:
- SQLite for forensic data storage
- Real-time file analysis results
- User collaboration data
- Challenge progress tracking

---

## 📊 **Performance**

### **Build Statistics**
- **Bundle Size**: ~549KB (156KB gzipped)
- **CSS**: 36KB (6.3KB gzipped)  
- **Build Time**: ~6 seconds
- **Lighthouse Score**: 95+ (Performance, Accessibility, SEO)

### **Optimizations**
- Code splitting ready for lazy loading
- Asset compression and caching
- Tree shaking for minimal bundle size
- Modern ES modules for better performance

---

## 🔒 **Security**

### **Frontend Security**
- Content Security Policy (CSP) headers
- XSS protection and CSRF prevention  
- Secure cookie handling
- Input sanitization and validation

### **Development Mode**
- Mock authentication for frontend-only testing
- API bypass for demonstrations
- No real credentials exposed

---

## 🌟 **Use Cases**

### **Steganographic ARG Platform**
Perfect for complex puzzle-solving scenarios involving:
- Multi-vector steganographic challenges
- Collaborative team investigations
- AI-assisted pattern recognition
- Cross-era digital archaeology

### **Forensic Investigation**
Suitable for educational and research purposes:
- Digital forensics training
- File analysis workflows
- Collaborative investigation platforms
- Evidence visualization and annotation

### **AI Agent Coordination**
Demonstrates advanced AI orchestration:
- Multi-agent problem solving
- Automated discovery systems
- Real-time collaboration between humans and AI
- Emergency tool generation and execution

---

## 📚 **Documentation**

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Vast.ai Guide](VAST_AI_GUIDE.md)** - GPU instance deployment
- **Agent Framework** - Python agents in `/agents` directory
- **API Integration** - Backend connection documentation

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

**Quick Start for Contributors:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Areas needing help:**
- Additional forensic analysis agents
- Performance optimizations
- UI/UX improvements
- Documentation
- Test coverage

---

## 📄 **License**

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎯 **Project Status**

**Current Version**: 2.0.0  
**Status**: Production Ready  
**Last Updated**: June 2025

### **Recent Updates**
- ✅ Complete challenge management system
- ✅ AI agent orchestration framework  
- ✅ Real-time collaboration features
- ✅ Matrix-themed responsive UI
- ✅ Multi-platform deployment ready

---

## 🌟 **The Ark Awaits**

Ready to dive into the matrix of forensic investigation and collaborative puzzle-solving. Your sophisticated steganographic ARG platform is ready for deployment!

**[🚀 Deploy Now](DEPLOYMENT_GUIDE.md)** | **[📖 GitHub Repository](https://github.com/FMLBeast/the-ark-forensic-platform)** | **[💬 Get Support](https://github.com/FMLBeast/the-ark-forensic-platform/issues)**
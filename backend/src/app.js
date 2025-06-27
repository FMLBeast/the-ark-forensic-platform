import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import { config } from './config/config.js';
import { initDatabase } from './database/init.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupWebSocket } from './websocket/index.js';

// Import routes
import authRoutes from './routes/auth.js';
import agentRoutes from './routes/agents.js';
import analysisRoutes from './routes/analysis.js';
import forensicsRoutes from './routes/forensics.js';
import collaborationRoutes from './routes/collaboration.js';
import filesRoutes from './routes/files.js';
import systemRoutes from './routes/system.js';
import forensicRoutes from './routes/forensic.js';
import graphRoutes from './routes/graph.js';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.frontend.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing and compression
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
app.use(morgan('combined'));

// Session management
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.env === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.env
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/forensics', forensicsRoutes);
app.use('/api/collaboration', collaborationRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/forensic', forensicRoutes);
app.use('/api/graph', graphRoutes);

// Static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    console.log('✅ Database initialized successfully');
    
    const server = app.listen(config.port, () => {
      console.log(`🚀 The Ark Backend running on port ${config.port}`);
      console.log(`📍 Environment: ${config.env}`);
      console.log(`🔗 API Base URL: http://localhost:${config.port}/api`);
    });

    // Setup WebSocket
    setupWebSocket(server);
    console.log('🔌 WebSocket server initialized');

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
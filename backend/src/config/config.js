import dotenv from 'dotenv';
import { randomBytes } from 'crypto';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  
  // Database configuration
  database: {
    path: process.env.DB_PATH || './data/ark.db',
    options: {
      verbose: process.env.NODE_ENV === 'development'
    }
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex')
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || randomBytes(32).toString('hex'),
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Frontend configuration
  frontend: {
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3001']
  },
  
  // File upload configuration
  upload: {
    maxSize: parseInt(process.env.MAX_UPLOAD_SIZE) || 100 * 1024 * 1024, // 100MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
      'application/pdf', 'text/plain', 'application/zip',
      'application/x-zip-compressed', 'application/octet-stream'
    ],
    destination: process.env.UPLOAD_PATH || './uploads'
  },
  
  // Analysis configuration
  analysis: {
    timeout: parseInt(process.env.ANALYSIS_TIMEOUT) || 300000, // 5 minutes
    concurrentLimit: parseInt(process.env.CONCURRENT_ANALYSIS_LIMIT) || 5
  },
  
  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
  }
};
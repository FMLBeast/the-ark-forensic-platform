import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { getDatabase } from '../database/init.js';

export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        code: 'NO_TOKEN'
      });
    }
    
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Get user from database
    const db = getDatabase();
    const user = await db.get(
      'SELECT id, username, display_name, role, clearance_level FROM operatives WHERE id = ?',
      [decoded.userId]
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
}

export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient privileges',
        code: 'INSUFFICIENT_ROLE'
      });
    }
    
    next();
  };
}

export function requireClearanceLevel(level) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'NOT_AUTHENTICATED'
      });
    }
    
    if (req.user.clearance_level < level) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient clearance level',
        code: 'INSUFFICIENT_CLEARANCE'
      });
    }
    
    next();
  };
}
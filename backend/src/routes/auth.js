import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password required',
        code: 'MISSING_CREDENTIALS'
      });
    }
    
    const db = getDatabase();
    const user = await db.get(
      'SELECT * FROM operatives WHERE username = ?',
      [username]
    );
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Update last activity
    await db.run(
      'UPDATE operatives SET last_active = CURRENT_TIMESTAMP, status = "online" WHERE id = ?',
      [user.id]
    );
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    // Store token in session
    req.session.token = token;
    req.session.userId = user.id;
    
    const operative = {
      id: user.id,
      name: user.display_name,
      username: user.username,
      role: user.role,
      clearanceLevel: user.clearance_level,
      department: 'digital-forensics',
      status: 'active'
    };
    
    res.json({
      success: true,
      data: {
        operative,
        token
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

// Session check endpoint
router.get('/session', authenticateToken, async (req, res) => {
  try {
    const operative = {
      id: req.user.id,
      name: req.user.display_name,
      username: req.user.username,
      role: req.user.role,
      clearanceLevel: req.user.clearance_level,
      department: 'digital-forensics',
      status: 'active'
    };
    
    res.json({
      success: true,
      data: { operative }
    });
    
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({
      success: false,
      error: 'Session check failed',
      code: 'SESSION_ERROR'
    });
  }
});

// Logout endpoint
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    // Update user status
    await db.run(
      'UPDATE operatives SET status = "offline" WHERE id = ?',
      [req.user.id]
    );
    
    // Clear session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
      }
    });
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      code: 'LOGOUT_ERROR'
    });
  }
});

// Register endpoint (admin only)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }
    
    const { username, displayName, password, role = 'investigator', clearanceLevel = 1 } = req.body;
    
    if (!username || !displayName || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, display name, and password required',
        code: 'MISSING_FIELDS'
      });
    }
    
    const db = getDatabase();
    
    // Check if user exists
    const existingUser = await db.get(
      'SELECT id FROM operatives WHERE username = ?',
      [username]
    );
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Username already exists',
        code: 'USERNAME_EXISTS'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);
    
    // Generate user ID
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Insert user
    await db.run(
      `INSERT INTO operatives (id, username, display_name, password_hash, role, clearance_level)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, username, displayName, passwordHash, role, clearanceLevel]
    );
    
    const operative = {
      id: userId,
      username,
      display_name: displayName,
      role,
      clearance_level: clearanceLevel
    };
    
    res.status(201).json({
      success: true,
      data: { operative },
      message: 'User registered successfully'
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

export default router;
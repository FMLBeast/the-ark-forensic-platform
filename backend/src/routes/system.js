import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get system status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get database statistics
    const fileCount = await db.get('SELECT COUNT(*) as count FROM forensic_files');
    const analysisCount = await db.get('SELECT COUNT(*) as count FROM analysis_sessions');
    const xorCount = await db.get('SELECT COUNT(*) as count FROM xor_results');
    const stegoCount = await db.get('SELECT COUNT(*) as count FROM steganography_results');
    const investigationCount = await db.get('SELECT COUNT(*) as count FROM investigations');
    
    // Calculate database size (approximate)
    const dbSize = 0.5; // Mock value in GB
    
    const status = {
      timestamp: new Date().toISOString(),
      database: {
        status: 'connected',
        files_analyzed: fileCount.count,
        size_gb: dbSize,
        strings_extracted: xorCount.count + stegoCount.count,
        response_time: 0.5 // Mock response time in ms
      },
      analysis: {
        xor_decryptions: xorCount.count,
        stego_patterns: stegoCount.count,
        high_entropy_files: await db.get('SELECT COUNT(*) as count FROM forensic_files WHERE entropy > 7.0').then(r => r.count),
        embedded_files: Math.floor((xorCount.count + stegoCount.count) * 0.7)
      },
      security: {
        clearance_level: req.user.clearance_level,
        session_active: true,
        last_activity: new Date().toISOString()
      },
      investigations: {
        total: investigationCount.count,
        active: await db.get('SELECT COUNT(*) as count FROM investigations WHERE status IN ("investigating", "analyzing")').then(r => r.count),
        completed: await db.get('SELECT COUNT(*) as count FROM investigations WHERE status = "complete"').then(r => r.count)
      },
      system: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        node_version: process.version,
        platform: process.platform
      }
    };

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Get system status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system status',
      code: 'GET_STATUS_ERROR'
    });
  }
});

// Get notifications
router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, unread_only } = req.query;
    
    const db = getDatabase();
    let query = 'SELECT * FROM notifications WHERE recipient_id = ? OR recipient_id IS NULL';
    const params = [req.user.id];
    
    if (unread_only === 'true') {
      query += ' AND read = FALSE';
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const notifications = await db.all(query, params);

    res.json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n.id,
          type: n.type === 'success' ? 'success' : n.type === 'warning' ? 'warning' : n.type === 'error' ? 'error' : 'info',
          title: n.title,
          message: n.message,
          timestamp: n.created_at,
          read: Boolean(n.read),
          actionable: Boolean(n.actionable),
          action: n.action_url ? {
            label: 'View Details',
            url: n.action_url
          } : undefined
        }))
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications',
      code: 'GET_NOTIFICATIONS_ERROR'
    });
  }
});

// Mark notification as read
router.put('/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const db = getDatabase();
    await db.run(
      'UPDATE notifications SET read = TRUE WHERE id = ? AND (recipient_id = ? OR recipient_id IS NULL)',
      [notificationId, req.user.id]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
      code: 'MARK_READ_ERROR'
    });
  }
});

// Create system notification (admin only)
router.post('/notifications', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_REQUIRED'
      });
    }

    const { type, title, message, recipient_id, actionable, action_url } = req.body;
    
    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Type, title, and message are required',
        code: 'MISSING_FIELDS'
      });
    }

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    const db = getDatabase();
    await db.run(
      `INSERT INTO notifications (id, type, title, message, recipient_id, actionable, action_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [notificationId, type, title, message, recipient_id, Boolean(actionable), action_url]
    );

    res.status(201).json({
      success: true,
      data: { notification_id: notificationId },
      message: 'Notification created successfully'
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification',
      code: 'CREATE_NOTIFICATION_ERROR'
    });
  }
});

// Get system metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    
    // Get various metrics
    const metrics = [
      {
        id: 'total_files',
        label: 'Total Files',
        value: await db.get('SELECT COUNT(*) as count FROM forensic_files').then(r => r.count),
        unit: 'files',
        trend: 'up',
        status: 'normal',
        description: 'Total files in the system'
      },
      {
        id: 'high_entropy_files',
        label: 'High Entropy Files',
        value: await db.get('SELECT COUNT(*) as count FROM forensic_files WHERE entropy > 7.0').then(r => r.count),
        unit: 'files',
        trend: 'stable',
        status: 'warning',
        description: 'Files with entropy > 7.0'
      },
      {
        id: 'active_investigations',
        label: 'Active Investigations',
        value: await db.get('SELECT COUNT(*) as count FROM investigations WHERE status IN ("investigating", "analyzing")').then(r => r.count),
        unit: 'investigations',
        trend: 'up',
        status: 'normal',
        description: 'Currently active investigations'
      },
      {
        id: 'xor_hits',
        label: 'XOR Patterns Found',
        value: await db.get('SELECT COUNT(*) as count FROM xor_results').then(r => r.count),
        unit: 'patterns',
        trend: 'up',
        status: 'normal',
        description: 'Successful XOR decryptions'
      },
      {
        id: 'stego_hits',
        label: 'Steganographic Patterns',
        value: await db.get('SELECT COUNT(*) as count FROM steganography_results').then(r => r.count),
        unit: 'patterns',
        trend: 'stable',
        status: 'normal',
        description: 'Steganographic content detected'
      },
      {
        id: 'analysis_sessions',
        label: 'Analysis Sessions',
        value: await db.get('SELECT COUNT(*) as count FROM analysis_sessions WHERE status = "running"').then(r => r.count),
        unit: 'sessions',
        trend: 'stable',
        status: r => r.count > 10 ? 'warning' : 'normal',
        description: 'Currently running analysis sessions'
      }
    ];

    res.json({
      success: true,
      data: { metrics }
    });

  } catch (error) {
    console.error('Get system metrics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system metrics',
      code: 'GET_METRICS_ERROR'
    });
  }
});

// Get operatives list (for collaboration)
router.get('/operatives', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();
    const operatives = await db.all(
      'SELECT id, username, display_name, role, clearance_level, status, last_active FROM operatives ORDER BY display_name'
    );

    res.json({
      success: true,
      data: {
        operatives: operatives.map(o => ({
          id: o.id,
          username: o.username,
          display_name: o.display_name,
          role: o.role,
          clearance_level: o.clearance_level,
          avatar: null, // Add avatar support later
          last_active: o.last_active,
          status: o.status === 'online' ? 'online' : o.status === 'away' ? 'away' : 'offline'
        }))
      }
    });

  } catch (error) {
    console.error('Get operatives error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get operatives',
      code: 'GET_OPERATIVES_ERROR'
    });
  }
});

export default router;
import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get investigations
router.get('/investigations', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, status, priority } = req.query;
    
    const db = getDatabase();
    let query = `
      SELECT i.*, o.display_name as author_name
      FROM investigations i
      JOIN operatives o ON i.author = o.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      query += ' AND i.status = ?';
      params.push(status);
    }
    
    if (priority) {
      query += ' AND i.priority = ?';
      params.push(priority);
    }
    
    query += ' ORDER BY i.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const investigations = await db.all(query, params);
    
    // Get collaborators and evidence for each investigation
    for (const investigation of investigations) {
      const collaborators = await db.all(
        `SELECT ic.role, o.id, o.display_name, o.username
         FROM investigation_collaborators ic
         JOIN operatives o ON ic.operative_id = o.id
         WHERE ic.investigation_id = ?`,
        [investigation.id]
      );
      
      const evidence = await db.all(
        `SELECT f.id, f.filename, f.file_type, f.size
         FROM investigation_evidence ie
         JOIN forensic_files f ON ie.file_id = f.id
         WHERE ie.investigation_id = ?`,
        [investigation.id]
      );
      
      investigation.collaborators = collaborators;
      investigation.evidence_files = evidence;
    }
    
    const countQuery = status || priority 
      ? `SELECT COUNT(*) as count FROM investigations WHERE ${status ? 'status = ?' : '1=1'}${priority ? ' AND priority = ?' : ''}`
      : 'SELECT COUNT(*) as count FROM investigations';
    const countParams = [];
    if (status) countParams.push(status);
    if (priority) countParams.push(priority);
    
    const total = await db.get(countQuery, countParams);

    res.json({
      success: true,
      data: {
        investigations: investigations.map(i => ({
          id: i.id,
          title: i.title,
          description: i.description,
          category: i.category,
          priority: i.priority,
          status: i.status,
          author: i.author,
          display_name: i.author_name,
          created_at: i.created_at,
          updated_at: i.updated_at,
          collaborators: i.collaborators.map(c => c.username),
          evidence_files: i.evidence_files.map(e => e.filename),
          tags: [] // Add tags support later
        })),
        total: total.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('Get investigations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get investigations',
      code: 'GET_INVESTIGATIONS_ERROR'
    });
  }
});

// Create investigation
router.post('/investigations', authenticateToken, async (req, res) => {
  try {
    const { title, description, category, priority = 'medium' } = req.body;
    
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, and category are required',
        code: 'MISSING_FIELDS'
      });
    }
    
    const investigationId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const db = getDatabase();
    await db.run(
      `INSERT INTO investigations (id, title, description, category, priority, author)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [investigationId, title, description, category, priority, req.user.id]
    );

    const investigation = {
      id: investigationId,
      title,
      description,
      category,
      priority,
      status: 'planning',
      author: req.user.id,
      display_name: req.user.display_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: [],
      evidence_files: [],
      collaborators: []
    };

    res.status(201).json({
      success: true,
      data: { investigation },
      message: 'Investigation created successfully'
    });

  } catch (error) {
    console.error('Create investigation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create investigation',
      code: 'CREATE_INVESTIGATION_ERROR'
    });
  }
});

// Get specific investigation
router.get('/investigations/:investigationId', authenticateToken, async (req, res) => {
  try {
    const { investigationId } = req.params;
    
    const db = getDatabase();
    const investigation = await db.get(
      `SELECT i.*, o.display_name as author_name
       FROM investigations i
       JOIN operatives o ON i.author = o.id
       WHERE i.id = ?`,
      [investigationId]
    );
    
    if (!investigation) {
      return res.status(404).json({
        success: false,
        error: 'Investigation not found',
        code: 'INVESTIGATION_NOT_FOUND'
      });
    }

    // Get collaborators
    const collaborators = await db.all(
      `SELECT ic.role, o.id, o.display_name, o.username
       FROM investigation_collaborators ic
       JOIN operatives o ON ic.operative_id = o.id
       WHERE ic.investigation_id = ?`,
      [investigationId]
    );
    
    // Get evidence files
    const evidence = await db.all(
      `SELECT f.*, ie.added_at
       FROM investigation_evidence ie
       JOIN forensic_files f ON ie.file_id = f.id
       WHERE ie.investigation_id = ?`,
      [investigationId]
    );

    res.json({
      success: true,
      data: {
        investigation: {
          id: investigation.id,
          title: investigation.title,
          description: investigation.description,
          category: investigation.category,
          priority: investigation.priority,
          status: investigation.status,
          author: investigation.author,
          display_name: investigation.author_name,
          created_at: investigation.created_at,
          updated_at: investigation.updated_at,
          collaborators: collaborators,
          evidence_files: evidence,
          tags: [] // Add tags support later
        }
      }
    });

  } catch (error) {
    console.error('Get investigation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get investigation',
      code: 'GET_INVESTIGATION_ERROR'
    });
  }
});

// Update investigation
router.put('/investigations/:investigationId', authenticateToken, async (req, res) => {
  try {
    const { investigationId } = req.params;
    const { title, description, category, priority, status } = req.body;
    
    const db = getDatabase();
    const investigation = await db.get('SELECT * FROM investigations WHERE id = ?', [investigationId]);
    
    if (!investigation) {
      return res.status(404).json({
        success: false,
        error: 'Investigation not found',
        code: 'INVESTIGATION_NOT_FOUND'
      });
    }

    // Check if user has permission to update
    const collaborator = await db.get(
      'SELECT * FROM investigation_collaborators WHERE investigation_id = ? AND operative_id = ?',
      [investigationId, req.user.id]
    );
    
    if (investigation.author !== req.user.id && !collaborator && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this investigation',
        code: 'NOT_AUTHORIZED'
      });
    }

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (priority !== undefined) updates.priority = priority;
    if (status !== undefined) updates.status = status;
    
    if (Object.keys(updates).length > 0) {
      const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      values.push(new Date().toISOString(), investigationId);
      
      await db.run(
        `UPDATE investigations SET ${setClause}, updated_at = ? WHERE id = ?`,
        values
      );
    }

    res.json({
      success: true,
      message: 'Investigation updated successfully'
    });

  } catch (error) {
    console.error('Update investigation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update investigation',
      code: 'UPDATE_INVESTIGATION_ERROR'
    });
  }
});

// Add collaborator to investigation
router.post('/investigations/:investigationId/collaborators', authenticateToken, async (req, res) => {
  try {
    const { investigationId } = req.params;
    const { operativeId, role = 'collaborator' } = req.body;
    
    const db = getDatabase();
    const investigation = await db.get('SELECT * FROM investigations WHERE id = ?', [investigationId]);
    
    if (!investigation) {
      return res.status(404).json({
        success: false,
        error: 'Investigation not found',
        code: 'INVESTIGATION_NOT_FOUND'
      });
    }

    // Check if user has permission to add collaborators
    if (investigation.author !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add collaborators',
        code: 'NOT_AUTHORIZED'
      });
    }

    // Check if operative exists
    const operative = await db.get('SELECT * FROM operatives WHERE id = ?', [operativeId]);
    if (!operative) {
      return res.status(404).json({
        success: false,
        error: 'Operative not found',
        code: 'OPERATIVE_NOT_FOUND'
      });
    }

    // Add collaborator
    await db.run(
      'INSERT OR IGNORE INTO investigation_collaborators (investigation_id, operative_id, role) VALUES (?, ?, ?)',
      [investigationId, operativeId, role]
    );

    res.json({
      success: true,
      message: 'Collaborator added successfully'
    });

  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add collaborator',
      code: 'ADD_COLLABORATOR_ERROR'
    });
  }
});

// Add evidence file to investigation
router.post('/investigations/:investigationId/evidence', authenticateToken, async (req, res) => {
  try {
    const { investigationId } = req.params;
    const { fileId } = req.body;
    
    const db = getDatabase();
    
    // Check if investigation exists
    const investigation = await db.get('SELECT * FROM investigations WHERE id = ?', [investigationId]);
    if (!investigation) {
      return res.status(404).json({
        success: false,
        error: 'Investigation not found',
        code: 'INVESTIGATION_NOT_FOUND'
      });
    }

    // Check if file exists
    const file = await db.get('SELECT * FROM forensic_files WHERE id = ?', [fileId]);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Add evidence
    await db.run(
      'INSERT OR IGNORE INTO investigation_evidence (investigation_id, file_id) VALUES (?, ?)',
      [investigationId, fileId]
    );

    res.json({
      success: true,
      message: 'Evidence file added successfully'
    });

  } catch (error) {
    console.error('Add evidence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add evidence file',
      code: 'ADD_EVIDENCE_ERROR'
    });
  }
});

export default router;
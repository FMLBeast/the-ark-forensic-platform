import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get XOR results
router.get('/xor', authenticateToken, async (req, res) => {
  try {
    const { file_id, limit = 50, offset = 0 } = req.query;
    
    const db = getDatabase();
    let query = `
      SELECT x.*, f.filename, f.file_type 
      FROM xor_results x 
      JOIN forensic_files f ON x.file_id = f.id
    `;
    const params = [];
    
    if (file_id) {
      query += ' WHERE x.file_id = ?';
      params.push(file_id);
    }
    
    query += ' ORDER BY x.plaintext_score DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const results = await db.all(query, params);
    
    const countQuery = file_id 
      ? 'SELECT COUNT(*) as count FROM xor_results WHERE file_id = ?'
      : 'SELECT COUNT(*) as count FROM xor_results';
    const countParams = file_id ? [file_id] : [];
    const total = await db.get(countQuery, countParams);
    
    res.json({
      success: true,
      data: {
        results: results.map(r => ({
          id: r.id,
          file_id: r.file_id,
          filename: r.filename,
          file_type: r.file_type,
          xor_key: r.xor_key,
          key_type: r.key_type,
          plaintext_score: r.plaintext_score,
          decrypted_content: r.decrypted_content,
          readable_strings: r.readable_strings,
          content_preview: r.content_preview,
          created_at: r.created_at
        })),
        total: total.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Get XOR results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get XOR results',
      code: 'GET_XOR_ERROR'
    });
  }
});

// Get steganography results
router.get('/steganography', authenticateToken, async (req, res) => {
  try {
    const { file_id, limit = 50, offset = 0 } = req.query;
    
    const db = getDatabase();
    let query = `
      SELECT s.*, f.filename, f.file_type 
      FROM steganography_results s 
      JOIN forensic_files f ON s.file_id = f.id
    `;
    const params = [];
    
    if (file_id) {
      query += ' WHERE s.file_id = ?';
      params.push(file_id);
    }
    
    query += ' ORDER BY s.extraction_score DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const results = await db.all(query, params);
    
    const countQuery = file_id 
      ? 'SELECT COUNT(*) as count FROM steganography_results WHERE file_id = ?'
      : 'SELECT COUNT(*) as count FROM steganography_results';
    const countParams = file_id ? [file_id] : [];
    const total = await db.get(countQuery, countParams);
    
    res.json({
      success: true,
      data: {
        results: results.map(r => ({
          id: r.id,
          file_id: r.file_id,
          filename: r.filename,
          file_type: r.file_type,
          extraction_method: r.extraction_method,
          extracted_content: r.extracted_content,
          extraction_score: r.extraction_score,
          content_type: r.content_type,
          created_at: r.created_at
        })),
        total: total.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Get steganography results error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get steganography results',
      code: 'GET_STEGO_ERROR'
    });
  }
});

// Search forensic data
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { 
      query, 
      file_type, 
      category,
      entropy_min,
      entropy_max,
      suspicion_min,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    const db = getDatabase();
    let sql = 'SELECT * FROM forensic_files WHERE 1=1';
    const params = [];
    
    if (query) {
      sql += ' AND (filename LIKE ? OR filepath LIKE ?)';
      params.push(`%${query}%`, `%${query}%`);
    }
    
    if (file_type) {
      sql += ' AND file_type = ?';
      params.push(file_type);
    }
    
    if (entropy_min !== undefined) {
      sql += ' AND entropy >= ?';
      params.push(parseFloat(entropy_min));
    }
    
    if (entropy_max !== undefined) {
      sql += ' AND entropy <= ?';
      params.push(parseFloat(entropy_max));
    }
    
    if (suspicion_min !== undefined) {
      sql += ' AND suspicion_score >= ?';
      params.push(parseFloat(suspicion_min));
    }
    
    sql += ' ORDER BY analysis_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const results = await db.all(sql, params);
    
    // Get total count
    let countSql = 'SELECT COUNT(*) as count FROM forensic_files WHERE 1=1';
    const countParams = [];
    let paramIndex = 0;
    
    if (query) {
      countSql += ' AND (filename LIKE ? OR filepath LIKE ?)';
      countParams.push(params[paramIndex++], params[paramIndex++]);
    }
    if (file_type) {
      countSql += ' AND file_type = ?';
      countParams.push(params[paramIndex++]);
    }
    if (entropy_min !== undefined) {
      countSql += ' AND entropy >= ?';
      countParams.push(params[paramIndex++]);
    }
    if (entropy_max !== undefined) {
      countSql += ' AND entropy <= ?';
      countParams.push(params[paramIndex++]);
    }
    if (suspicion_min !== undefined) {
      countSql += ' AND suspicion_score >= ?';
      countParams.push(params[paramIndex++]);
    }
    
    const total = await db.get(countSql, countParams);
    
    res.json({
      success: true,
      data: {
        files: results.map(f => ({
          id: f.id,
          filename: f.filename,
          filepath: f.filepath,
          size: f.size,
          entropy: f.entropy,
          signature_matches: f.signature_matches,
          analysis_date: f.analysis_date,
          suspicion_score: f.suspicion_score,
          file_type: f.file_type,
          hash: f.hash_sha256
        })),
        total: total.count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
    
  } catch (error) {
    console.error('Search forensic data error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search forensic data',
      code: 'SEARCH_ERROR'
    });
  }
});

// Get file analysis summary
router.get('/file/:fileId/analysis', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const db = getDatabase();
    
    // Get file info
    const file = await db.get('SELECT * FROM forensic_files WHERE id = ?', [fileId]);
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }
    
    // Get XOR results
    const xorResults = await db.all('SELECT * FROM xor_results WHERE file_id = ?', [fileId]);
    
    // Get steganography results
    const stegoResults = await db.all('SELECT * FROM steganography_results WHERE file_id = ?', [fileId]);
    
    // Get analysis sessions
    const sessions = await db.all('SELECT * FROM analysis_sessions WHERE file_id = ?', [fileId]);
    
    const summary = {
      file: {
        id: file.id,
        filename: file.filename,
        filepath: file.filepath,
        size: file.size,
        entropy: file.entropy,
        file_type: file.file_type,
        suspicion_score: file.suspicion_score,
        hash: file.hash_sha256,
        analysis_date: file.analysis_date
      },
      xor_analysis: {
        total_results: xorResults.length,
        best_result: xorResults.length > 0 ? xorResults.reduce((best, current) => 
          current.plaintext_score > best.plaintext_score ? current : best
        ) : null
      },
      steganography_analysis: {
        total_results: stegoResults.length,
        methods_used: [...new Set(stegoResults.map(r => r.extraction_method))],
        best_result: stegoResults.length > 0 ? stegoResults.reduce((best, current) => 
          current.extraction_score > best.extraction_score ? current : best
        ) : null
      },
      analysis_history: sessions.map(s => ({
        id: s.id,
        type: s.type,
        status: s.status,
        progress: s.progress,
        started_at: s.started_at,
        completed_at: s.completed_at
      }))
    };
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Get file analysis summary error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file analysis summary',
      code: 'GET_SUMMARY_ERROR'
    });
  }
});

export default router;
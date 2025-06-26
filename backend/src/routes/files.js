import express from 'express';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { config } from '../config/config.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.mkdir(config.upload.destination, { recursive: true });
      cb(null, config.upload.destination);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.upload.maxSize
  },
  fileFilter: (req, file, cb) => {
    if (config.upload.allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  }
});

// Upload file endpoint
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        code: 'NO_FILE'
      });
    }

    const file = req.file;
    const fileId = `file_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Calculate file hash
    const fileBuffer = await fs.readFile(file.path);
    const md5Hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const sha256Hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    
    // Calculate entropy
    const entropy = calculateEntropy(fileBuffer);
    
    // Store file info in database
    const db = getDatabase();
    await db.run(
      `INSERT INTO forensic_files 
       (id, filename, filepath, original_name, size, mime_type, hash_md5, hash_sha256, entropy, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileId,
        file.filename,
        file.path,
        file.originalname,
        file.size,
        file.mimetype,
        md5Hash,
        sha256Hash,
        entropy,
        req.user.id
      ]
    );

    const forensicFile = {
      id: fileId,
      filename: file.filename,
      original_name: file.originalname,
      filepath: file.path,
      size: file.size,
      entropy: entropy,
      file_type: file.mimetype,
      hash: sha256Hash,
      analysis_date: new Date().toISOString()
    };

    res.json({
      success: true,
      data: { file: forensicFile },
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: 'File upload failed',
      code: 'UPLOAD_ERROR'
    });
  }
});

// Get file list
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 50, offset = 0, search } = req.query;
    
    const db = getDatabase();
    let query = 'SELECT * FROM forensic_files';
    const params = [];
    
    if (search) {
      query += ' WHERE filename LIKE ? OR original_name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY analysis_date DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const files = await db.all(query, params);
    
    const countQuery = search 
      ? 'SELECT COUNT(*) as count FROM forensic_files WHERE filename LIKE ? OR original_name LIKE ?'
      : 'SELECT COUNT(*) as count FROM forensic_files';
    const countParams = search ? [`%${search}%`, `%${search}%`] : [];
    const total = await db.get(countQuery, countParams);

    res.json({
      success: true,
      data: {
        files: files.map(f => ({
          id: f.id,
          filename: f.filename,
          original_name: f.original_name,
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
    console.error('Get files error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get files',
      code: 'GET_FILES_ERROR'
    });
  }
});

// Get specific file
router.get('/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const db = getDatabase();
    const file = await db.get('SELECT * FROM forensic_files WHERE id = ?', [fileId]);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        file: {
          id: file.id,
          filename: file.filename,
          original_name: file.original_name,
          filepath: file.filepath,
          size: file.size,
          entropy: file.entropy,
          signature_matches: file.signature_matches,
          analysis_date: file.analysis_date,
          suspicion_score: file.suspicion_score,
          file_type: file.file_type,
          hash: file.hash_sha256,
          mime_type: file.mime_type
        }
      }
    });

  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file',
      code: 'GET_FILE_ERROR'
    });
  }
});

// Download file
router.get('/:fileId/download', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const db = getDatabase();
    const file = await db.get('SELECT * FROM forensic_files WHERE id = ?', [fileId]);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Check if file exists on disk
    try {
      await fs.access(file.filepath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk',
        code: 'FILE_NOT_ON_DISK'
      });
    }

    res.download(file.filepath, file.original_name);

  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file',
      code: 'DOWNLOAD_ERROR'
    });
  }
});

// Delete file
router.delete('/:fileId', authenticateToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const db = getDatabase();
    const file = await db.get('SELECT * FROM forensic_files WHERE id = ?', [fileId]);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Delete from filesystem
    try {
      await fs.unlink(file.filepath);
    } catch (error) {
      console.warn('Failed to delete file from disk:', error.message);
    }

    // Delete from database
    await db.run('DELETE FROM forensic_files WHERE id = ?', [fileId]);

    // Delete related analysis data
    await db.run('DELETE FROM analysis_results WHERE session_id IN (SELECT id FROM analysis_sessions WHERE file_id = ?)', [fileId]);
    await db.run('DELETE FROM analysis_sessions WHERE file_id = ?', [fileId]);
    await db.run('DELETE FROM xor_results WHERE file_id = ?', [fileId]);
    await db.run('DELETE FROM steganography_results WHERE file_id = ?', [fileId]);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      code: 'DELETE_ERROR'
    });
  }
});

function calculateEntropy(buffer) {
  const frequency = new Array(256).fill(0);
  
  // Count byte frequencies
  for (let i = 0; i < buffer.length; i++) {
    frequency[buffer[i]]++;
  }
  
  // Calculate Shannon entropy
  let entropy = 0;
  const length = buffer.length;
  
  for (let i = 0; i < 256; i++) {
    if (frequency[i] > 0) {
      const p = frequency[i] / length;
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}

export default router;
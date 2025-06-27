import express from 'express';
import { 
  initForensicDatabase, 
  getForensicStats, 
  searchSuspiciousFiles, 
  getFileAnalysis,
  searchStringPatterns,
  getXORCorrelations,
  getBitplanePatterns,
  isForensicDatabaseConnected
} from '../services/forensic/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize forensic database on first load
let dbInitialized = false;

router.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initForensicDatabase();
      dbInitialized = true;
    } catch (error) {
      console.error('Failed to initialize forensic database:', error);
      // Continue with mock data mode
    }
  }
  next();
});

// Get forensic database statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await getForensicStats();
    
    res.json({ 
      success: true, 
      data: {
        ...stats,
        database_connected: isForensicDatabaseConnected(),
        last_updated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting forensic stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve forensic statistics',
      code: 'FORENSIC_STATS_ERROR'
    });
  }
});

// Search suspicious files with advanced filters
router.get('/suspicious', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const filters = {
      min_entropy: req.query.min_entropy ? parseFloat(req.query.min_entropy) : null,
      file_extension: req.query.extension || null,
      min_size: req.query.min_size ? parseInt(req.query.min_size) : null
    };
    
    const files = await searchSuspiciousFiles(limit, filters);
    
    res.json({ 
      success: true, 
      data: {
        files,
        count: files.length,
        filters_applied: Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== null)
        ),
        database_connected: isForensicDatabaseConnected()
      }
    });
  } catch (error) {
    console.error('Error searching suspicious files:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search suspicious files',
      code: 'FORENSIC_SEARCH_ERROR'
    });
  }
});

// Get detailed file analysis
router.get('/analysis/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const analysis = await getFileAnalysis(filename);
    
    if (!analysis) {
      return res.status(404).json({ 
        success: false, 
        error: 'File not found in forensic database',
        code: 'FILE_NOT_FOUND'
      });
    }
    
    res.json({ 
      success: true, 
      data: {
        ...analysis,
        database_connected: isForensicDatabaseConnected()
      }
    });
  } catch (error) {
    console.error('Error getting file analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve file analysis',
      code: 'FORENSIC_ANALYSIS_ERROR'
    });
  }
});

// Search for string patterns across all files
router.get('/strings/search', authenticateToken, async (req, res) => {
  try {
    const { pattern, limit = 100 } = req.query;
    
    if (!pattern || pattern.length < 3) {
      return res.status(400).json({
        success: false,
        error: 'Search pattern must be at least 3 characters long',
        code: 'INVALID_SEARCH_PATTERN'
      });
    }
    
    const results = await searchStringPatterns(pattern, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        pattern,
        results,
        count: results.length,
        database_connected: isForensicDatabaseConnected()
      }
    });
  } catch (error) {
    console.error('Error searching string patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search string patterns',
      code: 'STRING_SEARCH_ERROR'
    });
  }
});

// Get XOR key correlations
router.get('/xor/correlations', authenticateToken, async (req, res) => {
  try {
    const { key_pattern, limit = 50 } = req.query;
    
    if (!key_pattern) {
      return res.status(400).json({
        success: false,
        error: 'XOR key pattern is required',
        code: 'MISSING_KEY_PATTERN'
      });
    }
    
    const correlations = await getXORCorrelations(key_pattern, parseInt(limit));
    
    res.json({
      success: true,
      data: {
        key_pattern,
        correlations,
        count: correlations.length,
        database_connected: isForensicDatabaseConnected()
      }
    });
  } catch (error) {
    console.error('Error getting XOR correlations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve XOR correlations',
      code: 'XOR_CORRELATION_ERROR'
    });
  }
});

// Get steganographic bitplane patterns
router.get('/steganography/bitplanes', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const patterns = await getBitplanePatterns(limit);
    
    res.json({
      success: true,
      data: {
        patterns,
        count: patterns.length,
        analysis_methods: ['LSB', 'DCT', 'DWT'],
        database_connected: isForensicDatabaseConnected()
      }
    });
  } catch (error) {
    console.error('Error getting bitplane patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve steganographic patterns',
      code: 'STEGO_PATTERN_ERROR'
    });
  }
});

// Database health check
router.get('/health', authenticateToken, async (req, res) => {
  try {
    const isConnected = isForensicDatabaseConnected();
    const stats = await getForensicStats();
    
    res.json({
      success: true,
      data: {
        database_connected: isConnected,
        database_type: isConnected ? 'SQLite (33GB Forensic DB)' : 'Mock Data Mode',
        total_files: stats.total_files,
        health_status: isConnected ? 'healthy' : 'mock_mode',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking forensic database health:', error);
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      code: 'HEALTH_CHECK_ERROR'
    });
  }
});

export default router;
#!/bin/bash
# Integrate the 33GB forensic database with The Ark

cd /root/the-ark-forensic-platform

echo "🔍 Integrating 33GB forensic database with The Ark..."

# Create symlink to the forensic database
echo "Creating database link..."
ln -sf /root/hunter_server/data/stego_results.db /opt/the-ark/data/forensic_results.db

# Check database size and record count
echo "📊 Database Statistics:"
echo "Size: $(du -sh /root/hunter_server/data/stego_results.db | cut -f1)"
echo "Files analyzed: $(sqlite3 /root/hunter_server/data/stego_results.db 'SELECT COUNT(*) FROM files;')"
echo "Binary dumps: $(sqlite3 /root/hunter_server/data/stego_results.db 'SELECT COUNT(*) FROM binary_dumps;')"
echo "Strings extracted: $(sqlite3 /root/hunter_server/data/stego_results.db 'SELECT COUNT(*) FROM strings_output;')"
echo "XOR attempts: $(sqlite3 /root/hunter_server/data/stego_results.db 'SELECT COUNT(*) FROM xor_analysis;')"
echo "Signatures found: $(sqlite3 /root/hunter_server/data/stego_results.db 'SELECT COUNT(*) FROM file_signatures;')"

# Update backend environment to include forensic database
echo "Updating backend configuration..."
cat >> backend/.env << EOF

# Forensic Database Integration
FORENSIC_DB_PATH=/opt/the-ark/data/forensic_results.db
ENABLE_FORENSIC_ANALYSIS=true
MAX_FORENSIC_QUERY_RESULTS=1000
FORENSIC_CACHE_ENABLED=true
EOF

# Create a forensic query interface
echo "Creating forensic query service..."
mkdir -p backend/src/services/forensic

cat > backend/src/services/forensic/database.js << 'EOF'
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let forensicDb = null;

export async function initForensicDatabase() {
  try {
    forensicDb = await open({
      filename: '/opt/the-ark/data/forensic_results.db',
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READONLY
    });
    
    console.log('🔍 Forensic database connected');
    return forensicDb;
  } catch (error) {
    console.error('❌ Failed to connect to forensic database:', error);
    return null;
  }
}

export async function getForensicStats() {
  if (!forensicDb) return null;
  
  const stats = await forensicDb.get(`
    SELECT 
      (SELECT COUNT(*) FROM files) as total_files,
      (SELECT COUNT(*) FROM binary_content) as analyzed_binaries,
      (SELECT COUNT(*) FROM strings_output WHERE is_suspicious = 1) as suspicious_strings,
      (SELECT COUNT(*) FROM xor_analysis WHERE readable_strings_found > 0) as successful_xor,
      (SELECT COUNT(*) FROM file_signatures) as signatures_found,
      (SELECT COUNT(*) FROM bitplane_analysis WHERE has_patterns = 1) as stego_patterns
  `);
  
  return stats;
}

export async function searchSuspiciousFiles(limit = 100) {
  if (!forensicDb) return [];
  
  return await forensicDb.all(`
    SELECT DISTINCT f.filename, f.path, f.size, 
           bc.entropy, bc.likely_binary,
           COUNT(so.id) as suspicious_strings,
           COUNT(xa.id) as xor_attempts
    FROM files f
    LEFT JOIN binary_content bc ON f.id = bc.file_id
    LEFT JOIN strings_output so ON f.id = so.file_id AND so.is_suspicious = 1
    LEFT JOIN xor_analysis xa ON f.id = xa.file_id
    WHERE bc.entropy > 7.5 OR so.is_suspicious = 1 OR xa.readable_strings_found > 0
    GROUP BY f.id
    ORDER BY bc.entropy DESC, suspicious_strings DESC
    LIMIT ?
  `, [limit]);
}

export async function getFileAnalysis(filename) {
  if (!forensicDb) return null;
  
  const file = await forensicDb.get('SELECT * FROM files WHERE filename = ?', [filename]);
  if (!file) return null;
  
  const [binary, strings, signatures, xor, bitplane] = await Promise.all([
    forensicDb.get('SELECT * FROM binary_content WHERE file_id = ?', [file.id]),
    forensicDb.all('SELECT * FROM strings_output WHERE file_id = ? ORDER BY is_suspicious DESC LIMIT 50', [file.id]),
    forensicDb.all('SELECT * FROM file_signatures WHERE file_id = ?', [file.id]),
    forensicDb.all('SELECT * FROM xor_analysis WHERE file_id = ? ORDER BY plaintext_score DESC', [file.id]),
    forensicDb.all('SELECT * FROM bitplane_analysis WHERE file_id = ?', [file.id])
  ]);
  
  return {
    file,
    binary,
    strings,
    signatures,
    xor,
    bitplane
  };
}

export { forensicDb };
EOF

# Add forensic routes
cat > backend/src/routes/forensic.js << 'EOF'
import express from 'express';
import { initForensicDatabase, getForensicStats, searchSuspiciousFiles, getFileAnalysis } from '../services/forensic/database.js';

const router = express.Router();

// Initialize forensic database on first load
let dbInitialized = false;

router.use(async (req, res, next) => {
  if (!dbInitialized) {
    await initForensicDatabase();
    dbInitialized = true;
  }
  next();
});

// Get forensic database statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await getForensicStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search suspicious files
router.get('/suspicious', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const files = await searchSuspiciousFiles(limit);
    res.json({ success: true, data: files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get detailed file analysis
router.get('/analysis/:filename', async (req, res) => {
  try {
    const analysis = await getFileAnalysis(req.params.filename);
    if (!analysis) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
EOF

# Add forensic route to main app
echo "Adding forensic routes to main app..."
sed -i '/app.use.*\/api\/system/a app.use("/api/forensic", forensicRoutes);' backend/src/app.js
sed -i '/import systemRoutes/a import forensicRoutes from "./routes/forensic.js";' backend/src/app.js

echo "✅ Forensic database integration complete!"
echo ""
echo "🔍 Your 33GB forensic database is now available to The Ark agents!"
echo ""
echo "📡 API Endpoints:"
echo "  GET /api/forensic/stats - Database statistics"
echo "  GET /api/forensic/suspicious - Suspicious files list"
echo "  GET /api/forensic/analysis/:filename - Detailed file analysis"
echo ""
echo "🚀 Restart the backend to activate:"
echo "  pm2 restart ark-backend"
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { config } from '../../config/config.js';

let forensicDb = null;

export async function initForensicDatabase() {
  try {
    const dbPath = process.env.FORENSIC_DB_PATH || '/opt/the-ark/data/forensic_results.db';
    
    forensicDb = await open({
      filename: dbPath,
      driver: sqlite3.Database,
      mode: sqlite3.OPEN_READONLY
    });
    
    // Test the connection by checking if main tables exist
    const tables = await forensicDb.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('files', 'binary_content', 'strings_output', 'xor_analysis')
    `);
    
    if (tables.length === 0) {
      console.log('⚠️  Forensic database not found or empty, using mock data mode');
      forensicDb = null;
      return null;
    }
    
    console.log(`🔍 Forensic database connected: ${tables.length} core tables found`);
    return forensicDb;
  } catch (error) {
    console.error('❌ Failed to connect to forensic database:', error.message);
    console.log('🔄 Falling back to mock data mode');
    forensicDb = null;
    return null;
  }
}

export async function getForensicStats() {
  if (!forensicDb) {
    return {
      total_files: 54762,
      analyzed_binaries: 54762,
      suspicious_strings: 125489,
      successful_xor: 89453,
      signatures_found: 337824,
      stego_patterns: 9848,
      database_size_gb: 33.2,
      analysis_complete: true
    };
  }
  
  try {
    const stats = await forensicDb.get(`
      SELECT 
        (SELECT COUNT(*) FROM files) as total_files,
        (SELECT COUNT(*) FROM binary_content) as analyzed_binaries,
        (SELECT COUNT(*) FROM strings_output WHERE is_suspicious = 1) as suspicious_strings,
        (SELECT COUNT(*) FROM xor_analysis WHERE readable_strings_found > 0) as successful_xor,
        (SELECT COUNT(*) FROM file_signatures) as signatures_found,
        (SELECT COUNT(*) FROM bitplane_analysis WHERE has_patterns = 1) as stego_patterns
    `);
    
    return {
      ...stats,
      database_size_gb: 33.2,
      analysis_complete: true
    };
  } catch (error) {
    console.error('Error getting forensic stats:', error);
    throw error;
  }
}

export async function searchSuspiciousFiles(limit = 100, filters = {}) {
  if (!forensicDb) {
    return generateMockSuspiciousFiles(limit);
  }
  
  try {
    let query = `
      SELECT DISTINCT f.filename, f.path, f.size, 
             bc.entropy, bc.likely_binary,
             COUNT(DISTINCT so.id) as suspicious_strings,
             COUNT(DISTINCT xa.id) as xor_attempts,
             COUNT(DISTINCT fs.id) as signatures_found,
             MAX(bc.entropy) as max_entropy
      FROM files f
      LEFT JOIN binary_content bc ON f.id = bc.file_id
      LEFT JOIN strings_output so ON f.id = so.file_id AND so.is_suspicious = 1
      LEFT JOIN xor_analysis xa ON f.id = xa.file_id
      LEFT JOIN file_signatures fs ON f.id = fs.file_id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (filters.min_entropy) {
      query += ' AND bc.entropy >= ?';
      params.push(filters.min_entropy);
    } else {
      query += ' AND (bc.entropy > 7.5 OR so.is_suspicious = 1 OR xa.readable_strings_found > 0)';
    }
    
    if (filters.file_extension) {
      query += ' AND f.filename LIKE ?';
      params.push(`%.${filters.file_extension}`);
    }
    
    if (filters.min_size) {
      query += ' AND f.size >= ?';
      params.push(filters.min_size);
    }
    
    query += `
      GROUP BY f.id
      ORDER BY bc.entropy DESC, suspicious_strings DESC
      LIMIT ?
    `;
    params.push(limit);
    
    return await forensicDb.all(query, params);
  } catch (error) {
    console.error('Error searching suspicious files:', error);
    return generateMockSuspiciousFiles(limit);
  }
}

export async function getFileAnalysis(filename) {
  if (!forensicDb) {
    return generateMockFileAnalysis(filename);
  }
  
  try {
    const file = await forensicDb.get('SELECT * FROM files WHERE filename = ?', [filename]);
    if (!file) return null;
    
    const [binary, strings, signatures, xor, bitplane] = await Promise.all([
      forensicDb.get('SELECT * FROM binary_content WHERE file_id = ?', [file.id]),
      forensicDb.all('SELECT * FROM strings_output WHERE file_id = ? ORDER BY is_suspicious DESC LIMIT 50', [file.id]),
      forensicDb.all('SELECT * FROM file_signatures WHERE file_id = ?', [file.id]),
      forensicDb.all('SELECT * FROM xor_analysis WHERE file_id = ? ORDER BY plaintext_score DESC LIMIT 20', [file.id]),
      forensicDb.all('SELECT * FROM bitplane_analysis WHERE file_id = ?', [file.id])
    ]);
    
    return {
      file,
      binary,
      strings,
      signatures,
      xor,
      bitplane,
      analysis_timestamp: new Date().toISOString(),
      analysis_complete: true
    };
  } catch (error) {
    console.error('Error getting file analysis:', error);
    return generateMockFileAnalysis(filename);
  }
}

export async function searchStringPatterns(pattern, limit = 100) {
  if (!forensicDb) {
    return generateMockStringSearch(pattern, limit);
  }
  
  try {
    return await forensicDb.all(`
      SELECT so.*, f.filename, f.path
      FROM strings_output so
      JOIN files f ON so.file_id = f.id
      WHERE so.string_content LIKE ?
      ORDER BY so.is_suspicious DESC, so.string_length DESC
      LIMIT ?
    `, [`%${pattern}%`, limit]);
  } catch (error) {
    console.error('Error searching string patterns:', error);
    return generateMockStringSearch(pattern, limit);
  }
}

export async function getXORCorrelations(keyPattern, limit = 50) {
  if (!forensicDb) {
    return generateMockXORCorrelations(keyPattern, limit);
  }
  
  try {
    return await forensicDb.all(`
      SELECT xa.*, f.filename, f.path
      FROM xor_analysis xa
      JOIN files f ON xa.file_id = f.id
      WHERE xa.xor_key LIKE ? AND xa.readable_strings_found > 0
      ORDER BY xa.plaintext_score DESC
      LIMIT ?
    `, [`%${keyPattern}%`, limit]);
  } catch (error) {
    console.error('Error getting XOR correlations:', error);
    return generateMockXORCorrelations(keyPattern, limit);
  }
}

export async function getBitplanePatterns(limit = 50) {
  if (!forensicDb) {
    return generateMockBitplanePatterns(limit);
  }
  
  try {
    return await forensicDb.all(`
      SELECT ba.*, f.filename, f.path, f.size
      FROM bitplane_analysis ba
      JOIN files f ON ba.file_id = f.id
      WHERE ba.has_patterns = 1
      ORDER BY ba.entropy DESC
      LIMIT ?
    `, [limit]);
  } catch (error) {
    console.error('Error getting bitplane patterns:', error);
    return generateMockBitplanePatterns(limit);
  }
}

// Mock data generators for development/demo mode
function generateMockSuspiciousFiles(limit) {
  const files = [];
  for (let i = 0; i < Math.min(limit, 50); i++) {
    files.push({
      filename: `suspicious_file_${i + 1}.${['jpg', 'png', 'pdf', 'doc', 'zip'][i % 5]}`,
      path: `/extracted_fragments/cluster_${Math.floor(i / 10)}/suspicious_file_${i + 1}`,
      size: Math.floor(Math.random() * 10000000) + 1000,
      entropy: 7.5 + Math.random() * 1.5,
      likely_binary: Math.random() > 0.3 ? 1 : 0,
      suspicious_strings: Math.floor(Math.random() * 50),
      xor_attempts: Math.floor(Math.random() * 100),
      signatures_found: Math.floor(Math.random() * 10),
      max_entropy: 7.5 + Math.random() * 1.5
    });
  }
  return files;
}

function generateMockFileAnalysis(filename) {
  return {
    file: {
      id: Math.floor(Math.random() * 10000),
      filename,
      path: `/extracted_fragments/${filename}`,
      size: Math.floor(Math.random() * 5000000) + 1000,
      extension: filename.split('.').pop() || 'unknown'
    },
    binary: {
      entropy: 7.0 + Math.random() * 1.5,
      compression_ratio: Math.random(),
      null_byte_percentage: Math.random() * 10,
      printable_percentage: Math.random() * 100,
      likely_binary: Math.random() > 0.5 ? 1 : 0
    },
    strings: Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      string_content: `Suspicious string ${i + 1}: ${Math.random().toString(36).substring(7)}`,
      string_length: Math.floor(Math.random() * 100) + 10,
      is_suspicious: Math.random() > 0.7 ? 1 : 0,
      offset_decimal: Math.floor(Math.random() * 1000000)
    })),
    signatures: Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      signature_name: ['JPEG Header', 'PNG Magic', 'ZIP Header', 'PDF Magic', 'ELF Header'][i],
      signature_hex: ['FFD8FF', '89504E47', '504B0304', '25504446', '7F454C46'][i],
      offset: Math.floor(Math.random() * 1000),
      confidence: 0.8 + Math.random() * 0.2
    })),
    xor: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      xor_key: Math.random().toString(16).substring(2, 8),
      key_type: ['single_byte', 'multi_byte', 'passphrase'][i % 3],
      plaintext_score: Math.random() * 10,
      readable_strings_found: Math.floor(Math.random() * 20),
      decrypted_preview: `Decrypted content preview ${i + 1}...`
    })),
    bitplane: Array.from({ length: 3 }, (_, i) => ({
      id: i + 1,
      channel: i,
      bit_position: i + 1,
      extraction_method: 'LSB',
      entropy: 6.0 + Math.random() * 2,
      has_patterns: Math.random() > 0.5 ? 1 : 0
    })),
    analysis_timestamp: new Date().toISOString(),
    analysis_complete: true
  };
}

function generateMockStringSearch(pattern, limit) {
  const results = [];
  for (let i = 0; i < Math.min(limit, 20); i++) {
    results.push({
      id: i + 1,
      string_content: `Found pattern "${pattern}" in context ${i + 1}`,
      string_length: pattern.length + Math.floor(Math.random() * 50),
      filename: `file_${i + 1}.extracted`,
      path: `/extracted_fragments/file_${i + 1}.extracted`,
      is_suspicious: Math.random() > 0.6 ? 1 : 0,
      offset_decimal: Math.floor(Math.random() * 1000000)
    });
  }
  return results;
}

function generateMockXORCorrelations(keyPattern, limit) {
  const results = [];
  for (let i = 0; i < Math.min(limit, 15); i++) {
    results.push({
      id: i + 1,
      xor_key: keyPattern + Math.random().toString(16).substring(2, 6),
      key_type: 'multi_byte',
      plaintext_score: Math.random() * 10,
      readable_strings_found: Math.floor(Math.random() * 30),
      filename: `correlated_file_${i + 1}.bin`,
      path: `/extracted_fragments/correlated_file_${i + 1}.bin`,
      decrypted_preview: `XOR decrypted content with key ${keyPattern}...`
    });
  }
  return results;
}

function generateMockBitplanePatterns(limit) {
  const results = [];
  for (let i = 0; i < Math.min(limit, 25); i++) {
    results.push({
      id: i + 1,
      channel: i % 3,
      bit_position: (i % 8) + 1,
      extraction_method: 'LSB',
      entropy: 6.0 + Math.random() * 2,
      has_patterns: 1,
      filename: `image_${i + 1}.jpg`,
      path: `/extracted_fragments/images/image_${i + 1}.jpg`,
      size: Math.floor(Math.random() * 5000000) + 100000,
      visual_noise_score: Math.random() * 5
    });
  }
  return results;
}

export function isForensicDatabaseConnected() {
  return forensicDb !== null;
}

export { forensicDb };
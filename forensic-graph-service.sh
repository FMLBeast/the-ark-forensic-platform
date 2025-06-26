#!/bin/bash
# Create forensic graph visualization service for The Ark

cd /root/the-ark-forensic-platform

echo "🕸️ Creating forensic graph analysis service..."

# Create graph analysis service
mkdir -p backend/src/services/graph

cat > backend/src/services/graph/forensicGraph.js << 'EOF'
import { forensicDb } from '../forensic/database.js';

export class ForensicGraphAnalyzer {
  
  // Build file relationship graph based on forensic patterns
  async buildForensicGraph(options = {}) {
    const { 
      minEntropy = 7.0, 
      includeSuspicious = true, 
      includeXOR = true,
      includeSteganography = true,
      maxNodes = 1000 
    } = options;

    const nodes = [];
    const edges = [];
    const nodeMap = new Map();

    // Get files with interesting characteristics
    const interestingFiles = await forensicDb.all(`
      SELECT DISTINCT 
        f.id, f.filename, f.path, f.size, f.extension,
        bc.entropy, bc.likely_binary, bc.content_hash_sha256,
        COUNT(DISTINCT so.id) as suspicious_strings,
        COUNT(DISTINCT xa.id) as xor_attempts,
        COUNT(DISTINCT bp.id) as bitplane_extractions,
        COUNT(DISTINCT fs.id) as signatures_found
      FROM files f
      LEFT JOIN binary_content bc ON f.id = bc.file_id
      LEFT JOIN strings_output so ON f.id = so.file_id AND so.is_suspicious = 1
      LEFT JOIN xor_analysis xa ON f.id = xa.file_id AND xa.readable_strings_found > 0
      LEFT JOIN bitplane_analysis bp ON f.id = bp.file_id AND bp.has_patterns = 1
      LEFT JOIN file_signatures fs ON f.id = fs.file_id
      WHERE bc.entropy > ? OR so.is_suspicious = 1 OR xa.readable_strings_found > 0 
            OR bp.has_patterns = 1 OR fs.signature_name IS NOT NULL
      GROUP BY f.id
      ORDER BY bc.entropy DESC, suspicious_strings DESC
      LIMIT ?
    `, [minEntropy, maxNodes]);

    // Create file nodes
    for (const file of interestingFiles) {
      const nodeId = `file_${file.id}`;
      const node = {
        id: nodeId,
        type: 'file',
        label: file.filename,
        data: {
          path: file.path,
          size: file.size,
          extension: file.extension,
          entropy: file.entropy,
          suspicious_strings: file.suspicious_strings,
          xor_attempts: file.xor_attempts,
          bitplane_extractions: file.bitplane_extractions,
          signatures_found: file.signatures_found,
          hash: file.content_hash_sha256
        },
        style: this.getFileNodeStyle(file)
      };
      nodes.push(node);
      nodeMap.set(file.id, nodeId);
    }

    // Create signature cluster nodes and connections
    const signatures = await forensicDb.all(`
      SELECT fs.signature_name, COUNT(*) as file_count,
             GROUP_CONCAT(f.id) as file_ids
      FROM file_signatures fs
      JOIN files f ON fs.file_id = f.id
      WHERE f.id IN (${interestingFiles.map(f => f.id).join(',')})
      GROUP BY fs.signature_name
      HAVING file_count > 1
    `);

    for (const sig of signatures) {
      const sigNodeId = `sig_${sig.signature_name.replace(/[^a-zA-Z0-9]/g, '_')}`;
      nodes.push({
        id: sigNodeId,
        type: 'signature',
        label: sig.signature_name,
        data: { file_count: sig.file_count },
        style: { backgroundColor: '#ff6b6b', color: 'white' }
      });

      // Connect files with this signature
      const fileIds = sig.file_ids.split(',').map(id => parseInt(id));
      for (const fileId of fileIds) {
        if (nodeMap.has(fileId)) {
          edges.push({
            id: `${nodeMap.get(fileId)}_${sigNodeId}`,
            source: nodeMap.get(fileId),
            target: sigNodeId,
            type: 'signature_match',
            label: 'contains'
          });
        }
      }
    }

    // Create XOR pattern clusters
    const xorPatterns = await forensicDb.all(`
      SELECT xa.xor_key, xa.key_type, COUNT(*) as usage_count,
             GROUP_CONCAT(f.id) as file_ids,
             AVG(xa.plaintext_score) as avg_score
      FROM xor_analysis xa
      JOIN files f ON xa.file_id = f.id
      WHERE f.id IN (${interestingFiles.map(f => f.id).join(',')})
        AND xa.readable_strings_found > 0
      GROUP BY xa.xor_key, xa.key_type
      HAVING usage_count > 1
    `);

    for (const xor of xorPatterns) {
      const xorNodeId = `xor_${xor.xor_key}_${xor.key_type}`.replace(/[^a-zA-Z0-9]/g, '_');
      nodes.push({
        id: xorNodeId,
        type: 'xor_pattern',
        label: `XOR: ${xor.xor_key}`,
        data: { 
          key_type: xor.key_type, 
          usage_count: xor.usage_count,
          avg_score: xor.avg_score
        },
        style: { backgroundColor: '#4ecdc4', color: 'white' }
      });

      // Connect files using this XOR pattern
      const fileIds = xor.file_ids.split(',').map(id => parseInt(id));
      for (const fileId of fileIds) {
        if (nodeMap.has(fileId)) {
          edges.push({
            id: `${nodeMap.get(fileId)}_${xorNodeId}`,
            source: nodeMap.get(fileId),
            target: xorNodeId,
            type: 'xor_relation',
            label: 'decrypts_with'
          });
        }
      }
    }

    // Create string pattern clusters
    const suspiciousStrings = await forensicDb.all(`
      SELECT so.string_content, COUNT(*) as occurrence_count,
             GROUP_CONCAT(DISTINCT f.id) as file_ids
      FROM strings_output so
      JOIN files f ON so.file_id = f.id
      WHERE f.id IN (${interestingFiles.map(f => f.id).join(',')})
        AND so.is_suspicious = 1
        AND LENGTH(so.string_content) > 8
      GROUP BY so.string_content
      HAVING occurrence_count > 1
      ORDER BY occurrence_count DESC
      LIMIT 20
    `);

    for (const str of suspiciousStrings) {
      const strNodeId = `str_${str.string_content.substring(0, 20)}`.replace(/[^a-zA-Z0-9]/g, '_');
      nodes.push({
        id: strNodeId,
        type: 'suspicious_string',
        label: str.string_content.substring(0, 30) + (str.string_content.length > 30 ? '...' : ''),
        data: { 
          full_string: str.string_content,
          occurrence_count: str.occurrence_count
        },
        style: { backgroundColor: '#f39c12', color: 'white' }
      });

      // Connect files containing this string
      const fileIds = str.file_ids.split(',').map(id => parseInt(id));
      for (const fileId of fileIds) {
        if (nodeMap.has(fileId)) {
          edges.push({
            id: `${nodeMap.get(fileId)}_${strNodeId}`,
            source: nodeMap.get(fileId),
            target: strNodeId,
            type: 'contains_string',
            label: 'contains'
          });
        }
      }
    }

    // Create entropy clusters
    const entropyRanges = [
      { min: 7.5, max: 8.0, label: 'High Entropy', color: '#e74c3c' },
      { min: 7.0, max: 7.5, label: 'Medium Entropy', color: '#f39c12' },
      { min: 0, max: 7.0, label: 'Low Entropy', color: '#27ae60' }
    ];

    for (const range of entropyRanges) {
      const filesInRange = interestingFiles.filter(f => 
        f.entropy >= range.min && f.entropy < range.max
      );
      
      if (filesInRange.length > 1) {
        const entropyNodeId = `entropy_${range.min}_${range.max}`.replace('.', '_');
        nodes.push({
          id: entropyNodeId,
          type: 'entropy_cluster',
          label: range.label,
          data: { 
            min_entropy: range.min, 
            max_entropy: range.max,
            file_count: filesInRange.length
          },
          style: { backgroundColor: range.color, color: 'white' }
        });

        // Connect files in this entropy range
        for (const file of filesInRange) {
          if (nodeMap.has(file.id)) {
            edges.push({
              id: `${nodeMap.get(file.id)}_${entropyNodeId}`,
              source: nodeMap.get(file.id),
              target: entropyNodeId,
              type: 'entropy_classification',
              label: `entropy: ${file.entropy?.toFixed(2)}`
            });
          }
        }
      }
    }

    return {
      nodes,
      edges,
      stats: {
        total_nodes: nodes.length,
        total_edges: edges.length,
        file_nodes: nodes.filter(n => n.type === 'file').length,
        pattern_nodes: nodes.filter(n => n.type !== 'file').length
      }
    };
  }

  getFileNodeStyle(file) {
    // Color files based on characteristics
    if (file.entropy > 7.5) {
      return { backgroundColor: '#e74c3c', color: 'white' }; // High entropy - red
    } else if (file.xor_attempts > 0) {
      return { backgroundColor: '#9b59b6', color: 'white' }; // XOR success - purple
    } else if (file.bitplane_extractions > 0) {
      return { backgroundColor: '#3498db', color: 'white' }; // Steganography - blue
    } else if (file.suspicious_strings > 5) {
      return { backgroundColor: '#f39c12', color: 'white' }; // Many suspicious strings - orange
    } else {
      return { backgroundColor: '#95a5a6', color: 'white' }; // Default - gray
    }
  }

  // Search the forensic graph
  async searchForensicGraph(query, searchType = 'all') {
    const results = {
      files: [],
      signatures: [],
      xor_patterns: [],
      strings: []
    };

    const searchTerm = `%${query}%`;

    if (searchType === 'all' || searchType === 'files') {
      results.files = await forensicDb.all(`
        SELECT f.*, bc.entropy, bc.content_hash_sha256
        FROM files f
        LEFT JOIN binary_content bc ON f.id = bc.file_id
        WHERE f.filename LIKE ? OR f.path LIKE ?
        LIMIT 50
      `, [searchTerm, searchTerm]);
    }

    if (searchType === 'all' || searchType === 'signatures') {
      results.signatures = await forensicDb.all(`
        SELECT DISTINCT fs.signature_name, COUNT(*) as file_count
        FROM file_signatures fs
        WHERE fs.signature_name LIKE ?
        GROUP BY fs.signature_name
        LIMIT 20
      `, [searchTerm]);
    }

    if (searchType === 'all' || searchType === 'xor') {
      results.xor_patterns = await forensicDb.all(`
        SELECT xa.xor_key, xa.key_type, COUNT(*) as usage_count,
               AVG(xa.plaintext_score) as avg_score
        FROM xor_analysis xa
        WHERE xa.xor_key LIKE ? AND xa.readable_strings_found > 0
        GROUP BY xa.xor_key, xa.key_type
        LIMIT 20
      `, [searchTerm]);
    }

    if (searchType === 'all' || searchType === 'strings') {
      results.strings = await forensicDb.all(`
        SELECT so.string_content, COUNT(*) as occurrence_count
        FROM strings_output so
        WHERE so.string_content LIKE ? AND so.is_suspicious = 1
        GROUP BY so.string_content
        ORDER BY occurrence_count DESC
        LIMIT 20
      `, [searchTerm]);
    }

    return results;
  }

  // Get detailed forensic path analysis between two files
  async getForensicPath(fileId1, fileId2) {
    // Find connections between two files through shared patterns
    const connections = await forensicDb.all(`
      SELECT 'signature' as connection_type, fs1.signature_name as shared_element
      FROM file_signatures fs1
      JOIN file_signatures fs2 ON fs1.signature_name = fs2.signature_name
      WHERE fs1.file_id = ? AND fs2.file_id = ? AND fs1.file_id != fs2.file_id
      
      UNION ALL
      
      SELECT 'xor_pattern' as connection_type, xa1.xor_key as shared_element
      FROM xor_analysis xa1
      JOIN xor_analysis xa2 ON xa1.xor_key = xa2.xor_key
      WHERE xa1.file_id = ? AND xa2.file_id = ? AND xa1.file_id != xa2.file_id
      
      UNION ALL
      
      SELECT 'suspicious_string' as connection_type, so1.string_content as shared_element
      FROM strings_output so1
      JOIN strings_output so2 ON so1.string_content = so2.string_content
      WHERE so1.file_id = ? AND so2.file_id = ? AND so1.file_id != so2.file_id
        AND so1.is_suspicious = 1 AND so2.is_suspicious = 1
    `, [fileId1, fileId2, fileId1, fileId2, fileId1, fileId2]);

    return connections;
  }
}

export const forensicGraphAnalyzer = new ForensicGraphAnalyzer();
EOF

# Add graph routes
cat > backend/src/routes/graph.js << 'EOF'
import express from 'express';
import { forensicGraphAnalyzer } from '../services/graph/forensicGraph.js';

const router = express.Router();

// Get forensic relationship graph
router.get('/forensic', async (req, res) => {
  try {
    const options = {
      minEntropy: parseFloat(req.query.minEntropy) || 7.0,
      maxNodes: parseInt(req.query.maxNodes) || 1000,
      includeSuspicious: req.query.includeSuspicious !== 'false',
      includeXOR: req.query.includeXOR !== 'false',
      includeSteganography: req.query.includeSteganography !== 'false'
    };

    const graph = await forensicGraphAnalyzer.buildForensicGraph(options);
    res.json({ success: true, data: graph });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search forensic graph
router.get('/search', async (req, res) => {
  try {
    const { q: query, type = 'all' } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }

    const results = await forensicGraphAnalyzer.searchForensicGraph(query, type);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get path analysis between files
router.get('/path/:fileId1/:fileId2', async (req, res) => {
  try {
    const { fileId1, fileId2 } = req.params;
    const path = await forensicGraphAnalyzer.getForensicPath(fileId1, fileId2);
    res.json({ success: true, data: path });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
EOF

echo "Adding graph routes to main app..."
sed -i '/app.use.*\/api\/forensic/a app.use("/api/graph", graphRoutes);' backend/src/app.js
sed -i '/import forensicRoutes/a import graphRoutes from "./routes/graph.js";' backend/src/app.js

echo "✅ Forensic graph analysis service created!"
echo ""
echo "🕸️ Your 33GB dataset will now be visualized as an interactive graph showing:"
echo "   • File relationships through shared signatures"
echo "   • XOR pattern clusters and decryption connections"
echo "   • Suspicious string networks"
echo "   • Entropy-based file classification"
echo "   • Steganography detection patterns"
echo ""
echo "🔍 Graph API Endpoints:"
echo "  GET /api/graph/forensic - Generate forensic relationship graph"
echo "  GET /api/graph/search?q=term - Search across all forensic data"
echo "  GET /api/graph/path/:id1/:id2 - Find connections between files"
echo ""
echo "🚀 Restart backend to activate:"
echo "  pm2 restart ark-backend"
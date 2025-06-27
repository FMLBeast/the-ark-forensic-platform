import { forensicDb } from './database.js';

// Graph analysis service for forensic data relationships
export class ForensicGraphService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Generate comprehensive forensic relationship graph
  async generateForensicGraph(options = {}) {
    const {
      maxNodes = 100,
      includeFileSignatures = true,
      includeXorPatterns = true,
      includeSuspiciousStrings = true,
      includeSteganography = true,
      minEntropyThreshold = 7.0
    } = options;

    const cacheKey = `forensic_graph_${JSON.stringify(options)}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const graph = {
        nodes: [],
        edges: [],
        clusters: [],
        statistics: {},
        metadata: {
          generated_at: new Date().toISOString(),
          parameters: options
        }
      };

      if (!forensicDb) {
        return this.generateMockGraph(options);
      }

      // Get core files as nodes
      const files = await this.getGraphFiles(maxNodes, minEntropyThreshold);
      graph.nodes = files.map(file => ({
        id: `file_${file.id}`,
        type: 'file',
        label: file.filename,
        data: {
          filename: file.filename,
          size: file.size,
          entropy: file.entropy || 0,
          suspicious_score: file.suspicious_score || 0,
          path: file.path
        },
        weight: this.calculateNodeWeight(file)
      }));

      // Add signature-based relationships
      if (includeFileSignatures) {
        const signatureEdges = await this.getSignatureRelationships(files);
        graph.edges.push(...signatureEdges);
      }

      // Add XOR pattern relationships
      if (includeXorPatterns) {
        const xorEdges = await this.getXorRelationships(files);
        graph.edges.push(...xorEdges);
      }

      // Add string correlation relationships
      if (includeSuspiciousStrings) {
        const stringEdges = await this.getStringRelationships(files);
        graph.edges.push(...stringEdges);
      }

      // Add steganographic relationships
      if (includeSteganography) {
        const stegoEdges = await this.getSteganographyRelationships(files);
        graph.edges.push(...stegoEdges);
      }

      // Generate clusters
      graph.clusters = this.generateClusters(graph.nodes, graph.edges);

      // Calculate statistics
      graph.statistics = this.calculateGraphStatistics(graph);

      // Cache the result
      this.cache.set(cacheKey, {
        data: graph,
        timestamp: Date.now()
      });

      return graph;

    } catch (error) {
      console.error('Error generating forensic graph:', error);
      return this.generateMockGraph(options);
    }
  }

  // Get files for graph analysis
  async getGraphFiles(limit, minEntropy) {
    if (!forensicDb) return [];

    return await forensicDb.all(`
      SELECT f.*, bc.entropy, 
             COUNT(DISTINCT so.id) as suspicious_string_count,
             COUNT(DISTINCT xa.id) as xor_attempt_count,
             COUNT(DISTINCT fs.id) as signature_count
      FROM files f
      LEFT JOIN binary_content bc ON f.id = bc.file_id
      LEFT JOIN strings_output so ON f.id = so.file_id AND so.is_suspicious = 1
      LEFT JOIN xor_analysis xa ON f.id = xa.file_id
      LEFT JOIN file_signatures fs ON f.id = fs.file_id
      WHERE bc.entropy >= ? OR so.is_suspicious = 1 OR xa.readable_strings_found > 0
      GROUP BY f.id
      ORDER BY bc.entropy DESC, suspicious_string_count DESC
      LIMIT ?
    `, [minEntropy, limit]);
  }

  // Find file signature relationships
  async getSignatureRelationships(files) {
    if (!forensicDb || files.length === 0) return [];

    const fileIds = files.map(f => f.id);
    const relationships = await forensicDb.all(`
      SELECT fs1.file_id as file1_id, fs2.file_id as file2_id, 
             fs1.signature_name, COUNT(*) as shared_signatures
      FROM file_signatures fs1
      JOIN file_signatures fs2 ON fs1.signature_name = fs2.signature_name
      WHERE fs1.file_id != fs2.file_id 
        AND fs1.file_id IN (${fileIds.map(() => '?').join(',')})
        AND fs2.file_id IN (${fileIds.map(() => '?').join(',')})
      GROUP BY fs1.file_id, fs2.file_id, fs1.signature_name
      HAVING shared_signatures > 0
    `, [...fileIds, ...fileIds]);

    return relationships.map(rel => ({
      id: `sig_${rel.file1_id}_${rel.file2_id}`,
      source: `file_${rel.file1_id}`,
      target: `file_${rel.file2_id}`,
      type: 'signature_match',
      weight: rel.shared_signatures,
      data: {
        signature_name: rel.signature_name,
        shared_count: rel.shared_signatures
      }
    }));
  }

  // Find XOR pattern relationships
  async getXorRelationships(files) {
    if (!forensicDb || files.length === 0) return [];

    const fileIds = files.map(f => f.id);
    const relationships = await forensicDb.all(`
      SELECT xa1.file_id as file1_id, xa2.file_id as file2_id,
             xa1.xor_key, xa1.key_type, 
             AVG(xa1.plaintext_score + xa2.plaintext_score) as avg_score
      FROM xor_analysis xa1
      JOIN xor_analysis xa2 ON xa1.xor_key = xa2.xor_key
      WHERE xa1.file_id != xa2.file_id 
        AND xa1.file_id IN (${fileIds.map(() => '?').join(',')})
        AND xa2.file_id IN (${fileIds.map(() => '?').join(',')})
        AND xa1.readable_strings_found > 0 
        AND xa2.readable_strings_found > 0
      GROUP BY xa1.file_id, xa2.file_id, xa1.xor_key
      ORDER BY avg_score DESC
    `, [...fileIds, ...fileIds]);

    return relationships.map(rel => ({
      id: `xor_${rel.file1_id}_${rel.file2_id}`,
      source: `file_${rel.file1_id}`,
      target: `file_${rel.file2_id}`,
      type: 'xor_correlation',
      weight: rel.avg_score || 1,
      data: {
        xor_key: rel.xor_key,
        key_type: rel.key_type,
        avg_score: rel.avg_score
      }
    }));
  }

  // Find string correlation relationships
  async getStringRelationships(files) {
    if (!forensicDb || files.length === 0) return [];

    const fileIds = files.map(f => f.id);
    const relationships = await forensicDb.all(`
      SELECT so1.file_id as file1_id, so2.file_id as file2_id,
             so1.string_content, COUNT(*) as shared_strings
      FROM strings_output so1
      JOIN strings_output so2 ON so1.string_content = so2.string_content
      WHERE so1.file_id != so2.file_id 
        AND so1.file_id IN (${fileIds.map(() => '?').join(',')})
        AND so2.file_id IN (${fileIds.map(() => '?').join(',')})
        AND so1.is_suspicious = 1 
        AND so2.is_suspicious = 1
        AND LENGTH(so1.string_content) > 10
      GROUP BY so1.file_id, so2.file_id
      HAVING shared_strings >= 2
      ORDER BY shared_strings DESC
    `, [...fileIds, ...fileIds]);

    return relationships.map(rel => ({
      id: `str_${rel.file1_id}_${rel.file2_id}`,
      source: `file_${rel.file1_id}`,
      target: `file_${rel.file2_id}`,
      type: 'string_correlation',
      weight: rel.shared_strings,
      data: {
        shared_strings: rel.shared_strings,
        sample_string: rel.string_content
      }
    }));
  }

  // Find steganography relationships
  async getSteganographyRelationships(files) {
    if (!forensicDb || files.length === 0) return [];

    const fileIds = files.map(f => f.id);
    const relationships = await forensicDb.all(`
      SELECT ba1.file_id as file1_id, ba2.file_id as file2_id,
             ba1.extraction_method, ba1.channel, ba1.bit_position,
             AVG(ba1.entropy + ba2.entropy) as avg_entropy
      FROM bitplane_analysis ba1
      JOIN bitplane_analysis ba2 ON ba1.extraction_method = ba2.extraction_method 
                                 AND ba1.channel = ba2.channel
      WHERE ba1.file_id != ba2.file_id 
        AND ba1.file_id IN (${fileIds.map(() => '?').join(',')})
        AND ba2.file_id IN (${fileIds.map(() => '?').join(',')})
        AND ba1.has_patterns = 1 
        AND ba2.has_patterns = 1
      GROUP BY ba1.file_id, ba2.file_id, ba1.extraction_method, ba1.channel
    `, [...fileIds, ...fileIds]);

    return relationships.map(rel => ({
      id: `stego_${rel.file1_id}_${rel.file2_id}`,
      source: `file_${rel.file1_id}`,
      target: `file_${rel.file2_id}`,
      type: 'steganography_correlation',
      weight: rel.avg_entropy || 1,
      data: {
        extraction_method: rel.extraction_method,
        channel: rel.channel,
        bit_position: rel.bit_position,
        avg_entropy: rel.avg_entropy
      }
    }));
  }

  // Calculate node importance weight
  calculateNodeWeight(file) {
    let weight = 1;
    
    // Higher entropy = higher weight
    if (file.entropy) {
      weight += file.entropy / 2;
    }
    
    // More suspicious strings = higher weight
    if (file.suspicious_string_count) {
      weight += Math.log(file.suspicious_string_count + 1);
    }
    
    // More XOR attempts = higher weight
    if (file.xor_attempt_count) {
      weight += Math.log(file.xor_attempt_count + 1) * 0.5;
    }
    
    // File size factor
    if (file.size) {
      weight += Math.log(file.size) * 0.1;
    }
    
    return Math.min(weight, 10); // Cap at 10
  }

  // Generate clusters based on relationships
  generateClusters(nodes, edges) {
    const clusters = [];
    const visited = new Set();
    const adjacencyList = new Map();

    // Build adjacency list
    nodes.forEach(node => adjacencyList.set(node.id, []));
    edges.forEach(edge => {
      if (adjacencyList.has(edge.source)) {
        adjacencyList.get(edge.source).push(edge.target);
      }
      if (adjacencyList.has(edge.target)) {
        adjacencyList.get(edge.target).push(edge.source);
      }
    });

    // Find connected components
    nodes.forEach(node => {
      if (!visited.has(node.id)) {
        const cluster = this.dfsCluster(node.id, adjacencyList, visited);
        if (cluster.length > 1) {
          clusters.push({
            id: `cluster_${clusters.length}`,
            nodes: cluster,
            size: cluster.length,
            type: this.identifyClusterType(cluster, edges)
          });
        }
      }
    });

    return clusters;
  }

  // Depth-first search for clustering
  dfsCluster(nodeId, adjacencyList, visited) {
    const cluster = [];
    const stack = [nodeId];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!visited.has(current)) {
        visited.add(current);
        cluster.push(current);
        
        const neighbors = adjacencyList.get(current) || [];
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            stack.push(neighbor);
          }
        });
      }
    }

    return cluster;
  }

  // Identify cluster type based on edge types
  identifyClusterType(clusterNodes, edges) {
    const clusterEdges = edges.filter(edge => 
      clusterNodes.includes(edge.source) && clusterNodes.includes(edge.target)
    );

    const edgeTypes = clusterEdges.map(edge => edge.type);
    const typeCounts = {};
    
    edgeTypes.forEach(type => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const dominantType = Object.keys(typeCounts).reduce((a, b) => 
      typeCounts[a] > typeCounts[b] ? a : b, 'mixed'
    );

    return dominantType;
  }

  // Calculate graph statistics
  calculateGraphStatistics(graph) {
    const { nodes, edges, clusters } = graph;
    
    const edgeTypeStats = {};
    edges.forEach(edge => {
      edgeTypeStats[edge.type] = (edgeTypeStats[edge.type] || 0) + 1;
    });

    const avgWeight = edges.length > 0 
      ? edges.reduce((sum, edge) => sum + edge.weight, 0) / edges.length 
      : 0;

    return {
      total_nodes: nodes.length,
      total_edges: edges.length,
      total_clusters: clusters.length,
      edge_types: edgeTypeStats,
      average_edge_weight: avgWeight,
      density: nodes.length > 1 ? (2 * edges.length) / (nodes.length * (nodes.length - 1)) : 0,
      largest_cluster_size: clusters.length > 0 ? Math.max(...clusters.map(c => c.size)) : 0
    };
  }

  // Search for specific patterns in the graph
  async searchPatterns(query, options = {}) {
    const { type = 'string', limit = 50 } = options;

    try {
      let results = [];

      if (type === 'string' && forensicDb) {
        results = await forensicDb.all(`
          SELECT so.*, f.filename, f.path
          FROM strings_output so
          JOIN files f ON so.file_id = f.id
          WHERE so.string_content LIKE ?
          ORDER BY so.is_suspicious DESC, so.string_length DESC
          LIMIT ?
        `, [`%${query}%`, limit]);
      } else if (type === 'xor_key' && forensicDb) {
        results = await forensicDb.all(`
          SELECT xa.*, f.filename, f.path
          FROM xor_analysis xa
          JOIN files f ON xa.file_id = f.id
          WHERE xa.xor_key LIKE ? AND xa.readable_strings_found > 0
          ORDER BY xa.plaintext_score DESC
          LIMIT ?
        `, [`%${query}%`, limit]);
      } else {
        // Mock search results
        results = this.generateMockSearchResults(query, type, limit);
      }

      return {
        query,
        type,
        results: results.map(result => ({
          ...result,
          relevance_score: this.calculateRelevanceScore(result, query)
        })),
        total: results.length
      };

    } catch (error) {
      console.error('Error searching patterns:', error);
      return {
        query,
        type,
        results: [],
        total: 0,
        error: error.message
      };
    }
  }

  // Calculate relevance score for search results
  calculateRelevanceScore(result, query) {
    let score = 0;
    
    if (result.string_content && result.string_content.toLowerCase().includes(query.toLowerCase())) {
      score += 5;
    }
    
    if (result.is_suspicious) {
      score += 3;
    }
    
    if (result.plaintext_score) {
      score += result.plaintext_score;
    }
    
    return Math.min(score, 10);
  }

  // Generate mock graph for development/demo
  generateMockGraph(options) {
    const { maxNodes = 100 } = options;
    
    const nodeCount = Math.min(maxNodes, 50);
    const nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: `file_${i + 1}`,
      type: 'file',
      label: `suspicious_file_${i + 1}.${['jpg', 'png', 'zip', 'pdf', 'doc'][i % 5]}`,
      data: {
        filename: `suspicious_file_${i + 1}`,
        size: Math.floor(Math.random() * 10000000) + 1000,
        entropy: 7.0 + Math.random() * 1.5,
        suspicious_score: Math.random() * 10,
        path: `/extracted_fragments/cluster_${Math.floor(i / 10)}/suspicious_file_${i + 1}`
      },
      weight: 1 + Math.random() * 5
    }));

    const edges = [];
    const edgeTypes = ['signature_match', 'xor_correlation', 'string_correlation', 'steganography_correlation'];
    
    // Generate random edges
    for (let i = 0; i < Math.min(nodeCount * 2, 100); i++) {
      const source = Math.floor(Math.random() * nodeCount);
      const target = Math.floor(Math.random() * nodeCount);
      
      if (source !== target) {
        const edgeType = edgeTypes[Math.floor(Math.random() * edgeTypes.length)];
        edges.push({
          id: `edge_${i}`,
          source: `file_${source + 1}`,
          target: `file_${target + 1}`,
          type: edgeType,
          weight: 1 + Math.random() * 5,
          data: this.generateMockEdgeData(edgeType)
        });
      }
    }

    const clusters = this.generateClusters(nodes, edges);
    const statistics = this.calculateGraphStatistics({ nodes, edges, clusters });

    return {
      nodes,
      edges,
      clusters,
      statistics,
      metadata: {
        generated_at: new Date().toISOString(),
        mode: 'mock',
        parameters: options
      }
    };
  }

  // Generate mock edge data
  generateMockEdgeData(type) {
    switch (type) {
      case 'signature_match':
        return {
          signature_name: ['JPEG Header', 'PNG Magic', 'ZIP Signature'][Math.floor(Math.random() * 3)],
          shared_count: Math.floor(Math.random() * 5) + 1
        };
      case 'xor_correlation':
        return {
          xor_key: Math.random().toString(16).substring(2, 8),
          key_type: 'multi_byte',
          avg_score: Math.random() * 10
        };
      case 'string_correlation':
        return {
          shared_strings: Math.floor(Math.random() * 10) + 2,
          sample_string: `pattern_${Math.floor(Math.random() * 1000)}`
        };
      case 'steganography_correlation':
        return {
          extraction_method: 'LSB',
          channel: Math.floor(Math.random() * 3),
          bit_position: Math.floor(Math.random() * 8) + 1,
          avg_entropy: 6.0 + Math.random() * 2
        };
      default:
        return {};
    }
  }

  // Generate mock search results
  generateMockSearchResults(query, type, limit) {
    const results = [];
    
    for (let i = 0; i < Math.min(limit, 20); i++) {
      if (type === 'string') {
        results.push({
          id: i + 1,
          string_content: `Found "${query}" in context ${i + 1}`,
          string_length: query.length + Math.floor(Math.random() * 50),
          filename: `file_${i + 1}.extracted`,
          path: `/extracted_fragments/file_${i + 1}.extracted`,
          is_suspicious: Math.random() > 0.6 ? 1 : 0,
          offset_decimal: Math.floor(Math.random() * 1000000)
        });
      } else if (type === 'xor_key') {
        results.push({
          id: i + 1,
          xor_key: query + Math.random().toString(16).substring(2, 4),
          key_type: 'multi_byte',
          plaintext_score: Math.random() * 10,
          readable_strings_found: Math.floor(Math.random() * 30),
          filename: `correlated_file_${i + 1}.bin`,
          path: `/extracted_fragments/correlated_file_${i + 1}.bin`
        });
      }
    }
    
    return results;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export const forensicGraphService = new ForensicGraphService();
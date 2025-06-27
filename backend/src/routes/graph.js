import express from 'express';
import { forensicGraphService } from '../services/forensic/graph.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Generate forensic relationship graph
router.get('/forensic', authenticateToken, async (req, res) => {
  try {
    const options = {
      maxNodes: parseInt(req.query.max_nodes) || 100,
      includeFileSignatures: req.query.include_signatures !== 'false',
      includeXorPatterns: req.query.include_xor !== 'false',
      includeSuspiciousStrings: req.query.include_strings !== 'false',
      includeSteganography: req.query.include_stego !== 'false',
      minEntropyThreshold: parseFloat(req.query.min_entropy) || 7.0
    };

    const graph = await forensicGraphService.generateForensicGraph(options);

    res.json({
      success: true,
      data: graph
    });
  } catch (error) {
    console.error('Error generating forensic graph:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate forensic relationship graph',
      code: 'GRAPH_GENERATION_ERROR'
    });
  }
});

// Search for patterns in forensic data
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query, type = 'string', limit = 50 } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters long',
        code: 'INVALID_SEARCH_QUERY'
      });
    }

    const results = await forensicGraphService.searchPatterns(query, {
      type,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error searching patterns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search forensic patterns',
      code: 'PATTERN_SEARCH_ERROR'
    });
  }
});

// Find path between two files
router.get('/path/:id1/:id2', authenticateToken, async (req, res) => {
  try {
    const { id1, id2 } = req.params;
    const maxDepth = parseInt(req.query.max_depth) || 5;

    // Generate graph to find path
    const graph = await forensicGraphService.generateForensicGraph({
      maxNodes: 200 // Larger graph for path finding
    });

    const path = findShortestPath(graph, id1, id2, maxDepth);

    res.json({
      success: true,
      data: {
        source: id1,
        target: id2,
        path: path,
        found: path.length > 0,
        distance: path.length - 1
      }
    });
  } catch (error) {
    console.error('Error finding path:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find path between files',
      code: 'PATH_FINDING_ERROR'
    });
  }
});

// Get graph statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const graph = await forensicGraphService.generateForensicGraph({
      maxNodes: 50 // Smaller graph for stats
    });

    const enhancedStats = {
      ...graph.statistics,
      node_types: analyzeNodeTypes(graph.nodes),
      edge_distribution: analyzeEdgeDistribution(graph.edges),
      cluster_analysis: analyzeClusterDistribution(graph.clusters),
      connectivity_metrics: calculateConnectivityMetrics(graph)
    };

    res.json({
      success: true,
      data: enhancedStats
    });
  } catch (error) {
    console.error('Error getting graph statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve graph statistics',
      code: 'GRAPH_STATS_ERROR'
    });
  }
});

// Clear graph cache
router.post('/cache/clear', authenticateToken, async (req, res) => {
  try {
    forensicGraphService.clearCache();
    
    res.json({
      success: true,
      message: 'Graph cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear graph cache',
      code: 'CACHE_CLEAR_ERROR'
    });
  }
});

// Helper function to find shortest path between nodes
function findShortestPath(graph, startId, endId, maxDepth) {
  if (startId === endId) return [startId];

  const { nodes, edges } = graph;
  const nodeIds = new Set(nodes.map(n => n.id));

  if (!nodeIds.has(startId) || !nodeIds.has(endId)) {
    return [];
  }

  // Build adjacency list
  const adjacencyList = new Map();
  nodes.forEach(node => adjacencyList.set(node.id, []));
  
  edges.forEach(edge => {
    if (adjacencyList.has(edge.source)) {
      adjacencyList.get(edge.source).push(edge.target);
    }
    if (adjacencyList.has(edge.target)) {
      adjacencyList.get(edge.target).push(edge.source);
    }
  });

  // BFS to find shortest path
  const queue = [[startId]];
  const visited = new Set([startId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (path.length > maxDepth) continue;

    const neighbors = adjacencyList.get(current) || [];
    
    for (const neighbor of neighbors) {
      if (neighbor === endId) {
        return [...path, neighbor];
      }

      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  return []; // No path found
}

// Analyze node types distribution
function analyzeNodeTypes(nodes) {
  const types = {};
  const entropyBuckets = {
    'low': 0,      // < 6.0
    'medium': 0,   // 6.0 - 7.5
    'high': 0,     // 7.5 - 8.5
    'very_high': 0 // > 8.5
  };

  nodes.forEach(node => {
    const type = node.type || 'unknown';
    types[type] = (types[type] || 0) + 1;

    if (node.data && node.data.entropy !== undefined) {
      const entropy = node.data.entropy;
      if (entropy < 6.0) entropyBuckets.low++;
      else if (entropy < 7.5) entropyBuckets.medium++;
      else if (entropy < 8.5) entropyBuckets.high++;
      else entropyBuckets.very_high++;
    }
  });

  return {
    by_type: types,
    by_entropy: entropyBuckets
  };
}

// Analyze edge distribution
function analyzeEdgeDistribution(edges) {
  const distribution = {};
  const weightStats = {
    min: Infinity,
    max: -Infinity,
    avg: 0,
    total: 0
  };

  edges.forEach(edge => {
    const type = edge.type || 'unknown';
    distribution[type] = (distribution[type] || 0) + 1;

    if (edge.weight) {
      weightStats.min = Math.min(weightStats.min, edge.weight);
      weightStats.max = Math.max(weightStats.max, edge.weight);
      weightStats.total += edge.weight;
    }
  });

  if (edges.length > 0) {
    weightStats.avg = weightStats.total / edges.length;
  }

  return {
    by_type: distribution,
    weight_stats: weightStats
  };
}

// Analyze cluster distribution
function analyzeClusterDistribution(clusters) {
  const sizeDistribution = {};
  const typeDistribution = {};

  clusters.forEach(cluster => {
    const size = cluster.size || 0;
    const type = cluster.type || 'unknown';

    sizeDistribution[size] = (sizeDistribution[size] || 0) + 1;
    typeDistribution[type] = (typeDistribution[type] || 0) + 1;
  });

  return {
    by_size: sizeDistribution,
    by_type: typeDistribution,
    total_clusters: clusters.length,
    avg_cluster_size: clusters.length > 0 
      ? clusters.reduce((sum, c) => sum + (c.size || 0), 0) / clusters.length 
      : 0
  };
}

// Calculate connectivity metrics
function calculateConnectivityMetrics(graph) {
  const { nodes, edges } = graph;
  
  if (nodes.length === 0) {
    return {
      average_degree: 0,
      max_degree: 0,
      connected_components: 0
    };
  }

  // Calculate degree for each node
  const degrees = new Map();
  nodes.forEach(node => degrees.set(node.id, 0));

  edges.forEach(edge => {
    degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
  });

  const degreeValues = Array.from(degrees.values());
  const averageDegree = degreeValues.reduce((sum, deg) => sum + deg, 0) / degreeValues.length;
  const maxDegree = Math.max(...degreeValues);

  return {
    average_degree: averageDegree,
    max_degree: maxDegree,
    connected_components: countConnectedComponents(graph)
  };
}

// Count connected components
function countConnectedComponents(graph) {
  const { nodes, edges } = graph;
  const visited = new Set();
  let components = 0;

  // Build adjacency list
  const adjacencyList = new Map();
  nodes.forEach(node => adjacencyList.set(node.id, []));
  
  edges.forEach(edge => {
    if (adjacencyList.has(edge.source)) {
      adjacencyList.get(edge.source).push(edge.target);
    }
    if (adjacencyList.has(edge.target)) {
      adjacencyList.get(edge.target).push(edge.source);
    }
  });

  // DFS to find connected components
  function dfs(nodeId) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    
    const neighbors = adjacencyList.get(nodeId) || [];
    neighbors.forEach(neighbor => dfs(neighbor));
  }

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id);
      components++;
    }
  });

  return components;
}

export default router;
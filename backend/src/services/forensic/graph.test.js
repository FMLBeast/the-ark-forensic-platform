import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { ForensicGraphService, forensicGraphService } from './graph.js'
import { forensicDbMock } from '../../test/helpers/database.js'

// Mock dependencies
jest.unstable_mockModule('./database.js', () => ({
  forensicDb: null
}))

describe('Forensic Graph Service', () => {
  let graphService
  let mockDb

  beforeEach(() => {
    graphService = new ForensicGraphService()
    mockDb = forensicDbMock.mockDatabase()
    graphService.clearCache()
  })

  afterEach(() => {
    jest.clearAllMocks()
    forensicDbMock.clear()
  })

  describe('generateForensicGraph', () => {
    it('should generate graph with default options', async () => {
      const graph = await graphService.generateForensicGraph()

      expect(graph).toHaveProperty('nodes')
      expect(graph).toHaveProperty('edges')
      expect(graph).toHaveProperty('clusters')
      expect(graph).toHaveProperty('statistics')
      expect(graph).toHaveProperty('metadata')
      expect(graph.metadata).toHaveProperty('generated_at')
      expect(graph.metadata).toHaveProperty('parameters')
    })

    it('should generate mock graph when no database connection', async () => {
      const graph = await graphService.generateForensicGraph({ maxNodes: 10 })

      expect(graph.nodes.length).toBeLessThanOrEqual(10)
      expect(graph.metadata.mode).toBe('mock')
      expect(Array.isArray(graph.nodes)).toBe(true)
      expect(Array.isArray(graph.edges)).toBe(true)
      expect(Array.isArray(graph.clusters)).toBe(true)
    })

    it('should respect maxNodes parameter', async () => {
      const maxNodes = 5
      const graph = await graphService.generateForensicGraph({ maxNodes })

      expect(graph.nodes.length).toBeLessThanOrEqual(maxNodes)
    })

    it('should cache results', async () => {
      const options = { maxNodes: 10 }
      
      const graph1 = await graphService.generateForensicGraph(options)
      const graph2 = await graphService.generateForensicGraph(options)

      expect(graph1).toBe(graph2) // Should return same cached object
    })

    it('should include different relationship types based on options', async () => {
      const graph = await graphService.generateForensicGraph({
        includeFileSignatures: true,
        includeXorPatterns: true,
        includeSuspiciousStrings: true,
        includeSteganography: true
      })

      // Should have various edge types in mock mode
      const edgeTypes = new Set(graph.edges.map(edge => edge.type))
      expect(edgeTypes.size).toBeGreaterThan(0)
    })
  })

  describe('calculateNodeWeight', () => {
    it('should calculate weight based on file properties', () => {
      const file = {
        entropy: 7.5,
        suspicious_string_count: 10,
        xor_attempt_count: 5,
        size: 1024000
      }

      const weight = graphService.calculateNodeWeight(file)

      expect(weight).toBeGreaterThan(1)
      expect(weight).toBeLessThanOrEqual(10)
    })

    it('should handle missing properties gracefully', () => {
      const file = { filename: 'test.txt' }

      const weight = graphService.calculateNodeWeight(file)

      expect(weight).toBe(1) // Base weight
    })

    it('should cap weight at maximum value', () => {
      const file = {
        entropy: 8.0,
        suspicious_string_count: 1000,
        xor_attempt_count: 1000,
        size: 100000000
      }

      const weight = graphService.calculateNodeWeight(file)

      expect(weight).toBe(10) // Should be capped
    })
  })

  describe('generateClusters', () => {
    it('should find connected components', () => {
      const nodes = [
        { id: 'file_1' },
        { id: 'file_2' },
        { id: 'file_3' },
        { id: 'file_4' }
      ]

      const edges = [
        { source: 'file_1', target: 'file_2', type: 'signature_match' },
        { source: 'file_2', target: 'file_3', type: 'xor_correlation' }
        // file_4 is isolated
      ]

      const clusters = graphService.generateClusters(nodes, edges)

      expect(clusters.length).toBe(1) // One cluster of 3 connected nodes
      expect(clusters[0].size).toBe(3)
      expect(clusters[0].nodes).toContain('file_1')
      expect(clusters[0].nodes).toContain('file_2')
      expect(clusters[0].nodes).toContain('file_3')
    })

    it('should handle empty graph', () => {
      const clusters = graphService.generateClusters([], [])

      expect(clusters).toEqual([])
    })

    it('should identify cluster types', () => {
      const nodes = [
        { id: 'file_1' },
        { id: 'file_2' }
      ]

      const edges = [
        { source: 'file_1', target: 'file_2', type: 'signature_match' }
      ]

      const clusters = graphService.generateClusters(nodes, edges)

      expect(clusters[0].type).toBe('signature_match')
    })
  })

  describe('calculateGraphStatistics', () => {
    it('should calculate comprehensive statistics', () => {
      const graph = {
        nodes: [
          { id: 'file_1' },
          { id: 'file_2' },
          { id: 'file_3' }
        ],
        edges: [
          { type: 'signature_match', weight: 2 },
          { type: 'xor_correlation', weight: 3 },
          { type: 'signature_match', weight: 1 }
        ],
        clusters: [
          { size: 3 },
          { size: 2 }
        ]
      }

      const stats = graphService.calculateGraphStatistics(graph)

      expect(stats.total_nodes).toBe(3)
      expect(stats.total_edges).toBe(3)
      expect(stats.total_clusters).toBe(2)
      expect(stats.edge_types).toHaveProperty('signature_match', 2)
      expect(stats.edge_types).toHaveProperty('xor_correlation', 1)
      expect(stats.average_edge_weight).toBe(2) // (2+3+1)/3
      expect(stats.largest_cluster_size).toBe(3)
      expect(stats.density).toBeGreaterThan(0)
    })

    it('should handle empty graph statistics', () => {
      const graph = { nodes: [], edges: [], clusters: [] }

      const stats = graphService.calculateGraphStatistics(graph)

      expect(stats.total_nodes).toBe(0)
      expect(stats.total_edges).toBe(0)
      expect(stats.average_edge_weight).toBe(0)
      expect(stats.density).toBe(0)
      expect(stats.largest_cluster_size).toBe(0)
    })
  })

  describe('searchPatterns', () => {
    it('should search for string patterns', async () => {
      const query = 'password'
      const result = await graphService.searchPatterns(query, { type: 'string', limit: 10 })

      expect(result).toHaveProperty('query', query)
      expect(result).toHaveProperty('type', 'string')
      expect(result).toHaveProperty('results')
      expect(result).toHaveProperty('total')
      expect(Array.isArray(result.results)).toBe(true)
    })

    it('should search for XOR key patterns', async () => {
      const query = 'ABC'
      const result = await graphService.searchPatterns(query, { type: 'xor_key', limit: 5 })

      expect(result.query).toBe(query)
      expect(result.type).toBe('xor_key')
      expect(Array.isArray(result.results)).toBe(true)
    })

    it('should calculate relevance scores', async () => {
      const result = await graphService.searchPatterns('test', { type: 'string' })

      if (result.results.length > 0) {
        expect(result.results[0]).toHaveProperty('relevance_score')
        expect(typeof result.results[0].relevance_score).toBe('number')
      }
    })

    it('should handle search errors gracefully', async () => {
      // Force an error in searchPatterns
      const originalMethod = graphService.generateMockSearchResults
      graphService.generateMockSearchResults = jest.fn(() => {
        throw new Error('Search failed')
      })

      const result = await graphService.searchPatterns('test')

      expect(result).toHaveProperty('error')
      expect(result.results).toEqual([])
      expect(result.total).toBe(0)

      // Restore original method
      graphService.generateMockSearchResults = originalMethod
    })
  })

  describe('calculateRelevanceScore', () => {
    it('should score based on string content match', () => {
      const result = {
        string_content: 'This contains the QUERY string',
        is_suspicious: 0,
        plaintext_score: 5
      }

      const score = graphService.calculateRelevanceScore(result, 'query')

      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(10)
    })

    it('should boost score for suspicious strings', () => {
      const suspiciousResult = {
        string_content: 'test query',
        is_suspicious: 1,
        plaintext_score: 3
      }

      const normalResult = {
        string_content: 'test query',
        is_suspicious: 0,
        plaintext_score: 3
      }

      const suspiciousScore = graphService.calculateRelevanceScore(suspiciousResult, 'query')
      const normalScore = graphService.calculateRelevanceScore(normalResult, 'query')

      expect(suspiciousScore).toBeGreaterThan(normalScore)
    })

    it('should include plaintext score in relevance', () => {
      const result = {
        string_content: 'no match',
        is_suspicious: 0,
        plaintext_score: 8
      }

      const score = graphService.calculateRelevanceScore(result, 'nomatch')

      expect(score).toBe(8) // Only plaintext score
    })
  })

  describe('Mock Data Generation', () => {
    it('should generate realistic mock nodes', () => {
      const graph = graphService.generateMockGraph({ maxNodes: 10 })

      expect(graph.nodes.length).toBeLessThanOrEqual(10)
      graph.nodes.forEach(node => {
        expect(node).toHaveProperty('id')
        expect(node).toHaveProperty('type', 'file')
        expect(node).toHaveProperty('label')
        expect(node).toHaveProperty('data')
        expect(node.data).toHaveProperty('filename')
        expect(node.data).toHaveProperty('size')
        expect(node.data).toHaveProperty('entropy')
        expect(node.data.entropy).toBeGreaterThanOrEqual(7.0)
        expect(node.data.entropy).toBeLessThanOrEqual(8.5)
      })
    })

    it('should generate realistic mock edges', () => {
      const graph = graphService.generateMockGraph({ maxNodes: 10 })

      graph.edges.forEach(edge => {
        expect(edge).toHaveProperty('id')
        expect(edge).toHaveProperty('source')
        expect(edge).toHaveProperty('target')
        expect(edge).toHaveProperty('type')
        expect(edge).toHaveProperty('weight')
        expect(edge).toHaveProperty('data')
        
        const validTypes = ['signature_match', 'xor_correlation', 'string_correlation', 'steganography_correlation']
        expect(validTypes).toContain(edge.type)
      })
    })

    it('should generate different edge data for different types', () => {
      const signatureData = graphService.generateMockEdgeData('signature_match')
      const xorData = graphService.generateMockEdgeData('xor_correlation')
      const stringData = graphService.generateMockEdgeData('string_correlation')
      const stegoData = graphService.generateMockEdgeData('steganography_correlation')

      expect(signatureData).toHaveProperty('signature_name')
      expect(xorData).toHaveProperty('xor_key')
      expect(stringData).toHaveProperty('shared_strings')
      expect(stegoData).toHaveProperty('extraction_method')
    })

    it('should generate mock search results for different types', () => {
      const stringResults = graphService.generateMockSearchResults('test', 'string', 5)
      const xorResults = graphService.generateMockSearchResults('ABC', 'xor_key', 3)

      expect(stringResults.length).toBeLessThanOrEqual(5)
      expect(xorResults.length).toBeLessThanOrEqual(3)

      if (stringResults.length > 0) {
        expect(stringResults[0]).toHaveProperty('string_content')
        expect(stringResults[0].string_content).toContain('test')
      }

      if (xorResults.length > 0) {
        expect(xorResults[0]).toHaveProperty('xor_key')
        expect(xorResults[0].xor_key).toContain('ABC')
      }
    })
  })

  describe('Cache Management', () => {
    it('should cache graph results', async () => {
      const options = { maxNodes: 5 }
      
      // First call
      const startTime1 = Date.now()
      const graph1 = await graphService.generateForensicGraph(options)
      const duration1 = Date.now() - startTime1

      // Second call (should be cached)
      const startTime2 = Date.now()
      const graph2 = await graphService.generateForensicGraph(options)
      const duration2 = Date.now() - startTime2

      expect(graph1).toBe(graph2) // Same object reference
      expect(duration2).toBeLessThan(duration1) // Faster second call
    })

    it('should respect cache timeout', async () => {
      // Create a service with very short cache timeout for testing
      const testService = new ForensicGraphService()
      testService.cacheTimeout = 10 // 10ms

      const options = { maxNodes: 3 }
      
      const graph1 = await testService.generateForensicGraph(options)
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 20))
      
      const graph2 = await testService.generateForensicGraph(options)

      // Should be different objects (new generation)
      expect(graph1).not.toBe(graph2)
    })

    it('should clear cache when requested', async () => {
      const options = { maxNodes: 5 }
      
      const graph1 = await graphService.generateForensicGraph(options)
      graphService.clearCache()
      const graph2 = await graphService.generateForensicGraph(options)

      expect(graph1).not.toBe(graph2)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error scenario
      const errorService = new ForensicGraphService()
      
      // Override getGraphFiles to throw error
      errorService.getGraphFiles = jest.fn().mockRejectedValue(new Error('Database error'))

      const graph = await errorService.generateForensicGraph()

      // Should fall back to mock graph
      expect(graph).toHaveProperty('nodes')
      expect(graph).toHaveProperty('edges')
      expect(graph.metadata.mode).toBe('mock')
    })

    it('should handle invalid input gracefully', () => {
      const weight1 = graphService.calculateNodeWeight(null)
      const weight2 = graphService.calculateNodeWeight({})
      const weight3 = graphService.calculateNodeWeight(undefined)

      expect(weight1).toBe(1)
      expect(weight2).toBe(1)
      expect(weight3).toBe(1)
    })
  })

  describe('Performance Tests', () => {
    it('should handle large graph generation efficiently', async () => {
      const start = Date.now()
      const graph = await graphService.generateForensicGraph({ maxNodes: 100 })
      const duration = Date.now() - start

      expect(graph.nodes.length).toBeLessThanOrEqual(100)
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should limit edge generation for performance', async () => {
      const graph = await graphService.generateForensicGraph({ maxNodes: 50 })

      // Edge count should be reasonable for performance
      expect(graph.edges.length).toBeLessThan(graph.nodes.length * 5)
    })

    it('should perform clustering efficiently', () => {
      const nodes = Array.from({ length: 50 }, (_, i) => ({ id: `node_${i}` }))
      const edges = Array.from({ length: 75 }, (_, i) => ({
        source: `node_${i % 25}`,
        target: `node_${(i + 1) % 25}`,
        type: 'test'
      }))

      const start = Date.now()
      const clusters = graphService.generateClusters(nodes, edges)
      const duration = Date.now() - start

      expect(duration).toBeLessThan(1000) // Should complete within 1 second
      expect(Array.isArray(clusters)).toBe(true)
    })
  })
})
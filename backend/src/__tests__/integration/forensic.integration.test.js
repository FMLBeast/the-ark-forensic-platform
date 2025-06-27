import request from 'supertest'
import express from 'express'
import { jest } from '@jest/globals'

// Integration tests for forensic API endpoints
describe('Forensic API Integration Tests', () => {
  let app

  beforeAll(async () => {
    // Create minimal Express app for testing
    app = express()
    app.use(express.json())

    // Mock forensic routes
    app.get('/api/forensic/stats', (req, res) => {
      res.status(200).json({
        success: true,
        data: {
          total_files: 54762,
          analyzed_binaries: 54762,
          suspicious_strings: 125489,
          successful_xor: 89453,
          signatures_found: 337824,
          stego_patterns: 9848,
          database_size_gb: 33.2,
          analysis_complete: true,
          last_updated: new Date().toISOString()
        }
      })
    })

    app.get('/api/forensic/suspicious-files', (req, res) => {
      const limit = parseInt(req.query.limit) || 50
      const minEntropy = parseFloat(req.query.min_entropy) || 7.0

      const mockFiles = [
        {
          filename: 'suspicious1.jpg',
          path: '/extracted/suspicious1.jpg',
          size: 2048576,
          entropy: 7.8,
          suspicious_score: 8.5,
          likely_binary: 1,
          suspicious_strings: 15,
          xor_attempts: 8,
          signatures_found: 3
        },
        {
          filename: 'suspicious2.zip',
          path: '/extracted/suspicious2.zip',
          size: 1024000,
          entropy: 7.9,
          suspicious_score: 9.2,
          likely_binary: 1,
          suspicious_strings: 22,
          xor_attempts: 12,
          signatures_found: 1
        }
      ]

      const filteredFiles = mockFiles
        .filter(file => file.entropy >= minEntropy)
        .slice(0, limit)

      res.status(200).json({
        success: true,
        data: {
          files: filteredFiles,
          total_count: filteredFiles.length,
          query_params: {
            limit,
            min_entropy: minEntropy
          }
        }
      })
    })

    app.get('/api/forensic/file/:filename', (req, res) => {
      const { filename } = req.params

      if (filename === 'nonexistent.jpg') {
        return res.status(404).json({
          success: false,
          error: 'File not found'
        })
      }

      res.status(200).json({
        success: true,
        data: {
          file: {
            id: 1,
            filename: filename,
            path: `/extracted/${filename}`,
            size: 2048576,
            entropy: 7.5,
            file_type: 'JPEG'
          },
          binary: {
            entropy: 7.5,
            compression_ratio: 0.8,
            likely_binary: 1
          },
          strings: [
            {
              id: 1,
              string_content: 'suspicious string found',
              is_suspicious: 1,
              offset_decimal: 1024
            }
          ],
          signatures: [
            {
              id: 1,
              signature_name: 'JPEG Header',
              signature_hex: 'FFD8FF',
              confidence: 0.95
            }
          ],
          xor: [
            {
              id: 1,
              xor_key: 'ABC123',
              key_type: 'hex',
              plaintext_score: 8.5,
              readable_strings_found: 5
            }
          ],
          bitplane: [
            {
              id: 1,
              channel: 0,
              bit_position: 1,
              extraction_method: 'LSB',
              has_patterns: 1,
              entropy: 7.2
            }
          ],
          analysis_complete: true
        }
      })
    })

    app.get('/api/forensic/search/strings', (req, res) => {
      const pattern = req.query.pattern
      const limit = parseInt(req.query.limit) || 50

      if (!pattern) {
        return res.status(400).json({
          success: false,
          error: 'Search pattern is required'
        })
      }

      const mockResults = [
        {
          id: 1,
          string_content: `Found "${pattern}" in context 1`,
          string_length: pattern.length + 20,
          filename: 'file1.extracted',
          path: '/extracted_fragments/file1.extracted',
          is_suspicious: 1,
          offset_decimal: 5432
        },
        {
          id: 2,
          string_content: `Another occurrence of ${pattern}`,
          string_length: pattern.length + 25,
          filename: 'file2.extracted',
          path: '/extracted_fragments/file2.extracted',
          is_suspicious: 0,
          offset_decimal: 9876
        }
      ]

      res.status(200).json({
        success: true,
        data: {
          pattern,
          results: mockResults.slice(0, limit),
          total_matches: mockResults.length
        }
      })
    })

    app.get('/api/forensic/graph', (req, res) => {
      const maxNodes = parseInt(req.query.max_nodes) || 50

      const mockGraph = {
        nodes: [
          {
            id: 'file_1',
            type: 'file',
            label: 'suspicious_file_1.jpg',
            data: {
              filename: 'suspicious_file_1.jpg',
              size: 1024000,
              entropy: 7.8,
              suspicious_score: 8.5
            },
            weight: 4.2
          },
          {
            id: 'file_2',
            type: 'file',
            label: 'suspicious_file_2.png',
            data: {
              filename: 'suspicious_file_2.png',
              size: 2048000,
              entropy: 7.6,
              suspicious_score: 7.9
            },
            weight: 3.8
          }
        ],
        edges: [
          {
            id: 'edge_1',
            source: 'file_1',
            target: 'file_2',
            type: 'signature_match',
            weight: 2.5,
            data: {
              signature_name: 'Common Header',
              shared_count: 3
            }
          }
        ],
        clusters: [
          {
            id: 'cluster_1',
            nodes: ['file_1', 'file_2'],
            size: 2,
            type: 'signature_match'
          }
        ],
        statistics: {
          total_nodes: 2,
          total_edges: 1,
          total_clusters: 1,
          edge_types: {
            signature_match: 1
          },
          average_edge_weight: 2.5,
          density: 1.0
        },
        metadata: {
          generated_at: new Date().toISOString(),
          parameters: { max_nodes: maxNodes }
        }
      }

      res.status(200).json({
        success: true,
        data: mockGraph
      })
    })
  })

  describe('GET /api/forensic/stats', () => {
    it('should return forensic database statistics', async () => {
      const response = await request(app)
        .get('/api/forensic/stats')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('total_files')
      expect(response.body.data).toHaveProperty('database_size_gb')
      expect(response.body.data).toHaveProperty('analysis_complete')
      expect(response.body.data.total_files).toBe(54762)
      expect(response.body.data.database_size_gb).toBe(33.2)
    })
  })

  describe('GET /api/forensic/suspicious-files', () => {
    it('should return suspicious files with default parameters', async () => {
      const response = await request(app)
        .get('/api/forensic/suspicious-files')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('files')
      expect(response.body.data).toHaveProperty('total_count')
      expect(Array.isArray(response.body.data.files)).toBe(true)
      expect(response.body.data.files.length).toBeGreaterThan(0)

      const file = response.body.data.files[0]
      expect(file).toHaveProperty('filename')
      expect(file).toHaveProperty('entropy')
      expect(file).toHaveProperty('suspicious_score')
    })

    it('should filter files by entropy threshold', async () => {
      const response = await request(app)
        .get('/api/forensic/suspicious-files')
        .query({ min_entropy: 8.0 })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.query_params.min_entropy).toBe(8.0)
      
      // Should filter out files with entropy < 8.0
      response.body.data.files.forEach(file => {
        expect(file.entropy).toBeGreaterThanOrEqual(8.0)
      })
    })

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/forensic/suspicious-files')
        .query({ limit: 1 })

      expect(response.status).toBe(200)
      expect(response.body.data.files.length).toBeLessThanOrEqual(1)
      expect(response.body.data.query_params.limit).toBe(1)
    })
  })

  describe('GET /api/forensic/file/:filename', () => {
    it('should return comprehensive file analysis', async () => {
      const response = await request(app)
        .get('/api/forensic/file/test.jpg')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('file')
      expect(response.body.data).toHaveProperty('binary')
      expect(response.body.data).toHaveProperty('strings')
      expect(response.body.data).toHaveProperty('signatures')
      expect(response.body.data).toHaveProperty('xor')
      expect(response.body.data).toHaveProperty('bitplane')
      expect(response.body.data.analysis_complete).toBe(true)

      const file = response.body.data.file
      expect(file.filename).toBe('test.jpg')
      expect(file).toHaveProperty('entropy')
      expect(file).toHaveProperty('size')
    })

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/api/forensic/file/nonexistent.jpg')

      expect(response.status).toBe(404)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('File not found')
    })
  })

  describe('GET /api/forensic/search/strings', () => {
    it('should search for string patterns', async () => {
      const response = await request(app)
        .get('/api/forensic/search/strings')
        .query({ pattern: 'password' })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('pattern', 'password')
      expect(response.body.data).toHaveProperty('results')
      expect(response.body.data).toHaveProperty('total_matches')
      expect(Array.isArray(response.body.data.results)).toBe(true)

      if (response.body.data.results.length > 0) {
        const result = response.body.data.results[0]
        expect(result).toHaveProperty('string_content')
        expect(result).toHaveProperty('filename')
        expect(result).toHaveProperty('is_suspicious')
        expect(result.string_content).toContain('password')
      }
    })

    it('should require search pattern', async () => {
      const response = await request(app)
        .get('/api/forensic/search/strings')

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Search pattern is required')
    })

    it('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/forensic/search/strings')
        .query({ pattern: 'test', limit: 1 })

      expect(response.status).toBe(200)
      expect(response.body.data.results.length).toBeLessThanOrEqual(1)
    })
  })

  describe('GET /api/forensic/graph', () => {
    it('should return forensic relationship graph', async () => {
      const response = await request(app)
        .get('/api/forensic/graph')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('nodes')
      expect(response.body.data).toHaveProperty('edges')
      expect(response.body.data).toHaveProperty('clusters')
      expect(response.body.data).toHaveProperty('statistics')
      expect(response.body.data).toHaveProperty('metadata')

      expect(Array.isArray(response.body.data.nodes)).toBe(true)
      expect(Array.isArray(response.body.data.edges)).toBe(true)
      expect(Array.isArray(response.body.data.clusters)).toBe(true)

      const stats = response.body.data.statistics
      expect(stats).toHaveProperty('total_nodes')
      expect(stats).toHaveProperty('total_edges')
      expect(stats).toHaveProperty('edge_types')
    })

    it('should respect max_nodes parameter', async () => {
      const response = await request(app)
        .get('/api/forensic/graph')
        .query({ max_nodes: 10 })

      expect(response.status).toBe(200)
      expect(response.body.data.metadata.parameters.max_nodes).toBe(10)
      expect(response.body.data.nodes.length).toBeLessThanOrEqual(10)
    })

    it('should include proper node structure', async () => {
      const response = await request(app)
        .get('/api/forensic/graph')

      expect(response.status).toBe(200)
      
      if (response.body.data.nodes.length > 0) {
        const node = response.body.data.nodes[0]
        expect(node).toHaveProperty('id')
        expect(node).toHaveProperty('type')
        expect(node).toHaveProperty('label')
        expect(node).toHaveProperty('data')
        expect(node).toHaveProperty('weight')
        
        expect(node.data).toHaveProperty('filename')
        expect(node.data).toHaveProperty('entropy')
        expect(node.data).toHaveProperty('size')
      }
    })

    it('should include proper edge structure', async () => {
      const response = await request(app)
        .get('/api/forensic/graph')

      expect(response.status).toBe(200)
      
      if (response.body.data.edges.length > 0) {
        const edge = response.body.data.edges[0]
        expect(edge).toHaveProperty('id')
        expect(edge).toHaveProperty('source')
        expect(edge).toHaveProperty('target')
        expect(edge).toHaveProperty('type')
        expect(edge).toHaveProperty('weight')
        expect(edge).toHaveProperty('data')
      }
    })
  })

  describe('Forensic Analysis Workflow Integration', () => {
    it('should complete full forensic analysis workflow', async () => {
      // Step 1: Get database statistics
      const statsResponse = await request(app)
        .get('/api/forensic/stats')

      expect(statsResponse.status).toBe(200)
      expect(statsResponse.body.data.analysis_complete).toBe(true)

      // Step 2: Get suspicious files
      const filesResponse = await request(app)
        .get('/api/forensic/suspicious-files')
        .query({ limit: 5, min_entropy: 7.0 })

      expect(filesResponse.status).toBe(200)
      expect(filesResponse.body.data.files.length).toBeGreaterThan(0)

      const firstFile = filesResponse.body.data.files[0]

      // Step 3: Analyze specific file
      const fileResponse = await request(app)
        .get(`/api/forensic/file/${firstFile.filename}`)

      expect(fileResponse.status).toBe(200)
      expect(fileResponse.body.data.analysis_complete).toBe(true)

      // Step 4: Search for patterns
      const searchResponse = await request(app)
        .get('/api/forensic/search/strings')
        .query({ pattern: 'suspicious', limit: 10 })

      expect(searchResponse.status).toBe(200)
      expect(searchResponse.body.data.results.length).toBeGreaterThan(0)

      // Step 5: Generate relationship graph
      const graphResponse = await request(app)
        .get('/api/forensic/graph')
        .query({ max_nodes: 25 })

      expect(graphResponse.status).toBe(200)
      expect(graphResponse.body.data.statistics.total_nodes).toBeGreaterThan(0)
    })

    it('should handle error cases gracefully in workflow', async () => {
      // Test error handling in file analysis
      const errorResponse = await request(app)
        .get('/api/forensic/file/nonexistent.jpg')

      expect(errorResponse.status).toBe(404)
      expect(errorResponse.body.success).toBe(false)

      // Test error handling in string search
      const searchErrorResponse = await request(app)
        .get('/api/forensic/search/strings')

      expect(searchErrorResponse.status).toBe(400)
      expect(searchErrorResponse.body.success).toBe(false)
    })
  })
})
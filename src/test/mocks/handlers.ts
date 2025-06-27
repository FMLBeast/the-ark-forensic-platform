import { rest } from 'msw'

const API_BASE = 'http://localhost:3000/api'

export const handlers = [
  // Authentication endpoints
  rest.post(`${API_BASE}/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: {
            id: 'test-user-1',
            username: 'testuser',
            display_name: 'Test User',
            role: 'investigator',
            clearance_level: 2
          },
          token: 'mock-jwt-token'
        }
      })
    )
  }),

  rest.get(`${API_BASE}/auth/session`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: {
            id: 'test-user-1',
            username: 'testuser',
            display_name: 'Test User',
            role: 'investigator',
            clearance_level: 2
          }
        }
      })
    )
  }),

  rest.post(`${API_BASE}/auth/logout`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        message: 'Logged out successfully'
      })
    )
  }),

  // Forensic endpoints
  rest.get(`${API_BASE}/forensic/stats`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
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
          database_connected: false,
          last_updated: new Date().toISOString()
        }
      })
    )
  }),

  rest.get(`${API_BASE}/forensic/suspicious`, (req, res, ctx) => {
    const limit = parseInt(req.url.searchParams.get('limit') || '10')
    
    const mockFiles = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      filename: `suspicious_file_${i + 1}.${['jpg', 'png', 'pdf', 'zip', 'doc'][i % 5]}`,
      path: `/extracted_fragments/cluster_${Math.floor(i / 3)}/suspicious_file_${i + 1}`,
      size: Math.floor(Math.random() * 10000000) + 1000,
      entropy: 7.5 + Math.random() * 1.5,
      likely_binary: Math.random() > 0.3 ? 1 : 0,
      suspicious_strings: Math.floor(Math.random() * 50),
      xor_attempts: Math.floor(Math.random() * 100),
      signatures_found: Math.floor(Math.random() * 10),
      max_entropy: 7.5 + Math.random() * 1.5
    }))

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          files: mockFiles,
          count: mockFiles.length,
          filters_applied: {},
          database_connected: false
        }
      })
    )
  }),

  rest.get(`${API_BASE}/forensic/analysis/:filename`, (req, res, ctx) => {
    const { filename } = req.params

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          file: {
            id: 12345,
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
          strings: Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            string_content: `Test string ${i + 1}`,
            string_length: Math.floor(Math.random() * 100) + 10,
            is_suspicious: Math.random() > 0.7 ? 1 : 0,
            offset_decimal: Math.floor(Math.random() * 1000000)
          })),
          signatures: Array.from({ length: 3 }, (_, i) => ({
            id: i + 1,
            signature_name: ['JPEG Header', 'PNG Magic', 'ZIP Header'][i],
            signature_hex: ['FFD8FF', '89504E47', '504B0304'][i],
            offset: Math.floor(Math.random() * 1000),
            confidence: 0.8 + Math.random() * 0.2
          })),
          xor: Array.from({ length: 3 }, (_, i) => ({
            id: i + 1,
            xor_key: Math.random().toString(16).substring(2, 8),
            key_type: 'multi_byte',
            plaintext_score: Math.random() * 10,
            readable_strings_found: Math.floor(Math.random() * 20),
            decrypted_preview: `Decrypted content ${i + 1}...`
          })),
          bitplane: Array.from({ length: 2 }, (_, i) => ({
            id: i + 1,
            channel: i,
            bit_position: i + 1,
            extraction_method: 'LSB',
            entropy: 6.0 + Math.random() * 2,
            has_patterns: Math.random() > 0.5 ? 1 : 0
          })),
          analysis_timestamp: new Date().toISOString(),
          analysis_complete: true,
          database_connected: false
        }
      })
    )
  }),

  // Agent endpoints
  rest.get(`${API_BASE}/agents/list`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          agents: [
            {
              agent_id: 'file_analysis_agent',
              name: 'File Analysis Agent',
              description: 'Advanced file analysis with deep inspection capabilities',
              capabilities: ['file_analysis', 'extraction', 'metadata_extraction'],
              status: 'idle',
              task_count: 247,
              success_count: 231,
              error_count: 16,
              success_rate: 0.94,
              created_at: new Date().toISOString(),
              last_activity: new Date().toISOString()
            },
            {
              agent_id: 'steganography_agent',
              name: 'Steganography Agent',
              description: 'Advanced steganography detection and extraction',
              capabilities: ['steganography', 'extraction', 'intelligence'],
              status: 'idle',
              task_count: 189,
              success_count: 172,
              error_count: 17,
              success_rate: 0.91,
              created_at: new Date().toISOString(),
              last_activity: new Date().toISOString()
            }
          ]
        }
      })
    )
  }),

  rest.post(`${API_BASE}/agents/orchestrate`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          session_id: `session_${Date.now()}`,
          status: 'running',
          progress: 0,
          current_phase: 'Initializing analysis',
          agents_involved: ['file_analysis_agent', 'steganography_agent'],
          task_count: 5,
          completed_tasks: 0,
          failed_tasks: 0,
          results: [],
          insights: [],
          connections_discovered: [],
          started_at: new Date().toISOString()
        }
      })
    )
  }),

  // Graph endpoints
  rest.get(`${API_BASE}/graph/forensic`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          nodes: [
            {
              id: 'file_1',
              type: 'file',
              label: 'suspicious_file_1.jpg',
              data: {
                filename: 'suspicious_file_1.jpg',
                size: 2048576,
                entropy: 7.8,
                suspicious_score: 8.5
              },
              weight: 3.2
            },
            {
              id: 'file_2',
              type: 'file',
              label: 'hidden_data.zip',
              data: {
                filename: 'hidden_data.zip',
                size: 1024000,
                entropy: 7.9,
                suspicious_score: 9.1
              },
              weight: 4.1
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
                signature_name: 'ZIP Header',
                shared_count: 1
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
            edge_types: { signature_match: 1 },
            average_edge_weight: 2.5,
            density: 1.0,
            largest_cluster_size: 2
          },
          metadata: {
            generated_at: new Date().toISOString(),
            mode: 'mock'
          }
        }
      })
    )
  }),

  // Files endpoints
  rest.get(`${API_BASE}/files`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          files: [
            {
              id: 'file-1',
              filename: 'test_image.jpg',
              original_name: 'test_image.jpg',
              size: 2048576,
              mime_type: 'image/jpeg',
              uploaded_at: new Date().toISOString(),
              analysis_status: 'completed'
            }
          ],
          total: 1
        }
      })
    )
  }),

  // System endpoints
  rest.get(`${API_BASE}/system/health`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '2.0.0',
          database: 'connected',
          uptime: 3600
        }
      })
    )
  }),

  // Default error handler for unmatched requests
  rest.get('*', (req, res, ctx) => {
    console.warn(`Unhandled ${req.method} request to ${req.url}`)
    return res(
      ctx.status(404),
      ctx.json({
        success: false,
        error: 'Endpoint not found',
        code: 'NOT_FOUND'
      })
    )
  })
]
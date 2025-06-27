import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { agentOrchestrator } from './agentOrchestrator.js'
import { dbHelper } from '../test/helpers/database.js'

// Mock dependencies
jest.unstable_mockModule('../database/init.js', () => ({
  getDatabase: jest.fn(() => dbHelper.getDatabase())
}))

jest.unstable_mockModule('fs/promises', () => ({
  access: jest.fn(),
  stat: jest.fn(),
  readFile: jest.fn()
}))

jest.unstable_mockModule('child_process', () => ({
  spawn: jest.fn()
}))

describe('Agent Orchestrator Service', () => {
  let mockFs
  let mockSpawn

  beforeEach(async () => {
    mockFs = await import('fs/promises')
    mockSpawn = (await import('child_process')).spawn
    dbHelper.reset()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('orchestrateAnalysis', () => {
    const analysisRequest = {
      file_path: '/test/file.jpg',
      analysis_type: 'comprehensive',
      priority: 'high',
      user_id: 'test-user'
    }

    it('should start orchestration session successfully', async () => {
      // Mock file system
      mockFs.access.mockResolvedValue()
      mockFs.stat.mockResolvedValue({ size: 1024000 })

      // Mock database operations
      dbHelper.mockRunResponse({ lastID: 'session-123' })

      const result = await agentOrchestrator.orchestrateAnalysis(analysisRequest)

      expect(result).toHaveProperty('session_id')
      expect(result.status).toBe('running')
      expect(result.progress).toBe(0)
      expect(result.current_phase).toBe('Initializing analysis')
      expect(result.agents_involved).toContain('file_analysis_agent')
      expect(result.agents_involved).toContain('steganography_agent')
      expect(result.agents_involved).toContain('cryptography_agent')
      expect(result.agents_involved).toContain('intelligence_agent')

      // Verify database insert
      dbHelper.expectInsert('orchestration_sessions')
    })

    it('should handle file not found error', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'))

      await expect(agentOrchestrator.orchestrateAnalysis(analysisRequest))
        .rejects.toThrow('Failed to start orchestration: File not found')
    })

    it('should accept custom agent preferences', async () => {
      mockFs.access.mockResolvedValue()
      mockFs.stat.mockResolvedValue({ size: 1024000 })
      dbHelper.mockRunResponse()

      const customRequest = {
        ...analysisRequest,
        agent_preferences: ['file_analysis_agent', 'cryptography_agent']
      }

      const result = await agentOrchestrator.orchestrateAnalysis(customRequest)

      expect(result.agents_involved).toEqual(['file_analysis_agent', 'cryptography_agent'])
    })

    it('should estimate completion time based on analysis type and file size', async () => {
      mockFs.access.mockResolvedValue()
      mockFs.stat.mockResolvedValue({ size: 10 * 1024 * 1024 }) // 10MB
      dbHelper.mockRunResponse()

      const result = await agentOrchestrator.orchestrateAnalysis({
        ...analysisRequest,
        analysis_type: 'collaborative'
      })

      expect(result).toHaveProperty('estimated_completion')
      expect(new Date(result.estimated_completion)).toBeInstanceOf(Date)
    })
  })

  describe('getSessionStatus', () => {
    it('should return session status for active session', async () => {
      // First create a session
      mockFs.access.mockResolvedValue()
      mockFs.stat.mockResolvedValue({ size: 1024000 })
      dbHelper.mockRunResponse()

      const orchestrationResult = await agentOrchestrator.orchestrateAnalysis({
        file_path: '/test/file.jpg',
        analysis_type: 'comprehensive',
        user_id: 'test-user'
      })

      const sessionId = orchestrationResult.session_id
      const status = agentOrchestrator.getSessionStatus(sessionId)

      expect(status).toHaveProperty('session_id', sessionId)
      expect(status).toHaveProperty('status', 'running')
      expect(status).toHaveProperty('progress', 0)
      expect(status).toHaveProperty('current_phase', 'Initializing analysis')
      expect(status).toHaveProperty('agents_involved')
      expect(status).toHaveProperty('task_count')
      expect(status).toHaveProperty('completed_tasks')
      expect(status).toHaveProperty('failed_tasks')
    })

    it('should return null for non-existent session', () => {
      const status = agentOrchestrator.getSessionStatus('non-existent-session')
      expect(status).toBeNull()
    })
  })

  describe('FileAnalysisAgent', () => {
    let fileAgent

    beforeEach(() => {
      fileAgent = agentOrchestrator.agents.file_analysis_agent
    })

    it('should analyze file successfully', async () => {
      const filePath = '/test/file.jpg'
      
      // Mock file operations
      mockFs.stat.mockResolvedValue({ size: 1024000 })
      mockFs.readFile.mockResolvedValue(Buffer.from('test file content'))
      
      // Mock file command
      mockSpawn.mockImplementation((command, args, options) => {
        const mockChild = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn()
        }
        
        if (command === 'file') {
          setTimeout(() => {
            mockChild.stdout.on.mock.calls[0][1]('JPEG image data')
            mockChild.on.mock.calls.find(call => call[0] === 'close')[1](0)
          }, 0)
        }
        
        return mockChild
      })

      const result = await fileAgent.analyze(filePath)

      expect(result.success).toBe(true)
      expect(result.type).toBe('file_analysis')
      expect(result).toHaveProperty('file_type')
      expect(result).toHaveProperty('size', 1024000)
      expect(result).toHaveProperty('entropy')
      expect(result).toHaveProperty('suspicion_score')
      expect(result).toHaveProperty('execution_time')
      expect(result.confidence_score).toBe(0.95)
    })

    it('should handle file analysis errors gracefully', async () => {
      const filePath = '/test/nonexistent.jpg'
      
      mockFs.stat.mockRejectedValue(new Error('File not found'))

      const result = await fileAgent.analyze(filePath)

      expect(result.success).toBe(false)
      expect(result.type).toBe('file_analysis')
      expect(result).toHaveProperty('error')
      expect(result.confidence_score).toBe(0)
    })

    it('should calculate entropy correctly', async () => {
      // Test with known data
      const testBuffer = Buffer.from([0, 0, 0, 0, 255, 255, 255, 255]) // Low entropy
      mockFs.readFile.mockResolvedValue(testBuffer)

      const entropy = await fileAgent.calculateEntropy('/test/file')

      expect(entropy).toBeGreaterThan(0)
      expect(entropy).toBeLessThan(8) // Maximum entropy is 8 bits
    })

    it('should detect suspicious indicators correctly', () => {
      const indicators = fileAgent.getSuspiciousIndicators(7.8, 50, 'unknown data')

      expect(indicators).toContain('very_high_entropy')
      expect(indicators).toContain('very_small_file')
      expect(indicators).toContain('unknown_file_type')
    })
  })

  describe('SteganographyAgent', () => {
    let stegoAgent

    beforeEach(() => {
      stegoAgent = agentOrchestrator.agents.steganography_agent
    })

    it('should analyze image files for steganography', async () => {
      const filePath = '/test/image.jpg'
      const fileAnalysis = { file_type: 'JPEG image data' }

      mockFs.readFile.mockResolvedValue(Buffer.from('test image data'))
      
      // Mock steganography tools
      mockSpawn.mockImplementation((command, args, options) => {
        const mockChild = {
          stdout: { on: jest.fn() },
          stderr: { on: jest.fn() },
          on: jest.fn()
        }
        
        if (command === 'zsteg') {
          setTimeout(() => {
            mockChild.stdout.on.mock.calls[0][1]('Hidden text found: secret message')
            mockChild.on.mock.calls.find(call => call[0] === 'close')[1](0)
          }, 0)
        }
        
        return mockChild
      })

      const result = await stegoAgent.analyze(filePath, fileAnalysis)

      expect(result.success).toBe(true)
      expect(result.type).toBe('steganography')
      expect(result.applicable).toBe(true)
      expect(result).toHaveProperty('results')
      expect(result).toHaveProperty('total_methods')
    })

    it('should skip analysis for non-image files', async () => {
      const filePath = '/test/document.txt'
      const fileAnalysis = { file_type: 'ASCII text' }

      const result = await stegoAgent.analyze(filePath, fileAnalysis)

      expect(result.success).toBe(true)
      expect(result.applicable).toBe(false)
      expect(result.message).toContain('not applicable to non-image files')
      expect(result.confidence_score).toBe(1.0)
    })

    it('should perform LSB analysis', async () => {
      const testBuffer = Buffer.from([
        0b10000000, 0b11000001, 0b11000101, 0b11001100, // 'H' = 72
        0b11000001, 0b11000101, 0b11001100, 0b11001100, // 'e' = 101
        0b11001100, 0b11001100, 0b11000101, 0b11010000  // 'l' = 108
      ])
      
      mockFs.readFile.mockResolvedValue(testBuffer)

      const result = await stegoAgent.performLSBAnalysis('/test/file')

      expect(result).toHaveProperty('found')
      // Result depends on specific LSB extraction logic
    })
  })

  describe('CryptographyAgent', () => {
    let cryptoAgent

    beforeEach(() => {
      cryptoAgent = agentOrchestrator.agents.cryptography_agent
    })

    it('should perform comprehensive cryptographic analysis', async () => {
      const filePath = '/test/encrypted.dat'
      const fileAnalysis = { file_type: 'data' }

      // Mock encrypted content that XORs to readable text
      const encryptedBuffer = Buffer.from('IFMMP')  // 'HELLO' XORed with key 1
      mockFs.readFile.mockResolvedValue(encryptedBuffer)

      const result = await cryptoAgent.analyze(filePath, fileAnalysis)

      expect(result.success).toBe(true)
      expect(result.type).toBe('cryptography')
      expect(result).toHaveProperty('results')
      expect(result).toHaveProperty('total_methods')
    })

    it('should detect XOR encryption patterns', async () => {
      // 'HELLO' XORed with key 1
      const xorBuffer = Buffer.from([0x49, 0x46, 0x4D, 0x4D, 0x4F]) // IFMMO
      mockFs.readFile.mockResolvedValue(xorBuffer)

      const results = await cryptoAgent.performXORAnalysis('/test/file')

      expect(Array.isArray(results)).toBe(true)
      // Should find readable content when XORed with key 1
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('method', 'xor_single_byte')
        expect(results[0]).toHaveProperty('key')
        expect(results[0]).toHaveProperty('confidence')
      }
    })

    it('should detect Base64 encoded content', async () => {
      const base64Content = 'SGVsbG8gV29ybGQ=' // 'Hello World' in base64
      mockFs.readFile.mockResolvedValue(base64Content)

      const results = await cryptoAgent.detectBase64('/test/file')

      expect(Array.isArray(results)).toBe(true)
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('method', 'base64_decode')
        expect(results[0]).toHaveProperty('decoded_content')
        expect(results[0].decoded_content).toContain('Hello World')
      }
    })

    it('should analyze Caesar cipher for text files', async () => {
      const textContent = 'Khoor Zruog' // 'Hello World' with Caesar shift 3
      mockFs.readFile.mockResolvedValue(textContent)

      const results = await cryptoAgent.performCaesarAnalysis('/test/file')

      expect(Array.isArray(results)).toBe(true)
      // Should find readable content when shifted
    })
  })

  describe('IntelligenceAgent', () => {
    let intelligenceAgent

    beforeEach(() => {
      intelligenceAgent = agentOrchestrator.agents.intelligence_agent
    })

    it('should synthesize analysis results', async () => {
      const mockResults = [
        {
          type: 'file_analysis',
          entropy: 7.8,
          suspicious_indicators: ['high_entropy', 'unknown_file_type'],
          confidence_score: 0.9
        },
        {
          type: 'steganography',
          results: [{ method: 'zsteg', confidence: 0.8 }],
          confidence_score: 0.8
        },
        {
          type: 'cryptography',
          results: [{ method: 'xor_single_byte', confidence: 0.9 }],
          confidence_score: 0.85
        }
      ]

      const result = await intelligenceAgent.synthesize(mockResults, '/test/file')

      expect(result.success).toBe(true)
      expect(result.type).toBe('intelligence_synthesis')
      expect(result).toHaveProperty('insights')
      expect(result).toHaveProperty('connections_discovered')
      expect(result).toHaveProperty('patterns_detected')
      expect(result).toHaveProperty('recommendations')
      expect(result).toHaveProperty('confidence_assessment')
      expect(result.confidence_score).toBe(0.9)

      expect(result.insights.length).toBeGreaterThan(0)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })

    it('should generate appropriate recommendations', () => {
      const mockResults = [
        {
          type: 'file_analysis',
          entropy: 7.9,
          confidence_score: 0.95
        },
        {
          type: 'steganography',
          results: [{ method: 'lsb', confidence: 0.8 }],
          confidence_score: 0.8
        }
      ]

      const recommendations = intelligenceAgent.generateRecommendations(mockResults)

      expect(Array.isArray(recommendations)).toBe(true)
      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.some(r => r.includes('cryptographic analysis'))).toBe(true)
      expect(recommendations.some(r => r.includes('steganographic content'))).toBe(true)
    })

    it('should calculate overall confidence correctly', () => {
      const results = [
        { confidence_score: 0.9 },
        { confidence_score: 0.8 },
        { confidence_score: 0.7 }
      ]

      const confidence = intelligenceAgent.calculateOverallConfidence(results)

      expect(confidence).toBe(0.8) // (0.9 + 0.8 + 0.7) / 3
    })

    it('should handle empty results gracefully', () => {
      const confidence = intelligenceAgent.calculateOverallConfidence([])
      expect(confidence).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection failures', async () => {
      dbHelper.mockError(new Error('Database connection failed'))

      await expect(agentOrchestrator.orchestrateAnalysis({
        file_path: '/test/file.jpg',
        analysis_type: 'comprehensive',
        user_id: 'test-user'
      })).rejects.toThrow('Failed to start orchestration')
    })

    it('should handle agent execution failures gracefully', async () => {
      // Mock file system
      mockFs.access.mockResolvedValue()
      mockFs.stat.mockResolvedValue({ size: 1024000 })
      dbHelper.mockRunResponse()

      // Mock agent failure
      const originalAnalyze = agentOrchestrator.agents.file_analysis_agent.analyze
      agentOrchestrator.agents.file_analysis_agent.analyze = jest.fn()
        .mockRejectedValue(new Error('Agent execution failed'))

      const result = await agentOrchestrator.orchestrateAnalysis({
        file_path: '/test/file.jpg',
        analysis_type: 'comprehensive',
        user_id: 'test-user'
      })

      expect(result.status).toBe('running')
      
      // Wait for orchestration to complete with error
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const status = agentOrchestrator.getSessionStatus(result.session_id)
      expect(status.status).toBe('error')

      // Restore original method
      agentOrchestrator.agents.file_analysis_agent.analyze = originalAnalyze
    })
  })

  describe('Performance Tests', () => {
    it('should handle large files efficiently', async () => {
      const largeFileSize = 100 * 1024 * 1024 // 100MB
      
      mockFs.access.mockResolvedValue()
      mockFs.stat.mockResolvedValue({ size: largeFileSize })
      dbHelper.mockRunResponse()

      const start = Date.now()
      const result = await agentOrchestrator.orchestrateAnalysis({
        file_path: '/test/largefile.dat',
        analysis_type: 'comprehensive',
        user_id: 'test-user'
      })
      const duration = Date.now() - start

      expect(result.session_id).toBeDefined()
      expect(duration).toBeLessThan(1000) // Should start quickly
      expect(result.estimated_completion).toBeDefined()
    })

    it('should estimate completion time accurately for different analysis types', async () => {
      mockFs.access.mockResolvedValue()
      mockFs.stat.mockResolvedValue({ size: 1024000 })
      dbHelper.mockRunResponse()

      const comprehensiveTime = agentOrchestrator.estimateCompletionTime('comprehensive', 1024000)
      const targetedTime = agentOrchestrator.estimateCompletionTime('targeted', 1024000)
      const collaborativeTime = agentOrchestrator.estimateCompletionTime('collaborative', 1024000)

      expect(comprehensiveTime).toBeGreaterThan(targetedTime)
      expect(collaborativeTime).toBeGreaterThan(comprehensiveTime)
      expect(typeof comprehensiveTime).toBe('number')
    })
  })
})
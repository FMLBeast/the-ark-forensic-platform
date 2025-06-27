import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { 
  initForensicDatabase, 
  getForensicStats, 
  searchSuspiciousFiles,
  getFileAnalysis,
  searchStringPatterns,
  getXORCorrelations,
  getBitplanePatterns,
  isForensicDatabaseConnected
} from './database.js'
import { forensicDbMock } from '../../test/helpers/database.js'

// Mock sqlite and filesystem modules
jest.unstable_mockModule('sqlite3', () => ({
  Database: jest.fn(),
  default: {
    OPEN_READONLY: 1
  }
}))

jest.unstable_mockModule('sqlite', () => ({
  open: jest.fn()
}))

jest.unstable_mockModule('../../config/config.js', () => ({
  config: {
    database: {
      path: './test.db'
    }
  }
}))

describe('Forensic Database Service', () => {
  let mockDb
  
  beforeEach(() => {
    mockDb = forensicDbMock.mockDatabase()
    jest.clearAllMocks()
  })

  afterEach(() => {
    forensicDbMock.clear()
  })

  describe('initForensicDatabase', () => {
    it('should initialize database connection successfully', async () => {
      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      mockDb.all.mockResolvedValue([
        { name: 'files' },
        { name: 'binary_content' },
        { name: 'strings_output' },
        { name: 'xor_analysis' }
      ])

      const result = await initForensicDatabase()

      expect(open).toHaveBeenCalledWith({
        filename: expect.any(String),
        driver: expect.any(Function),
        mode: expect.any(Number)
      })
      expect(result).toBe(mockDb)
    })

    it('should handle database connection failure', async () => {
      const { open } = await import('sqlite')
      open.mockRejectedValue(new Error('Database not found'))

      const result = await initForensicDatabase()

      expect(result).toBeNull()
    })

    it('should handle empty database gracefully', async () => {
      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      mockDb.all.mockResolvedValue([]) // No tables

      const result = await initForensicDatabase()

      expect(result).toBeNull()
    })
  })

  describe('getForensicStats', () => {
    it('should return database statistics when connected', async () => {
      // Mock database response
      mockDb.get.mockResolvedValue({
        total_files: 54762,
        analyzed_binaries: 54762,
        suspicious_strings: 125489,
        successful_xor: 89453,
        signatures_found: 337824,
        stego_patterns: 9848
      })

      // Set forensic database
      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      await initForensicDatabase()

      const stats = await getForensicStats()

      expect(stats).toHaveProperty('total_files', 54762)
      expect(stats).toHaveProperty('analyzed_binaries', 54762)
      expect(stats).toHaveProperty('suspicious_strings', 125489)
      expect(stats).toHaveProperty('database_size_gb', 33.2)
      expect(stats).toHaveProperty('analysis_complete', true)
    })

    it('should return mock statistics when database not connected', async () => {
      const stats = await getForensicStats()

      expect(stats).toHaveProperty('total_files', 54762)
      expect(stats).toHaveProperty('database_size_gb', 33.2)
      expect(stats).toHaveProperty('analysis_complete', true)
    })

    it('should handle database query errors', async () => {
      mockDb.get.mockRejectedValue(new Error('Query failed'))
      
      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      await initForensicDatabase()

      await expect(getForensicStats()).rejects.toThrow('Query failed')
    })
  })

  describe('searchSuspiciousFiles', () => {
    it('should return suspicious files from database', async () => {
      const mockFiles = [
        {
          filename: 'suspicious1.jpg',
          path: '/extracted/suspicious1.jpg',
          size: 2048576,
          entropy: 7.8,
          likely_binary: 1,
          suspicious_strings: 15,
          xor_attempts: 8,
          signatures_found: 3,
          max_entropy: 7.8
        },
        {
          filename: 'suspicious2.zip',
          path: '/extracted/suspicious2.zip',
          size: 1024000,
          entropy: 7.9,
          likely_binary: 1,
          suspicious_strings: 22,
          xor_attempts: 12,
          signatures_found: 1,
          max_entropy: 7.9
        }
      ]

      mockDb.all.mockResolvedValue(mockFiles)
      
      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      await initForensicDatabase()

      const results = await searchSuspiciousFiles(10)

      expect(results).toHaveLength(2)
      expect(results[0]).toHaveProperty('filename', 'suspicious1.jpg')
      expect(results[0]).toHaveProperty('entropy', 7.8)
      expect(results[1]).toHaveProperty('filename', 'suspicious2.zip')
    })

    it('should apply entropy filter correctly', async () => {
      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      await initForensicDatabase()

      mockDb.all.mockResolvedValue([])

      await searchSuspiciousFiles(10, { min_entropy: 8.0 })

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('AND bc.entropy >= ?'),
        expect.arrayContaining([8.0])
      )
    })

    it('should apply file extension filter', async () => {
      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      await initForensicDatabase()

      mockDb.all.mockResolvedValue([])

      await searchSuspiciousFiles(10, { file_extension: 'jpg' })

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('AND f.filename LIKE ?'),
        expect.arrayContaining(['%.jpg'])
      )
    })

    it('should return mock data when database not connected', async () => {
      const results = await searchSuspiciousFiles(5)

      expect(results).toHaveLength(5)
      expect(results[0]).toHaveProperty('filename')
      expect(results[0]).toHaveProperty('entropy')
    })
  })

  describe('getFileAnalysis', () => {
    it('should return comprehensive file analysis', async () => {
      const filename = 'test_file.jpg'
      const mockFile = { id: 1, filename, path: `/extracted/${filename}`, size: 2048576 }
      const mockBinary = { entropy: 7.5, likely_binary: 1 }
      const mockStrings = [{ id: 1, string_content: 'test string', is_suspicious: 1 }]
      const mockSignatures = [{ id: 1, signature_name: 'JPEG Header', confidence: 0.95 }]
      const mockXor = [{ id: 1, xor_key: 'ABC123', plaintext_score: 8.5 }]
      const mockBitplane = [{ id: 1, channel: 0, has_patterns: 1 }]

      mockDb.get
        .mockResolvedValueOnce(mockFile)  // File query
        .mockResolvedValueOnce(mockBinary) // Binary content query

      mockDb.all
        .mockResolvedValueOnce(mockStrings)    // Strings query
        .mockResolvedValueOnce(mockSignatures) // Signatures query
        .mockResolvedValueOnce(mockXor)        // XOR query
        .mockResolvedValueOnce(mockBitplane)   // Bitplane query

      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      await initForensicDatabase()

      const result = await getFileAnalysis(filename)

      expect(result).toHaveProperty('file', mockFile)
      expect(result).toHaveProperty('binary', mockBinary)
      expect(result).toHaveProperty('strings', mockStrings)
      expect(result).toHaveProperty('signatures', mockSignatures)
      expect(result).toHaveProperty('xor', mockXor)
      expect(result).toHaveProperty('bitplane', mockBitplane)
      expect(result).toHaveProperty('analysis_complete', true)
    })

    it('should return null for non-existent file', async () => {
      mockDb.get.mockResolvedValue(null)

      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      await initForensicDatabase()

      const result = await getFileAnalysis('nonexistent.jpg')

      expect(result).toBeNull()
    })

    it('should return mock analysis when database not connected', async () => {
      const result = await getFileAnalysis('test.jpg')

      expect(result).toHaveProperty('file')
      expect(result).toHaveProperty('binary')
      expect(result).toHaveProperty('analysis_complete', true)
      expect(result.file.filename).toBe('test.jpg')
    })
  })

  describe('searchStringPatterns', () => {
    it('should search for string patterns successfully', async () => {
      const pattern = 'password'
      const mockResults = [
        {
          id: 1,
          string_content: 'Found password in file',
          filename: 'secret.txt',
          path: '/extracted/secret.txt',
          is_suspicious: 1
        }
      ]

      mockDb.all.mockResolvedValue(mockResults)

      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      await initForensicDatabase()

      const results = await searchStringPatterns(pattern, 10)

      expect(results).toHaveLength(1)
      expect(results[0]).toHaveProperty('string_content', 'Found password in file')
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('WHERE so.string_content LIKE ?'),
        expect.arrayContaining([`%${pattern}%`])
      )
    })

    it('should return mock results when database not connected', async () => {
      const results = await searchStringPatterns('test', 5)

      expect(results).toHaveLength(5)
      expect(results[0]).toHaveProperty('string_content')
    })
  })

  describe('getXORCorrelations', () => {
    it('should find XOR key correlations', async () => {
      const keyPattern = 'ABC'
      const mockResults = [
        {
          id: 1,
          xor_key: 'ABC123',
          key_type: 'hex',
          plaintext_score: 9.2,
          filename: 'encrypted.bin',
          path: '/extracted/encrypted.bin'
        }
      ]

      mockDb.all.mockResolvedValue(mockResults)

      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      await initForensicDatabase()

      const results = await getXORCorrelations(keyPattern, 20)

      expect(results).toHaveLength(1)
      expect(results[0]).toHaveProperty('xor_key', 'ABC123')
      expect(mockDb.all).toHaveBeenCalledWith(
        expect.stringContaining('WHERE xa.xor_key LIKE ?'),
        expect.arrayContaining([`%${keyPattern}%`])
      )
    })

    it('should return mock correlations when database not connected', async () => {
      const results = await getXORCorrelations('key', 5)

      expect(results).toHaveLength(5)
      expect(results[0]).toHaveProperty('xor_key')
    })
  })

  describe('getBitplanePatterns', () => {
    it('should retrieve bitplane analysis patterns', async () => {
      const mockPatterns = [
        {
          id: 1,
          channel: 0,
          bit_position: 1,
          extraction_method: 'LSB',
          has_patterns: 1,
          filename: 'image.jpg',
          entropy: 7.2
        }
      ]

      mockDb.all.mockResolvedValue(mockPatterns)

      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      await initForensicDatabase()

      const results = await getBitplanePatterns(25)

      expect(results).toHaveLength(1)
      expect(results[0]).toHaveProperty('extraction_method', 'LSB')
      expect(results[0]).toHaveProperty('has_patterns', 1)
    })

    it('should return mock patterns when database not connected', async () => {
      const results = await getBitplanePatterns(10)

      expect(results).toHaveLength(10)
      expect(results[0]).toHaveProperty('extraction_method')
    })
  })

  describe('isForensicDatabaseConnected', () => {
    it('should return true when database is connected', async () => {
      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      mockDb.all.mockResolvedValue([{ name: 'files' }])
      
      await initForensicDatabase()
      
      const connected = isForensicDatabaseConnected()
      expect(connected).toBe(true)
    })

    it('should return false when database is not connected', () => {
      const connected = isForensicDatabaseConnected()
      expect(connected).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle database query failures gracefully', async () => {
      mockDb.all.mockRejectedValue(new Error('Database error'))

      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      await initForensicDatabase()

      // Should fall back to mock data
      const results = await searchSuspiciousFiles(5)
      expect(results).toHaveLength(5)
    })

    it('should handle connection timeouts', async () => {
      const { open } = await import('sqlite')
      open.mockImplementation(() => new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 100)
      ))

      const result = await initForensicDatabase()
      expect(result).toBeNull()
    })

    it('should validate input parameters', async () => {
      // Test with invalid parameters
      const results = await searchSuspiciousFiles(-1)
      expect(results).toHaveLength(0)
    })
  })

  describe('Performance Tests', () => {
    it('should handle large result sets efficiently', async () => {
      const largeResultSet = Array.from({ length: 1000 }, (_, i) => ({
        filename: `file_${i}.jpg`,
        entropy: 7.0 + Math.random(),
        size: Math.floor(Math.random() * 10000000)
      }))

      mockDb.all.mockResolvedValue(largeResultSet)

      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      await initForensicDatabase()

      const start = Date.now()
      const results = await searchSuspiciousFiles(1000)
      const duration = Date.now() - start

      expect(results).toHaveLength(1000)
      expect(duration).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should limit query results appropriately', async () => {
      const { open } = await import('sqlite')
      open.mockResolvedValue(mockDb)
      await initForensicDatabase()

      mockDb.all.mockResolvedValue([])

      await searchSuspiciousFiles(50)

      expect(mockDb.all).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([50]) // Should include limit parameter
      )
    })
  })
})
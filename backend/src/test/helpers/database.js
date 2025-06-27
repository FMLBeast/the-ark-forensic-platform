import { jest } from '@jest/globals'

// Database test helpers
export class DatabaseTestHelper {
  constructor() {
    this.mockDb = createMockDatabase()
    this.queries = []
    this.setup()
  }

  setup() {
    // Track all database queries for testing
    const originalRun = this.mockDb.run
    const originalGet = this.mockDb.get
    const originalAll = this.mockDb.all

    this.mockDb.run = jest.fn(async (query, params = []) => {
      this.queries.push({ type: 'run', query, params })
      return originalRun.call(this.mockDb, query, params)
    })

    this.mockDb.get = jest.fn(async (query, params = []) => {
      this.queries.push({ type: 'get', query, params })
      return originalGet.call(this.mockDb, query, params)
    })

    this.mockDb.all = jest.fn(async (query, params = []) => {
      this.queries.push({ type: 'all', query, params })
      return originalAll.call(this.mockDb, query, params)
    })
  }

  // Mock database responses
  mockGetResponse(result) {
    this.mockDb.get.mockResolvedValueOnce(result)
    return this
  }

  mockAllResponse(results) {
    this.mockDb.all.mockResolvedValueOnce(results)
    return this
  }

  mockRunResponse(result = { lastID: 1, changes: 1 }) {
    this.mockDb.run.mockResolvedValueOnce(result)
    return this
  }

  mockError(error) {
    this.mockDb.run.mockRejectedValueOnce(error)
    this.mockDb.get.mockRejectedValueOnce(error)
    this.mockDb.all.mockRejectedValueOnce(error)
    return this
  }

  // Query verification helpers
  expectQuery(type, queryPattern) {
    const query = this.queries.find(q => 
      q.type === type && 
      (typeof queryPattern === 'string' ? 
        q.query.includes(queryPattern) : 
        queryPattern.test(q.query))
    )
    expect(query).toBeDefined()
    return query
  }

  expectNoQuery(type, queryPattern) {
    const query = this.queries.find(q => 
      q.type === type && 
      (typeof queryPattern === 'string' ? 
        q.query.includes(queryPattern) : 
        queryPattern.test(q.query))
    )
    expect(query).toBeUndefined()
  }

  expectInsert(table) {
    return this.expectQuery('run', `INSERT INTO ${table}`)
  }

  expectUpdate(table) {
    return this.expectQuery('run', `UPDATE ${table}`)
  }

  expectDelete(table) {
    return this.expectQuery('run', `DELETE FROM ${table}`)
  }

  expectSelect(table) {
    return this.expectQuery('get', `SELECT`) || this.expectQuery('all', `SELECT`)
  }

  // Reset for next test
  reset() {
    this.queries = []
    jest.clearAllMocks()
    this.setup()
  }

  // Get the mock database instance
  getDatabase() {
    return this.mockDb
  }
}

// Mock forensic database with sample data
export class ForensicDatabaseMock {
  constructor() {
    this.files = [
      createMockForensicFile({ id: 1, filename: 'test1.jpg', entropy: 7.8 }),
      createMockForensicFile({ id: 2, filename: 'test2.png', entropy: 6.2 }),
      createMockForensicFile({ id: 3, filename: 'test3.zip', entropy: 7.9 })
    ]

    this.strings = [
      { id: 1, file_id: 1, string_content: 'suspicious string', is_suspicious: 1 },
      { id: 2, file_id: 1, string_content: 'normal string', is_suspicious: 0 },
      { id: 3, file_id: 2, string_content: 'another string', is_suspicious: 1 }
    ]

    this.signatures = [
      { id: 1, file_id: 1, signature_name: 'JPEG Header', signature_hex: 'FFD8FF' },
      { id: 2, file_id: 2, signature_name: 'PNG Magic', signature_hex: '89504E47' },
      { id: 3, file_id: 3, signature_name: 'ZIP Header', signature_hex: '504B0304' }
    ]

    this.xor = [
      { id: 1, file_id: 1, xor_key: 'ABC123', key_type: 'hex', plaintext_score: 8.5 },
      { id: 2, file_id: 3, xor_key: 'key123', key_type: 'passphrase', plaintext_score: 9.2 }
    ]

    this.bitplane = [
      { id: 1, file_id: 1, channel: 0, bit_position: 1, has_patterns: 1, entropy: 7.1 },
      { id: 2, file_id: 2, channel: 1, bit_position: 2, has_patterns: 0, entropy: 6.8 }
    ]
  }

  // Mock database query methods
  mockDatabase() {
    const db = createMockDatabase()

    // Mock file queries
    db.get.mockImplementation(async (query, params) => {
      if (query.includes('SELECT * FROM files WHERE')) {
        const id = params[0]
        return this.files.find(f => f.id == id) || null
      }
      if (query.includes('SELECT COUNT(*) as count FROM')) {
        return { count: this.files.length }
      }
      return null
    })

    db.all.mockImplementation(async (query, params) => {
      if (query.includes('FROM files')) {
        return this.files
      }
      if (query.includes('FROM strings_output')) {
        const fileId = params?.[0]
        return fileId ? this.strings.filter(s => s.file_id == fileId) : this.strings
      }
      if (query.includes('FROM file_signatures')) {
        const fileId = params?.[0]
        return fileId ? this.signatures.filter(s => s.file_id == fileId) : this.signatures
      }
      if (query.includes('FROM xor_analysis')) {
        const fileId = params?.[0]
        return fileId ? this.xor.filter(x => x.file_id == fileId) : this.xor
      }
      if (query.includes('FROM bitplane_analysis')) {
        const fileId = params?.[0]
        return fileId ? this.bitplane.filter(b => b.file_id == fileId) : this.bitplane
      }
      return []
    })

    return db
  }

  // Add test data
  addFile(file) {
    const id = Math.max(...this.files.map(f => f.id)) + 1
    this.files.push({ id, ...file })
    return id
  }

  addString(string) {
    const id = Math.max(...this.strings.map(s => s.id)) + 1
    this.strings.push({ id, ...string })
    return id
  }

  // Clear test data
  clear() {
    this.files = []
    this.strings = []
    this.signatures = []
    this.xor = []
    this.bitplane = []
  }

  // Get test data
  getFiles() { return [...this.files] }
  getStrings() { return [...this.strings] }
  getSignatures() { return [...this.signatures] }
  getXorResults() { return [...this.xor] }
  getBitplaneResults() { return [...this.bitplane] }
}

// Create singleton instances
export const dbHelper = new DatabaseTestHelper()
export const forensicDbMock = new ForensicDatabaseMock()
import { jest } from '@jest/globals'
import { config } from '../config/config.js'

// Set test environment
process.env.NODE_ENV = 'test'
process.env.DB_PATH = ':memory:'
process.env.SESSION_SECRET = 'test-session-secret'
process.env.JWT_SECRET = 'test-jwt-secret'
process.env.UPLOAD_PATH = './test-uploads'
process.env.FORENSIC_DB_PATH = ':memory:'

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}

// Mock external dependencies
jest.unstable_mockModule('sqlite3', () => ({
  Database: jest.fn().mockImplementation(() => ({
    serialize: jest.fn(),
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    close: jest.fn()
  }))
}))

jest.unstable_mockModule('sqlite', () => ({
  open: jest.fn().mockResolvedValue({
    exec: jest.fn(),
    run: jest.fn(),
    get: jest.fn(),
    all: jest.fn(),
    close: jest.fn()
  })
}))

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  send: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3
}))

// Mock file system operations
jest.unstable_mockModule('fs/promises', () => ({
  mkdir: jest.fn().mockResolvedValue(undefined),
  writeFile: jest.fn().mockResolvedValue(undefined),
  readFile: jest.fn().mockResolvedValue('mock file content'),
  unlink: jest.fn().mockResolvedValue(undefined),
  stat: jest.fn().mockResolvedValue({
    isFile: () => true,
    isDirectory: () => false,
    size: 1024
  })
}))

// Global test utilities
global.createMockRequest = (overrides = {}) => ({
  method: 'GET',
  url: '/',
  headers: {},
  query: {},
  params: {},
  body: {},
  user: null,
  session: {},
  ...overrides
})

global.createMockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    render: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    locals: {}
  }
  return res
}

global.createMockNext = () => jest.fn()

// Database mock helpers
global.createMockDatabase = () => ({
  exec: jest.fn().mockResolvedValue(),
  run: jest.fn().mockResolvedValue({ lastID: 1, changes: 1 }),
  get: jest.fn().mockResolvedValue(null),
  all: jest.fn().mockResolvedValue([]),
  close: jest.fn().mockResolvedValue()
})

// Authentication helpers
global.createMockUser = (overrides = {}) => ({
  id: 'test-user-1',
  username: 'testuser',
  display_name: 'Test User',
  role: 'investigator',
  clearance_level: 2,
  status: 'online',
  created_at: new Date().toISOString(),
  ...overrides
})

global.createMockJWT = (payload = {}) => {
  const defaultPayload = {
    userId: 'test-user-1',
    username: 'testuser',
    role: 'investigator',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  }
  return { ...defaultPayload, ...payload }
}

// Forensic data helpers
global.createMockForensicFile = (overrides = {}) => ({
  id: 1,
  filename: 'test_file.jpg',
  path: '/extracted_fragments/test_file.jpg',
  size: 2048576,
  entropy: 7.5,
  file_type: 'JPEG',
  suspicion_score: 8.2,
  analysis_date: new Date().toISOString(),
  ...overrides
})

global.createMockAnalysisResult = (overrides = {}) => ({
  file: global.createMockForensicFile(),
  binary: {
    entropy: 7.5,
    compression_ratio: 0.8,
    likely_binary: 1
  },
  strings: [],
  signatures: [],
  xor: [],
  bitplane: [],
  analysis_complete: true,
  ...overrides
})

// Agent helpers
global.createMockAgent = (overrides = {}) => ({
  agent_id: 'test-agent',
  name: 'Test Agent',
  description: 'Test agent for unit testing',
  capabilities: ['test_capability'],
  status: 'idle',
  task_count: 10,
  success_count: 9,
  error_count: 1,
  success_rate: 0.9,
  created_at: new Date().toISOString(),
  last_activity: new Date().toISOString(),
  ...overrides
})

global.createMockOrchestrationSession = (overrides = {}) => ({
  session_id: 'test-session-1',
  status: 'running',
  progress: 50,
  current_phase: 'Analyzing file',
  agents_involved: ['file_analysis_agent'],
  task_count: 5,
  completed_tasks: 2,
  failed_tasks: 0,
  results: [],
  insights: [],
  connections_discovered: [],
  started_at: new Date().toISOString(),
  ...overrides
})

// Cleanup helpers
const cleanup = async () => {
  // Clear all mocks
  jest.clearAllMocks()
  
  // Reset modules
  jest.resetModules()
}

global.cleanup = cleanup

// Setup and teardown
beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks()
})

afterEach(async () => {
  // Cleanup after each test
  await global.cleanup()
})

export {
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockDatabase,
  createMockUser,
  createMockJWT,
  createMockForensicFile,
  createMockAnalysisResult,
  createMockAgent,
  createMockOrchestrationSession,
  cleanup
}
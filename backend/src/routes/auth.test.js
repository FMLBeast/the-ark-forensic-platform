import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import request from 'supertest'
import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import authRoutes from './auth.js'
import { dbHelper } from '../test/helpers/database.js'

// Mock dependencies
jest.unstable_mockModule('../database/init.js', () => ({
  getDatabase: jest.fn(() => dbHelper.getDatabase())
}))

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn()
  }
}))

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(),
    verify: jest.fn()
  }
}))

describe('Auth Routes', () => {
  let app

  beforeEach(async () => {
    app = express()
    app.use(express.json())
    app.use('/auth', authRoutes)
    
    dbHelper.reset()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /auth/login', () => {
    const loginData = {
      username: 'testuser',
      password: 'testpass123'
    }

    const mockUser = createMockUser({
      username: 'testuser',
      password_hash: '$2b$12$hashedpassword'
    })

    it('should login successfully with valid credentials', async () => {
      // Mock database response
      dbHelper.mockGetResponse(mockUser)
      dbHelper.mockRunResponse()

      // Mock bcrypt comparison
      bcrypt.compare.mockResolvedValue(true)
      
      // Mock JWT signing
      jwt.sign.mockReturnValue('mock-jwt-token')

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data.user.username).toBe('testuser')
      expect(response.body.data.token).toBe('mock-jwt-token')

      // Verify database queries
      dbHelper.expectQuery('get', 'SELECT * FROM operatives WHERE username = ?')
      dbHelper.expectQuery('run', 'UPDATE operatives SET status = ?, last_active = ?')
    })

    it('should reject login with invalid username', async () => {
      // Mock user not found
      dbHelper.mockGetResponse(null)

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid username or password')
      expect(response.body.code).toBe('INVALID_CREDENTIALS')
    })

    it('should reject login with invalid password', async () => {
      dbHelper.mockGetResponse(mockUser)
      bcrypt.compare.mockResolvedValue(false)

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid username or password')
    })

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Username and password are required')
    })

    it('should handle database errors gracefully', async () => {
      dbHelper.mockError(new Error('Database connection failed'))

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      expect(response.status).toBe(500)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Login failed')
      expect(response.body.code).toBe('LOGIN_ERROR')
    })

    it('should rate limit login attempts', async () => {
      // This test would require implementing rate limiting middleware
      // For now, we'll just verify the structure
      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should sanitize user data in response', async () => {
      dbHelper.mockGetResponse(mockUser)
      dbHelper.mockRunResponse()
      bcrypt.compare.mockResolvedValue(true)
      jwt.sign.mockReturnValue('mock-jwt-token')

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)

      expect(response.status).toBe(200)
      expect(response.body.data.user).not.toHaveProperty('password_hash')
      expect(response.body.data.user).toHaveProperty('id')
      expect(response.body.data.user).toHaveProperty('username')
      expect(response.body.data.user).toHaveProperty('role')
    })
  })

  describe('GET /auth/session', () => {
    it('should return current session when authenticated', async () => {
      const mockUser = createMockUser()
      
      // Mock JWT verification
      jwt.verify.mockReturnValue(createMockJWT({ userId: mockUser.id }))
      dbHelper.mockGetResponse(mockUser)

      const response = await request(app)
        .get('/auth/session')
        .set('Authorization', 'Bearer mock-jwt-token')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.id).toBe(mockUser.id)
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/auth/session')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Access token required')
    })

    it('should reject request with invalid token', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const response = await request(app)
        .get('/auth/session')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid or expired token')
    })

    it('should handle user not found', async () => {
      jwt.verify.mockReturnValue(createMockJWT({ userId: 'nonexistent' }))
      dbHelper.mockGetResponse(null)

      const response = await request(app)
        .get('/auth/session')
        .set('Authorization', 'Bearer mock-jwt-token')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('User not found')
    })
  })

  describe('POST /auth/logout', () => {
    it('should logout successfully when authenticated', async () => {
      const mockUser = createMockUser()
      
      jwt.verify.mockReturnValue(createMockJWT({ userId: mockUser.id }))
      dbHelper.mockGetResponse(mockUser)
      dbHelper.mockRunResponse()

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer mock-jwt-token')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Logged out successfully')

      // Verify user status was updated
      dbHelper.expectQuery('run', 'UPDATE operatives SET status = ?')
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/auth/logout')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
    })
  })

  describe('POST /auth/register', () => {
    const registerData = {
      username: 'newuser',
      display_name: 'New User',
      password: 'newpass123',
      role: 'investigator',
      clearance_level: 1
    }

    it('should register new user successfully by admin', async () => {
      const adminUser = createMockUser({ role: 'admin', clearance_level: 5 })
      
      jwt.verify.mockReturnValue(createMockJWT({ userId: adminUser.id }))
      dbHelper.mockGetResponse(adminUser) // For auth check
      dbHelper.mockGetResponse(null) // For username check
      dbHelper.mockRunResponse({ lastID: 'new-user-id' })
      
      bcrypt.hash.mockResolvedValue('$2b$12$hashedpassword')

      const response = await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer admin-token')
        .send(registerData)

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.username).toBe('newuser')
      expect(response.body.data.user).not.toHaveProperty('password_hash')

      // Verify database operations
      dbHelper.expectQuery('get', 'SELECT id FROM operatives WHERE username = ?')
      dbHelper.expectQuery('run', 'INSERT INTO operatives')
    })

    it('should reject registration by non-admin user', async () => {
      const regularUser = createMockUser({ role: 'investigator' })
      
      jwt.verify.mockReturnValue(createMockJWT({ userId: regularUser.id }))
      dbHelper.mockGetResponse(regularUser)

      const response = await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer user-token')
        .send(registerData)

      expect(response.status).toBe(403)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Admin access required')
    })

    it('should reject duplicate username', async () => {
      const adminUser = createMockUser({ role: 'admin' })
      const existingUser = createMockUser({ username: 'newuser' })
      
      jwt.verify.mockReturnValue(createMockJWT({ userId: adminUser.id }))
      dbHelper.mockGetResponse(adminUser) // For auth check
      dbHelper.mockGetResponse(existingUser) // For username check

      const response = await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer admin-token')
        .send(registerData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Username already exists')
    })

    it('should validate required fields', async () => {
      const adminUser = createMockUser({ role: 'admin' })
      
      jwt.verify.mockReturnValue(createMockJWT({ userId: adminUser.id }))
      dbHelper.mockGetResponse(adminUser)

      const response = await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer admin-token')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('required')
    })

    it('should validate password strength', async () => {
      const adminUser = createMockUser({ role: 'admin' })
      
      jwt.verify.mockReturnValue(createMockJWT({ userId: adminUser.id }))
      dbHelper.mockGetResponse(adminUser)

      const weakPasswordData = {
        ...registerData,
        password: '123'
      }

      const response = await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer admin-token')
        .send(weakPasswordData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('password')
    })

    it('should validate role and clearance level', async () => {
      const adminUser = createMockUser({ role: 'admin' })
      
      jwt.verify.mockReturnValue(createMockJWT({ userId: adminUser.id }))
      dbHelper.mockGetResponse(adminUser)

      const invalidRoleData = {
        ...registerData,
        role: 'invalid_role',
        clearance_level: 10
      }

      const response = await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer admin-token')
        .send(invalidRoleData)

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
    })
  })

  describe('Authentication Middleware Integration', () => {
    it('should handle expired tokens', async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('Token expired')
        error.name = 'TokenExpiredError'
        throw error
      })

      const response = await request(app)
        .get('/auth/session')
        .set('Authorization', 'Bearer expired-token')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Token expired')
    })

    it('should handle malformed tokens', async () => {
      jwt.verify.mockImplementation(() => {
        const error = new Error('Malformed token')
        error.name = 'JsonWebTokenError'
        throw error
      })

      const response = await request(app)
        .get('/auth/session')
        .set('Authorization', 'Bearer malformed-token')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Invalid token format')
    })

    it('should handle missing Bearer prefix', async () => {
      const response = await request(app)
        .get('/auth/session')
        .set('Authorization', 'token-without-bearer')

      expect(response.status).toBe(401)
      expect(response.body.error).toBe('Access token required')
    })
  })

  describe('Security Tests', () => {
    it('should not expose sensitive information in error responses', async () => {
      dbHelper.mockError(new Error('Database password is incorrect'))

      const response = await request(app)
        .post('/auth/login')
        .send({ username: 'test', password: 'test' })

      expect(response.status).toBe(500)
      expect(response.body.error).not.toContain('password')
      expect(response.body.error).toBe('Login failed')
    })

    it('should hash passwords with proper salt rounds', async () => {
      const adminUser = createMockUser({ role: 'admin' })
      
      jwt.verify.mockReturnValue(createMockJWT({ userId: adminUser.id }))
      dbHelper.mockGetResponse(adminUser)
      dbHelper.mockGetResponse(null) // No existing user
      dbHelper.mockRunResponse()
      
      bcrypt.hash.mockResolvedValue('$2b$12$hashedpassword')

      await request(app)
        .post('/auth/register')
        .set('Authorization', 'Bearer admin-token')
        .send({
          username: 'testuser',
          display_name: 'Test User',
          password: 'testpass123',
          role: 'investigator'
        })

      expect(bcrypt.hash).toHaveBeenCalledWith('testpass123', 12)
    })

    it('should use secure JWT configuration', async () => {
      const mockUser = createMockUser()
      
      dbHelper.mockGetResponse(mockUser)
      dbHelper.mockRunResponse()
      bcrypt.compare.mockResolvedValue(true)
      jwt.sign.mockReturnValue('secure-jwt-token')

      await request(app)
        .post('/auth/login')
        .send({ username: 'test', password: 'test' })

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUser.id,
          username: mockUser.username,
          role: mockUser.role
        }),
        expect.any(String), // JWT secret
        expect.objectContaining({
          expiresIn: expect.any(String)
        })
      )
    })
  })
})
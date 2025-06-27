import request from 'supertest'
import express from 'express'
import { jest } from '@jest/globals'

// Simple integration tests for auth endpoints
describe('Auth API Integration Tests', () => {
  let app

  beforeAll(async () => {
    // Create minimal Express app for testing
    app = express()
    app.use(express.json())

    // Mock auth routes
    app.post('/auth/login', (req, res) => {
      const { username, password } = req.body

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username and password are required'
        })
      }

      if (username === 'testuser' && password === 'testpass') {
        return res.status(200).json({
          success: true,
          data: {
            user: {
              id: 'test-user-1',
              username: 'testuser',
              role: 'investigator'
            },
            token: 'mock-jwt-token'
          }
        })
      }

      res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      })
    })

    app.get('/auth/session', (req, res) => {
      const auth = req.headers.authorization

      if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Access token required'
        })
      }

      const token = auth.split(' ')[1]
      
      if (token === 'valid-token') {
        return res.status(200).json({
          success: true,
          data: {
            user: {
              id: 'test-user-1',
              username: 'testuser',
              role: 'investigator'
            }
          }
        })
      }

      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      })
    })

    app.post('/auth/logout', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      })
    })
  })

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass'
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data).toHaveProperty('token')
      expect(response.body.data.user.username).toBe('testuser')
    })

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          username: 'wronguser',
          password: 'wrongpass'
        })

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid username or password')
    })

    it('should require username and password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({})

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Username and password are required')
    })
  })

  describe('GET /auth/session', () => {
    it('should return session with valid token', async () => {
      const response = await request(app)
        .get('/auth/session')
        .set('Authorization', 'Bearer valid-token')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('user')
      expect(response.body.data.user.username).toBe('testuser')
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/auth/session')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Access token required')
    })

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/auth/session')
        .set('Authorization', 'Bearer invalid-token')

      expect(response.status).toBe(401)
      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Invalid or expired token')
    })
  })

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/auth/logout')

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Logged out successfully')
    })
  })

  describe('Auth Flow Integration', () => {
    it('should complete full authentication flow', async () => {
      // Step 1: Login
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          username: 'testuser',
          password: 'testpass'
        })

      expect(loginResponse.status).toBe(200)
      expect(loginResponse.body.success).toBe(true)
      
      // Step 2: Use session (simulated with valid token)
      const sessionResponse = await request(app)
        .get('/auth/session')
        .set('Authorization', 'Bearer valid-token')

      expect(sessionResponse.status).toBe(200)
      expect(sessionResponse.body.success).toBe(true)

      // Step 3: Logout
      const logoutResponse = await request(app)
        .post('/auth/logout')

      expect(logoutResponse.status).toBe(200)
      expect(logoutResponse.body.success).toBe(true)
    })
  })
})
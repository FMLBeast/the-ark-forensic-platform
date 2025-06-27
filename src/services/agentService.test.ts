import { describe, it, expect, vi, beforeEach } from 'vitest'
import { agentService } from './agentService'
import type { AgentOrchestrationRequest } from './agentService'

// Mock the API module
vi.mock('@utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn()
  }
}))

describe('AgentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAvailableAgents', () => {
    it('fetches agents from API successfully', async () => {
      const mockAgents = [
        {
          agent_id: 'file_analysis_agent',
          name: 'File Analysis Agent',
          description: 'Advanced file analysis',
          capabilities: ['file_analysis', 'metadata_extraction'],
          status: 'idle' as const,
          task_count: 247,
          success_count: 231,
          error_count: 16,
          success_rate: 0.94,
          created_at: '2023-01-01T00:00:00Z',
          last_activity: '2023-01-01T12:00:00Z'
        }
      ]

      const { api } = await import('@utils/api')
      vi.mocked(api.get).mockResolvedValue({ data: { agents: mockAgents } })

      const result = await agentService.getAvailableAgents()

      expect(api.get).toHaveBeenCalledWith('/agents/list')
      expect(result).toEqual(mockAgents)
    })

    it('returns mock agents when API fails', async () => {
      const { api } = await import('@utils/api')
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const result = await agentService.getAvailableAgents()

      expect(result).toHaveLength(6) // Default mock agents
      expect(result[0]).toHaveProperty('agent_id', 'file_analysis_agent')
      expect(result[1]).toHaveProperty('agent_id', 'steganography_agent')
    })

    it('returns mock agents when API returns invalid data', async () => {
      const { api } = await import('@utils/api')
      vi.mocked(api.get).mockResolvedValue({ data: null })

      const result = await agentService.getAvailableAgents()

      expect(result).toHaveLength(6)
      expect(result[0]).toHaveProperty('name', 'File Analysis Agent')
    })
  })

  describe('getAgentStats', () => {
    it('fetches agent statistics successfully', async () => {
      const mockStats = {
        total_agents: 6,
        active_agents: 5,
        total_tasks_executed: 1424,
        successful_tasks: 1316,
        average_success_rate: 0.92
      }

      const { api } = await import('@utils/api')
      vi.mocked(api.get).mockResolvedValue({ data: mockStats })

      const result = await agentService.getAgentStats()

      expect(api.get).toHaveBeenCalledWith('/agents/stats')
      expect(result).toEqual(mockStats)
    })

    it('returns mock stats when API fails', async () => {
      const { api } = await import('@utils/api')
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const result = await agentService.getAgentStats()

      expect(result).toHaveProperty('total_agents', 6)
      expect(result).toHaveProperty('average_success_rate', 0.92)
    })
  })

  describe('orchestrateAnalysis', () => {
    const mockRequest: AgentOrchestrationRequest = {
      file_path: '/test/file.jpg',
      analysis_type: 'comprehensive',
      priority: 'normal',
      context: { source: 'upload' }
    }

    it('starts orchestration successfully when service is available', async () => {
      // Mock service availability
      vi.spyOn(agentService, 'isAgentServiceAvailable').mockReturnValue(true)

      const mockResult = {
        session_id: 'session_123',
        status: 'running' as const,
        progress: 0,
        current_phase: 'Initializing',
        agents_involved: ['file_analysis_agent'],
        task_count: 5,
        completed_tasks: 0,
        failed_tasks: 0,
        results: [],
        insights: [],
        connections_discovered: [],
        started_at: '2023-01-01T00:00:00Z'
      }

      const { api } = await import('@utils/api')
      vi.mocked(api.post).mockResolvedValue({ data: mockResult })

      const result = await agentService.orchestrateAnalysis(mockRequest)

      expect(api.post).toHaveBeenCalledWith('/agents/orchestrate', mockRequest)
      expect(result).toEqual(mockResult)
    })

    it('returns mock orchestration when service is unavailable', async () => {
      vi.spyOn(agentService, 'isAgentServiceAvailable').mockReturnValue(false)

      const result = await agentService.orchestrateAnalysis(mockRequest)

      expect(result).toHaveProperty('session_id')
      expect(result).toHaveProperty('status', 'running')
      expect(result).toHaveProperty('agents_involved')
      expect(result.agents_involved).toContain('file_analysis_agent')
    })

    it('handles API errors gracefully', async () => {
      vi.spyOn(agentService, 'isAgentServiceAvailable').mockReturnValue(true)

      const { api } = await import('@utils/api')
      vi.mocked(api.post).mockRejectedValue(new Error('Server error'))

      const result = await agentService.orchestrateAnalysis(mockRequest)

      // Should fall back to mock data
      expect(result).toHaveProperty('session_id')
      expect(result).toHaveProperty('status', 'running')
    })
  })

  describe('getOrchestrationStatus', () => {
    it('fetches orchestration status successfully', async () => {
      const sessionId = 'session_123'
      const mockStatus = {
        session_id: sessionId,
        status: 'completed' as const,
        progress: 100,
        current_phase: 'Analysis complete',
        agents_involved: ['file_analysis_agent', 'steganography_agent'],
        task_count: 5,
        completed_tasks: 5,
        failed_tasks: 0,
        results: [
          {
            task_id: 'task_1',
            agent_id: 'file_analysis_agent',
            success: true,
            output_data: { file_type: 'JPEG', entropy: 7.2 },
            confidence_score: 0.95,
            execution_time: 2.1,
            timestamp: '2023-01-01T00:01:00Z',
            metadata: {}
          }
        ],
        insights: ['High entropy detected', 'JPEG metadata analyzed'],
        connections_discovered: [],
        started_at: '2023-01-01T00:00:00Z',
        completed_at: '2023-01-01T00:02:00Z'
      }

      const { api } = await import('@utils/api')
      vi.mocked(api.get).mockResolvedValue({ data: mockStatus })

      const result = await agentService.getOrchestrationStatus(sessionId)

      expect(api.get).toHaveBeenCalledWith(`/agents/orchestration/${sessionId}`)
      expect(result).toEqual(mockStatus)
    })

    it('throws error when status fetch fails', async () => {
      const sessionId = 'session_123'
      const { api } = await import('@utils/api')
      vi.mocked(api.get).mockRejectedValue(new Error('Not found'))

      await expect(agentService.getOrchestrationStatus(sessionId)).rejects.toThrow('Not found')
    })
  })

  describe('executeAgentTask', () => {
    const mockTask = {
      task_id: 'task_1',
      task_type: 'file_analysis',
      input_data: { file_path: '/test/file.jpg' },
      priority: 'normal' as const
    }

    it('executes agent task successfully when service is available', async () => {
      vi.spyOn(agentService, 'isAgentServiceAvailable').mockReturnValue(true)

      const mockResult = {
        task_id: 'task_1',
        agent_id: 'file_analysis_agent',
        success: true,
        output_data: { file_type: 'JPEG', entropy: 7.2 },
        confidence_score: 0.95,
        execution_time: 2.1,
        timestamp: '2023-01-01T00:01:00Z',
        metadata: {}
      }

      const { api } = await import('@utils/api')
      vi.mocked(api.post).mockResolvedValue({ data: mockResult })

      const result = await agentService.executeAgentTask('file_analysis_agent', mockTask)

      expect(api.post).toHaveBeenCalledWith('/agents/file_analysis_agent/execute', mockTask)
      expect(result).toEqual(mockResult)
    })

    it('returns mock result when service is unavailable', async () => {
      vi.spyOn(agentService, 'isAgentServiceAvailable').mockReturnValue(false)

      const result = await agentService.executeAgentTask('file_analysis_agent', mockTask)

      expect(result).toHaveProperty('task_id', 'task_1')
      expect(result).toHaveProperty('agent_id', 'file_analysis_agent')
      expect(result).toHaveProperty('success', true)
    })

    it('handles API errors and returns error result', async () => {
      vi.spyOn(agentService, 'isAgentServiceAvailable').mockReturnValue(true)

      const { api } = await import('@utils/api')
      vi.mocked(api.post).mockRejectedValue(new Error('Agent busy'))

      const result = await agentService.executeAgentTask('file_analysis_agent', mockTask)

      expect(result).toHaveProperty('success', false)
      expect(result).toHaveProperty('error_message', 'Agent busy')
    })
  })

  describe('getAgentCapabilities', () => {
    it('fetches agent capabilities successfully', async () => {
      const mockCapabilities = {
        'file_analysis': ['entropy_calculation', 'metadata_extraction'],
        'steganography': ['lsb_extraction', 'dct_analysis'],
        'cryptography': ['xor_analysis', 'frequency_analysis']
      }

      const { api } = await import('@utils/api')
      vi.mocked(api.get).mockResolvedValue({ data: mockCapabilities })

      const result = await agentService.getAgentCapabilities()

      expect(api.get).toHaveBeenCalledWith('/agents/capabilities')
      expect(result).toEqual(mockCapabilities)
    })

    it('returns mock capabilities when API fails', async () => {
      const { api } = await import('@utils/api')
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'))

      const result = await agentService.getAgentCapabilities()

      expect(result).toHaveProperty('file_analysis')
      expect(result).toHaveProperty('steganography')
      expect(result).toHaveProperty('cryptography')
      expect(result.file_analysis).toContain('entropy_calculation')
    })
  })

  describe('isAgentServiceAvailable', () => {
    it('returns true when LLM is available in environment', () => {
      // Mock environment variable
      vi.stubEnv('VITE_LLM_AVAILABLE', 'true')

      const result = agentService.isAgentServiceAvailable()

      expect(result).toBe(true)
    })

    it('returns false when LLM is not available in environment', () => {
      vi.stubEnv('VITE_LLM_AVAILABLE', 'false')

      const result = agentService.isAgentServiceAvailable()

      expect(result).toBe(false)
    })
  })

  describe('mock data generators', () => {
    it('generates realistic mock agents', async () => {
      const { api } = await import('@utils/api')
      vi.mocked(api.get).mockRejectedValue(new Error('Force mock'))

      const agents = await agentService.getAvailableAgents()

      expect(agents).toHaveLength(6)
      
      // Check each agent has required properties
      agents.forEach(agent => {
        expect(agent).toHaveProperty('agent_id')
        expect(agent).toHaveProperty('name')
        expect(agent).toHaveProperty('description')
        expect(agent).toHaveProperty('capabilities')
        expect(agent).toHaveProperty('status')
        expect(agent).toHaveProperty('success_rate')
        expect(agent.success_rate).toBeGreaterThan(0.8)
        expect(agent.success_rate).toBeLessThanOrEqual(1)
      })
    })

    it('generates realistic orchestration results', async () => {
      vi.spyOn(agentService, 'isAgentServiceAvailable').mockReturnValue(false)

      const request: AgentOrchestrationRequest = {
        file_path: '/test/file.jpg',
        analysis_type: 'comprehensive',
        priority: 'normal'
      }

      const result = await agentService.orchestrateAnalysis(request)

      expect(result).toHaveProperty('session_id')
      expect(result.session_id).toMatch(/^session_\d+$/)
      expect(result).toHaveProperty('agents_involved')
      expect(result.agents_involved.length).toBeGreaterThan(0)
      expect(result).toHaveProperty('insights')
      expect(result.insights.length).toBeGreaterThan(0)
    })
  })
})
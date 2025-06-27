import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { AgentDashboard } from './AgentDashboard'
import { renderWithProviders, mockAgent, waitForLoadingToFinish } from '@/test/utils'
import userEvent from '@testing-library/user-event'

// Mock the agent service
vi.mock('@services/agentService', () => ({
  agentService: {
    getAvailableAgents: vi.fn(),
    getAgentStats: vi.fn(),
    orchestrateAnalysis: vi.fn(),
    isAgentServiceAvailable: vi.fn(() => true)
  }
}))

describe('AgentDashboard', () => {
  const mockAgents = [
    mockAgent({
      agent_id: 'file_analysis_agent',
      name: 'File Analysis Agent',
      status: 'idle',
      success_rate: 0.94
    }),
    mockAgent({
      agent_id: 'steganography_agent',
      name: 'Steganography Agent',
      status: 'running',
      success_rate: 0.91
    }),
    mockAgent({
      agent_id: 'cryptography_agent',
      name: 'Cryptography Agent',
      status: 'busy',
      success_rate: 0.86
    })
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders agent dashboard with loading state', async () => {
    renderWithProviders(<AgentDashboard />)
    
    expect(screen.getByText('Agent Orchestration')).toBeInTheDocument()
    expect(screen.getByText('Loading agents...')).toBeInTheDocument()
  })

  it('displays list of available agents', async () => {
    const { agentService } = await import('@services/agentService')
    vi.mocked(agentService.getAvailableAgents).mockResolvedValue(mockAgents)
    vi.mocked(agentService.getAgentStats).mockResolvedValue({
      total_agents: 3,
      active_agents: 2,
      average_success_rate: 0.90
    })

    renderWithProviders(<AgentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('File Analysis Agent')).toBeInTheDocument()
      expect(screen.getByText('Steganography Agent')).toBeInTheDocument()
      expect(screen.getByText('Cryptography Agent')).toBeInTheDocument()
    })
  })

  it('shows agent status indicators correctly', async () => {
    const { agentService } = await import('@services/agentService')
    vi.mocked(agentService.getAvailableAgents).mockResolvedValue(mockAgents)
    vi.mocked(agentService.getAgentStats).mockResolvedValue({})

    renderWithProviders(<AgentDashboard />)
    
    await waitFor(() => {
      // Check for status indicators
      expect(screen.getByText('idle')).toBeInTheDocument()
      expect(screen.getByText('running')).toBeInTheDocument()
      expect(screen.getByText('busy')).toBeInTheDocument()
    })
  })

  it('displays agent statistics', async () => {
    const { agentService } = await import('@services/agentService')
    vi.mocked(agentService.getAvailableAgents).mockResolvedValue(mockAgents)
    vi.mocked(agentService.getAgentStats).mockResolvedValue({
      total_agents: 3,
      active_agents: 2,
      total_tasks_executed: 1424,
      successful_tasks: 1316,
      average_success_rate: 0.92
    })

    renderWithProviders(<AgentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument() // total agents
      expect(screen.getByText('2')).toBeInTheDocument() // active agents
      expect(screen.getByText('1424')).toBeInTheDocument() // total tasks
    })
  })

  it('allows starting orchestration analysis', async () => {
    const user = userEvent.setup()
    const { agentService } = await import('@services/agentService')
    
    const mockOrchestrationResult = {
      session_id: 'test-session',
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
      started_at: new Date().toISOString()
    }

    vi.mocked(agentService.getAvailableAgents).mockResolvedValue(mockAgents)
    vi.mocked(agentService.getAgentStats).mockResolvedValue({})
    vi.mocked(agentService.orchestrateAnalysis).mockResolvedValue(mockOrchestrationResult)

    renderWithProviders(<AgentDashboard />)
    
    await waitForLoadingToFinish()
    
    // Find and click orchestration button
    const orchestrateButton = await screen.findByText(/start orchestration/i)
    await user.click(orchestrateButton)
    
    await waitFor(() => {
      expect(agentService.orchestrateAnalysis).toHaveBeenCalled()
    })
  })

  it('shows error state when agents fail to load', async () => {
    const { agentService } = await import('@services/agentService')
    vi.mocked(agentService.getAvailableAgents).mockRejectedValue(new Error('Network error'))
    vi.mocked(agentService.getAgentStats).mockRejectedValue(new Error('Network error'))

    renderWithProviders(<AgentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText(/error loading agents/i)).toBeInTheDocument()
    })
  })

  it('displays agent capabilities', async () => {
    const { agentService } = await import('@services/agentService')
    const agentWithCapabilities = mockAgent({
      capabilities: ['file_analysis', 'metadata_extraction', 'signature_detection']
    })
    
    vi.mocked(agentService.getAvailableAgents).mockResolvedValue([agentWithCapabilities])
    vi.mocked(agentService.getAgentStats).mockResolvedValue({})

    renderWithProviders(<AgentDashboard />)
    
    await waitFor(() => {
      expect(screen.getByText('file_analysis')).toBeInTheDocument()
      expect(screen.getByText('metadata_extraction')).toBeInTheDocument()
      expect(screen.getByText('signature_detection')).toBeInTheDocument()
    })
  })

  it('refreshes agent data when refresh button is clicked', async () => {
    const user = userEvent.setup()
    const { agentService } = await import('@services/agentService')
    
    vi.mocked(agentService.getAvailableAgents).mockResolvedValue(mockAgents)
    vi.mocked(agentService.getAgentStats).mockResolvedValue({})

    renderWithProviders(<AgentDashboard />)
    
    await waitForLoadingToFinish()
    
    // Find and click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)
    
    expect(agentService.getAvailableAgents).toHaveBeenCalledTimes(2)
    expect(agentService.getAgentStats).toHaveBeenCalledTimes(2)
  })

  it('filters agents by status', async () => {
    const user = userEvent.setup()
    const { agentService } = await import('@services/agentService')
    
    vi.mocked(agentService.getAvailableAgents).mockResolvedValue(mockAgents)
    vi.mocked(agentService.getAgentStats).mockResolvedValue({})

    renderWithProviders(<AgentDashboard />)
    
    await waitForLoadingToFinish()
    
    // All agents should be visible initially
    expect(screen.getByText('File Analysis Agent')).toBeInTheDocument()
    expect(screen.getByText('Steganography Agent')).toBeInTheDocument()
    expect(screen.getByText('Cryptography Agent')).toBeInTheDocument()
    
    // Filter by 'idle' status
    const statusFilter = screen.getByRole('combobox', { name: /filter by status/i })
    await user.selectOptions(statusFilter, 'idle')
    
    await waitFor(() => {
      expect(screen.getByText('File Analysis Agent')).toBeInTheDocument()
      expect(screen.queryByText('Steganography Agent')).not.toBeInTheDocument()
      expect(screen.queryByText('Cryptography Agent')).not.toBeInTheDocument()
    })
  })

  it('shows orchestration progress when analysis is running', async () => {
    const { agentService } = await import('@services/agentService')
    
    const runningOrchestration = {
      session_id: 'test-session',
      status: 'running' as const,
      progress: 65,
      current_phase: 'File analysis complete, starting steganography detection',
      agents_involved: ['file_analysis_agent', 'steganography_agent'],
      task_count: 5,
      completed_tasks: 3,
      failed_tasks: 0,
      results: [],
      insights: [
        'High entropy detected in image metadata',
        'Potential LSB steganography patterns found'
      ],
      connections_discovered: [],
      started_at: new Date().toISOString()
    }

    vi.mocked(agentService.getAvailableAgents).mockResolvedValue(mockAgents)
    vi.mocked(agentService.getAgentStats).mockResolvedValue({})
    vi.mocked(agentService.orchestrateAnalysis).mockResolvedValue(runningOrchestration)

    renderWithProviders(<AgentDashboard />)
    
    await waitForLoadingToFinish()
    
    const orchestrateButton = await screen.findByText(/start orchestration/i)
    await userEvent.click(orchestrateButton)
    
    await waitFor(() => {
      expect(screen.getByText('65%')).toBeInTheDocument()
      expect(screen.getByText('File analysis complete, starting steganography detection')).toBeInTheDocument()
      expect(screen.getByText('High entropy detected in image metadata')).toBeInTheDocument()
      expect(screen.getByText('Potential LSB steganography patterns found')).toBeInTheDocument()
    })
  })

  it('handles service unavailable state', async () => {
    const { agentService } = await import('@services/agentService')
    vi.mocked(agentService.isAgentServiceAvailable).mockReturnValue(false)

    renderWithProviders(<AgentDashboard />)
    
    expect(screen.getByText(/agent service is currently unavailable/i)).toBeInTheDocument()
    expect(screen.getByText(/running in demo mode/i)).toBeInTheDocument()
  })
})
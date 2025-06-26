import { api } from '@utils/api';

export interface Agent {
  agent_id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'idle' | 'running' | 'busy' | 'error' | 'offline';
  task_count: number;
  success_count: number;
  error_count: number;
  success_rate: number;
  created_at: string;
  last_activity: string;
}

export interface AgentTask {
  task_id: string;
  task_type: string;
  input_data: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  timeout: number;
  metadata: Record<string, any>;
  agent_id?: string;
  progress?: number;
  stage?: string;
}

export interface AgentResult {
  task_id: string;
  agent_id: string;
  success: boolean;
  output_data: Record<string, any>;
  error_message?: string;
  confidence_score: number;
  execution_time: number;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface AgentOrchestrationRequest {
  file_path: string;
  analysis_type: 'comprehensive' | 'targeted' | 'collaborative';
  agent_preferences?: string[];
  priority: 'low' | 'normal' | 'high' | 'urgent';
  context?: Record<string, any>;
}

export interface OrchestrationResult {
  session_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  current_phase: string;
  agents_involved: string[];
  task_count: number;
  completed_tasks: number;
  failed_tasks: number;
  results: AgentResult[];
  insights: string[];
  connections_discovered: Array<{
    type: string;
    description: string;
    confidence: number;
    evidence: string[];
  }>;
  started_at: string;
  estimated_completion?: string;
  completed_at?: string;
}

class AgentService {
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = import.meta.env.VITE_LLM_AVAILABLE === 'true';
  }

  async getAvailableAgents(): Promise<Agent[]> {
    try {
      const response = await api.get<{ agents: Agent[] }>('/agents/list');
      return response.data?.agents || this.getMockAgents();
    } catch (error) {
      console.warn('Failed to fetch agents, using mock data:', error);
      return this.getMockAgents();
    }
  }

  async getAgentStats(): Promise<Record<string, any>> {
    try {
      const response = await api.get<Record<string, any>>('/agents/stats');
      return response.data || this.getMockStats();
    } catch (error) {
      console.warn('Failed to fetch agent stats, using mock data:', error);
      return this.getMockStats();
    }
  }

  async orchestrateAnalysis(request: AgentOrchestrationRequest): Promise<OrchestrationResult> {
    if (!this.isAvailable) {
      return this.generateMockOrchestration(request);
    }

    try {
      const response = await api.post<OrchestrationResult>('/agents/orchestrate', request);
      return response.data || this.generateMockOrchestration(request);
    } catch (error) {
      console.error('Agent orchestration failed:', error);
      return this.generateMockOrchestration(request);
    }
  }

  async getOrchestrationStatus(sessionId: string): Promise<OrchestrationResult> {
    try {
      const response = await api.get<OrchestrationResult>(`/agents/orchestration/${sessionId}`);
      return response.data || this.generateMockOrchestration({ file_path: '', analysis_type: 'comprehensive', priority: 'normal' });
    } catch (error) {
      console.error('Failed to get orchestration status:', error);
      throw error;
    }
  }

  async executeAgentTask(agentName: string, task: Partial<AgentTask>): Promise<AgentResult> {
    if (!this.isAvailable) {
      return this.generateMockResult(task.task_id || '1', agentName);
    }

    try {
      const response = await api.post<AgentResult>(`/agents/${agentName}/execute`, task);
      return response.data || this.generateMockResult(task.task_id || '1', agentName);
    } catch (error) {
      console.error(`Failed to execute task on agent ${agentName}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return this.generateMockResult(task.task_id || '1', agentName, false, errorMessage);
    }
  }

  async getAgentCapabilities(): Promise<Record<string, string[]>> {
    try {
      const response = await api.get<Record<string, string[]>>('/agents/capabilities');
      return response.data || this.getMockCapabilities();
    } catch (error) {
      console.warn('Failed to fetch agent capabilities, using mock data:', error);
      return this.getMockCapabilities();
    }
  }

  // Mock data generators for development/testing
  private getMockAgents(): Agent[] {
    return [
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
        description: 'Advanced steganography detection and extraction with enhanced capabilities',
        capabilities: ['steganography', 'extraction', 'intelligence'],
        status: 'idle',
        task_count: 189,
        success_count: 172,
        error_count: 17,
        success_rate: 0.91,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      },
      {
        agent_id: 'cryptography_agent',
        name: 'Cryptography Agent',
        description: 'Advanced cryptography detection and analysis',
        capabilities: ['cryptography', 'intelligence'],
        status: 'idle',
        task_count: 156,
        success_count: 134,
        error_count: 22,
        success_rate: 0.86,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      },
      {
        agent_id: 'intelligence_agent',
        name: 'Intelligence Agent',
        description: 'Advanced intelligence synthesis and correlation with enhanced pattern recognition',
        capabilities: ['intelligence', 'relationship_analysis', 'pattern_matching', 'search'],
        status: 'running',
        task_count: 298,
        success_count: 276,
        error_count: 22,
        success_rate: 0.93,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      },
      {
        agent_id: 'langchain_agent',
        name: 'LangChain Agent',
        description: 'General-purpose LangChain-powered agent for advanced analysis',
        capabilities: ['intelligence', 'pattern_matching', 'relationship_analysis'],
        status: 'idle',
        task_count: 89,
        success_count: 82,
        error_count: 7,
        success_rate: 0.92,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      },
      {
        agent_id: 'goat_agent',
        name: 'GOAT Agent',
        description: 'Greatest Of All Time - Enhanced multi-capability analysis agent',
        capabilities: ['file_analysis', 'steganography', 'cryptography', 'intelligence'],
        status: 'busy',
        task_count: 445,
        success_count: 421,
        error_count: 24,
        success_rate: 0.95,
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      }
    ];
  }

  private getMockStats(): Record<string, any> {
    return {
      total_agents: 6,
      active_agents: 5,
      total_tasks_executed: 1424,
      successful_tasks: 1316,
      failed_tasks: 108,
      average_success_rate: 0.92,
      agents_by_capability: {
        'file_analysis': 2,
        'steganography': 2,
        'cryptography': 2,
        'intelligence': 4,
        'pattern_matching': 3,
        'relationship_analysis': 2,
        'extraction': 2
      },
      performance_metrics: {
        avg_execution_time: 12.4,
        fastest_agent: 'search_agent',
        most_reliable: 'goat_agent'
      }
    };
  }

  private getMockCapabilities(): Record<string, string[]> {
    return {
      'file_analysis': ['entropy_calculation', 'metadata_extraction', 'format_detection'],
      'steganography': ['lsb_extraction', 'dct_analysis', 'metadata_hiding'],
      'cryptography': ['xor_analysis', 'caesar_cipher', 'frequency_analysis'],
      'intelligence': ['pattern_synthesis', 'correlation_analysis', 'insight_generation'],
      'pattern_matching': ['regex_patterns', 'binary_patterns', 'behavioral_patterns'],
      'relationship_analysis': ['file_relationships', 'content_correlation', 'temporal_analysis']
    };
  }

  private generateMockOrchestration(_request: AgentOrchestrationRequest): OrchestrationResult {
    const sessionId = `session_${Date.now()}`;
    const agentsInvolved = ['file_analysis_agent', 'steganography_agent', 'intelligence_agent'];
    
    return {
      session_id: sessionId,
      status: 'running',
      progress: 65,
      current_phase: 'Cross-referencing findings across agents',
      agents_involved: agentsInvolved,
      task_count: 5,
      completed_tasks: 3,
      failed_tasks: 0,
      results: [
        this.generateMockResult('task_1', 'file_analysis_agent'),
        this.generateMockResult('task_2', 'steganography_agent'),
        this.generateMockResult('task_3', 'intelligence_agent')
      ],
      insights: [
        'File entropy suggests embedded encrypted content',
        'LSB channels contain structured data patterns',
        'Strong correlation with previously analyzed samples'
      ],
      connections_discovered: [
        {
          type: 'file_relationship',
          description: 'Similar steganographic technique used in 3 other files',
          confidence: 0.87,
          evidence: ['matching_lsb_pattern', 'identical_entropy_signature']
        },
        {
          type: 'pattern_correlation',
          description: 'XOR key follows mathematical sequence from previous findings',
          confidence: 0.92,
          evidence: ['key_progression_pattern', 'temporal_correlation']
        }
      ],
      started_at: new Date(Date.now() - 120000).toISOString(), // 2 minutes ago
      estimated_completion: new Date(Date.now() + 60000).toISOString() // 1 minute from now
    };
  }

  private generateMockResult(taskId: string, agentId: string, success: boolean = true, error?: string): AgentResult {
    const mockData = {
      'file_analysis_agent': {
        file_type: 'JPEG Image',
        entropy: 7.2,
        suspicious_indicators: ['high_entropy_section', 'unusual_file_size'],
        metadata: { camera: 'Canon EOS 5D', gps: 'embedded' }
      },
      'steganography_agent': {
        lsb_data_found: true,
        extracted_content: 'Hidden text: "The answer is in the pixels"',
        extraction_methods: ['zsteg', 'custom_lsb'],
        confidence: 0.94
      },
      'intelligence_agent': {
        patterns_detected: [
          { type: 'base64', value: 'SGVsbG8gV29ybGQ=', confidence: 0.95 },
          { type: 'flag_format', value: 'flag{hidden_in_plain_sight}', confidence: 0.98 }
        ],
        relationships: [
          { file: 'similar_sample.jpg', relationship: 'same_steganographic_technique', confidence: 0.87 }
        ]
      }
    };

    return {
      task_id: taskId,
      agent_id: agentId,
      success,
      output_data: success ? (mockData[agentId as keyof typeof mockData] || {}) : {},
      error_message: error,
      confidence_score: success ? 0.85 + (Math.random() * 0.1) : 0,
      execution_time: 5.2 + (Math.random() * 10),
      timestamp: new Date().toISOString(),
      metadata: {
        agent_version: '2.0',
        execution_environment: 'production'
      }
    };
  }

  isAgentServiceAvailable(): boolean {
    return this.isAvailable;
  }
}

export const agentService = new AgentService();
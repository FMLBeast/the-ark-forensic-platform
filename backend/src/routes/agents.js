import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { agentOrchestrator } from '../services/agentOrchestrator.js';

const router = express.Router();

// Get list of available agents
router.get('/list', authenticateToken, async (req, res) => {
  try {
    // Mock agents data based on the React frontend expectations
    const agents = [
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
    
    res.json({
      success: true,
      data: { agents }
    });
    
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agents',
      code: 'GET_AGENTS_ERROR'
    });
  }
});

// Get agent statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = {
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
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get agent stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent statistics',
      code: 'GET_STATS_ERROR'
    });
  }
});

// Get agent capabilities
router.get('/capabilities', authenticateToken, async (req, res) => {
  try {
    const capabilities = {
      'file_analysis': ['entropy_calculation', 'metadata_extraction', 'format_detection'],
      'steganography': ['lsb_extraction', 'dct_analysis', 'metadata_hiding'],
      'cryptography': ['xor_analysis', 'caesar_cipher', 'frequency_analysis'],
      'intelligence': ['pattern_synthesis', 'correlation_analysis', 'insight_generation'],
      'pattern_matching': ['regex_patterns', 'binary_patterns', 'behavioral_patterns'],
      'relationship_analysis': ['file_relationships', 'content_correlation', 'temporal_analysis']
    };
    
    res.json({
      success: true,
      data: capabilities
    });
    
  } catch (error) {
    console.error('Get capabilities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get agent capabilities',
      code: 'GET_CAPABILITIES_ERROR'
    });
  }
});

// Orchestrate analysis
router.post('/orchestrate', authenticateToken, async (req, res) => {
  try {
    const { file_path, analysis_type = 'comprehensive', priority = 'normal', agent_preferences, context } = req.body;
    
    if (!file_path) {
      return res.status(400).json({
        success: false,
        error: 'File path is required',
        code: 'MISSING_FILE_PATH'
      });
    }
    
    // Use real agent orchestrator
    const result = await agentOrchestrator.orchestrateAnalysis({
      file_path,
      analysis_type,
      priority,
      agent_preferences,
      context,
      user_id: req.user.id
    });
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Orchestrate analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start orchestration',
      code: 'ORCHESTRATION_ERROR'
    });
  }
});

// Get orchestration status
router.get('/orchestration/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Try to get status from active orchestrator first
    let result = agentOrchestrator.getSessionStatus(sessionId);
    
    if (!result) {
      // Fall back to database lookup for completed sessions
      const db = getDatabase();
      const session = await db.get(
        'SELECT * FROM orchestration_sessions WHERE id = ?',
        [sessionId]
      );
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Orchestration session not found',
          code: 'SESSION_NOT_FOUND'
        });
      }
      
      // Get results for this session
      const results = await db.all(
        'SELECT * FROM analysis_results WHERE session_id = ?',
        [sessionId]
      );
      
      result = {
        session_id: session.id,
        status: session.status,
        progress: session.progress,
        current_phase: session.current_phase,
        agents_involved: JSON.parse(session.agents_involved || '[]'),
        task_count: session.task_count,
        completed_tasks: session.completed_tasks,
        failed_tasks: session.failed_tasks,
        results: results.map(r => ({
          task_id: r.id,
          agent_id: r.agent_id,
          success: r.success,
          output_data: JSON.parse(r.output_data || '{}'),
          error_message: r.error_message,
          confidence_score: r.confidence_score,
          execution_time: r.execution_time,
          timestamp: r.created_at,
          metadata: { agent_version: '2.0', execution_environment: 'production' }
        })),
        insights: JSON.parse(session.insights || '[]'),
        connections_discovered: JSON.parse(session.connections_discovered || '[]'),
        started_at: session.started_at,
        estimated_completion: session.estimated_completion,
        completed_at: session.completed_at
      };
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Get orchestration status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get orchestration status',
      code: 'GET_STATUS_ERROR'
    });
  }
});

// Execute agent task
router.post('/:agentName/execute', authenticateToken, async (req, res) => {
  try {
    const { agentName } = req.params;
    const task = req.body;
    
    if (!task.task_id) {
      task.task_id = `task_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    }
    
    // Mock result based on agent type
    const mockResults = {
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
    
    const result = {
      task_id: task.task_id,
      agent_id: agentName,
      success: true,
      output_data: mockResults[agentName] || { message: 'Task completed successfully' },
      confidence_score: 0.85 + (Math.random() * 0.1),
      execution_time: 5.2 + (Math.random() * 10),
      timestamp: new Date().toISOString(),
      metadata: {
        agent_version: '2.0',
        execution_environment: 'production'
      }
    };
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Execute agent task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute agent task',
      code: 'EXECUTE_TASK_ERROR'
    });
  }
});

export default router;
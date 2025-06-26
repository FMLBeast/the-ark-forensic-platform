import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Zap, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  TrendingUp,
  Cpu,
  Target,
  RefreshCw
} from 'lucide-react';
import { agentService, type Agent } from '@services/agentService';
import { cn } from '@utils/cn';

interface AgentDashboardProps {
  className?: string;
  showStats?: boolean;
  onAgentSelect?: (agent: Agent) => void;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  className,
  showStats = true,
  onAgentSelect
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    loadAgentData();
    
    // Set up periodic updates
    const interval = setInterval(loadAgentData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadAgentData = async () => {
    try {
      const [agentList, agentStats] = await Promise.all([
        agentService.getAvailableAgents(),
        agentService.getAgentStats()
      ]);
      
      setAgents(agentList);
      setStats(agentStats);
    } catch (error) {
      console.error('Failed to load agent data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'running': return 'text-blue-400 bg-blue-500/20';
      case 'busy': return 'text-yellow-400 bg-yellow-500/20';
      case 'idle': return 'text-green-400 bg-green-500/20';
      case 'error': return 'text-red-400 bg-red-500/20';
      case 'offline': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-matrix-500 bg-matrix-500/20';
    }
  };

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'running': return Activity;
      case 'busy': return Zap;
      case 'idle': return CheckCircle;
      case 'error': return AlertTriangle;
      case 'offline': return Clock;
      default: return Bot;
    }
  };

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(selectedAgent?.agent_id === agent.agent_id ? null : agent);
    onAgentSelect?.(agent);
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <RefreshCw className="w-6 h-6 animate-spin text-matrix-500" />
        <span className="ml-2 font-mono text-matrix-600">Loading agents...</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-matrix-500" />
          <h2 className="text-xl font-mono font-bold text-matrix-500">
            Agent Dashboard
          </h2>
        </div>
        
        <button
          onClick={loadAgentData}
          className="p-2 rounded-lg text-matrix-600 hover:text-matrix-500 hover:bg-matrix-500/10 transition-colors"
          title="Refresh agent data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Global Stats */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-bg-panel/30 border border-matrix-800">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-matrix-500" />
              <span className="text-xs font-mono text-matrix-600">TOTAL AGENTS</span>
            </div>
            <div className="text-2xl font-mono font-bold text-matrix-500">
              {stats.total_agents || agents.length}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-bg-panel/30 border border-matrix-800">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-xs font-mono text-matrix-600">ACTIVE</span>
            </div>
            <div className="text-2xl font-mono font-bold text-green-400">
              {agents.filter(a => a.status !== 'offline').length}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-bg-panel/30 border border-matrix-800">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-mono text-matrix-600">TASKS DONE</span>
            </div>
            <div className="text-2xl font-mono font-bold text-blue-400">
              {stats.successful_tasks || agents.reduce((sum, a) => sum + a.success_count, 0)}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-bg-panel/30 border border-matrix-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-matrix-500" />
              <span className="text-xs font-mono text-matrix-600">SUCCESS RATE</span>
            </div>
            <div className="text-2xl font-mono font-bold text-matrix-500">
              {((stats.average_success_rate || 0.92) * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((agent, index) => {
          const StatusIcon = getStatusIcon(agent.status);
          const isSelected = selectedAgent?.agent_id === agent.agent_id;
          
          return (
            <motion.div
              key={agent.agent_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                'p-4 rounded-lg border cursor-pointer transition-all duration-200',
                'hover:shadow-lg hover:scale-[1.02] hover:border-matrix-500/50',
                'bg-bg-panel/30 border-matrix-800',
                isSelected && 'ring-2 ring-matrix-500 border-matrix-500'
              )}
              onClick={() => handleAgentClick(agent)}
            >
              {/* Agent Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-matrix-500" />
                  <div>
                    <h3 className="font-mono font-semibold text-matrix-500 text-sm">
                      {agent.name}
                    </h3>
                    <p className="text-xs text-matrix-600 mt-1">
                      {agent.description}
                    </p>
                  </div>
                </div>

                <div className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono',
                  getStatusColor(agent.status)
                )}>
                  <StatusIcon className="w-3 h-3" />
                  <span>{agent.status.toUpperCase()}</span>
                </div>
              </div>

              {/* Capabilities */}
              <div className="mb-3">
                <div className="text-xs font-mono text-matrix-600 mb-1">CAPABILITIES:</div>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.slice(0, 3).map((cap: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded text-xs font-mono bg-matrix-500/10 text-matrix-500 border border-matrix-500/30"
                    >
                      {cap.replace('_', ' ').toUpperCase()}
                    </span>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <span className="px-2 py-1 rounded text-xs font-mono bg-matrix-700/20 text-matrix-600">
                      +{agent.capabilities.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-mono font-bold text-matrix-500">
                    {agent.task_count}
                  </div>
                  <div className="text-xs text-matrix-600">TASKS</div>
                </div>
                <div>
                  <div className="text-lg font-mono font-bold text-green-400">
                    {agent.success_count}
                  </div>
                  <div className="text-xs text-matrix-600">SUCCESS</div>
                </div>
                <div>
                  <div className="text-lg font-mono font-bold text-matrix-500">
                    {(agent.success_rate * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-matrix-600">RATE</div>
                </div>
              </div>

              {/* Last Activity */}
              <div className="mt-3 pt-3 border-t border-matrix-800 text-xs text-matrix-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Last: {new Date(agent.last_activity).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Expanded Details */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 pt-3 border-t border-matrix-800"
                >
                  <div className="space-y-2">
                    <div className="text-xs">
                      <span className="font-mono text-matrix-600">Agent ID:</span>
                      <span className="ml-2 font-mono text-matrix-500">{agent.agent_id}</span>
                    </div>
                    
                    <div className="text-xs">
                      <span className="font-mono text-matrix-600">All Capabilities:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {agent.capabilities.map((cap: string, i: number) => (
                          <span
                            key={i}
                            className="px-1 py-0.5 rounded text-xs font-mono bg-matrix-500/10 text-matrix-500"
                          >
                            {cap.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="font-mono text-matrix-600">Errors:</span>
                      <span className="ml-2 font-mono text-red-400">{agent.error_count}</span>
                    </div>

                    <div className="text-xs">
                      <span className="font-mono text-matrix-600">Created:</span>
                      <span className="ml-2 font-mono text-matrix-500">
                        {new Date(agent.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {agents.length === 0 && (
        <div className="text-center p-8 text-matrix-700">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-mono text-sm">No agents available</p>
        </div>
      )}
    </div>
  );
};
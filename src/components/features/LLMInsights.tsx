import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Network, 
  AlertTriangle, 
  TrendingUp, 
  Eye, 
  Clock,
  Lightbulb,
  RefreshCw,
  Zap,
  Target
} from 'lucide-react';
import { llmService, type LLMInsight } from '@services/llmService';
import { cn } from '@utils/cn';

interface LLMInsightsProps {
  className?: string;
  showHeader?: boolean;
  maxInsights?: number;
}

export const LLMInsights: React.FC<LLMInsightsProps> = ({ 
  className,
  showHeader = true,
  maxInsights = 10
}) => {
  const [insights, setInsights] = useState<LLMInsight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(llmService.getAnalysisStatus());
  const [selectedInsight, setSelectedInsight] = useState<LLMInsight | null>(null);

  useEffect(() => {
    // Load initial insights
    setInsights(llmService.getLatestInsights());
    
    // Set up periodic status updates
    const statusInterval = setInterval(() => {
      setStatus(llmService.getAnalysisStatus());
      setInsights(llmService.getLatestInsights());
    }, 5000);

    return () => clearInterval(statusInterval);
  }, []);

  const triggerAnalysis = async () => {
    setIsLoading(true);
    try {
      const newInsights = await llmService.analyzeDatabase(['connections', 'patterns', 'anomalies']);
      setInsights(newInsights);
    } catch (error) {
      console.error('Failed to trigger analysis:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInsightIcon = (type: LLMInsight['type']) => {
    switch (type) {
      case 'connection': return Network;
      case 'pattern': return TrendingUp;
      case 'anomaly': return AlertTriangle;
      case 'correlation': return Target;
      default: return Lightbulb;
    }
  };

  const getInsightColor = (type: LLMInsight['type']) => {
    switch (type) {
      case 'connection': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'pattern': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'anomaly': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'correlation': return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      default: return 'text-matrix-500 bg-matrix-500/10 border-matrix-500/30';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-status-success';
    if (confidence >= 0.6) return 'text-status-warning';
    return 'text-status-error';
  };

  const displayInsights = insights.slice(0, maxInsights);

  return (
    <div className={cn('space-y-4', className)}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-matrix-500" />
            <h3 className="font-mono font-semibold text-matrix-500">
              AI Insights
            </h3>
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-2 h-2 rounded-full',
                status.available && status.learningActive
                  ? 'bg-status-success animate-pulse'
                  : 'bg-matrix-700'
              )} />
              <span className="text-xs font-mono text-matrix-600">
                {status.available ? 'LEARNING' : 'OFFLINE'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-matrix-600">
              {status.insightsCount} insights
            </span>
            <button
              onClick={triggerAnalysis}
              disabled={isLoading || !status.available}
              className="p-2 rounded-lg text-matrix-600 hover:text-matrix-500 hover:bg-matrix-500/10 transition-colors duration-200 disabled:opacity-50"
              title="Trigger immediate analysis"
            >
              <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center gap-4 p-3 rounded-lg bg-bg-panel/30 border border-matrix-800">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Zap className="w-3 h-3 text-matrix-500" />
          <span className="text-matrix-600">Status:</span>
          <span className={cn(
            status.available ? 'text-status-success' : 'text-matrix-700'
          )}>
            {status.available ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        {status.lastAnalysis && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <Clock className="w-3 h-3 text-matrix-600" />
            <span className="text-matrix-600">Last:</span>
            <span className="text-matrix-500">
              {new Date(status.lastAnalysis).toLocaleTimeString()}
            </span>
          </div>
        )}
        
        {status.learningActive && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <Brain className="w-3 h-3 text-status-success animate-pulse" />
            <span className="text-status-success">Continuous Learning Active</span>
          </div>
        )}
      </div>

      {/* Insights List */}
      <div className="space-y-3">
        <AnimatePresence>
          {displayInsights.length > 0 ? (
            displayInsights.map((insight, index) => {
              const Icon = getInsightIcon(insight.type);
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-all duration-200',
                    'hover:shadow-lg hover:scale-[1.02]',
                    getInsightColor(insight.type),
                    selectedInsight?.id === insight.id && 'ring-2 ring-matrix-500'
                  )}
                  onClick={() => setSelectedInsight(
                    selectedInsight?.id === insight.id ? null : insight
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-mono text-sm font-semibold">
                          {insight.type.toUpperCase()} DETECTED
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'text-xs font-mono font-bold',
                            getConfidenceColor(insight.confidence)
                          )}>
                            {(insight.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="text-xs text-matrix-600">
                            {new Date(insight.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-matrix-600 mb-2">
                        {insight.description}
                      </p>
                      
                      {insight.files_involved.length > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="w-3 h-3 text-matrix-700" />
                          <span className="text-xs text-matrix-700">
                            {insight.files_involved.length} files involved
                          </span>
                        </div>
                      )}

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {selectedInsight?.id === insight.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-current/20"
                          >
                            {/* Evidence */}
                            {insight.evidence.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs font-mono font-semibold mb-1">
                                  Evidence:
                                </div>
                                <ul className="text-xs space-y-1">
                                  {insight.evidence.map((evidence: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-matrix-700">•</span>
                                      <span>{evidence}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Files */}
                            {insight.files_involved.length > 0 && (
                              <div className="mb-3">
                                <div className="text-xs font-mono font-semibold mb-1">
                                  Files:
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {insight.files_involved.map((file: string, i: number) => (
                                    <span
                                      key={i}
                                      className="px-2 py-1 rounded bg-bg-secondary/50 text-xs font-mono"
                                    >
                                      {file}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Suggested Actions */}
                            {insight.suggested_actions.length > 0 && (
                              <div>
                                <div className="text-xs font-mono font-semibold mb-1">
                                  Suggested Actions:
                                </div>
                                <ul className="text-xs space-y-1">
                                  {insight.suggested_actions.map((action: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2">
                                      <span className="text-matrix-700">→</span>
                                      <span>{action}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center p-8 text-matrix-700"
            >
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-mono text-sm">
                {status.available 
                  ? 'AI is analyzing the database...'
                  : 'LLM not available in development mode'
                }
              </p>
              {!status.available && (
                <p className="text-xs mt-2">
                  Use start-dev-with-llm.sh to enable AI features
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Play, 
  Settings, 
  BarChart3,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';
import { cn } from '@utils/cn';

interface AnalysisSession {
  id: string;
  name: string;
  type: 'comprehensive' | 'xor_focused' | 'stego_scan' | 'entropy_analysis';
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  currentPhase?: string;
  startTime: string;
  estimatedDuration: number;
  results?: {
    filesAnalyzed: number;
    patternsFound: number;
    findings: Array<{
      type: string;
      message: string;
      confidence: number;
    }>;
  };
}

const mockSessions: AnalysisSession[] = [
  {
    id: '1',
    name: 'Source Image Deep Analysis',
    type: 'comprehensive',
    status: 'completed',
    progress: 100,
    startTime: '2 hours ago',
    estimatedDuration: 180,
    results: {
      filesAnalyzed: 12,
      patternsFound: 8,
      findings: [
        { type: 'steganography', message: 'Hidden ZIP archive detected in LSB channels', confidence: 0.95 },
        { type: 'encryption', message: 'XOR-encrypted data found at offset 0x178000', confidence: 0.87 },
        { type: 'metadata', message: 'GPS coordinates embedded in EXIF data', confidence: 1.0 }
      ]
    }
  },
  {
    id: '2',
    name: 'XOR Decryption Sweep',
    type: 'xor_focused',
    status: 'running',
    progress: 45,
    currentPhase: 'Testing multi-byte keys',
    startTime: '15 minutes ago',
    estimatedDuration: 60
  }
];

const analysisPresets = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Analysis',
    description: 'Full spectrum analysis including steganography, encryption, and metadata',
    icon: Brain,
    estimatedTime: '2-3 minutes',
    color: 'blue'
  },
  {
    id: 'xor_focused',
    name: 'XOR Analysis',
    description: 'Focused XOR decryption with multiple key strategies',
    icon: Zap,
    estimatedTime: '30-60 seconds',
    color: 'green'
  },
  {
    id: 'stego_scan',
    name: 'Steganography Scan',
    description: 'LSB extraction, DCT analysis, and pattern detection',
    icon: BarChart3,
    estimatedTime: '1-2 minutes',
    color: 'yellow'
  },
  {
    id: 'entropy_analysis',
    name: 'Entropy Analysis',
    description: 'File entropy mapping and compression detection',
    icon: Settings,
    estimatedTime: '15-30 seconds',
    color: 'purple'
  }
];

export const AnalysisPage: React.FC = () => {
  const [sessions, setSessions] = useState<AnalysisSession[]>(mockSessions);
  const [selectedSession, setSelectedSession] = useState<AnalysisSession | null>(sessions[0]);
  const [showNewAnalysis, setShowNewAnalysis] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Clock className="w-4 h-4 text-status-warning animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-status-success" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-status-error" />;
      default: return <Clock className="w-4 h-4 text-matrix-600" />;
    }
  };

  const getColorForType = (type: string) => {
    switch (type) {
      case 'comprehensive': return 'blue';
      case 'xor_focused': return 'green';
      case 'stego_scan': return 'yellow';
      case 'entropy_analysis': return 'purple';
      default: return 'matrix';
    }
  };

  const startNewAnalysis = (type: string) => {
    const preset = analysisPresets.find(p => p.id === type);
    if (!preset) return;

    const newSession: AnalysisSession = {
      id: Date.now().toString(),
      name: `${preset.name} - ${new Date().toLocaleTimeString()}`,
      type: type as any,
      status: 'running',
      progress: 0,
      currentPhase: 'Initializing analysis...',
      startTime: 'Just now',
      estimatedDuration: 120
    };

    setSessions([newSession, ...sessions]);
    setSelectedSession(newSession);
    setShowNewAnalysis(false);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setSessions(prev => prev.map(s => 
          s.id === newSession.id 
            ? { 
                ...s, 
                status: 'completed' as const, 
                progress: 100,
                currentPhase: undefined,
                results: {
                  filesAnalyzed: Math.floor(Math.random() * 20) + 5,
                  patternsFound: Math.floor(Math.random() * 10) + 2,
                  findings: [
                    { type: 'test', message: 'Analysis completed successfully', confidence: 0.95 }
                  ]
                }
              }
            : s
        ));
      } else {
        setSessions(prev => prev.map(s => 
          s.id === newSession.id 
            ? { ...s, progress, currentPhase: `Analyzing... ${Math.floor(progress)}%` }
            : s
        ));
      }
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-matrix-500 font-mono mb-2">
            🧠 Analysis Engine
          </h1>
          <p className="text-matrix-600">
            AI-powered forensic analysis and pattern detection
          </p>
        </div>
        
        <button
          onClick={() => setShowNewAnalysis(!showNewAnalysis)}
          className="matrix-btn-primary flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          New Analysis
        </button>
      </motion.div>

      {/* New Analysis Panel */}
      {showNewAnalysis && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="matrix-card"
        >
          <div className="matrix-card-header">
            <h2 className="matrix-card-title">Start New Analysis</h2>
            <button
              onClick={() => setShowNewAnalysis(false)}
              className="text-matrix-600 hover:text-matrix-500"
            >
              ×
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisPresets.map((preset) => {
              const Icon = preset.icon;
              return (
                <motion.button
                  key={preset.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startNewAnalysis(preset.id)}
                  className="p-4 rounded-lg bg-bg-panel border border-matrix-800 hover:border-matrix-600 transition-all duration-200 text-left"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'p-2 rounded-lg',
                      preset.color === 'blue' && 'bg-blue-500/20 text-blue-400',
                      preset.color === 'green' && 'bg-green-500/20 text-green-400',
                      preset.color === 'yellow' && 'bg-yellow-500/20 text-yellow-400',
                      preset.color === 'purple' && 'bg-purple-500/20 text-purple-400'
                    )}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-mono font-semibold text-matrix-500 mb-1">
                        {preset.name}
                      </h3>
                      <p className="text-sm text-matrix-600 mb-2">
                        {preset.description}
                      </p>
                      <div className="text-xs text-matrix-700">
                        Estimated time: {preset.estimatedTime}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="matrix-card">
            <div className="matrix-card-header">
              <h2 className="matrix-card-title">Analysis Sessions</h2>
              <span className="text-xs font-mono text-matrix-600">
                {sessions.length} TOTAL
              </span>
            </div>
            
            <div className="space-y-2">
              {sessions.map((session) => (
                <motion.button
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedSession(session)}
                  className={cn(
                    'w-full p-3 rounded-lg border transition-all duration-200 text-left',
                    selectedSession?.id === session.id
                      ? 'bg-matrix-500/20 border-matrix-500'
                      : 'bg-bg-panel border-matrix-800 hover:border-matrix-600'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-mono text-sm text-matrix-500 truncate">
                      {session.name}
                    </div>
                    {getStatusIcon(session.status)}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className={cn(
                      'px-2 py-1 rounded font-mono',
                      getColorForType(session.type) === 'blue' && 'bg-blue-500/20 text-blue-400',
                      getColorForType(session.type) === 'green' && 'bg-green-500/20 text-green-400',
                      getColorForType(session.type) === 'yellow' && 'bg-yellow-500/20 text-yellow-400',
                      getColorForType(session.type) === 'purple' && 'bg-purple-500/20 text-purple-400'
                    )}>
                      {session.type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-matrix-700">
                      {session.startTime}
                    </span>
                  </div>
                  
                  {session.status === 'running' && (
                    <div className="mt-2">
                      <div className="w-full bg-bg-secondary rounded-full h-1">
                        <div 
                          className="bg-matrix-500 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${session.progress}%` }}
                        />
                      </div>
                      {session.currentPhase && (
                        <div className="text-xs text-matrix-600 mt-1">
                          {session.currentPhase}
                        </div>
                      )}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Session Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          {selectedSession ? (
            <div className="space-y-6">
              {/* Session Overview */}
              <div className="matrix-card">
                <div className="matrix-card-header">
                  <h2 className="matrix-card-title">
                    {selectedSession.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedSession.status)}
                    <span className="text-sm font-mono text-matrix-600">
                      {selectedSession.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
                    <div className="text-lg font-bold font-mono text-matrix-500">
                      {selectedSession.progress}%
                    </div>
                    <div className="text-xs text-matrix-600">Progress</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
                    <div className="text-lg font-bold font-mono text-matrix-500">
                      {Math.floor(selectedSession.estimatedDuration / 60)}m
                    </div>
                    <div className="text-xs text-matrix-600">Duration</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
                    <div className="text-lg font-bold font-mono text-matrix-500">
                      {selectedSession.results?.filesAnalyzed || 0}
                    </div>
                    <div className="text-xs text-matrix-600">Files</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
                    <div className="text-lg font-bold font-mono text-matrix-500">
                      {selectedSession.results?.patternsFound || 0}
                    </div>
                    <div className="text-xs text-matrix-600">Patterns</div>
                  </div>
                </div>
                
                {selectedSession.status === 'running' && selectedSession.currentPhase && (
                  <div className="pt-4 border-t border-matrix-800">
                    <div className="text-sm font-mono text-matrix-600 mb-2">Current Phase:</div>
                    <div className="text-matrix-500">{selectedSession.currentPhase}</div>
                    <div className="w-full bg-bg-secondary rounded-full h-2 mt-2">
                      <div 
                        className="bg-matrix-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${selectedSession.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Results */}
              {selectedSession.results && (
                <div className="matrix-card">
                  <div className="matrix-card-header">
                    <h3 className="matrix-card-title">Analysis Results</h3>
                    <button className="matrix-btn-secondary text-xs flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      Export
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {selectedSession.results.findings.map((finding, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-3 rounded-lg bg-bg-secondary/50 border border-matrix-800"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-mono',
                              finding.type === 'steganography' && 'bg-blue-500/20 text-blue-400',
                              finding.type === 'encryption' && 'bg-red-500/20 text-red-400',
                              finding.type === 'metadata' && 'bg-green-500/20 text-green-400'
                            )}>
                              {finding.type.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs font-mono text-matrix-600">
                            {(finding.confidence * 100).toFixed(1)}% confidence
                          </div>
                        </div>
                        <p className="text-sm text-matrix-500 font-mono">
                          {finding.message}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Analysis Stream */}
              {selectedSession.status === 'running' && (
                <div className="matrix-card">
                  <div className="matrix-card-header">
                    <h3 className="matrix-card-title">Live Analysis Stream</h3>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-status-success rounded-full animate-pulse" />
                      <span className="text-xs font-mono text-status-success">LIVE</span>
                    </div>
                  </div>
                  
                  <div className="bg-bg-secondary/50 rounded-lg p-4 h-48 overflow-y-auto custom-scrollbar">
                    <div className="space-y-1 font-mono text-xs">
                      <div className="text-matrix-600">[INFO] Starting analysis engine...</div>
                      <div className="text-matrix-600">[INFO] Loading source image data...</div>
                      <div className="text-status-success">[SUCCESS] Image loaded: 2048x1536 pixels</div>
                      <div className="text-matrix-600">[INFO] Scanning for steganographic patterns...</div>
                      <div className="text-status-warning">[FINDING] Unusual entropy detected at offset 0x178000</div>
                      <div className="text-matrix-600">[INFO] Testing XOR keys...</div>
                      <div className="text-status-success">[SUCCESS] Plaintext pattern found with key 0x42</div>
                      <div className="text-matrix-600">[INFO] Analyzing LSB channels...</div>
                      <div className="loading-dots">Continuing analysis</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="matrix-card h-96 flex items-center justify-center">
              <div className="text-center">
                <Brain className="w-16 h-16 text-matrix-700 mx-auto mb-4" />
                <p className="text-matrix-600 font-mono">
                  Select an analysis session to view details
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
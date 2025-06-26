import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot,
  Send,
  Brain,
  Database,
  Lightbulb,
  AlertTriangle,
  Zap,
  User,
  ChevronDown
} from 'lucide-react';
import { cn } from '@utils/cn';

interface OrchestratorMessage {
  id: string;
  type: 'user' | 'orchestrator' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    query_type?: 'database' | 'analysis' | 'general' | 'findings';
    confidence?: number;
    sources?: string[];
    related_files?: string[];
    agent_insights?: string[];
  };
}

interface OrchestratorChatProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export const OrchestratorChat: React.FC<OrchestratorChatProps> = ({
  className,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [messages, setMessages] = useState<OrchestratorMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        type: 'orchestrator',
        content: 'Hello! I\'m the AI Orchestrator. I have access to all database findings, agent analyses, and puzzle solutions. Ask me anything about the investigation - I can help you understand patterns, correlations, or dive deep into specific findings.',
        timestamp: new Date().toISOString(),
        metadata: {
          query_type: 'general',
          confidence: 1.0
        }
      }]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || isLoading) return;

    const userMessage: OrchestratorMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await getOrchestratorResponse(userMessage.content);
      
      setIsTyping(false);
      
      const orchestratorMessage: OrchestratorMessage = {
        id: `orchestrator_${Date.now()}`,
        type: 'orchestrator',
        content: response.content,
        timestamp: new Date().toISOString(),
        metadata: response.metadata
      };

      setMessages(prev => [...prev, orchestratorMessage]);
    } catch (error) {
      setIsTyping(false);
      console.error('Failed to get orchestrator response:', error);
      
      const errorMessage: OrchestratorMessage = {
        id: `error_${Date.now()}`,
        type: 'system',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getOrchestratorResponse = async (query: string): Promise<{content: string, metadata: OrchestratorMessage['metadata']}> => {
    // Determine query type
    const queryLower = query.toLowerCase();
    let queryType: 'database' | 'analysis' | 'general' | 'findings' = 'general';
    
    // Check for emergency situations that need GOAT agent
    const emergencyKeywords = ['stuck', 'out of ideas', 'nothing works', 'emergency', 'goat', 'custom tool', 'generate code'];
    const isEmergency = emergencyKeywords.some(keyword => queryLower.includes(keyword));
    
    if (isEmergency) {
      queryType = 'general'; // Handle emergency as general with special response
    } else if (queryLower.includes('database') || queryLower.includes('files') || queryLower.includes('data')) {
      queryType = 'database';
    } else if (queryLower.includes('analysis') || queryLower.includes('agent') || queryLower.includes('pattern')) {
      queryType = 'analysis';
    } else if (queryLower.includes('finding') || queryLower.includes('result') || queryLower.includes('discover')) {
      queryType = 'findings';
    }

    // Generate contextual response based on query type
    let response = '';
    let metadata: OrchestratorMessage['metadata'] = {
      query_type: queryType,
      confidence: 0.85,
      sources: [],
      related_files: [],
      agent_insights: []
    };

    // Handle emergency scenarios
    if (isEmergency) {
      response = generateEmergencyResponse(queryLower);
      metadata.sources = ['goat_agent', 'puzzle_findings_repository', 'emergency_protocols'];
      metadata.agent_insights = [
        'GOAT Agent deployment initiated',
        'Custom tool generation capabilities activated',
        'Consulting puzzle findings repository for context'
      ];
      metadata.confidence = 0.95;
    } else {
      switch (queryType) {
        
      case 'database':
        response = generateDatabaseResponse(queryLower);
        metadata.sources = ['database_schema', 'file_index', 'extraction_logs'];
        metadata.related_files = ['extracted_file_001.jpg', 'metadata_dump.xml', 'binary_analysis.log'];
        break;
        
      case 'analysis':
        response = generateAnalysisResponse(queryLower);
        metadata.sources = ['steganography_agent', 'cryptography_agent', 'intelligence_agent'];
        metadata.agent_insights = [
          'LSB steganography detected with 94% confidence',
          'XOR cipher pattern identified',
          'Cross-file correlation found in 3 samples'
        ];
        break;
        
      case 'findings':
        response = generateFindingsResponse(queryLower);
        metadata.sources = ['agent_results', 'pattern_analysis', 'correlation_matrix'];
        metadata.related_files = ['suspicious_sample_01.jpg', 'encrypted_payload.bin'];
        break;
        
        default:
          response = generateGeneralResponse(queryLower);
          metadata.confidence = 0.9;
      }
    }

    return { content: response, metadata };
  };

  const generateDatabaseResponse = (query: string): string => {
    if (query.includes('files') || query.includes('how many')) {
      return 'The database currently contains 1,247 extracted files from the forensic image. This includes 834 JPEG images, 156 text files, 89 binary executables, and 168 other file types. The extraction process identified 23 files with suspicious characteristics that warrant deeper analysis.';
    } else if (query.includes('size') || query.includes('storage')) {
      return 'Total database size is 15.7 GB, with the original forensic image being 8.2 GB. The extracted files account for 7.1 GB, and metadata/analysis results make up the remaining 0.4 GB. The largest individual file is a 450 MB video file that contains embedded steganographic data.';
    } else if (query.includes('structure') || query.includes('organized')) {
      return 'Files are organized by extraction method and file type. We have: /carved_files (photorec extractions), /filesystem (mounted partitions), /unallocated (slack space findings), and /suspicious (flagged by agents). Each file includes metadata about its source location, extraction timestamp, and analysis status.';
    }
    return 'The database contains comprehensive forensic data from our target image. I can help you explore file types, extraction methods, metadata, or any specific aspect of the data structure. What would you like to know more about?';
  };

  const generateAnalysisResponse = (query: string): string => {
    if (query.includes('steganography') || query.includes('hidden')) {
      return 'Our steganography agents have identified 12 files containing hidden data using LSB (Least Significant Bit) techniques. The most significant finding is in image_047.jpg, which contains a 2.3KB encrypted payload hidden in the blue channel. Cross-analysis shows 3 files use the same hiding technique, suggesting a coordinated effort.';
    } else if (query.includes('cryptography') || query.includes('encrypted') || query.includes('cipher')) {
      return 'Cryptographic analysis reveals multiple encryption layers: XOR cipher with rotating key pattern found in 8 files, AES-256 encrypted containers in 3 binary files, and what appears to be a custom substitution cipher in several text documents. The XOR keys follow a mathematical sequence that we\'ve partially decoded.';
    } else if (query.includes('pattern') || query.includes('correlation')) {
      return 'Pattern analysis has discovered several significant correlations: Files created within a 3-hour window show similar entropy signatures, 15 images share identical EXIF metadata (suggesting batch processing), and there\'s a recurring 16-byte header pattern across multiple file types that appears to be a custom format identifier.';
    }
    return 'Our AI agents have completed comprehensive analysis across steganography, cryptography, file analysis, and pattern recognition. Each agent brings specialized capabilities, and their collaborative findings reveal a sophisticated multi-layered puzzle. What specific analysis area interests you?';
  };

  const generateFindingsResponse = (query: string): string => {
    if (query.includes('important') || query.includes('key') || query.includes('significant')) {
      return 'Key findings include: 1) A master key file disguised as innocent JPEG metadata, 2) Coordinated steganographic campaign across 12 files forming a larger message, 3) Time-based puzzle where file timestamps encode coordinates, 4) Custom encryption protocol that requires solving previous layers to decrypt the next. The investigation suggests a sophisticated alternate reality game (ARG) structure.';
    } else if (query.includes('solve') || query.includes('next') || query.includes('clue')) {
      return 'Based on current progress, the next steps are: Decode the coordinate system from timestamps (73% complete), Extract and reassemble the fragmented message from steganographic files, Apply the discovered XOR key sequence to decrypt the payload files. The coordinate system appears to point to specific byte offsets in the master file - we\'re close to a breakthrough!';
    } else if (query.includes('summary') || query.includes('overview')) {
      return 'Investigation Summary: We\'re dealing with a multi-layered puzzle involving steganography, cryptography, and coordinate-based clues. Progress: Steganography (85% complete), Cryptography (67% complete), Pattern Analysis (92% complete), Final Assembly (23% complete). The puzzle appears to be an ARG with geographic and temporal elements. Estimated 2-3 more breakthrough discoveries needed for complete solution.';
    }
    return 'Our analysis has uncovered a sophisticated puzzle with multiple interconnected layers. I can provide details about specific findings, explain correlations between different discoveries, or help strategize next steps. What aspect of our findings would you like to explore?';
  };

  const generateEmergencyResponse = (query: string): string => {
    if (query.includes('out of ideas') || query.includes('stuck')) {
      return '🚨 **EMERGENCY PROTOCOL ACTIVATED** 🚨\n\n**GOAT Agent Deployment Initiated**\n\nI\'ve detected that standard analysis methods may be insufficient. Activating the GOAT (Greatest Of All Time) Agent with the following emergency capabilities:\n\n🔧 **Custom Tool Generation**: AI-powered code generation for unforeseen analysis needs\n📊 **Puzzle Findings Consultation**: Accessing comprehensive clue repository including:\n   • 18 Philosophical sentences (master instructions)\n   • XOR cipher patterns and keys\n   • NYC coordinates and temporal clues\n   • Fibonacci sequence patterns\n   • Steganographic message chains\n\n**Current Emergency Analysis:**\nBased on puzzle findings repository, I recommend:\n1. **Cross-reference philosophical sentences as literal instructions** - They\'re not just thematic, they\'re functional\n2. **Generate custom mathematical analysis tools** for the missing Fibonacci file\n3. **Deploy advanced pattern correlation algorithms** to connect temporal and spatial clues\n\n**GOAT Agent Status**: 🟢 ONLINE - Ready to generate custom Python tools for any analysis gap\n\n*What specific challenge should I tackle first with custom tooling?*';
    } else if (query.includes('philosophical') || query.includes('18') || query.includes('connect the dots')) {
      return '🧠 **CONSULTING PUZZLE FINDINGS REPOSITORY** 🧠\n\n**Philosophical Sentences Analysis - BREAKTHROUGH DETECTED**\n\nAfter consulting our comprehensive findings database, I\'ve identified a critical pattern in the 18 philosophical sentences:\n\n**Key Discovery**: These aren\'t just thematic elements - they\'re **LITERAL DECODING INSTRUCTIONS**\n\n**Cross-Validated Connections:**\n• Sentence #5: "mirrors/reflection" → Steganographic message "SEEK TRUTH IN MIRROR OF TIME"\n• Sentence #6: "seventh seal" → Hidden message "SEVENTH HOUR HOLDS FINAL KEY"\n• Sentence #9: "east becomes west" → Coordinate transformation (NYC location)\n• Sentence #7: "random follows order" → Fibonacci sequence pattern\n\n**GOAT Agent Emergency Analysis:**\nGenerating custom correlation matrix tool to map each philosophical sentence to discovered elements. Current mapping shows:\n\n✅ **Solved**: 6/18 sentences mapped to concrete findings\n🔄 **In Progress**: 4/18 sentences partially decoded\n❓ **Unknown**: 8/18 sentences awaiting interpretation\n\n**Next Steps Generated:**\n1. Deploy custom sentence-to-element mapping algorithm\n2. Use unmapped sentences to predict missing puzzle pieces\n3. Generate mathematical tools based on sentence #11 "numbers are universe language"\n\n*The philosophical sentences ARE the master key. Ready to deploy specialized analysis tools?*';
    } else if (query.includes('goat') || query.includes('custom tool') || query.includes('generate code')) {
      return '🤖 **GOAT AGENT READY FOR DEPLOYMENT** 🤖\n\n**Advanced Capabilities Activated:**\n\n🔧 **Code Generation**: AI-powered Python tool creation for:\n   • Custom file format analysis\n   • Mathematical pattern detection\n   • Advanced steganography techniques\n   • Cross-correlation analysis\n   • Entropy and statistical analysis\n\n📋 **Current Deployment Options:**\n1. **Fibonacci File Locator** - Generate tool to find missing 17,711-byte file\n2. **Philosophical Sentence Mapper** - Cross-reference tool for sentence-to-clue correlation\n3. **Temporal Coordinate Analyzer** - Tool for impossible timestamp decoding\n4. **Custom Steganography Detector** - Advanced hidden data extraction\n5. **Mathematical Pattern Synthesizer** - Multi-dimensional pattern analysis\n\n**Safety Features:**\n✅ Sandboxed execution environment\n✅ Code safety validation\n✅ Real-time monitoring\n✅ Rollback capabilities\n\n**Ready for Emergency Deployment**\nGOAT Agent can generate and execute custom analysis tools within 30 seconds. All tools are validated against our puzzle findings repository for context awareness.\n\n*Which custom tool should I generate first? Or describe the specific analysis challenge you\'re facing.*';
    }
    return '🚨 **EMERGENCY ASSISTANCE ACTIVATED** 🚨\n\nGOAT Agent standing by with custom tool generation capabilities. I have access to the complete puzzle findings repository and can generate specialized analysis tools for any unforeseen challenges.\n\n**Available Emergency Services:**\n• Custom code generation and execution\n• Puzzle findings consultation and cross-reference\n• Advanced pattern correlation analysis\n• Mathematical sequence analysis\n• Steganographic technique development\n\n*What specific challenge requires emergency intervention?*';
  };

  const generateGeneralResponse = (query: string): string => {
    if (query.includes('help') || query.includes('what can')) {
      return 'I can help you with: 🔍 Database queries (file counts, types, metadata), 🤖 Agent analysis results and insights, 🧩 Puzzle solving strategies and next steps, 🔗 Pattern correlations and connections, 📊 Progress summaries and status updates, 💡 Suggestions for new investigation approaches, 🚨 Emergency GOAT agent deployment for custom tooling. Just ask me anything about the investigation!';
    } else if (query.includes('progress') || query.includes('status')) {
      return 'Current Investigation Status: Overall Progress: 67% complete. Active agents: 6/6 operational (including GOAT agent on standby). Recent breakthroughs: XOR key pattern decoded, steganographic message chain discovered, philosophical sentences identified as master instructions. Immediate priorities: Coordinate system decryption, final payload assembly. Estimated completion: 2-4 hours with current momentum.';
    }
    return 'I\'m here to help you navigate this complex forensic investigation. I have real-time access to all database findings, agent analyses, puzzle findings repository, and emergency GOAT agent capabilities. What would you like to explore together?';
  };

  const getMessageIcon = (type: OrchestratorMessage['type']) => {
    switch (type) {
      case 'user': return User;
      case 'orchestrator': return Bot;
      case 'system': return AlertTriangle;
      default: return Bot;
    }
  };

  const getMessageColor = (type: OrchestratorMessage['type']) => {
    switch (type) {
      case 'user': return 'border-l-blue-500 bg-blue-500/5';
      case 'orchestrator': return 'border-l-matrix-500 bg-matrix-500/5';
      case 'system': return 'border-l-red-500 bg-red-500/5';
      default: return 'border-l-matrix-500 bg-matrix-500/5';
    }
  };

  if (isCollapsed) {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn('fixed bottom-20 right-4 z-40', className)}
      >
        <button
          onClick={() => onToggleCollapse?.(false)}
          className="flex items-center gap-2 px-4 py-3 bg-bg-panel border border-matrix-500 rounded-lg text-matrix-500 hover:bg-matrix-500/10 transition-colors shadow-lg"
        >
          <Brain className="w-5 h-5" />
          <span className="font-mono text-sm font-semibold">AI Orchestrator</span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'flex flex-col h-96 bg-bg-panel border border-matrix-800 rounded-lg overflow-hidden shadow-xl',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-matrix-800 bg-gradient-to-r from-matrix-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-6 h-6 text-matrix-500" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-matrix-500">
              AI Orchestrator
            </h3>
            <p className="text-xs text-matrix-600">
              Ask me anything about the investigation
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggleCollapse?.(true)}
          className="p-1 text-matrix-600 hover:text-matrix-500 transition-colors"
          title="Minimize chat"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => {
            const MessageIcon = getMessageIcon(message.type);
            
            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.type === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: message.type === 'user' ? 20 : -20 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'flex gap-3 p-3 rounded-lg border-l-2',
                  getMessageColor(message.type)
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                  message.type === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-matrix-500/20 text-matrix-500'
                )}>
                  <MessageIcon className="w-4 h-4" />
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono font-semibold text-sm text-matrix-500">
                      {message.type === 'user' ? 'You' : message.type === 'orchestrator' ? 'AI Orchestrator' : 'System'}
                    </span>
                    <span className="text-xs text-matrix-600">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  <p className="text-sm text-matrix-600 leading-relaxed">
                    {message.content}
                  </p>

                  {/* Metadata */}
                  {message.metadata && (
                    <div className="mt-3 space-y-2">
                      {message.metadata.confidence && (
                        <div className="flex items-center gap-2 text-xs">
                          <Zap className="w-3 h-3 text-matrix-600" />
                          <span className="text-matrix-600">Confidence:</span>
                          <span className="text-matrix-500 font-mono">
                            {(message.metadata.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}

                      {message.metadata.sources && message.metadata.sources.length > 0 && (
                        <div className="text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            <Database className="w-3 h-3 text-matrix-600" />
                            <span className="text-matrix-600">Sources:</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {message.metadata.sources.map((source, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded bg-matrix-500/10 text-matrix-500 font-mono text-xs"
                              >
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {message.metadata.agent_insights && message.metadata.agent_insights.length > 0 && (
                        <div className="text-xs">
                          <div className="flex items-center gap-1 mb-1">
                            <Lightbulb className="w-3 h-3 text-matrix-600" />
                            <span className="text-matrix-600">Agent Insights:</span>
                          </div>
                          <ul className="space-y-1">
                            {message.metadata.agent_insights.map((insight, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-matrix-700 mt-0.5">•</span>
                                <span className="text-matrix-600">{insight}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 p-3 text-matrix-600"
          >
            <div className="w-8 h-8 rounded-full bg-matrix-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-matrix-500" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-mono">AI is thinking</span>
              <div className="flex gap-1">
                <div className="w-1 h-1 bg-matrix-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 bg-matrix-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 bg-matrix-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-matrix-800">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask about database, findings, patterns, next steps..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-bg-secondary border border-matrix-800 rounded-lg text-matrix-500 placeholder-matrix-700 font-mono text-sm focus:outline-none focus:border-matrix-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isLoading}
            className="px-4 py-2 bg-matrix-500/20 border border-matrix-500 rounded-lg text-matrix-500 hover:bg-matrix-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            'What are the key findings?',
            'Given these 18 philosophical sentences, connect the dots',
            'We\'re stuck, deploy GOAT agent',
            'Generate custom analysis tool'
          ].map((suggestion, i) => (
            <button
              key={i}
              onClick={() => setNewMessage(suggestion)}
              className="px-2 py-1 text-xs bg-matrix-500/10 text-matrix-600 rounded font-mono hover:bg-matrix-500/20 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </form>
    </motion.div>
  );
};
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDatabase } from '../database/init.js';

// Ollama client for LLM integration
class OllamaClient {
  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.primaryModel = process.env.OLLAMA_MODEL || 'codellama:13b-instruct';
    this.secondaryModel = process.env.OLLAMA_SECONDARY_MODEL || 'llama2:13b-chat';
    this.lightweightModel = process.env.OLLAMA_LIGHTWEIGHT_MODEL || 'codellama:7b-instruct';
    this.analysisModel = process.env.OLLAMA_ANALYSIS_MODEL || 'mistral:7b-instruct';
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT) || 120000;
    this.enabled = process.env.ENABLE_OLLAMA_ORCHESTRATION === 'true';
  }

  async isAvailable() {
    if (!this.enabled) return false;
    
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      console.warn('Ollama not available:', error.message);
      return false;
    }
  }

  async generateAnalysis(prompt, model = null, context = {}) {
    if (!this.enabled) {
      return { success: false, error: 'Ollama orchestration disabled' };
    }

    const selectedModel = model || this.primaryModel;
    
    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: prompt,
          context: context,
          stream: false,
          options: {
            temperature: 0.2,
            top_p: 0.9,
            max_tokens: 4096,
            stop: ['<|end|>', '</analysis>']
          }
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        response: data.response,
        context: data.context,
        model: selectedModel,
        done: data.done,
        total_duration: data.total_duration,
        load_duration: data.load_duration,
        prompt_eval_count: data.prompt_eval_count,
        eval_count: data.eval_count
      };
    } catch (error) {
      console.error('Ollama generation error:', error);
      return {
        success: false,
        error: error.message,
        model: selectedModel
      };
    }
  }

  async analyzeForensicFindings(analysisType, data) {
    const prompts = {
      file_analysis: `<analysis>
You are a forensic investigator analyzing suspicious files. Provide a comprehensive analysis.

FILE DETAILS:
- Filename: ${data.filename || 'unknown'}
- Size: ${data.size || 0} bytes
- Entropy: ${data.entropy || 'unknown'}
- File Type: ${data.file_type || 'unknown'}
- Suspicious Indicators: ${data.suspicious_indicators?.join(', ') || 'none'}
- Path: ${data.path || 'unknown'}

ANALYSIS REQUIREMENTS:
1. Risk Assessment (Critical/High/Medium/Low)
2. Threat Classification
3. Anomaly Detection
4. Technical Indicators
5. Investigation Recommendations

Provide detailed forensic analysis:
</analysis>`,

      string_analysis: `<analysis>
Analyze extracted strings for forensic significance and potential threats.

STRING DATA:
${data.strings?.slice(0, 20).map((s, i) => 
  `${i+1}. "${s.string_content}" (suspicious: ${s.is_suspicious ? 'YES' : 'NO'})`
).join('\n') || 'No strings available'}

SOURCE FILE: ${data.filename || 'unknown'}
TOTAL STRINGS: ${data.strings?.length || 0}

ANALYSIS FOCUS:
1. Malware Indicators
2. Suspicious Patterns
3. Obfuscation Techniques
4. Command Injection
5. Data Exfiltration Patterns

Provide detailed string analysis:
</analysis>`,

      xor_analysis: `<analysis>
Analyze XOR encryption patterns and potential decryption results.

XOR ANALYSIS DATA:
- Total Attempts: ${data.xor_attempts || 0}
- Successful Decryptions: ${data.successful_xor || 0}
- Key Patterns: ${data.xor_keys?.join(', ') || 'none'}
- Best Plaintext Score: ${data.best_score || 0}

DECRYPTION SAMPLES:
${data.decrypted_samples?.slice(0, 5).map((s, i) => 
  `Key ${s.key}: "${s.content.substring(0, 100)}..."`
).join('\n') || 'No successful decryptions'}

ANALYSIS REQUIREMENTS:
1. Encryption Strength Assessment
2. Key Pattern Analysis
3. Content Classification
4. Evasion Technique Identification
5. Decryption Strategy

Provide comprehensive XOR analysis:
</analysis>`,

      steganography: `<analysis>
Analyze steganographic evidence and hidden data extraction.

STEGANOGRAPHY FINDINGS:
- Method: ${data.method || 'unknown'}
- Channel: ${data.channel || 'N/A'}
- Bit Position: ${data.bit_position || 'N/A'}
- Extraction Method: ${data.extraction_method || 'unknown'}
- Pattern Detection: ${data.has_patterns ? 'YES' : 'NO'}
- Content Preview: ${data.extracted_content?.substring(0, 200) || 'none'}

ANALYSIS REQUIREMENTS:
1. Steganographic Technique Assessment
2. Sophistication Level
3. Content Significance
4. Evasion Methods
5. Attribution Indicators

Provide detailed steganographic analysis:
</analysis>`,

      intelligence_synthesis: `<analysis>
Synthesize all forensic findings into a comprehensive intelligence report.

INVESTIGATION SUMMARY:
${data.findings?.map(f => `- ${f.type}: ${f.summary}`).join('\n') || 'No findings available'}

CORRELATION DATA:
- Related Files: ${data.related_files?.length || 0}
- Pattern Matches: ${data.pattern_matches?.length || 0}
- Timeline Events: ${data.timeline_events?.length || 0}

SYNTHESIS REQUIREMENTS:
1. Executive Summary
2. Threat Assessment
3. Evidence Correlation
4. Attribution Analysis
5. Investigation Roadmap
6. Tactical Recommendations

Provide comprehensive intelligence synthesis:
</analysis>`
    };

    const prompt = prompts[analysisType] || `Analyze this forensic data: ${JSON.stringify(data, null, 2)}`;
    
    // Use appropriate model based on analysis complexity
    let model = this.lightweightModel;
    if (analysisType === 'intelligence_synthesis') {
      model = this.primaryModel;
    } else if (analysisType === 'steganography' || analysisType === 'xor_analysis') {
      model = this.analysisModel;
    }
    
    return await this.generateAnalysis(prompt, model);
  }

  async generateInvestigationReport(sessionData) {
    const prompt = `<analysis>
Generate a comprehensive forensic investigation report.

SESSION DATA:
- Session ID: ${sessionData.session_id}
- Analysis Type: ${sessionData.analysis_type}
- Files Analyzed: ${sessionData.total_files || 0}
- Agents Involved: ${sessionData.agents_involved?.join(', ') || 'none'}
- Duration: ${sessionData.duration || 'unknown'}

FINDINGS SUMMARY:
${sessionData.results?.map(r => `
Agent: ${r.agent}
Type: ${r.type}
Success: ${r.success}
Key Findings: ${r.key_findings || 'none'}
`).join('\n') || 'No results available'}

REPORT REQUIREMENTS:
1. Executive Summary
2. Methodology
3. Key Findings
4. Technical Analysis
5. Risk Assessment
6. Recommendations
7. Appendices

Generate professional forensic report:
</analysis>`;

    return await this.generateAnalysis(prompt, this.primaryModel);
  }
}

// Enhanced Agent Orchestrator with Ollama integration
class OllamaAgentOrchestrator {
  constructor() {
    this.activeSessions = new Map();
    this.ollama = new OllamaClient();
    this.agents = {
      file_analysis_agent: new EnhancedFileAnalysisAgent(this.ollama),
      steganography_agent: new EnhancedSteganographyAgent(this.ollama),
      cryptography_agent: new EnhancedCryptographyAgent(this.ollama),
      intelligence_agent: new EnhancedIntelligenceAgent(this.ollama)
    };
    
    // Initialize Ollama connection
    this.initializeOllama();
  }

  async initializeOllama() {
    try {
      const available = await this.ollama.isAvailable();
      if (available) {
        console.log('✅ Ollama LLM orchestration enabled');
      } else {
        console.log('⚠️  Ollama not available, using traditional analysis');
      }
    } catch (error) {
      console.error('Ollama initialization error:', error);
    }
  }

  async orchestrateAnalysis({ file_path, analysis_type, priority, agent_preferences, context, user_id }) {
    const sessionId = `session_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    try {
      // Validate file exists
      await fs.access(file_path);
      const stats = await fs.stat(file_path);
      
      const db = getDatabase();
      
      // Create orchestration session with Ollama integration
      await db.run(
        `INSERT INTO orchestration_sessions 
         (id, file_path, analysis_type, priority, status, agents_involved, started_by, current_phase, progress, task_count, ollama_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId, 
          file_path, 
          analysis_type, 
          priority, 
          'running',
          JSON.stringify(agent_preferences || Object.keys(this.agents)),
          user_id,
          'Initializing AI-enhanced analysis',
          0,
          0,
          this.ollama.enabled
        ]
      );

      // Create session tracking
      const session = {
        id: sessionId,
        file_path,
        analysis_type,
        priority,
        status: 'running',
        progress: 0,
        current_phase: 'Initializing AI-enhanced analysis',
        agents_involved: agent_preferences || Object.keys(this.agents),
        tasks: [],
        results: [],
        insights: [],
        connections: [],
        ollama_analyses: [],
        started_at: new Date().toISOString(),
        file_size: stats.size,
        ollama_enabled: this.ollama.enabled
      };

      this.activeSessions.set(sessionId, session);

      // Start enhanced orchestration process
      this.runEnhancedOrchestration(sessionId).catch(error => {
        console.error(`Enhanced orchestration ${sessionId} failed:`, error);
        this.updateSessionStatus(sessionId, 'error', error.message);
      });

      return {
        session_id: sessionId,
        status: 'running',
        progress: 0,
        current_phase: 'Initializing AI-enhanced analysis',
        agents_involved: session.agents_involved,
        task_count: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        results: [],
        insights: [],
        connections_discovered: [],
        started_at: session.started_at,
        ollama_enabled: session.ollama_enabled,
        estimated_completion: new Date(Date.now() + this.estimateCompletionTime(analysis_type, stats.size)).toISOString()
      };
      
    } catch (error) {
      console.error('Failed to start enhanced orchestration:', error);
      throw new Error(`Failed to start enhanced orchestration: ${error.message}`);
    }
  }

  async runEnhancedOrchestration(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    try {
      // Phase 1: Traditional File Analysis + AI Enhancement
      await this.updateSessionPhase(sessionId, 'AI-Enhanced File Analysis', 10);
      const fileAnalysis = await this.agents.file_analysis_agent.analyze(session.file_path);
      session.results.push({ agent: 'file_analysis_agent', ...fileAnalysis });
      
      // Phase 2: AI-Enhanced Specialized Analysis
      await this.updateSessionPhase(sessionId, 'AI-Enhanced Specialized Analysis', 30);
      
      if (fileAnalysis.file_type && fileAnalysis.file_type.includes('image')) {
        const stegoAnalysis = await this.agents.steganography_agent.analyze(session.file_path, fileAnalysis);
        session.results.push({ agent: 'steganography_agent', ...stegoAnalysis });
      }

      // Phase 3: AI-Enhanced Cryptographic Analysis
      await this.updateSessionPhase(sessionId, 'AI-Enhanced Cryptographic Analysis', 60);
      const cryptoAnalysis = await this.agents.cryptography_agent.analyze(session.file_path, fileAnalysis);
      session.results.push({ agent: 'cryptography_agent', ...cryptoAnalysis });

      // Phase 4: AI Intelligence Synthesis
      await this.updateSessionPhase(sessionId, 'AI Intelligence Synthesis', 85);
      const intelligence = await this.agents.intelligence_agent.synthesize(session.results, session.file_path);
      session.results.push({ agent: 'intelligence_agent', ...intelligence });
      
      // Phase 5: Generate AI Investigation Report
      await this.updateSessionPhase(sessionId, 'Generating AI Report', 95);
      
      if (this.ollama.enabled) {
        const investigationReport = await this.ollama.generateInvestigationReport({
          session_id: sessionId,
          analysis_type: session.analysis_type,
          total_files: 1,
          agents_involved: session.agents_involved,
          duration: Date.now() - new Date(session.started_at).getTime(),
          results: session.results
        });
        
        if (investigationReport.success) {
          session.ai_report = investigationReport.response;
          session.ollama_analyses.push({
            type: 'investigation_report',
            model: investigationReport.model,
            response: investigationReport.response,
            performance: {
              total_duration: investigationReport.total_duration,
              eval_count: investigationReport.eval_count
            }
          });
        }
      }
      
      // Store results in database
      await this.persistEnhancedResults(sessionId, session);
      
      // Complete session
      await this.updateSessionStatus(sessionId, 'completed');
      session.status = 'completed';
      session.completed_at = new Date().toISOString();
      session.progress = 100;

    } catch (error) {
      console.error(`Enhanced orchestration ${sessionId} error:`, error);
      await this.updateSessionStatus(sessionId, 'error', error.message);
      session.status = 'error';
      session.error = error.message;
    }
  }

  async persistEnhancedResults(sessionId, session) {
    const db = getDatabase();
    
    // Persist traditional results
    for (let i = 0; i < session.results.length; i++) {
      const result = session.results[i];
      const resultId = `result_${sessionId}_${i}`;
      
      await db.run(
        `INSERT INTO analysis_results 
         (id, session_id, agent_id, result_type, success, confidence_score, execution_time, output_data, ai_enhanced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          resultId,
          sessionId,
          result.agent,
          result.type || 'analysis',
          result.success !== false,
          result.confidence_score || 0.8,
          result.execution_time || 0,
          JSON.stringify(result),
          this.ollama.enabled
        ]
      );
    }

    // Persist AI analyses
    if (session.ollama_analyses && session.ollama_analyses.length > 0) {
      for (let i = 0; i < session.ollama_analyses.length; i++) {
        const aiAnalysis = session.ollama_analyses[i];
        await db.run(
          `INSERT INTO ai_analyses 
           (id, session_id, analysis_type, model_used, ai_response, performance_metrics, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            `ai_${sessionId}_${i}`,
            sessionId,
            aiAnalysis.type,
            aiAnalysis.model,
            aiAnalysis.response,
            JSON.stringify(aiAnalysis.performance),
            new Date().toISOString()
          ]
        );
      }
    }

    // Update session with AI report
    await db.run(
      `UPDATE orchestration_sessions 
       SET insights = ?, connections_discovered = ?, completed_tasks = ?, task_count = ?, ai_report = ?
       WHERE id = ?`,
      [
        JSON.stringify(session.insights),
        JSON.stringify(session.connections),
        session.results.length,
        session.results.length,
        session.ai_report || null,
        sessionId
      ]
    );
  }

  getSessionStatus(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;

    return {
      session_id: sessionId,
      status: session.status,
      progress: session.progress,
      current_phase: session.current_phase,
      agents_involved: session.agents_involved,
      task_count: session.results.length,
      completed_tasks: session.results.filter(r => r.success !== false).length,
      failed_tasks: session.results.filter(r => r.success === false).length,
      results: session.results,
      insights: session.insights,
      connections_discovered: session.connections,
      ai_analyses: session.ollama_analyses || [],
      ai_report: session.ai_report,
      started_at: session.started_at,
      completed_at: session.completed_at,
      estimated_completion: session.estimated_completion,
      ollama_enabled: session.ollama_enabled
    };
  }

  async updateSessionPhase(sessionId, phase, progress) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.current_phase = phase;
      session.progress = progress;
    }

    const db = getDatabase();
    await db.run(
      'UPDATE orchestration_sessions SET current_phase = ?, progress = ? WHERE id = ?',
      [phase, progress, sessionId]
    );
  }

  async updateSessionStatus(sessionId, status, error = null) {
    const db = getDatabase();
    const updateFields = ['status = ?'];
    const params = [status, sessionId];
    
    if (status === 'completed') {
      updateFields.push('completed_at = CURRENT_TIMESTAMP');
    }
    
    if (error) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.error = error;
      }
    }

    await db.run(
      `UPDATE orchestration_sessions SET ${updateFields.join(', ')} WHERE id = ?`,
      params
    );
  }

  estimateCompletionTime(analysisType, fileSize) {
    const baseTimes = {
      'comprehensive': 300000, // 5 minutes
      'targeted': 120000, // 2 minutes
      'collaborative': 600000 // 10 minutes
    };
    
    const baseTime = baseTimes[analysisType] || 300000;
    const sizeFactor = Math.min(fileSize / (1024 * 1024), 10);
    const aiOverhead = this.ollama.enabled ? 60000 : 0; // 1 minute for AI analysis
    
    return baseTime + (sizeFactor * 30000) + aiOverhead;
  }
}

// Enhanced agents with Ollama integration will be in separate files
// This is just the orchestrator integration

export const ollamaAgentOrchestrator = new OllamaAgentOrchestrator();
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDatabase } from '../database/init.js';

class AgentOrchestrator {
  constructor() {
    this.activeSessions = new Map();
    this.agents = {
      file_analysis_agent: new FileAnalysisAgent(),
      steganography_agent: new SteganographyAgent(),
      cryptography_agent: new CryptographyAgent(),
      intelligence_agent: new IntelligenceAgent()
    };
  }

  async orchestrateAnalysis({ file_path, analysis_type, priority, agent_preferences, context, user_id }) {
    const sessionId = `session_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    
    try {
      // Validate file exists
      await fs.access(file_path);
      const stats = await fs.stat(file_path);
      
      const db = getDatabase();
      
      // Create orchestration session
      await db.run(
        `INSERT INTO orchestration_sessions 
         (id, file_path, analysis_type, priority, status, agents_involved, started_by, current_phase, progress, task_count)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId, 
          file_path, 
          analysis_type, 
          priority, 
          'running',
          JSON.stringify(agent_preferences || Object.keys(this.agents)),
          user_id,
          'Initializing analysis',
          0,
          0
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
        current_phase: 'Initializing analysis',
        agents_involved: agent_preferences || Object.keys(this.agents),
        tasks: [],
        results: [],
        insights: [],
        connections: [],
        started_at: new Date().toISOString(),
        file_size: stats.size
      };

      this.activeSessions.set(sessionId, session);

      // Start orchestration process
      this.runOrchestration(sessionId).catch(error => {
        console.error(`Orchestration ${sessionId} failed:`, error);
        this.updateSessionStatus(sessionId, 'error', error.message);
      });

      return {
        session_id: sessionId,
        status: 'running',
        progress: 0,
        current_phase: 'Initializing analysis',
        agents_involved: session.agents_involved,
        task_count: 0,
        completed_tasks: 0,
        failed_tasks: 0,
        results: [],
        insights: [],
        connections_discovered: [],
        started_at: session.started_at,
        estimated_completion: new Date(Date.now() + this.estimateCompletionTime(analysis_type, stats.size)).toISOString()
      };
      
    } catch (error) {
      console.error('Failed to start orchestration:', error);
      throw new Error(`Failed to start orchestration: ${error.message}`);
    }
  }

  async runOrchestration(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    try {
      // Phase 1: File Analysis
      await this.updateSessionPhase(sessionId, 'File Analysis', 10);
      const fileAnalysis = await this.agents.file_analysis_agent.analyze(session.file_path);
      session.results.push({ agent: 'file_analysis_agent', ...fileAnalysis });
      
      // Phase 2: Specialized Analysis based on file type
      await this.updateSessionPhase(sessionId, 'Specialized Analysis', 30);
      
      if (fileAnalysis.file_type && fileAnalysis.file_type.includes('image')) {
        const stegoAnalysis = await this.agents.steganography_agent.analyze(session.file_path, fileAnalysis);
        session.results.push({ agent: 'steganography_agent', ...stegoAnalysis });
      }

      // Phase 3: Cryptographic Analysis
      await this.updateSessionPhase(sessionId, 'Cryptographic Analysis', 60);
      const cryptoAnalysis = await this.agents.cryptography_agent.analyze(session.file_path, fileAnalysis);
      session.results.push({ agent: 'cryptography_agent', ...cryptoAnalysis });

      // Phase 4: Intelligence Synthesis
      await this.updateSessionPhase(sessionId, 'Intelligence Synthesis', 85);
      const intelligence = await this.agents.intelligence_agent.synthesize(session.results, session.file_path);
      session.results.push({ agent: 'intelligence_agent', ...intelligence });
      
      // Phase 5: Final Analysis
      await this.updateSessionPhase(sessionId, 'Finalizing Analysis', 95);
      
      // Store results in database
      await this.persistResults(sessionId, session);
      
      // Complete session
      await this.updateSessionStatus(sessionId, 'completed');
      session.status = 'completed';
      session.completed_at = new Date().toISOString();
      session.progress = 100;

    } catch (error) {
      console.error(`Orchestration ${sessionId} error:`, error);
      await this.updateSessionStatus(sessionId, 'error', error.message);
      session.status = 'error';
      session.error = error.message;
    }
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
      // Store error in session for debugging
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

  async persistResults(sessionId, session) {
    const db = getDatabase();
    
    for (let i = 0; i < session.results.length; i++) {
      const result = session.results[i];
      const resultId = `result_${sessionId}_${i}`;
      
      await db.run(
        `INSERT INTO analysis_results 
         (id, session_id, agent_id, result_type, success, confidence_score, execution_time, output_data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          resultId,
          sessionId,
          result.agent,
          result.type || 'analysis',
          result.success !== false,
          result.confidence_score || 0.8,
          result.execution_time || 0,
          JSON.stringify(result)
        ]
      );
    }

    // Update session with insights and connections
    await db.run(
      `UPDATE orchestration_sessions 
       SET insights = ?, connections_discovered = ?, completed_tasks = ?, task_count = ?
       WHERE id = ?`,
      [
        JSON.stringify(session.insights),
        JSON.stringify(session.connections),
        session.results.length,
        session.results.length,
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
      started_at: session.started_at,
      completed_at: session.completed_at,
      estimated_completion: session.estimated_completion
    };
  }

  estimateCompletionTime(analysisType, fileSize) {
    const baseTimes = {
      'comprehensive': 300000, // 5 minutes
      'targeted': 120000, // 2 minutes
      'collaborative': 600000 // 10 minutes
    };
    
    const baseTime = baseTimes[analysisType] || 300000;
    const sizeFactor = Math.min(fileSize / (1024 * 1024), 10); // Max 10x for very large files
    
    return baseTime + (sizeFactor * 30000); // Add 30s per MB
  }
}

// Base Agent Class
class BaseAgent {
  constructor(name) {
    this.name = name;
    this.capabilities = [];
  }

  async execute(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: options.timeout || 30000,
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// File Analysis Agent
class FileAnalysisAgent extends BaseAgent {
  constructor() {
    super('file_analysis_agent');
    this.capabilities = ['file_analysis', 'extraction', 'metadata_extraction'];
  }

  async analyze(filePath) {
    const startTime = Date.now();
    
    try {
      // Get file stats
      const stats = await fs.stat(filePath);
      
      // Run file command for type detection
      let fileType = 'unknown';
      try {
        const { stdout } = await this.execute('file', ['-b', filePath]);
        fileType = stdout.trim();
      } catch (error) {
        console.warn('File command failed:', error.message);
      }

      // Calculate entropy
      const entropy = await this.calculateEntropy(filePath);
      
      // Extract metadata
      const metadata = await this.extractMetadata(filePath);
      
      // Calculate suspicion score
      const suspicionScore = this.calculateSuspicionScore(entropy, stats.size, fileType);

      return {
        type: 'file_analysis',
        success: true,
        file_type: fileType,
        size: stats.size,
        entropy: entropy,
        metadata: metadata,
        suspicion_score: suspicionScore,
        suspicious_indicators: this.getSuspiciousIndicators(entropy, stats.size, fileType),
        execution_time: (Date.now() - startTime) / 1000,
        confidence_score: 0.95
      };

    } catch (error) {
      return {
        type: 'file_analysis',
        success: false,
        error: error.message,
        execution_time: (Date.now() - startTime) / 1000,
        confidence_score: 0
      };
    }
  }

  async calculateEntropy(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const frequency = new Array(256).fill(0);
      
      // Count byte frequencies
      for (let i = 0; i < buffer.length; i++) {
        frequency[buffer[i]]++;
      }
      
      // Calculate Shannon entropy
      let entropy = 0;
      const length = buffer.length;
      
      for (let i = 0; i < 256; i++) {
        if (frequency[i] > 0) {
          const p = frequency[i] / length;
          entropy -= p * Math.log2(p);
        }
      }
      
      return entropy;
    } catch (error) {
      console.warn('Entropy calculation failed:', error.message);
      return 0;
    }
  }

  async extractMetadata(filePath) {
    const metadata = {};
    
    try {
      // Try exiftool if available
      const { stdout } = await this.execute('exiftool', ['-json', filePath]);
      const exifData = JSON.parse(stdout)[0];
      metadata.exif = exifData;
    } catch (error) {
      // Exiftool not available or failed
      metadata.exif = null;
    }

    return metadata;
  }

  calculateSuspicionScore(entropy, size, fileType) {
    let score = 0;
    
    // High entropy is suspicious
    if (entropy > 7.5) score += 0.4;
    else if (entropy > 7.0) score += 0.2;
    
    // Unusual file sizes
    if (size > 100 * 1024 * 1024) score += 0.1; // Very large files
    if (size < 100 && !fileType.includes('empty')) score += 0.1; // Very small non-empty files
    
    // File type analysis
    if (fileType.includes('data') || fileType.includes('unknown')) score += 0.3;
    
    return Math.min(score, 1.0);
  }

  getSuspiciousIndicators(entropy, size, fileType) {
    const indicators = [];
    
    if (entropy > 7.5) indicators.push('very_high_entropy');
    else if (entropy > 7.0) indicators.push('high_entropy');
    
    if (size > 100 * 1024 * 1024) indicators.push('unusually_large_file');
    if (size < 100) indicators.push('very_small_file');
    
    if (fileType.includes('data')) indicators.push('unknown_file_type');
    
    return indicators;
  }
}

// Steganography Agent
class SteganographyAgent extends BaseAgent {
  constructor() {
    super('steganography_agent');
    this.capabilities = ['steganography', 'extraction', 'intelligence'];
  }

  async analyze(filePath, fileAnalysis) {
    const startTime = Date.now();
    
    try {
      if (!fileAnalysis.file_type.toLowerCase().includes('image')) {
        return {
          type: 'steganography',
          success: true,
          applicable: false,
          message: 'Steganography analysis not applicable to non-image files',
          execution_time: (Date.now() - startTime) / 1000,
          confidence_score: 1.0
        };
      }

      const results = [];
      
      // Try zsteg if available
      try {
        const { stdout } = await this.execute('zsteg', [filePath, '-a'], { timeout: 60000 });
        if (stdout.trim()) {
          results.push({
            method: 'zsteg',
            content: stdout.trim(),
            confidence: 0.8
          });
        }
      } catch (error) {
        console.warn('zsteg analysis failed:', error.message);
      }

      // Try steghide if available
      try {
        const { stdout } = await this.execute('steghide', ['info', filePath], { timeout: 30000 });
        if (stdout.includes('embedded')) {
          results.push({
            method: 'steghide',
            content: 'Embedded data detected',
            confidence: 0.9
          });
        }
      } catch (error) {
        // steghide will fail if no embedded data, this is expected
      }

      // LSB analysis
      const lsbResult = await this.performLSBAnalysis(filePath);
      if (lsbResult.found) {
        results.push(lsbResult);
      }

      return {
        type: 'steganography',
        success: true,
        applicable: true,
        results: results,
        total_methods: results.length,
        best_result: results.length > 0 ? results.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        ) : null,
        execution_time: (Date.now() - startTime) / 1000,
        confidence_score: results.length > 0 ? 0.9 : 0.7
      };

    } catch (error) {
      return {
        type: 'steganography',
        success: false,
        error: error.message,
        execution_time: (Date.now() - startTime) / 1000,
        confidence_score: 0
      };
    }
  }

  async performLSBAnalysis(filePath) {
    try {
      // Simple LSB analysis - check if LSBs form readable text
      const buffer = await fs.readFile(filePath);
      const lsbs = [];
      
      // Extract LSBs from first 1000 bytes
      for (let i = 0; i < Math.min(1000, buffer.length); i++) {
        lsbs.push(buffer[i] & 1);
      }
      
      // Convert to bytes and check for readable content
      const bytes = [];
      for (let i = 0; i < lsbs.length - 7; i += 8) {
        let byte = 0;
        for (let j = 0; j < 8; j++) {
          byte |= (lsbs[i + j] << j);
        }
        bytes.push(byte);
      }
      
      const text = Buffer.from(bytes).toString('ascii');
      const readableRatio = this.calculateReadableRatio(text);
      
      if (readableRatio > 0.7) {
        return {
          method: 'lsb_analysis',
          content: text,
          confidence: readableRatio,
          found: true
        };
      }
      
      return { found: false };
      
    } catch (error) {
      return { found: false, error: error.message };
    }
  }

  calculateReadableRatio(text) {
    if (!text || text.length === 0) return 0;
    
    const readableChars = text.match(/[a-zA-Z0-9\s.,!?]/g) || [];
    return readableChars.length / text.length;
  }
}

// Cryptography Agent
class CryptographyAgent extends BaseAgent {
  constructor() {
    super('cryptography_agent');
    this.capabilities = ['cryptography', 'intelligence'];
  }

  async analyze(filePath, fileAnalysis) {
    const startTime = Date.now();
    
    try {
      const results = [];
      
      // XOR Analysis
      const xorResults = await this.performXORAnalysis(filePath);
      if (xorResults.length > 0) {
        results.push(...xorResults);
      }
      
      // Caesar cipher analysis for text files
      if (fileAnalysis.file_type.toLowerCase().includes('text')) {
        const caesarResults = await this.performCaesarAnalysis(filePath);
        if (caesarResults.length > 0) {
          results.push(...caesarResults);
        }
      }
      
      // Base64 detection
      const base64Results = await this.detectBase64(filePath);
      if (base64Results.length > 0) {
        results.push(...base64Results);
      }

      return {
        type: 'cryptography',
        success: true,
        results: results,
        total_methods: results.length,
        best_result: results.length > 0 ? results.reduce((best, current) => 
          current.confidence > best.confidence ? current : best
        ) : null,
        execution_time: (Date.now() - startTime) / 1000,
        confidence_score: results.length > 0 ? 0.8 : 0.6
      };

    } catch (error) {
      return {
        type: 'cryptography',
        success: false,
        error: error.message,
        execution_time: (Date.now() - startTime) / 1000,
        confidence_score: 0
      };
    }
  }

  async performXORAnalysis(filePath) {
    try {
      const buffer = await fs.readFile(filePath);
      const results = [];
      
      // Try single-byte XOR keys
      for (let key = 1; key < 256; key++) {
        const decrypted = Buffer.alloc(buffer.length);
        for (let i = 0; i < buffer.length; i++) {
          decrypted[i] = buffer[i] ^ key;
        }
        
        const text = decrypted.toString('ascii', 0, Math.min(1000, buffer.length));
        const readableRatio = this.calculateReadableRatio(text);
        
        if (readableRatio > 0.7) {
          results.push({
            method: 'xor_single_byte',
            key: key.toString(16),
            decrypted_content: text,
            confidence: readableRatio,
            readable_ratio: readableRatio
          });
        }
      }
      
      // Sort by confidence and return top results
      return results
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
        
    } catch (error) {
      console.warn('XOR analysis failed:', error.message);
      return [];
    }
  }

  async performCaesarAnalysis(filePath) {
    try {
      const text = await fs.readFile(filePath, 'utf8');
      const results = [];
      
      for (let shift = 1; shift < 26; shift++) {
        const decrypted = this.caesarDecipher(text, shift);
        const readableRatio = this.calculateReadableRatio(decrypted);
        
        if (readableRatio > 0.8) {
          results.push({
            method: 'caesar_cipher',
            shift: shift,
            decrypted_content: decrypted.substring(0, 1000),
            confidence: readableRatio,
            readable_ratio: readableRatio
          });
        }
      }
      
      return results
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);
        
    } catch (error) {
      console.warn('Caesar cipher analysis failed:', error.message);
      return [];
    }
  }

  caesarDecipher(text, shift) {
    return text.replace(/[a-zA-Z]/g, function(char) {
      const start = char <= 'Z' ? 65 : 97;
      return String.fromCharCode(((char.charCodeAt(0) - start - shift + 26) % 26) + start);
    });
  }

  async detectBase64(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const base64Regex = /[A-Za-z0-9+/]{20,}={0,2}/g;
      const matches = content.match(base64Regex) || [];
      const results = [];
      
      for (const match of matches) {
        try {
          const decoded = Buffer.from(match, 'base64').toString('utf8');
          const readableRatio = this.calculateReadableRatio(decoded);
          
          if (readableRatio > 0.7) {
            results.push({
              method: 'base64_decode',
              encoded: match,
              decoded_content: decoded,
              confidence: readableRatio,
              readable_ratio: readableRatio
            });
          }
        } catch (error) {
          // Invalid base64, continue
        }
      }
      
      return results
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5);
        
    } catch (error) {
      console.warn('Base64 detection failed:', error.message);
      return [];
    }
  }

  calculateReadableRatio(text) {
    if (!text || text.length === 0) return 0;
    
    const readableChars = text.match(/[a-zA-Z0-9\s.,!?'"()-]/g) || [];
    return readableChars.length / text.length;
  }
}

// Intelligence Agent
class IntelligenceAgent extends BaseAgent {
  constructor() {
    super('intelligence_agent');
    this.capabilities = ['intelligence', 'relationship_analysis', 'pattern_matching', 'search'];
  }

  async synthesize(results, filePath) {
    const startTime = Date.now();
    
    try {
      const insights = [];
      const connections = [];
      const patterns = [];
      
      // Analyze results from other agents
      for (const result of results) {
        if (result.type === 'file_analysis') {
          if (result.entropy > 7.0) {
            insights.push('High entropy detected - indicates possible encryption or compression');
          }
          if (result.suspicious_indicators.length > 0) {
            insights.push(`Suspicious indicators found: ${result.suspicious_indicators.join(', ')}`);
          }
        }
        
        if (result.type === 'steganography' && result.results && result.results.length > 0) {
          insights.push('Steganographic content detected - hidden data found in file');
          connections.push({
            type: 'steganography_correlation',
            description: 'File contains hidden steganographic data',
            confidence: 0.9,
            evidence: result.results.map(r => r.method)
          });
        }
        
        if (result.type === 'cryptography' && result.results && result.results.length > 0) {
          insights.push('Cryptographic patterns detected - file may contain encrypted data');
          for (const cryptoResult of result.results) {
            if (cryptoResult.confidence > 0.8) {
              patterns.push({
                type: cryptoResult.method,
                confidence: cryptoResult.confidence,
                description: `High-confidence ${cryptoResult.method} pattern detected`
              });
            }
          }
        }
      }
      
      // Cross-reference with database for similar patterns
      const similarPatterns = await this.findSimilarPatterns(results);
      if (similarPatterns.length > 0) {
        connections.push(...similarPatterns);
      }
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(results);

      return {
        type: 'intelligence_synthesis',
        success: true,
        insights: insights,
        connections_discovered: connections,
        patterns_detected: patterns,
        recommendations: recommendations,
        confidence_assessment: this.calculateOverallConfidence(results),
        execution_time: (Date.now() - startTime) / 1000,
        confidence_score: 0.9
      };

    } catch (error) {
      return {
        type: 'intelligence_synthesis',
        success: false,
        error: error.message,
        execution_time: (Date.now() - startTime) / 1000,
        confidence_score: 0
      };
    }
  }

  async findSimilarPatterns(results) {
    try {
      const db = getDatabase();
      const connections = [];
      
      // Look for similar entropy patterns
      const fileResult = results.find(r => r.type === 'file_analysis');
      if (fileResult && fileResult.entropy) {
        const similarFiles = await db.all(
          'SELECT * FROM forensic_files WHERE entropy BETWEEN ? AND ? AND entropy != ?',
          [fileResult.entropy - 0.1, fileResult.entropy + 0.1, fileResult.entropy]
        );
        
        if (similarFiles.length > 0) {
          connections.push({
            type: 'entropy_correlation',
            description: `Similar entropy pattern found in ${similarFiles.length} other files`,
            confidence: 0.7,
            evidence: similarFiles.map(f => f.filename)
          });
        }
      }
      
      return connections;
    } catch (error) {
      console.warn('Pattern correlation failed:', error.message);
      return [];
    }
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    const fileResult = results.find(r => r.type === 'file_analysis');
    const stegoResult = results.find(r => r.type === 'steganography');
    const cryptoResult = results.find(r => r.type === 'cryptography');
    
    if (fileResult && fileResult.entropy > 7.5) {
      recommendations.push('Consider deeper cryptographic analysis due to very high entropy');
    }
    
    if (stegoResult && stegoResult.results && stegoResult.results.length > 0) {
      recommendations.push('Extract and analyze all steganographic content found');
      recommendations.push('Check for additional steganographic layers');
    }
    
    if (cryptoResult && cryptoResult.results && cryptoResult.results.length > 0) {
      recommendations.push('Validate cryptographic findings with additional tools');
      recommendations.push('Check for key patterns in decrypted content');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('File appears clean - no significant suspicious indicators found');
    }
    
    return recommendations;
  }

  calculateOverallConfidence(results) {
    if (results.length === 0) return 0;
    
    const confidenceSum = results.reduce((sum, result) => sum + (result.confidence_score || 0), 0);
    return confidenceSum / results.length;
  }
}

export const agentOrchestrator = new AgentOrchestrator();
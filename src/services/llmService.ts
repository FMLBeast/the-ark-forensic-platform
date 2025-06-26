import { api } from '@utils/api';

interface LLMInsight {
  id: string;
  type: 'connection' | 'pattern' | 'anomaly' | 'correlation';
  confidence: number;
  description: string;
  evidence: string[];
  files_involved: string[];
  suggested_actions: string[];
  timestamp: string;
}

interface DatabaseSnapshot {
  total_files: number;
  file_types: Record<string, number>;
  entropy_distribution: Record<string, number>;
  extraction_methods: Record<string, number>;
  recent_changes: any[];
  timestamp: string;
}

interface LLMAnalysisRequest {
  database_snapshot: DatabaseSnapshot;
  recent_findings: any[];
  focus_areas: string[];
  learning_context: string;
}

class LLMService {
  private isAvailable: boolean;
  private learningInterval: number | null = null;
  private baseURL: string;
  private insights: LLMInsight[] = [];
  private lastAnalysis: string | null = null;

  constructor() {
    this.isAvailable = import.meta.env.VITE_LLM_AVAILABLE === 'true';
    this.baseURL = import.meta.env.VITE_LLM_API_URL || 'http://localhost:8080';
    
    console.log(`🧠 LLM Service initialized: ${this.isAvailable ? 'Available' : 'Mock Mode'}`);
    
    if (this.isAvailable && import.meta.env.VITE_LLM_CONTINUOUS_LEARNING === 'true') {
      this.startContinuousLearning();
    }
  }

  async isLLMAvailable(): Promise<boolean> {
    if (!this.isAvailable) return false;
    
    try {
      const response = await fetch(`${this.baseURL}/health`, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getDatabaseSnapshot(): Promise<DatabaseSnapshot> {
    try {
      const response = await api.get<DatabaseSnapshot>('/forensics/database-snapshot');
      return response.data || this.createMockSnapshot();
    } catch (error) {
      console.warn('Failed to get database snapshot, using mock data:', error);
      return this.createMockSnapshot();
    }
  }

  private createMockSnapshot(): DatabaseSnapshot {
    return {
      total_files: 1247,
      file_types: {
        'image': 156,
        'text': 89,
        'binary': 432,
        'archive': 78,
        'encrypted': 23
      },
      entropy_distribution: {
        'low (0-3)': 234,
        'medium (3-6)': 567,
        'high (6-8)': 389,
        'very_high (8+)': 57
      },
      extraction_methods: {
        'steganography_lsb': 89,
        'xor_decryption': 156,
        'metadata_extraction': 234,
        'entropy_analysis': 432,
        'pattern_matching': 336
      },
      recent_changes: [],
      timestamp: new Date().toISOString()
    };
  }

  async analyzeDatabase(focusAreas: string[] = []): Promise<LLMInsight[]> {
    if (!this.isAvailable) {
      return this.generateMockInsights();
    }

    try {
      const snapshot = await this.getDatabaseSnapshot();
      const recentFindings = await this.getRecentFindings();

      const analysisRequest: LLMAnalysisRequest = {
        database_snapshot: snapshot,
        recent_findings: recentFindings,
        focus_areas: focusAreas,
        learning_context: `
          Analyze this forensic database for hidden connections, patterns, and anomalies.
          Focus on finding relationships between files that human analysts might miss.
          Look for:
          1. Unusual file clustering patterns
          2. Entropy correlations across different files
          3. Timeline patterns in file creation/modification
          4. Cross-file steganographic relationships
          5. Encryption key patterns and reuse
          6. Metadata correlations that could indicate common sources
          
          Provide actionable insights with confidence scores.
        `
      };

      const response = await fetch(`${this.baseURL}/analyze-database`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analysisRequest)
      });

      if (!response.ok) {
        throw new Error(`LLM analysis failed: ${response.status}`);
      }

      const insights = await response.json();
      this.insights = insights;
      this.lastAnalysis = new Date().toISOString();
      
      console.log(`🧠 LLM discovered ${insights.length} new insights`);
      return insights;

    } catch (error) {
      console.error('LLM analysis failed:', error);
      return this.generateMockInsights();
    }
  }

  private async getRecentFindings(): Promise<any[]> {
    try {
      const response = await api.get('/collaboration/findings?recent=true');
      return (response.data as { findings?: any[] })?.findings || [];
    } catch {
      return [];
    }
  }

  private generateMockInsights(): LLMInsight[] {
    return [
      {
        id: 'mock-1',
        type: 'connection',
        confidence: 0.87,
        description: 'Detected potential file relationship cluster based on entropy patterns',
        evidence: [
          'Files img_001.jpg, img_003.jpg, and img_007.jpg share similar entropy signatures',
          'All three files have embedded data at similar offsets',
          'Extraction timestamps suggest coordinated creation'
        ],
        files_involved: ['img_001.jpg', 'img_003.jpg', 'img_007.jpg'],
        suggested_actions: [
          'Cross-analyze steganographic content',
          'Compare embedded data structures',
          'Investigate temporal correlation'
        ],
        timestamp: new Date().toISOString()
      },
      {
        id: 'mock-2',
        type: 'anomaly',
        confidence: 0.92,
        description: 'Unusual XOR key pattern suggests systematic encryption approach',
        evidence: [
          'XOR keys follow mathematical progression: 0x42, 0x84, 0x168',
          'Pattern indicates knowledge of previous keys',
          'Timing suggests automated generation'
        ],
        files_involved: ['encrypted_data_01.bin', 'encrypted_data_02.bin', 'encrypted_data_03.bin'],
        suggested_actions: [
          'Test mathematical progression for future keys',
          'Analyze key generation algorithm',
          'Search for pattern in other encrypted files'
        ],
        timestamp: new Date().toISOString()
      }
    ];
  }

  async startContinuousLearning(): Promise<void> {
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
    }

    const interval = parseInt(import.meta.env.VITE_LLM_DB_ANALYSIS_INTERVAL) || 300000; // 5 minutes default
    
    console.log(`🧠 Starting continuous LLM learning (interval: ${interval / 1000}s)`);
    
    // Initial analysis
    this.analyzeDatabase(['connections', 'patterns', 'anomalies']);
    
    // Set up periodic analysis
    this.learningInterval = window.setInterval(async () => {
      console.log('🧠 Running scheduled database analysis...');
      await this.analyzeDatabase(['connections', 'patterns', 'anomalies']);
    }, interval);
  }

  stopContinuousLearning(): void {
    if (this.learningInterval) {
      clearInterval(this.learningInterval);
      this.learningInterval = null;
      console.log('🧠 Continuous learning stopped');
    }
  }

  getLatestInsights(): LLMInsight[] {
    return this.insights;
  }

  getInsightsByType(type: LLMInsight['type']): LLMInsight[] {
    return this.insights.filter(insight => insight.type === type);
  }

  async exploreConnection(fileIds: string[], context?: string): Promise<LLMInsight[]> {
    if (!this.isAvailable) {
      return this.generateConnectionMockInsights(fileIds);
    }

    try {
      const response = await fetch(`${this.baseURL}/explore-connection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          file_ids: fileIds,
          context: context || 'Explore potential connections between these files',
          analysis_depth: 'deep'
        })
      });

      const insights = await response.json();
      return insights;
    } catch (error) {
      console.error('Connection exploration failed:', error);
      return this.generateConnectionMockInsights(fileIds);
    }
  }

  private generateConnectionMockInsights(fileIds: string[]): LLMInsight[] {
    return [
      {
        id: `connection-${Date.now()}`,
        type: 'connection',
        confidence: 0.78,
        description: `Potential relationship discovered between ${fileIds.length} files`,
        evidence: [
          'Similar entropy patterns detected',
          'Temporal correlation in creation times',
          'Shared metadata signatures'
        ],
        files_involved: fileIds,
        suggested_actions: [
          'Perform cross-file steganographic analysis',
          'Compare binary structures',
          'Investigate common extraction methods'
        ],
        timestamp: new Date().toISOString()
      }
    ];
  }

  getAnalysisStatus(): {
    available: boolean;
    lastAnalysis: string | null;
    insightsCount: number;
    learningActive: boolean;
  } {
    return {
      available: this.isAvailable,
      lastAnalysis: this.lastAnalysis,
      insightsCount: this.insights.length,
      learningActive: this.learningInterval !== null
    };
  }
}

export const llmService = new LLMService();
export type { LLMInsight, DatabaseSnapshot };
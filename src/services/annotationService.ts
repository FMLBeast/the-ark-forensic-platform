import { api } from '@utils/api';

export interface FileAnnotation {
  id: string;
  file_path: string;
  user_id: string;
  username: string;
  annotation_type: 'highlight' | 'comment' | 'flag' | 'bookmark' | 'suspicious';
  content: string;
  coordinates?: {
    start_offset?: number;
    end_offset?: number;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  metadata: {
    file_type: string;
    view_mode: 'hex' | 'text' | 'image' | 'binary';
    context?: string; // surrounding bytes/text for context
    related_findings?: string[];
    agent_verified?: boolean;
    confidence_score?: number;
  };
  created_at: string;
  updated_at: string;
  color: string;
  is_public: boolean;
  upvotes: number;
  downvotes: number;
  replies: AnnotationReply[];
}

export interface AnnotationReply {
  id: string;
  annotation_id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
  is_agent_response: boolean;
  agent_id?: string;
}

export interface AnnotationFilter {
  file_path?: string;
  user_id?: string;
  annotation_type?: FileAnnotation['annotation_type'];
  date_range?: {
    start: string;
    end: string;
  };
  verified_only?: boolean;
  public_only?: boolean;
}

class AnnotationService {
  constructor() {
    // Using import.meta.env for future API integration
  }

  async getAnnotations(filter?: AnnotationFilter): Promise<FileAnnotation[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.file_path) params.append('file_path', filter.file_path);
      if (filter?.user_id) params.append('user_id', filter.user_id);
      if (filter?.annotation_type) params.append('type', filter.annotation_type);
      if (filter?.verified_only) params.append('verified_only', 'true');
      if (filter?.public_only) params.append('public_only', 'true');

      const response = await api.get<{ annotations: FileAnnotation[] }>(`/annotations?${params}`);
      return response.data?.annotations || this.getMockAnnotations(filter);
    } catch (error) {
      console.warn('Failed to fetch annotations, using mock data:', error);
      return this.getMockAnnotations(filter);
    }
  }

  async createAnnotation(annotation: Omit<FileAnnotation, 'id' | 'created_at' | 'updated_at' | 'upvotes' | 'downvotes' | 'replies'>): Promise<FileAnnotation> {
    try {
      const response = await api.post<FileAnnotation>('/annotations', annotation);
      return response.data || this.createMockAnnotation(annotation);
    } catch (error) {
      console.error('Failed to create annotation:', error);
      return this.createMockAnnotation(annotation);
    }
  }

  async updateAnnotation(id: string, updates: Partial<FileAnnotation>): Promise<FileAnnotation> {
    try {
      const response = await api.put<FileAnnotation>(`/annotations/${id}`, updates);
      return response.data || this.getMockAnnotations()[0];
    } catch (error) {
      console.error('Failed to update annotation:', error);
      throw error;
    }
  }

  async deleteAnnotation(id: string): Promise<void> {
    try {
      await api.delete(`/annotations/${id}`);
    } catch (error) {
      console.error('Failed to delete annotation:', error);
      throw error;
    }
  }

  async voteAnnotation(id: string, vote: 'up' | 'down'): Promise<void> {
    try {
      await api.post(`/annotations/${id}/vote`, { vote });
    } catch (error) {
      console.error('Failed to vote on annotation:', error);
      throw error;
    }
  }

  async addReply(annotationId: string, content: string): Promise<AnnotationReply> {
    try {
      const response = await api.post<AnnotationReply>(`/annotations/${annotationId}/replies`, { content });
      return response.data || this.createMockReply(annotationId, content);
    } catch (error) {
      console.error('Failed to add reply:', error);
      return this.createMockReply(annotationId, content);
    }
  }

  async requestAgentAnalysis(annotationId: string): Promise<void> {
    try {
      await api.post(`/annotations/${annotationId}/request-agent-analysis`);
    } catch (error) {
      console.error('Failed to request agent analysis:', error);
      throw error;
    }
  }

  async getAnnotationsForFile(filePath: string): Promise<FileAnnotation[]> {
    return this.getAnnotations({ file_path: filePath });
  }

  async getPublicAnnotations(): Promise<FileAnnotation[]> {
    return this.getAnnotations({ public_only: true });
  }

  async getVerifiedAnnotations(): Promise<FileAnnotation[]> {
    return this.getAnnotations({ verified_only: true });
  }

  // Mock data generators for development
  private getMockAnnotations(filter?: AnnotationFilter): FileAnnotation[] {
    const mockAnnotations: FileAnnotation[] = [
      {
        id: 'ann_1',
        file_path: '/extracted_files/image_001.jpg',
        user_id: 'user_1',
        username: 'AnalystAlpha',
        annotation_type: 'suspicious',
        content: 'Unusual byte sequence at offset 0x1A3F - possible steganographic payload',
        coordinates: {
          start_offset: 6719,
          end_offset: 6751,
          x: 150,
          y: 200,
          width: 32,
          height: 4
        },
        metadata: {
          file_type: 'JPEG',
          view_mode: 'hex',
          context: 'FF D8 FF E0 00 10 4A 46 49 46 00 01 01 01 00 48 [UNUSUAL] 3A 5B 9C 2E 8F 12 [/UNUSUAL] 00 48 00 00 FF DB',
          related_findings: ['high_entropy_region', 'non_standard_header'],
          agent_verified: true,
          confidence_score: 0.89
        },
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
        color: '#ff4444',
        is_public: true,
        upvotes: 5,
        downvotes: 0,
        replies: [
          {
            id: 'reply_1',
            annotation_id: 'ann_1',
            user_id: 'agent_steg',
            username: 'Steganography Agent',
            content: 'Analysis confirms: LSB steganography detected with 94% confidence. Extracting hidden payload now.',
            created_at: new Date(Date.now() - 3300000).toISOString(),
            is_agent_response: true,
            agent_id: 'steganography_agent'
          },
          {
            id: 'reply_2',
            annotation_id: 'ann_1',
            user_id: 'user_2',
            username: 'PuzzlerBeta',
            content: 'Great catch! I see similar patterns in files 047 and 089. Could be part of a coordinated sequence.',
            created_at: new Date(Date.now() - 3000000).toISOString(),
            is_agent_response: false
          }
        ]
      },
      {
        id: 'ann_2',
        file_path: '/extracted_files/document_023.txt',
        user_id: 'user_2',
        username: 'PuzzlerBeta',
        annotation_type: 'highlight',
        content: 'Possible coordinate reference - latitude/longitude format',
        coordinates: {
          start_offset: 1247,
          end_offset: 1267
        },
        metadata: {
          file_type: 'text',
          view_mode: 'text',
          context: 'meeting scheduled for tomorrow at coordinates 40.7128,-74.0060 near the old',
          related_findings: ['geographic_reference', 'temporal_clue'],
          confidence_score: 0.76
        },
        created_at: new Date(Date.now() - 7200000).toISOString(),
        updated_at: new Date(Date.now() - 7200000).toISOString(),
        color: '#44ff44',
        is_public: true,
        upvotes: 3,
        downvotes: 1,
        replies: [
          {
            id: 'reply_3',
            annotation_id: 'ann_2',
            user_id: 'agent_intel',
            username: 'Intelligence Agent',
            content: 'Coordinates verified: 40.7128,-74.0060 = New York City, Manhattan. Cross-referencing with other geographic clues in database.',
            created_at: new Date(Date.now() - 6900000).toISOString(),
            is_agent_response: true,
            agent_id: 'intelligence_agent'
          }
        ]
      },
      {
        id: 'ann_3',
        file_path: '/extracted_files/binary_payload.bin',
        user_id: 'user_1',
        username: 'AnalystAlpha',
        annotation_type: 'flag',
        content: 'Encrypted section - XOR cipher suspected based on entropy analysis',
        coordinates: {
          start_offset: 512,
          end_offset: 1024
        },
        metadata: {
          file_type: 'binary',
          view_mode: 'hex',
          context: '00 00 00 00 FF FF FF FF [ENCRYPTED_START] A3 5C 9E 12 8F 7B... [ENCRYPTED_END] 00 00 00 00',
          related_findings: ['xor_pattern', 'key_rotation'],
          agent_verified: true,
          confidence_score: 0.92
        },
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
        color: '#4444ff',
        is_public: false,
        upvotes: 7,
        downvotes: 0,
        replies: [
          {
            id: 'reply_4',
            annotation_id: 'ann_3',
            user_id: 'agent_crypto',
            username: 'Cryptography Agent',
            content: 'XOR cipher confirmed. Key pattern: rotating 4-byte sequence. Successfully decrypted 67% of payload. Contains ASCII text with embedded coordinates.',
            created_at: new Date(Date.now() - 1500000).toISOString(),
            is_agent_response: true,
            agent_id: 'cryptography_agent'
          }
        ]
      },
      {
        id: 'ann_4',
        file_path: '/extracted_files/metadata_dump.xml',
        user_id: 'user_3',
        username: 'CryptoGamma',
        annotation_type: 'bookmark',
        content: 'Timestamp anomaly - files created in impossible sequence',
        coordinates: {
          start_offset: 2056,
          end_offset: 2156
        },
        metadata: {
          file_type: 'XML',
          view_mode: 'text',
          context: '<timestamp>2023-02-30T25:67:99</timestamp><created>2023-02-29T23:59:59</created>',
          related_findings: ['temporal_anomaly', 'date_encoding'],
          confidence_score: 0.95
        },
        created_at: new Date(Date.now() - 5400000).toISOString(),
        updated_at: new Date(Date.now() - 5400000).toISOString(),
        color: '#ff8800',
        is_public: true,
        upvotes: 4,
        downvotes: 0,
        replies: []
      }
    ];

    // Apply filters
    if (filter?.file_path) {
      return mockAnnotations.filter(ann => ann.file_path === filter.file_path);
    }
    if (filter?.user_id) {
      return mockAnnotations.filter(ann => ann.user_id === filter.user_id);
    }
    if (filter?.annotation_type) {
      return mockAnnotations.filter(ann => ann.annotation_type === filter.annotation_type);
    }
    if (filter?.verified_only) {
      return mockAnnotations.filter(ann => ann.metadata.agent_verified);
    }
    if (filter?.public_only) {
      return mockAnnotations.filter(ann => ann.is_public);
    }

    return mockAnnotations;
  }

  private createMockAnnotation(partial: Omit<FileAnnotation, 'id' | 'created_at' | 'updated_at' | 'upvotes' | 'downvotes' | 'replies'>): FileAnnotation {
    return {
      ...partial,
      id: `ann_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0,
      replies: []
    };
  }

  private createMockReply(annotationId: string, content: string): AnnotationReply {
    return {
      id: `reply_${Date.now()}`,
      annotation_id: annotationId,
      user_id: 'current_user',
      username: 'You',
      content,
      created_at: new Date().toISOString(),
      is_agent_response: false
    };
  }
}

export const annotationService = new AnnotationService();
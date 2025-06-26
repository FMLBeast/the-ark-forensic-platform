import { api } from '@utils/api';

export interface PuzzleClue {
  id: string;
  type: 'text' | 'coordinate' | 'cipher' | 'pattern' | 'image' | 'audio' | 'philosophical' | 'temporal' | 'numerical';
  title: string;
  content: string;
  source_file?: string;
  discovered_by: string;
  discovered_at: string;
  confidence: number;
  verification_status: 'unverified' | 'verified' | 'disputed' | 'solved';
  related_clues: string[]; // IDs of related clues
  metadata: {
    extraction_method?: string;
    coordinates?: { x: number; y: number } | { lat: number; lng: number };
    cipher_type?: string;
    pattern_frequency?: number;
    temporal_context?: string;
    philosophical_theme?: string;
    numerical_sequence?: number[];
    interpretation?: string;
    next_steps?: string[];
  };
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  solution_status: 'unsolved' | 'partial' | 'complete';
  solution?: string;
  notes: ClueNote[];
}

export interface ClueNote {
  id: string;
  clue_id: string;
  user_id: string;
  username: string;
  content: string;
  note_type: 'observation' | 'theory' | 'connection' | 'solution' | 'question';
  created_at: string;
  upvotes: number;
  downvotes: number;
}

export interface PuzzleContext {
  id: string;
  title: string;
  description: string;
  theme: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimated_solve_time: number; // in hours
  creation_date: string;
  puzzle_type: 'arg' | 'ctf' | 'mystery' | 'treasure_hunt' | 'escape_room' | 'cipher_challenge';
  current_phase: string;
  completion_percentage: number;
  total_clues_expected: number;
  major_breakthroughs: string[];
  dead_ends: string[];
  working_theories: string[];
}

export interface FindingsAnalysis {
  connections: Array<{
    clue_ids: string[];
    connection_type: 'sequential' | 'thematic' | 'coordinate' | 'cipher_key' | 'temporal' | 'philosophical';
    description: string;
    confidence: number;
    implications: string[];
  }>;
  patterns: Array<{
    pattern_type: string;
    affected_clues: string[];
    description: string;
    significance: string;
  }>;
  gaps: Array<{
    description: string;
    missing_elements: string[];
    suggestions: string[];
  }>;
  next_steps: string[];
  overall_progress: {
    solved_percentage: number;
    confidence_in_direction: number;
    estimated_remaining_time: number;
  };
}

class FindingsService {
  constructor() {
    // Using import.meta.env for future API integration
  }

  // Clue Management
  async getClues(filter?: {
    type?: PuzzleClue['type'];
    status?: PuzzleClue['verification_status'];
    priority?: PuzzleClue['priority'];
    solved?: boolean;
    tags?: string[];
  }): Promise<PuzzleClue[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.type) params.append('type', filter.type);
      if (filter?.status) params.append('status', filter.status);
      if (filter?.priority) params.append('priority', filter.priority);
      if (filter?.solved !== undefined) params.append('solved', filter.solved.toString());
      if (filter?.tags) params.append('tags', filter.tags.join(','));

      const response = await api.get<{ clues: PuzzleClue[] }>(`/puzzle/clues?${params}`);
      return response.data?.clues || this.getMockClues(filter);
    } catch (error) {
      console.warn('Failed to fetch clues, using mock data:', error);
      return this.getMockClues(filter);
    }
  }

  async addClue(clue: Omit<PuzzleClue, 'id' | 'discovered_at' | 'notes'>): Promise<PuzzleClue> {
    try {
      const response = await api.post<PuzzleClue>('/puzzle/clues', clue);
      return response.data || this.createMockClue(clue);
    } catch (error) {
      console.error('Failed to add clue:', error);
      return this.createMockClue(clue);
    }
  }

  async updateClue(id: string, updates: Partial<PuzzleClue>): Promise<PuzzleClue> {
    try {
      const response = await api.put<PuzzleClue>(`/puzzle/clues/${id}`, updates);
      return response.data || this.getMockClues()[0];
    } catch (error) {
      console.error('Failed to update clue:', error);
      throw error;
    }
  }

  async deleteClue(id: string): Promise<void> {
    try {
      await api.delete(`/puzzle/clues/${id}`);
    } catch (error) {
      console.error('Failed to delete clue:', error);
      throw error;
    }
  }

  // Context Management
  async getPuzzleContext(): Promise<PuzzleContext> {
    try {
      const response = await api.get<PuzzleContext>('/puzzle/context');
      return response.data || this.getMockContext();
    } catch (error) {
      console.warn('Failed to fetch puzzle context, using mock data:', error);
      return this.getMockContext();
    }
  }

  async updatePuzzleContext(updates: Partial<PuzzleContext>): Promise<PuzzleContext> {
    try {
      const response = await api.put<PuzzleContext>('/puzzle/context', updates);
      return response.data || this.getMockContext();
    } catch (error) {
      console.error('Failed to update puzzle context:', error);
      return this.getMockContext();
    }
  }

  // Analysis and AI Integration
  async analyzeFindings(): Promise<FindingsAnalysis> {
    try {
      const response = await api.post<FindingsAnalysis>('/puzzle/analyze');
      return response.data || this.getMockAnalysis();
    } catch (error) {
      console.warn('Failed to analyze findings, using mock data:', error);
      return this.getMockAnalysis();
    }
  }

  async requestOrchestratorConsultation(query: string, context?: {
    specific_clues?: string[];
    focus_area?: string;
    urgency?: 'low' | 'medium' | 'high';
  }): Promise<{
    response: string;
    relevant_clues: PuzzleClue[];
    suggested_connections: string[];
    next_actions: string[];
    confidence: number;
  }> {
    try {
      const response = await api.post<any>('/puzzle/orchestrator-consult', { query, context });
      return response.data || this.getMockConsultation(query);
    } catch (error) {
      console.warn('Failed to consult orchestrator, using mock data:', error);
      return this.getMockConsultation(query);
    }
  }

  // Note Management
  async addClueNote(clueId: string, note: Omit<ClueNote, 'id' | 'clue_id' | 'created_at' | 'upvotes' | 'downvotes'>): Promise<ClueNote> {
    try {
      const response = await api.post<ClueNote>(`/puzzle/clues/${clueId}/notes`, note);
      return response.data || this.createMockNote(clueId, note);
    } catch (error) {
      console.error('Failed to add note:', error);
      return this.createMockNote(clueId, note);
    }
  }

  // Search and Discovery
  async searchClues(query: string): Promise<PuzzleClue[]> {
    try {
      const response = await api.get<{ clues: PuzzleClue[] }>(`/puzzle/clues/search?q=${encodeURIComponent(query)}`);
      return response.data?.clues || this.searchMockClues(query);
    } catch (error) {
      console.warn('Failed to search clues, using mock data:', error);
      return this.searchMockClues(query);
    }
  }

  async getCluesByTag(tag: string): Promise<PuzzleClue[]> {
    return this.getClues({ tags: [tag] });
  }

  async getUnsolvedClues(): Promise<PuzzleClue[]> {
    return this.getClues({ solved: false });
  }

  async getHighPriorityClues(): Promise<PuzzleClue[]> {
    return this.getClues({ priority: 'high' });
  }

  // Mock data generators for development
  private getMockClues(filter?: any): PuzzleClue[] {
    const mockClues: PuzzleClue[] = [
      {
        id: 'clue_1',
        type: 'philosophical',
        title: 'Eighteen Philosophical Sentences',
        content: '1. "The truth lies not in what is seen, but in what is hidden beneath the surface."\n2. "Time flows backward for those who understand its true nature."\n3. "Every cipher contains its own key, if one knows where to look."\n4. "The map is not the territory, but sometimes the territory is the map."\n5. "In the reflection of mirrors, reality becomes fiction and fiction becomes reality."\n6. "The seventh seal opens only to those who have closed the first six."\n7. "What appears to be random often follows the most precise order."\n8. "The answer to the riddle is the riddle itself."\n9. "East becomes west when the observer changes position."\n10. "The void between words carries more meaning than the words themselves."\n11. "Numbers are the language of the universe, but letters are its soul."\n12. "The beginning is the end, and the end is the beginning."\n13. "That which is above is like that which is below."\n14. "The key to understanding lies in the questions, not the answers."\n15. "Silence speaks louder than words in the digital realm."\n16. "The path forward is through the past."\n17. "Unity emerges from multiplicity when the pattern is revealed."\n18. "The final truth is that there is no final truth, only deeper mysteries."',
        source_file: '/extracted_files/philosophical_text.txt',
        discovered_by: 'PuzzlerBeta',
        discovered_at: new Date(Date.now() - 7200000).toISOString(),
        confidence: 0.95,
        verification_status: 'verified',
        related_clues: ['clue_2', 'clue_5'],
        metadata: {
          philosophical_theme: 'epistemology_metaphysics',
          interpretation: 'These sentences appear to contain encoded instructions for solving the overall puzzle',
          next_steps: ['Cross-reference with coordinate clues', 'Look for numerical patterns', 'Check for hidden acrostics']
        },
        tags: ['philosophy', 'instructions', 'encoded', 'master_key'],
        priority: 'critical',
        solution_status: 'partial',
        notes: []
      },
      {
        id: 'clue_2',
        type: 'coordinate',
        title: 'NYC Coordinates from Timestamp Analysis',
        content: '40.7128,-74.0060 (Manhattan, NY)\nDerived from file timestamp mathematical sequence',
        source_file: '/extracted_files/metadata_analysis.log',
        discovered_by: 'AnalystAlpha',
        discovered_at: new Date(Date.now() - 5400000).toISOString(),
        confidence: 0.87,
        verification_status: 'verified',
        related_clues: ['clue_1', 'clue_3'],
        metadata: {
          coordinates: { lat: 40.7128, lng: -74.0060 },
          extraction_method: 'timestamp_mathematical_analysis',
          interpretation: 'Physical location in Manhattan - possible meetup point or next clue location'
        },
        tags: ['coordinates', 'nyc', 'timestamp', 'location'],
        priority: 'high',
        solution_status: 'complete',
        notes: []
      },
      {
        id: 'clue_3',
        type: 'cipher',
        title: 'XOR Key Pattern: MATRIX_HUNT',
        content: 'Rotating XOR key discovered: "MATRIX_HUNT"\nApplied to 8 encrypted files, reveals ASCII coordinates and dates',
        source_file: '/extracted_files/encrypted_payload_*.bin',
        discovered_by: 'CryptoGamma',
        discovered_at: new Date(Date.now() - 3600000).toISOString(),
        confidence: 0.92,
        verification_status: 'verified',
        related_clues: ['clue_2', 'clue_4'],
        metadata: {
          cipher_type: 'rotating_xor',
          pattern_frequency: 11,
          interpretation: 'Key unlocks temporal and spatial coordinates across multiple files'
        },
        tags: ['xor', 'cipher', 'matrix', 'key'],
        priority: 'high',
        solution_status: 'complete',
        notes: []
      },
      {
        id: 'clue_4',
        type: 'temporal',
        title: 'Time-based Puzzle Sequence',
        content: 'Files created in impossible timestamp sequence point to specific dates:\n2023-02-30 (impossible) → Feb 28th + 2 days = March 2nd\n2023-13-45 (impossible) → Month 13 = January next year, Day 45 = Feb 14th\nPattern suggests Valentine\'s Day 2024 significance',
        source_file: '/extracted_files/metadata_dump.xml',
        discovered_by: 'TemporalHunter',
        discovered_at: new Date(Date.now() - 1800000).toISOString(),
        confidence: 0.78,
        verification_status: 'verified',
        related_clues: ['clue_3', 'clue_5'],
        metadata: {
          temporal_context: 'impossible_dates_encoding_real_dates',
          interpretation: 'Valentine\'s Day 2024 is significant - possible deadline or event date'
        },
        tags: ['temporal', 'dates', 'valentine', 'deadline'],
        priority: 'medium',
        solution_status: 'partial',
        notes: []
      },
      {
        id: 'clue_5',
        type: 'pattern',
        title: 'Steganographic Message Chain',
        content: 'Hidden messages in 12 images form coherent sequence:\n"SEEK THE TRUTH IN THE MIRROR OF TIME"\n"WHERE SHADOWS MEET LIGHT AT THE CROSSROADS"\n"THE SEVENTH HOUR HOLDS THE FINAL KEY"\nMessages appear to reference philosophical sentences #5, #9, and #6',
        source_file: '/extracted_files/image_*.jpg',
        discovered_by: 'SteganographyAgent',
        discovered_at: new Date(Date.now() - 900000).toISOString(),
        confidence: 0.89,
        verification_status: 'verified',
        related_clues: ['clue_1', 'clue_6'],
        metadata: {
          extraction_method: 'lsb_steganography',
          pattern_frequency: 12,
          interpretation: 'Messages directly reference philosophical sentences - cross-validation confirms connection'
        },
        tags: ['steganography', 'messages', 'philosophy_reference', 'sequence'],
        priority: 'high',
        solution_status: 'partial',
        notes: []
      },
      {
        id: 'clue_6',
        type: 'numerical',
        title: 'Fibonacci Sequence in File Sizes',
        content: 'File sizes follow Fibonacci sequence when ordered by discovery:\n1597, 2584, 4181, 6765, 10946 bytes\nNext expected: 17711 bytes - searching for missing file',
        source_file: 'Multiple files',
        discovered_by: 'PatternRecognitionAgent',
        discovered_at: new Date(Date.now() - 600000).toISOString(),
        confidence: 0.94,
        verification_status: 'verified',
        related_clues: ['clue_5'],
        metadata: {
          numerical_sequence: [1597, 2584, 4181, 6765, 10946, 17711],
          interpretation: 'Mathematical progression suggests systematic puzzle design - missing file likely contains crucial information'
        },
        tags: ['fibonacci', 'file_sizes', 'mathematical', 'missing_piece'],
        priority: 'critical',
        solution_status: 'unsolved',
        notes: []
      }
    ];

    // Apply filters
    let filtered = mockClues;
    
    if (filter?.type) {
      filtered = filtered.filter(clue => clue.type === filter.type);
    }
    if (filter?.status) {
      filtered = filtered.filter(clue => clue.verification_status === filter.status);
    }
    if (filter?.priority) {
      filtered = filtered.filter(clue => clue.priority === filter.priority);
    }
    if (filter?.solved !== undefined) {
      const isSolved = filter.solved;
      filtered = filtered.filter(clue => (clue.solution_status === 'complete') === isSolved);
    }
    if (filter?.tags) {
      filtered = filtered.filter(clue => filter.tags.some((tag: string) => clue.tags.includes(tag)));
    }

    return filtered;
  }

  private getMockContext(): PuzzleContext {
    return {
      id: 'matrix_hunt_2024',
      title: 'The Matrix Hunt: Digital Archaeology',
      description: 'A complex alternate reality game involving steganography, cryptography, philosophy, and temporal puzzles hidden within a forensic disk image.',
      theme: 'Digital Detective Work with Philosophical Elements',
      difficulty_level: 'expert',
      estimated_solve_time: 48,
      creation_date: new Date(Date.now() - 86400000 * 30).toISOString(),
      puzzle_type: 'arg',
      current_phase: 'Cross-referencing philosophical clues with discovered coordinates and temporal patterns',
      completion_percentage: 67,
      total_clues_expected: 15,
      major_breakthroughs: [
        'Discovery of the 18 philosophical sentences',
        'XOR key pattern "MATRIX_HUNT" decryption',
        'NYC coordinates from timestamp analysis',
        'Steganographic message chain connection'
      ],
      dead_ends: [
        'Initial assumption about random file placement',
        'Brute force attempts on encrypted files without key',
        'Geographic search outside NYC area'
      ],
      working_theories: [
        'Philosophical sentences contain master instructions for puzzle solution',
        'Valentine\'s Day 2024 is a critical deadline or event',
        'Physical NYC location contains next phase of puzzle',
        'Missing Fibonacci-sized file holds final key'
      ]
    };
  }

  private getMockAnalysis(): FindingsAnalysis {
    return {
      connections: [
        {
          clue_ids: ['clue_1', 'clue_5'],
          connection_type: 'thematic',
          description: 'Steganographic messages directly reference specific philosophical sentences (#5, #6, #9)',
          confidence: 0.95,
          implications: [
            'Philosophical sentences are master instructions',
            'Hidden messages validate interpretation',
            'Cross-validation confirms puzzle structure'
          ]
        },
        {
          clue_ids: ['clue_2', 'clue_3', 'clue_4'],
          connection_type: 'temporal',
          description: 'XOR decryption reveals coordinates that align with timestamp-derived location and dates',
          confidence: 0.88,
          implications: [
            'Multi-layer encoding system confirmed',
            'NYC location is central to puzzle',
            'Temporal elements point to specific event timing'
          ]
        }
      ],
      patterns: [
        {
          pattern_type: 'mathematical_progression',
          affected_clues: ['clue_6', 'clue_3'],
          description: 'Fibonacci sequence in file sizes and 11-character repeating XOR key show mathematical foundation',
          significance: 'Puzzle has strong mathematical underpinning - expect more numerical patterns'
        }
      ],
      gaps: [
        {
          description: 'Missing file with 17711 byte size in Fibonacci sequence',
          missing_elements: ['Next Fibonacci file', 'Physical verification of NYC coordinates', 'Valentine\'s Day 2024 significance'],
          suggestions: [
            'Search disk image for 17711-byte files',
            'Plan NYC location reconnaissance',
            'Research Valentine\'s Day 2024 events in Manhattan'
          ]
        }
      ],
      next_steps: [
        'Use philosophical sentences as decoding instructions for remaining clues',
        'Locate and analyze the missing Fibonacci-sized file',
        'Plan investigation of NYC coordinates (40.7128,-74.0060)',
        'Cross-reference all temporal clues with Valentine\'s Day 2024'
      ],
      overall_progress: {
        solved_percentage: 67,
        confidence_in_direction: 0.85,
        estimated_remaining_time: 12
      }
    };
  }

  private getMockConsultation(query: string): any {
    const isPhilosophyQuery = query.toLowerCase().includes('philosophical') || query.toLowerCase().includes('sentences') || query.toLowerCase().includes('18');
    
    if (isPhilosophyQuery) {
      return {
        response: `Based on the 18 philosophical sentences and current findings, I see a clear pattern emerging. The sentences aren't just thematic - they're literal instructions:

**Key Connections I've Found:**
- Sentence #5 "In the reflection of mirrors..." directly referenced in steganographic message "SEEK THE TRUTH IN THE MIRROR OF TIME"
- Sentence #6 "The seventh seal opens..." connects to "THE SEVENTH HOUR HOLDS THE FINAL KEY" 
- Sentence #9 "East becomes west..." relates to coordinate transformation and the NYC location

**The Pattern:**
The philosophical sentences appear to be a master cipher key. Each sentence corresponds to a specific puzzle element:
- Sentences about time (#2, #12, #16) → Temporal clues and Valentine's Day 2024
- Sentences about hidden truth (#1, #7, #14) → Steganographic messages
- Sentences about numbers/order (#7, #11, #17) → Fibonacci sequence and XOR patterns

**My Analysis:**
You're dealing with a multi-layered ARG where the philosophical sentences serve as both thematic framework AND literal decoding instructions. The puzzle creator embedded the solution method within the philosophical text.

**Immediate Next Steps:**
1. Map each philosophical sentence to a discovered element
2. Use unmapped sentences to predict remaining puzzle pieces
3. Sentence #7 "What appears random follows precise order" suggests the Fibonacci file isn't random - calculate its expected location using the mathematical pattern`,
        relevant_clues: this.getMockClues().filter(c => ['clue_1', 'clue_5', 'clue_6'].includes(c.id)),
        suggested_connections: [
          'Map each philosophical sentence to a puzzle element',
          'Use sentence structure to predict missing pieces',
          'Apply sentence meanings as literal decoding instructions'
        ],
        next_actions: [
          'Create sentence-to-element mapping matrix',
          'Calculate expected location of missing Fibonacci file',
          'Apply unmapped sentences to unsolved elements'
        ],
        confidence: 0.92
      };
    }

    return {
      response: `I've analyzed the current findings and can see several interconnected patterns. The puzzle appears to be a sophisticated ARG with multiple validation layers - each clue type (philosophical, numerical, geographical, temporal) cross-validates the others.

**Current Status Analysis:**
- Strong mathematical foundation (Fibonacci, XOR patterns)
- Geographic focus on Manhattan coordinates
- Temporal elements pointing to Valentine's Day 2024
- Philosophical framework providing interpretation context

**Missing Pieces:**
The Fibonacci sequence gap suggests systematic design - the missing 17711-byte file likely contains crucial progression information. The philosophical sentences seem to be more than thematic - they might be literal instructions.

**Recommended Approach:**
Focus on the intersection points between different clue types. The strongest leads are where multiple clue categories reinforce each other.`,
      relevant_clues: this.getMockClues().slice(0, 3),
      suggested_connections: [
        'Cross-validate temporal and geographical elements',
        'Use mathematical patterns to predict missing pieces',
        'Treat philosophical elements as functional rather than decorative'
      ],
      next_actions: [
        'Systematic search for missing Fibonacci file',
        'Detailed analysis of NYC coordinate significance',
        'Timeline mapping for Valentine\'s Day 2024 events'
      ],
      confidence: 0.78
    };
  }

  private createMockClue(partial: Omit<PuzzleClue, 'id' | 'discovered_at' | 'notes'>): PuzzleClue {
    return {
      ...partial,
      id: `clue_${Date.now()}`,
      discovered_at: new Date().toISOString(),
      notes: []
    };
  }

  private createMockNote(clueId: string, partial: Omit<ClueNote, 'id' | 'clue_id' | 'created_at' | 'upvotes' | 'downvotes'>): ClueNote {
    return {
      ...partial,
      id: `note_${Date.now()}`,
      clue_id: clueId,
      created_at: new Date().toISOString(),
      upvotes: 0,
      downvotes: 0
    };
  }

  private searchMockClues(query: string): PuzzleClue[] {
    const allClues = this.getMockClues();
    const lowerQuery = query.toLowerCase();
    
    return allClues.filter(clue => 
      clue.title.toLowerCase().includes(lowerQuery) ||
      clue.content.toLowerCase().includes(lowerQuery) ||
      clue.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

export const findingsService = new FindingsService();
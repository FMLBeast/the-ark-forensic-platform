// src/types/index.ts

export interface Operative {
  id: string;
  username: string;
  display_name: string;
  role: string;
  clearance_level: number;
  avatar?: string;
  last_active?: string;
  status: 'online' | 'away' | 'offline';
}

export interface ForensicFile {
  id: string;
  filename: string;
  filepath: string;
  size: number;
  entropy: number;
  signature_matches: number;
  analysis_date: string;
  suspicion_score: number;
  file_type: string;
  hash?: string;
}

export interface XorResult {
  id: string;
  file_id: string;
  xor_key: string;
  key_type: 'single_byte' | 'multi_byte' | 'rotating';
  plaintext_score: number;
  decrypted_content: string;
  readable_strings: number;
  content_preview: string;
}

export interface SteganographyResult {
  id: string;
  file_id: string;
  extraction_method: string;
  extracted_content: string;
  extraction_score: number;
  content_type: string;
}

export interface DatabaseIntelligence {
  database_overview: {
    total_files_analyzed: number;
    database_size_gb: number;
    total_strings_extracted: number;
    analysis_timestamp: string;
  };
  key_findings: {
    successful_xor_decryptions: number;
    steganographic_patterns_found: number;
    files_with_embedded_content: number;
    high_entropy_files: number;
  };
  table_statistics: Record<string, number>;
  analysis_capabilities: string[];
  recommended_investigations: string[];
}

export interface Investigation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planning' | 'investigating' | 'analyzing' | 'complete';
  author: string;
  display_name: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  evidence_files: string[];
  collaborators: string[];
}

export interface SystemStatus {
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected' | 'error';
    files_analyzed: number;
    size_gb: number;
    strings_extracted: number;
    response_time?: number;
  };
  analysis: {
    xor_decryptions: number;
    stego_patterns: number;
    high_entropy_files: number;
    embedded_files: number;
  };
  security: {
    clearance_level: number;
    session_active: boolean;
    last_activity: string;
  };
}

export interface SearchFilter {
  query?: string;
  file_type?: string;
  category?: string;
  date_range?: {
    start: string;
    end: string;
  };
  entropy_range?: {
    min: number;
    max: number;
  };
  suspicion_threshold?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface WebSocketMessage {
  type: 'status_update' | 'analysis_progress' | 'notification' | 'system_alert';
  data: any;
  timestamp: string;
  source?: string;
}

export interface AnalysisSession {
  id: string;
  type: 'comprehensive' | 'xor_focused' | 'stego_scan' | 'custom';
  status: 'pending' | 'running' | 'complete' | 'error';
  progress: number;
  current_phase?: string;
  results?: any[];
  errors?: string[];
  started_at: string;
  completed_at?: string;
  estimated_duration?: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionable?: boolean;
  action?: {
    label: string;
    url: string;
  };
}

export interface HUDMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'normal' | 'warning' | 'critical';
  description?: string;
}
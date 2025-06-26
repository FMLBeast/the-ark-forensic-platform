import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { config } from '../config/config.js';

let db = null;

export async function initDatabase() {
  try {
    // Ensure data directory exists
    const dbDir = dirname(config.database.path);
    await mkdir(dbDir, { recursive: true });
    
    // Open database connection
    db = await open({
      filename: config.database.path,
      driver: sqlite3.Database
    });
    
    // Enable foreign keys
    await db.exec('PRAGMA foreign_keys = ON');
    
    // Create tables
    await createTables();
    
    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  const tables = [
    // Users/Operatives table
    `CREATE TABLE IF NOT EXISTS operatives (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'investigator',
      clearance_level INTEGER NOT NULL DEFAULT 1,
      avatar TEXT,
      status TEXT NOT NULL DEFAULT 'offline',
      last_active DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Forensic files table
    `CREATE TABLE IF NOT EXISTS forensic_files (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      original_name TEXT NOT NULL,
      size INTEGER NOT NULL,
      mime_type TEXT,
      hash_md5 TEXT,
      hash_sha256 TEXT,
      entropy REAL,
      file_type TEXT,
      signature_matches INTEGER DEFAULT 0,
      suspicion_score REAL DEFAULT 0,
      uploaded_by TEXT,
      analysis_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES operatives(id)
    )`,
    
    // Investigations table
    `CREATE TABLE IF NOT EXISTS investigations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      status TEXT NOT NULL DEFAULT 'planning',
      author TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author) REFERENCES operatives(id)
    )`,
    
    // Investigation collaborators
    `CREATE TABLE IF NOT EXISTS investigation_collaborators (
      investigation_id TEXT,
      operative_id TEXT,
      role TEXT DEFAULT 'collaborator',
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (investigation_id, operative_id),
      FOREIGN KEY (investigation_id) REFERENCES investigations(id),
      FOREIGN KEY (operative_id) REFERENCES operatives(id)
    )`,
    
    // Investigation evidence files
    `CREATE TABLE IF NOT EXISTS investigation_evidence (
      investigation_id TEXT,
      file_id TEXT,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (investigation_id, file_id),
      FOREIGN KEY (investigation_id) REFERENCES investigations(id),
      FOREIGN KEY (file_id) REFERENCES forensic_files(id)
    )`,
    
    // Analysis sessions
    `CREATE TABLE IF NOT EXISTS analysis_sessions (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      current_phase TEXT,
      started_by TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      estimated_duration INTEGER,
      FOREIGN KEY (file_id) REFERENCES forensic_files(id),
      FOREIGN KEY (started_by) REFERENCES operatives(id)
    )`,
    
    // Analysis results
    `CREATE TABLE IF NOT EXISTS analysis_results (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      agent_id TEXT,
      result_type TEXT NOT NULL,
      success BOOLEAN NOT NULL,
      confidence_score REAL,
      execution_time REAL,
      output_data TEXT, -- JSON
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES analysis_sessions(id)
    )`,
    
    // XOR analysis results
    `CREATE TABLE IF NOT EXISTS xor_results (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      xor_key TEXT NOT NULL,
      key_type TEXT NOT NULL,
      plaintext_score REAL NOT NULL,
      decrypted_content TEXT,
      readable_strings INTEGER DEFAULT 0,
      content_preview TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES forensic_files(id)
    )`,
    
    // Steganography results
    `CREATE TABLE IF NOT EXISTS steganography_results (
      id TEXT PRIMARY KEY,
      file_id TEXT NOT NULL,
      extraction_method TEXT NOT NULL,
      extracted_content TEXT,
      extraction_score REAL NOT NULL,
      content_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_id) REFERENCES forensic_files(id)
    )`,
    
    // System notifications
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      recipient_id TEXT,
      read BOOLEAN DEFAULT FALSE,
      actionable BOOLEAN DEFAULT FALSE,
      action_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipient_id) REFERENCES operatives(id)
    )`,
    
    // Agent orchestration sessions
    `CREATE TABLE IF NOT EXISTS orchestration_sessions (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      analysis_type TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      current_phase TEXT,
      agents_involved TEXT, -- JSON array
      task_count INTEGER DEFAULT 0,
      completed_tasks INTEGER DEFAULT 0,
      failed_tasks INTEGER DEFAULT 0,
      insights TEXT, -- JSON array
      connections_discovered TEXT, -- JSON array
      started_by TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      estimated_completion DATETIME,
      completed_at DATETIME,
      FOREIGN KEY (started_by) REFERENCES operatives(id)
    )`
  ];
  
  for (const table of tables) {
    await db.exec(table);
  }
  
  // Create indexes for better performance
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_forensic_files_hash ON forensic_files(hash_sha256)',
    'CREATE INDEX IF NOT EXISTS idx_forensic_files_type ON forensic_files(file_type)',
    'CREATE INDEX IF NOT EXISTS idx_forensic_files_suspicion ON forensic_files(suspicion_score)',
    'CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status)',
    'CREATE INDEX IF NOT EXISTS idx_investigations_priority ON investigations(priority)',
    'CREATE INDEX IF NOT EXISTS idx_analysis_sessions_status ON analysis_sessions(status)',
    'CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id, read)'
  ];
  
  for (const index of indexes) {
    await db.exec(index);
  }
  
  // Insert default admin user if none exists
  await createDefaultUser();
}

async function createDefaultUser() {
  const existingUser = await db.get('SELECT id FROM operatives LIMIT 1');
  
  if (!existingUser) {
    const bcrypt = await import('bcryptjs');
    const defaultPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(defaultPassword, config.security.bcryptRounds);
    
    await db.run(
      `INSERT INTO operatives (id, username, display_name, password_hash, role, clearance_level)
       VALUES (?, ?, ?, ?, ?, ?)`,
      ['admin-001', 'admin', 'System Administrator', hashedPassword, 'admin', 5]
    );
    
    console.log('👤 Default admin user created (username: admin, password: admin123)');
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
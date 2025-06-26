import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  MessageSquare, 
  FileText, 
  Clock, 
  User,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Upload
} from 'lucide-react';
import { cn } from '@utils/cn';

interface Finding {
  id: string;
  title: string;
  description: string;
  category: 'steganography' | 'encryption' | 'metadata' | 'pattern' | 'other';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'review' | 'confirmed' | 'archived';
  author: string;
  authorRole: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  attachments?: number;
  collaborators: string[];
}

const mockFindings: Finding[] = [
  {
    id: '1',
    title: 'Hidden ZIP Archive in LSB Channels',
    description: 'Discovered a complete ZIP archive embedded in the least significant bits of the RGB channels. Archive contains multiple files including encrypted data.',
    category: 'steganography',
    priority: 'high',
    status: 'confirmed',
    author: 'lead_investigator',
    authorRole: 'The Architect',
    createdAt: '2 hours ago',
    updatedAt: '1 hour ago',
    tags: ['lsb', 'archive', 'rgb-channels'],
    attachments: 3,
    collaborators: ['analyst1', 'analyst2']
  },
  {
    id: '2',
    title: 'XOR Encrypted Coordinates Found',
    description: 'GPS coordinates encrypted with single-byte XOR key 0x42. Coordinates point to a location in downtown area.',
    category: 'encryption',
    priority: 'critical',
    status: 'review',
    author: 'analyst1',
    authorRole: 'Morpheus',
    createdAt: '4 hours ago',
    updatedAt: '30 minutes ago',
    tags: ['xor', 'gps', 'coordinates'],
    attachments: 1,
    collaborators: ['lead_investigator']
  },
  {
    id: '3',
    title: 'EXIF Metadata Analysis',
    description: 'Camera make/model suggests professional equipment. Timestamp indicates photo taken during specific timeframe of interest.',
    category: 'metadata',
    priority: 'medium',
    status: 'draft',
    author: 'researcher',
    authorRole: 'The Oracle',
    createdAt: '1 day ago',
    updatedAt: '6 hours ago',
    tags: ['exif', 'timestamp', 'camera'],
    collaborators: []
  }
];

const operatives = [
  { id: 'lead_investigator', name: 'The Architect', status: 'online', clearance: 10 },
  { id: 'analyst1', name: 'Morpheus', status: 'online', clearance: 9 },
  { id: 'analyst2', name: 'Trinity', status: 'away', clearance: 8 },
  { id: 'researcher', name: 'The Oracle', status: 'online', clearance: 7 },
  { id: 'puzzler', name: 'Neo', status: 'offline', clearance: 10 }
];

export const CollaborationPage: React.FC = () => {
  const [findings] = useState<Finding[]>(mockFindings);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showNewFinding, setShowNewFinding] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'steganography': return 'bg-blue-500/20 text-blue-400';
      case 'encryption': return 'bg-red-500/20 text-red-400';
      case 'metadata': return 'bg-green-500/20 text-green-400';
      case 'pattern': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-matrix-500/20 text-matrix-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-status-error';
      case 'high': return 'text-status-warning';
      case 'medium': return 'text-matrix-500';
      case 'low': return 'text-matrix-600';
      default: return 'text-matrix-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-status-success/20 text-status-success';
      case 'review': return 'bg-status-warning/20 text-status-warning';
      case 'draft': return 'bg-matrix-500/20 text-matrix-500';
      case 'archived': return 'bg-gray-500/20 text-gray-500';
      default: return 'bg-matrix-500/20 text-matrix-500';
    }
  };

  const filteredFindings = findings.filter(finding => {
    const matchesSearch = finding.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         finding.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         finding.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || finding.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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
            👥 Collaboration
          </h1>
          <p className="text-matrix-600">
            Team investigation workspace and findings management
          </p>
        </div>
        
        <button
          onClick={() => setShowNewFinding(!showNewFinding)}
          className="matrix-btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Finding
        </button>
      </motion.div>

      {/* Team Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="matrix-card"
      >
        <div className="matrix-card-header">
          <h2 className="matrix-card-title flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Status
          </h2>
          <span className="text-xs font-mono text-matrix-600">
            {operatives.filter(op => op.status === 'online').length} ONLINE
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {operatives.map((operative) => (
            <div
              key={operative.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-bg-panel border border-matrix-800"
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-matrix-500/20 border border-matrix-700 flex items-center justify-center">
                  <span className="text-xs font-mono font-bold text-matrix-500">
                    {operative.name[0]}
                  </span>
                </div>
                <div className={cn(
                  'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-bg-panel',
                  operative.status === 'online' && 'bg-status-success',
                  operative.status === 'away' && 'bg-status-warning',
                  operative.status === 'offline' && 'bg-gray-500'
                )} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-mono text-matrix-500 truncate">
                  {operative.name}
                </div>
                <div className="text-xs text-matrix-700">
                  L{operative.clearance}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="matrix-card"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-matrix-600" />
            <input
              type="text"
              placeholder="Search findings, tags, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="matrix-input w-full pl-10"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="matrix-input"
          >
            <option value="all">All Categories</option>
            <option value="steganography">Steganography</option>
            <option value="encryption">Encryption</option>
            <option value="metadata">Metadata</option>
            <option value="pattern">Pattern</option>
            <option value="other">Other</option>
          </select>
          <button className="matrix-btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Findings List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-1"
        >
          <div className="matrix-card">
            <div className="matrix-card-header">
              <h2 className="matrix-card-title">Investigation Findings</h2>
              <span className="text-xs font-mono text-matrix-600">
                {filteredFindings.length} FINDINGS
              </span>
            </div>
            
            <div className="space-y-2">
              {filteredFindings.map((finding) => (
                <motion.button
                  key={finding.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedFinding(finding)}
                  className={cn(
                    'w-full p-3 rounded-lg border transition-all duration-200 text-left',
                    selectedFinding?.id === finding.id
                      ? 'bg-matrix-500/20 border-matrix-500'
                      : 'bg-bg-panel border-matrix-800 hover:border-matrix-600'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-mono text-sm text-matrix-500 truncate flex-1">
                      {finding.title}
                    </div>
                    <div className={cn('text-xs font-bold', getPriorityColor(finding.priority))}>
                      {finding.priority.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('px-2 py-1 rounded text-xs font-mono', getCategoryColor(finding.category))}>
                      {finding.category.toUpperCase()}
                    </span>
                    <span className={cn('px-2 py-1 rounded text-xs font-mono', getStatusColor(finding.status))}>
                      {finding.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="text-xs text-matrix-600 mb-2 line-clamp-2">
                    {finding.description}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      <span className="text-matrix-700">{finding.authorRole}</span>
                    </div>
                    <div className="flex items-center gap-2 text-matrix-700">
                      <Clock className="w-3 h-3" />
                      {finding.updatedAt}
                    </div>
                  </div>
                  
                  {finding.attachments && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-matrix-600">
                      <FileText className="w-3 h-3" />
                      {finding.attachments} attachments
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Finding Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          {selectedFinding ? (
            <div className="space-y-6">
              {/* Finding Header */}
              <div className="matrix-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-mono font-bold text-matrix-500 mb-2">
                      {selectedFinding.title}
                    </h2>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn('px-2 py-1 rounded text-xs font-mono', getCategoryColor(selectedFinding.category))}>
                        {selectedFinding.category.toUpperCase()}
                      </span>
                      <span className={cn('px-2 py-1 rounded text-xs font-mono', getStatusColor(selectedFinding.status))}>
                        {selectedFinding.status.toUpperCase()}
                      </span>
                      <span className={cn('text-xs font-bold', getPriorityColor(selectedFinding.priority))}>
                        {selectedFinding.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="matrix-btn-secondary p-2">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="matrix-btn-secondary p-2">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="matrix-btn-secondary p-2 text-status-error">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-2 rounded-lg bg-bg-secondary/50">
                    <div className="text-sm font-mono text-matrix-500">Author</div>
                    <div className="text-xs text-matrix-600">{selectedFinding.authorRole}</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-bg-secondary/50">
                    <div className="text-sm font-mono text-matrix-500">Created</div>
                    <div className="text-xs text-matrix-600">{selectedFinding.createdAt}</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-bg-secondary/50">
                    <div className="text-sm font-mono text-matrix-500">Updated</div>
                    <div className="text-xs text-matrix-600">{selectedFinding.updatedAt}</div>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-bg-secondary/50">
                    <div className="text-sm font-mono text-matrix-500">Collaborators</div>
                    <div className="text-xs text-matrix-600">{selectedFinding.collaborators.length}</div>
                  </div>
                </div>
                
                <p className="text-matrix-600 leading-relaxed">
                  {selectedFinding.description}
                </p>
                
                {selectedFinding.tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-matrix-800">
                    <div className="text-sm font-mono text-matrix-600 mb-2">Tags:</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedFinding.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 rounded-lg bg-matrix-500/10 text-matrix-500 text-xs font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Attachments */}
              {selectedFinding.attachments && (
                <div className="matrix-card">
                  <div className="matrix-card-header">
                    <h3 className="matrix-card-title">Evidence Attachments</h3>
                    <button className="matrix-btn-secondary text-xs flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Add File
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {Array.from({ length: selectedFinding.attachments }, (_, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-bg-secondary/50">
                        <FileText className="w-5 h-5 text-matrix-500" />
                        <div className="flex-1">
                          <div className="text-sm font-mono text-matrix-500">
                            evidence_{i + 1}.{i === 0 ? 'jpg' : i === 1 ? 'zip' : 'txt'}
                          </div>
                          <div className="text-xs text-matrix-600">
                            {(Math.random() * 1000 + 100).toFixed(0)}KB • {selectedFinding.updatedAt}
                          </div>
                        </div>
                        <button className="matrix-btn-secondary text-xs">
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div className="matrix-card">
                <div className="matrix-card-header">
                  <h3 className="matrix-card-title flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Discussion
                  </h3>
                  <span className="text-xs font-mono text-matrix-600">
                    2 COMMENTS
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-bg-secondary/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-matrix-500/20 flex items-center justify-center">
                        <span className="text-xs font-mono text-matrix-500">M</span>
                      </div>
                      <span className="text-sm font-mono text-matrix-500">Morpheus</span>
                      <span className="text-xs text-matrix-700">1 hour ago</span>
                    </div>
                    <p className="text-sm text-matrix-600">
                      Confirmed the XOR key works across multiple sections. This is definitely significant.
                    </p>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-bg-secondary/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-matrix-500/20 flex items-center justify-center">
                        <span className="text-xs font-mono text-matrix-500">T</span>
                      </div>
                      <span className="text-sm font-mono text-matrix-500">Trinity</span>
                      <span className="text-xs text-matrix-700">30 minutes ago</span>
                    </div>
                    <p className="text-sm text-matrix-600">
                      I can cross-reference these coordinates with our database. Will update shortly.
                    </p>
                  </div>
                  
                  <div className="pt-3 border-t border-matrix-800">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-matrix-500/20 flex items-center justify-center">
                        <span className="text-sm font-mono text-matrix-500">A</span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          placeholder="Add your comment..."
                          className="matrix-input w-full h-20 resize-none"
                        />
                        <div className="flex justify-end mt-2">
                          <button className="matrix-btn-primary text-xs">
                            Post Comment
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="matrix-card h-96 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 text-matrix-700 mx-auto mb-4" />
                <p className="text-matrix-600 font-mono">
                  Select a finding to view details and collaborate
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
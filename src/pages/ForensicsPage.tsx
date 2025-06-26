import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  FileText, 
  Image, 
  Archive,
  TreePine,
  Network,
  Layers,
  Hash,
  Zap,
  ChevronDown,
  ChevronRight,
  Folder,
  File,
  MessageCircle,
  Bot,
  Users
} from 'lucide-react';
import { cn } from '@utils/cn';
import { AgentDashboard } from '@components/features/AgentDashboard';
import { LiveChat } from '@components/features/LiveChat';
import { OrchestratorChat } from '@components/features/OrchestratorChat';
import { FileAnnotator } from '@components/features/FileAnnotator';
import { LLMInsights } from '@components/features/LLMInsights';
import ChallengeManager from '@components/features/ChallengeManager';

interface ExtractedFile {
  id: string;
  name: string;
  type: 'image' | 'text' | 'binary' | 'archive' | 'encrypted';
  size: number;
  parent_id?: string;
  extraction_method: string;
  entropy: number;
  offset: number;
  depth: number;
  children?: ExtractedFile[];
  preview?: string;
  hash?: string;
}

// Mock data representing files extracted from a single source image
const mockExtractedFiles: ExtractedFile[] = [
  {
    id: 'root',
    name: 'source_image.jpg',
    type: 'image',
    size: 2048576,
    extraction_method: 'original',
    entropy: 7.2,
    offset: 0,
    depth: 0,
    hash: 'a1b2c3d4e5f6...',
    children: [
      {
        id: 'hidden_zip',
        name: 'hidden_archive.zip',
        type: 'archive',
        size: 524288,
        parent_id: 'root',
        extraction_method: 'steganography_lsb',
        entropy: 7.8,
        offset: 1024000,
        depth: 1,
        hash: 'f6e5d4c3b2a1...',
        children: [
          {
            id: 'readme',
            name: 'README.txt',
            type: 'text',
            size: 512,
            parent_id: 'hidden_zip',
            extraction_method: 'zip_extraction',
            entropy: 4.1,
            offset: 0,
            depth: 2,
            preview: 'This is a hidden message...',
            hash: 'txt123hash...'
          },
          {
            id: 'encrypted_file',
            name: 'secret.enc',
            type: 'encrypted',
            size: 8192,
            parent_id: 'hidden_zip',
            extraction_method: 'zip_extraction',
            entropy: 7.9,
            offset: 512,
            depth: 2,
            hash: 'enc456hash...'
          }
        ]
      },
      {
        id: 'xor_data',
        name: 'xor_decrypted.bin',
        type: 'binary',
        size: 4096,
        parent_id: 'root',
        extraction_method: 'xor_decryption',
        entropy: 6.5,
        offset: 1548288,
        depth: 1,
        preview: 'Binary data containing coordinates...',
        hash: 'xor789hash...'
      },
      {
        id: 'metadata_strings',
        name: 'extracted_strings.txt',
        type: 'text',
        size: 2048,
        parent_id: 'root',
        extraction_method: 'metadata_extraction',
        entropy: 5.2,
        offset: 2046528,
        depth: 1,
        preview: 'GPS coordinates, timestamps, device info...',
        hash: 'str012hash...'
      }
    ]
  }
];

const FileTreeNode: React.FC<{
  file: ExtractedFile;
  level: number;
  onSelect: (file: ExtractedFile) => void;
  selectedId?: string;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}> = ({ file, level, onSelect, selectedId, isExpanded, onToggleExpand }) => {
  const hasChildren = file.children && file.children.length > 0;
  const isSelected = selectedId === file.id;
  
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'text': return FileText;
      case 'archive': return Archive;
      case 'encrypted': return Hash;
      default: return File;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'text-blue-400';
      case 'text': return 'text-green-400';
      case 'archive': return 'text-yellow-400';
      case 'encrypted': return 'text-red-400';
      case 'binary': return 'text-purple-400';
      default: return 'text-matrix-500';
    }
  };

  const Icon = getFileIcon(file.type);

  return (
    <div className="select-none">
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200',
          'hover:bg-matrix-500/10 hover:border-matrix-600',
          isSelected && 'bg-matrix-500/20 border border-matrix-500',
          !isSelected && 'border border-transparent'
        )}
        style={{ marginLeft: `${level * 20}px` }}
        onClick={() => onSelect(file)}
      >
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(file.id);
            }}
            className="p-1 hover:bg-matrix-500/20 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-matrix-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-matrix-500" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-6" />}
        
        <Icon className={cn('w-4 h-4', getTypeColor(file.type))} />
        
        <div className="flex-1 min-w-0">
          <div className="font-mono text-sm text-matrix-500 truncate">
            {file.name}
          </div>
          <div className="text-xs text-matrix-700">
            {(file.size / 1024).toFixed(1)}KB • {file.extraction_method}
          </div>
        </div>
        
        <div className="text-xs font-mono text-matrix-600">
          E: {file.entropy.toFixed(1)}
        </div>
      </motion.div>
      
      {hasChildren && isExpanded && (
        <div>
          {file.children!.map(child => (
            <FileTreeNode
              key={child.id}
              file={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ForensicsPage: React.FC = () => {
  const [files] = useState<ExtractedFile[]>(mockExtractedFiles);
  const [selectedFile, setSelectedFile] = useState<ExtractedFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));
  const [viewMode, setViewMode] = useState<'tree' | 'network' | 'challenges'>('tree');
  const [chatCollapsed, setChatCollapsed] = useState(true);
  const [orchestratorCollapsed, setOrchestratorCollapsed] = useState(true);
  const [showAgentDashboard, setShowAgentDashboard] = useState(false);
  
  useEffect(() => {
    // Auto-select the root file on load
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  }, [files]);

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const flattenFiles = (files: ExtractedFile[]): ExtractedFile[] => {
    const result: ExtractedFile[] = [];
    const flatten = (fileList: ExtractedFile[]) => {
      fileList.forEach(file => {
        result.push(file);
        if (file.children) {
          flatten(file.children);
        }
      });
    };
    flatten(files);
    return result;
  };

  const filteredFiles = searchQuery 
    ? flattenFiles(files).filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.extraction_method.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : files;

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
            🔍 Forensic Investigation
          </h1>
          <p className="text-matrix-600">
            Interactive file extraction analysis and visualization
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAgentDashboard(!showAgentDashboard)}
            className={cn(
              'matrix-btn px-4 py-2 flex items-center gap-2',
              showAgentDashboard ? 'matrix-btn-primary' : 'matrix-btn-secondary'
            )}
          >
            <Bot className="w-4 h-4" />
            Agents
          </button>
          <button
            onClick={() => setChatCollapsed(!chatCollapsed)}
            className={cn(
              'matrix-btn px-4 py-2 flex items-center gap-2',
              !chatCollapsed ? 'matrix-btn-primary' : 'matrix-btn-secondary'
            )}
          >
            <Users className="w-4 h-4" />
            Chat
          </button>
          <button
            onClick={() => setOrchestratorCollapsed(!orchestratorCollapsed)}
            className={cn(
              'matrix-btn px-4 py-2 flex items-center gap-2',
              !orchestratorCollapsed ? 'matrix-btn-primary' : 'matrix-btn-secondary'
            )}
          >
            <MessageCircle className="w-4 h-4" />
            AI
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={cn(
              'matrix-btn px-3 py-2 flex items-center gap-2',
              viewMode === 'tree' ? 'matrix-btn-primary' : 'matrix-btn-secondary'
            )}
          >
            <TreePine className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('network')}
            className={cn(
              'matrix-btn px-3 py-2 flex items-center gap-2',
              viewMode === 'network' ? 'matrix-btn-primary' : 'matrix-btn-secondary'
            )}
          >
            <Network className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('challenges')}
            className={cn(
              'matrix-btn px-3 py-2 flex items-center gap-2',
              viewMode === 'challenges' ? 'matrix-btn-primary' : 'matrix-btn-secondary'
            )}
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="matrix-card"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-matrix-600" />
            <input
              type="text"
              placeholder="Search files, methods, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="matrix-input w-full pl-10"
            />
          </div>
          <button className="matrix-btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="matrix-btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      {viewMode === 'challenges' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ChallengeManager className="w-full" />
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File Tree Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="matrix-card h-[600px]">
              <div className="matrix-card-header">
                <h2 className="matrix-card-title flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  File Extraction Tree
                </h2>
                <span className="text-xs font-mono text-matrix-600">
                  {flattenFiles(files).length} FILES
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredFiles.map(file => (
                  <FileTreeNode
                    key={file.id}
                    file={file}
                    level={0}
                    onSelect={setSelectedFile}
                    selectedId={selectedFile?.id}
                    isExpanded={expandedNodes.has(file.id)}
                    onToggleExpand={toggleExpand}
                  />
                ))}
              </div>
            </div>
          </motion.div>

        {/* File Details Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          {selectedFile ? (
            <div className="space-y-6">
              {/* File Info */}
              <div className="matrix-card">
                <div className="matrix-card-header">
                  <h2 className="matrix-card-title flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    {selectedFile.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-mono',
                      selectedFile.type === 'image' && 'bg-blue-500/20 text-blue-400',
                      selectedFile.type === 'text' && 'bg-green-500/20 text-green-400',
                      selectedFile.type === 'archive' && 'bg-yellow-500/20 text-yellow-400',
                      selectedFile.type === 'encrypted' && 'bg-red-500/20 text-red-400',
                      selectedFile.type === 'binary' && 'bg-purple-500/20 text-purple-400'
                    )}>
                      {selectedFile.type.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
                    <div className="text-lg font-bold font-mono text-matrix-500">
                      {(selectedFile.size / 1024).toFixed(1)}KB
                    </div>
                    <div className="text-xs text-matrix-600">Size</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
                    <div className="text-lg font-bold font-mono text-matrix-500">
                      {selectedFile.entropy.toFixed(1)}
                    </div>
                    <div className="text-xs text-matrix-600">Entropy</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
                    <div className="text-lg font-bold font-mono text-matrix-500">
                      {selectedFile.depth}
                    </div>
                    <div className="text-xs text-matrix-600">Depth</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
                    <div className="text-lg font-bold font-mono text-matrix-500">
                      0x{selectedFile.offset.toString(16)}
                    </div>
                    <div className="text-xs text-matrix-600">Offset</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-matrix-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-mono text-matrix-600">Extraction Method:</span>
                    <span className="text-sm font-mono text-matrix-500">
                      {selectedFile.extraction_method}
                    </span>
                  </div>
                  {selectedFile.hash && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-mono text-matrix-600">Hash:</span>
                      <span className="text-sm font-mono text-matrix-500 truncate ml-2">
                        {selectedFile.hash}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* File Preview */}
              {selectedFile.preview && (
                <div className="matrix-card">
                  <div className="matrix-card-header">
                    <h3 className="matrix-card-title">Content Preview</h3>
                    <button className="matrix-btn-secondary text-xs">
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </button>
                  </div>
                  <div className="bg-bg-secondary/50 rounded-lg p-4">
                    <pre className="text-sm font-mono text-matrix-500 whitespace-pre-wrap">
                      {selectedFile.preview}
                    </pre>
                  </div>
                </div>
              )}

              {/* Analysis Actions */}
              <div className="matrix-card">
                <div className="matrix-card-header">
                  <h3 className="matrix-card-title">Quick Analysis</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button className="matrix-btn-secondary flex items-center gap-2 justify-center py-3">
                    <Zap className="w-4 h-4" />
                    XOR Decrypt
                  </button>
                  <button className="matrix-btn-secondary flex items-center gap-2 justify-center py-3">
                    <Eye className="w-4 h-4" />
                    Stego Scan
                  </button>
                  <button className="matrix-btn-secondary flex items-center gap-2 justify-center py-3">
                    <Hash className="w-4 h-4" />
                    Hash Analysis
                  </button>
                </div>
              </div>

              {/* File Annotations */}
              {selectedFile.preview && (
                <FileAnnotator
                  filePath={`/extracted_files/${selectedFile.name}`}
                  fileContent={selectedFile.preview}
                  viewMode="text"
                  onAnnotationCreate={(annotation) => {
                    console.log('New annotation:', annotation);
                  }}
                />
              )}

              {/* LLM Insights for selected file */}
              <LLMInsights maxInsights={5} />
            </div>
          ) : (
            <div className="matrix-card h-[600px] flex items-center justify-center">
              <div className="text-center">
                <Folder className="w-16 h-16 text-matrix-700 mx-auto mb-4" />
                <p className="text-matrix-600 font-mono">
                  Select a file from the tree to view details
                </p>
              </div>
            </div>
          )}
        </motion.div>
        </div>
      )}

      {/* Agent Dashboard Modal/Overlay */}
      {showAgentDashboard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          onClick={() => setShowAgentDashboard(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-bg-primary border border-matrix-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-mono font-bold text-matrix-500">Agent Dashboard</h2>
                <button
                  onClick={() => setShowAgentDashboard(false)}
                  className="text-matrix-600 hover:text-matrix-500 transition-colors"
                >
                  ×
                </button>
              </div>
              <AgentDashboard />
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Floating Chat Components */}
      <div className="fixed bottom-4 right-4 z-50 space-y-4">
        <LiveChat 
          className="w-96"
          minimizable={true}
          defaultRoom="general"
        />
        <OrchestratorChat
          className="w-96"
          isCollapsed={orchestratorCollapsed}
          onToggleCollapse={setOrchestratorCollapsed}
        />
      </div>
    </div>
  );
};
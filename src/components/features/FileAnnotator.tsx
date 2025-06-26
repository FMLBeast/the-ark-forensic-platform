import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare,
  Flag,
  Bookmark,
  AlertTriangle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Bot,
  User,
  Plus,
  Palette,
  Send,
  MapPin,
  Clock
} from 'lucide-react';
import { annotationService, type FileAnnotation } from '@services/annotationService';
import { cn } from '@utils/cn';

interface FileAnnotatorProps {
  filePath: string;
  fileContent: string;
  viewMode: 'hex' | 'text' | 'image' | 'binary';
  className?: string;
  onAnnotationCreate?: (annotation: FileAnnotation) => void;
  onAnnotationSelect?: (annotation: FileAnnotation | null) => void;
}

export const FileAnnotator: React.FC<FileAnnotatorProps> = ({
  filePath,
  fileContent,
  viewMode,
  className,
  onAnnotationCreate,
  onAnnotationSelect
}) => {
  const [annotations, setAnnotations] = useState<FileAnnotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<FileAnnotation | null>(null);
  const [isCreatingAnnotation, setIsCreatingAnnotation] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState({
    type: 'highlight' as FileAnnotation['annotation_type'],
    content: '',
    color: '#ffff00',
    isPublic: true,
    coordinates: { start_offset: 0, end_offset: 0 }
  });
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadAnnotations();
  }, [filePath]);

  const loadAnnotations = async () => {
    try {
      const fileAnnotations = await annotationService.getAnnotationsForFile(filePath);
      setAnnotations(fileAnnotations);
    } catch (error) {
      console.error('Failed to load annotations:', error);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const startOffset = range.startOffset;
    const endOffset = range.endOffset;

    if (startOffset !== endOffset) {
      setSelection({ start: startOffset, end: endOffset });
      setNewAnnotation(prev => ({
        ...prev,
        coordinates: { start_offset: startOffset, end_offset: endOffset }
      }));
    }
  };

  const handleCreateAnnotation = async () => {
    if (!newAnnotation.content.trim() || !selection) return;

    try {
      const annotation = await annotationService.createAnnotation({
        file_path: filePath,
        user_id: 'current_user',
        username: 'You',
        annotation_type: newAnnotation.type,
        content: newAnnotation.content,
        coordinates: newAnnotation.coordinates,
        metadata: {
          file_type: filePath.split('.').pop()?.toUpperCase() || 'UNKNOWN',
          view_mode: viewMode,
          context: getSelectionContext(selection.start, selection.end)
        },
        color: newAnnotation.color,
        is_public: newAnnotation.isPublic
      });

      setAnnotations(prev => [...prev, annotation]);
      onAnnotationCreate?.(annotation);
      
      // Reset form
      setIsCreatingAnnotation(false);
      setNewAnnotation({
        type: 'highlight',
        content: '',
        color: '#ffff00',
        isPublic: true,
        coordinates: { start_offset: 0, end_offset: 0 }
      });
      setSelection(null);
      
      // Clear text selection
      window.getSelection()?.removeAllRanges();
      
    } catch (error) {
      console.error('Failed to create annotation:', error);
    }
  };

  const getSelectionContext = (start: number, end: number): string => {
    const contextStart = Math.max(0, start - 50);
    const contextEnd = Math.min(fileContent.length, end + 50);
    const before = fileContent.slice(contextStart, start);
    const selected = fileContent.slice(start, end);
    const after = fileContent.slice(end, contextEnd);
    
    return `${before}[SELECTED]${selected}[/SELECTED]${after}`;
  };

  const handleAnnotationClick = (annotation: FileAnnotation) => {
    setSelectedAnnotation(selectedAnnotation?.id === annotation.id ? null : annotation);
    onAnnotationSelect?.(selectedAnnotation?.id === annotation.id ? null : annotation);
  };

  const handleVote = async (annotationId: string, vote: 'up' | 'down') => {
    try {
      await annotationService.voteAnnotation(annotationId, vote);
      // Update local state
      setAnnotations(prev => prev.map(ann => 
        ann.id === annotationId 
          ? { ...ann, [vote === 'up' ? 'upvotes' : 'downvotes']: ann[vote === 'up' ? 'upvotes' : 'downvotes'] + 1 }
          : ann
      ));
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const handleAddReply = async (annotationId: string) => {
    if (!replyContent.trim()) return;

    try {
      const reply = await annotationService.addReply(annotationId, replyContent);
      
      setAnnotations(prev => prev.map(ann => 
        ann.id === annotationId 
          ? { ...ann, replies: [...ann.replies, reply] }
          : ann
      ));
      
      setReplyContent('');
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const handleRequestAgentAnalysis = async (annotationId: string) => {
    try {
      await annotationService.requestAgentAnalysis(annotationId);
      // Show success message or update UI to indicate request sent
    } catch (error) {
      console.error('Failed to request agent analysis:', error);
    }
  };

  const getAnnotationIcon = (type: FileAnnotation['annotation_type']) => {
    switch (type) {
      case 'highlight': return Eye;
      case 'comment': return MessageSquare;
      case 'flag': return Flag;
      case 'bookmark': return Bookmark;
      case 'suspicious': return AlertTriangle;
      default: return MessageSquare;
    }
  };

  const getAnnotationColor = (type: FileAnnotation['annotation_type']) => {
    switch (type) {
      case 'highlight': return 'border-l-yellow-500 bg-yellow-500/10';
      case 'comment': return 'border-l-blue-500 bg-blue-500/10';
      case 'flag': return 'border-l-red-500 bg-red-500/10';
      case 'bookmark': return 'border-l-green-500 bg-green-500/10';
      case 'suspicious': return 'border-l-orange-500 bg-orange-500/10';
      default: return 'border-l-matrix-500 bg-matrix-500/10';
    }
  };

  const renderAnnotatedContent = () => {
    if (!fileContent) return null;

    // For demonstration, we'll show the content with highlights
    // In a real implementation, this would be more sophisticated
    let content = fileContent;
    let offset = 0;

    // Sort annotations by start position
    const sortedAnnotations = [...annotations].sort((a, b) => 
      (a.coordinates?.start_offset || 0) - (b.coordinates?.start_offset || 0)
    );

    for (const annotation of sortedAnnotations) {
      if (annotation.coordinates?.start_offset !== undefined && annotation.coordinates?.end_offset !== undefined) {
        const start = annotation.coordinates.start_offset + offset;
        const end = annotation.coordinates.end_offset + offset;
        
        const before = content.slice(0, start);
        const highlighted = content.slice(start, end);
        const after = content.slice(end);
        
        const highlightElement = `<span class="annotation-highlight" data-annotation-id="${annotation.id}" style="background-color: ${annotation.color}40; border-bottom: 2px solid ${annotation.color}; cursor: pointer;">${highlighted}</span>`;
        
        content = before + highlightElement + after;
        offset += highlightElement.length - highlighted.length;
      }
    }

    return (
      <div
        ref={contentRef}
        className="font-mono text-sm leading-relaxed p-4 bg-bg-secondary rounded-lg border border-matrix-800 whitespace-pre-wrap select-text"
        onMouseUp={handleTextSelection}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* File Content with Annotations */}
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-mono font-semibold text-matrix-500">
            {filePath.split('/').pop()}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-matrix-600 font-mono">
              {annotations.length} annotations
            </span>
            {selection && (
              <button
                onClick={() => setIsCreatingAnnotation(true)}
                className="flex items-center gap-1 px-2 py-1 bg-matrix-500/20 border border-matrix-500 rounded text-xs text-matrix-500 hover:bg-matrix-500/30 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Annotate
              </button>
            )}
          </div>
        </div>

        {renderAnnotatedContent()}

        {/* Selection Info */}
        {selection && (
          <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-400">
            Selected: {selection.end - selection.start} characters (offset {selection.start}-{selection.end})
          </div>
        )}
      </div>

      {/* Create Annotation Form */}
      <AnimatePresence>
        {isCreatingAnnotation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-bg-panel border border-matrix-800 rounded-lg"
          >
            <h4 className="font-mono font-semibold text-matrix-500 mb-3">Create Annotation</h4>
            
            <div className="space-y-3">
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-mono text-matrix-600 mb-1">Type:</label>
                <div className="flex gap-2">
                  {(['highlight', 'comment', 'flag', 'bookmark', 'suspicious'] as const).map(type => {
                    const Icon = getAnnotationIcon(type);
                    return (
                      <button
                        key={type}
                        onClick={() => setNewAnnotation(prev => ({ ...prev, type }))}
                        className={cn(
                          'flex items-center gap-1 px-2 py-1 rounded text-xs font-mono transition-colors',
                          newAnnotation.type === type 
                            ? 'bg-matrix-500/30 text-matrix-500 border border-matrix-500' 
                            : 'bg-matrix-500/10 text-matrix-600 border border-matrix-800 hover:bg-matrix-500/20'
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-mono text-matrix-600 mb-1">Content:</label>
                <textarea
                  value={newAnnotation.content}
                  onChange={(e) => setNewAnnotation(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Describe what you found..."
                  className="w-full px-3 py-2 bg-bg-secondary border border-matrix-800 rounded text-sm text-matrix-500 placeholder-matrix-700 font-mono resize-none focus:outline-none focus:border-matrix-500"
                  rows={3}
                />
              </div>

              {/* Color and Visibility */}
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-matrix-600" />
                  <input
                    type="color"
                    value={newAnnotation.color}
                    onChange={(e) => setNewAnnotation(prev => ({ ...prev, color: e.target.value }))}
                    className="w-8 h-8 rounded border border-matrix-800"
                  />
                </div>
                
                <label className="flex items-center gap-2 text-xs font-mono text-matrix-600">
                  <input
                    type="checkbox"
                    checked={newAnnotation.isPublic}
                    onChange={(e) => setNewAnnotation(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="rounded"
                  />
                  Public (visible to all users)
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleCreateAnnotation}
                  disabled={!newAnnotation.content.trim()}
                  className="px-3 py-1 bg-matrix-500/20 border border-matrix-500 rounded text-sm text-matrix-500 hover:bg-matrix-500/30 transition-colors disabled:opacity-50"
                >
                  Create Annotation
                </button>
                <button
                  onClick={() => setIsCreatingAnnotation(false)}
                  className="px-3 py-1 bg-matrix-800/20 border border-matrix-800 rounded text-sm text-matrix-600 hover:bg-matrix-800/30 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Annotations List */}
      <div className="space-y-3">
        <h4 className="font-mono font-semibold text-matrix-500">Annotations ({annotations.length})</h4>
        
        <div className="space-y-3">
          {annotations.map((annotation, index) => {
            const Icon = getAnnotationIcon(annotation.annotation_type);
            const isSelected = selectedAnnotation?.id === annotation.id;
            
            return (
              <motion.div
                key={annotation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'p-3 rounded-lg border-l-2 cursor-pointer transition-all duration-200',
                  getAnnotationColor(annotation.annotation_type),
                  isSelected && 'ring-2 ring-matrix-500'
                )}
                onClick={() => handleAnnotationClick(annotation)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-matrix-500" />
                    <span className="font-mono font-semibold text-sm text-matrix-500">
                      {annotation.username}
                    </span>
                    <span className="text-xs text-matrix-600">
                      {annotation.annotation_type.toUpperCase()}
                    </span>
                    {annotation.metadata.agent_verified && (
                      <div className="flex items-center gap-1 px-1 py-0.5 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400">
                        <Bot className="w-3 h-3" />
                        Verified
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-matrix-600">
                      <Clock className="w-3 h-3" />
                      {new Date(annotation.created_at).toLocaleTimeString()}
                    </div>
                    {annotation.coordinates && (
                      <div className="flex items-center gap-1 text-xs text-matrix-600">
                        <MapPin className="w-3 h-3" />
                        {annotation.coordinates.start_offset}-{annotation.coordinates.end_offset}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-matrix-600 mb-2">
                  {annotation.content}
                </p>

                {/* Metadata */}
                {annotation.metadata.context && isSelected && (
                  <div className="mb-2 p-2 bg-bg-secondary/50 rounded text-xs font-mono text-matrix-700">
                    <span className="text-matrix-600">Context: </span>
                    {annotation.metadata.context}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(annotation.id, 'up');
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-matrix-600 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      {annotation.upvotes}
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVote(annotation.id, 'down');
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-matrix-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <ThumbsDown className="w-3 h-3" />
                      {annotation.downvotes}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestAgentAnalysis(annotation.id);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs text-matrix-600 hover:text-matrix-500 hover:bg-matrix-500/10 transition-colors"
                      title="Request AI agent analysis"
                    >
                      <Bot className="w-3 h-3" />
                      Agent
                    </button>
                  </div>

                  <div className="text-xs text-matrix-600">
                    {annotation.replies.length} replies
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-matrix-800/50"
                    >
                      {/* Replies */}
                      {annotation.replies.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {annotation.replies.map((reply: any) => (
                            <div
                              key={reply.id}
                              className={cn(
                                'p-2 rounded text-xs',
                                reply.is_agent_response 
                                  ? 'bg-purple-500/10 border border-purple-500/30' 
                                  : 'bg-matrix-500/10 border border-matrix-800'
                              )}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                {reply.is_agent_response ? (
                                  <Bot className="w-3 h-3 text-purple-400" />
                                ) : (
                                  <User className="w-3 h-3 text-matrix-500" />
                                )}
                                <span className="font-mono font-semibold text-matrix-500">
                                  {reply.username}
                                </span>
                                <span className="text-matrix-600">
                                  {new Date(reply.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-matrix-600">{reply.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Form */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Add a reply..."
                          className="flex-1 px-2 py-1 bg-bg-secondary border border-matrix-800 rounded text-xs text-matrix-500 placeholder-matrix-700 font-mono focus:outline-none focus:border-matrix-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddReply(annotation.id);
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddReply(annotation.id)}
                          disabled={!replyContent.trim()}
                          className="px-2 py-1 bg-matrix-500/20 border border-matrix-500 rounded text-xs text-matrix-500 hover:bg-matrix-500/30 transition-colors disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {annotations.length === 0 && (
          <div className="text-center p-6 text-matrix-700">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-mono text-sm">No annotations yet</p>
            <p className="text-xs mt-1">Select text to create your first annotation</p>
          </div>
        )}
      </div>
    </div>
  );
};
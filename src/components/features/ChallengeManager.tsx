import React, { useState, useEffect } from 'react';
import { 
  Challenge, 
  ChallengeCategory, 
  ChallengeStatus, 
  ChallengePriority,
  StegPhase,
  challengeService 
} from '../../services/challengeService';

interface ChallengeManagerProps {
  className?: string;
}

const ChallengeManager: React.FC<ChallengeManagerProps> = ({ className = '' }) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'create'>('active');
  const [filters, setFilters] = useState({
    category: '',
    phase: '',
    priority: '',
    status: ''
  });

  useEffect(() => {
    loadChallenges();
    
    // Refresh challenges every 30 seconds to show discoveries
    const interval = setInterval(loadChallenges, 30000);
    return () => clearInterval(interval);
  }, [filters]);

  const loadChallenges = () => {
    const filterOptions = {
      category: filters.category ? filters.category as ChallengeCategory : undefined,
      phase: filters.phase ? filters.phase as StegPhase : undefined,
      status: filters.status ? filters.status as ChallengeStatus : undefined
    };
    
    const loadedChallenges = challengeService.getChallenges(filterOptions);
    setChallenges(loadedChallenges);
  };

  const handleChallengeUpdate = async (challengeId: string, updates: Partial<Challenge>) => {
    try {
      await challengeService.updateChallenge(challengeId, updates);
      loadChallenges();
      
      if (selectedChallenge?.id === challengeId) {
        setSelectedChallenge(challengeService.getChallenge(challengeId) || null);
      }
    } catch (error) {
      console.error('Failed to update challenge:', error);
    }
  };

  const getPriorityColor = (priority: ChallengePriority) => {
    switch (priority) {
      case ChallengePriority.CRITICAL: return 'text-red-400 border-red-400';
      case ChallengePriority.HIGH: return 'text-orange-400 border-orange-400';
      case ChallengePriority.MEDIUM: return 'text-yellow-400 border-yellow-400';
      case ChallengePriority.LOW: return 'text-matrix-400 border-matrix-400';
    }
  };

  const getStatusColor = (status: ChallengeStatus) => {
    switch (status) {
      case ChallengeStatus.COMPLETED: return 'text-green-400 bg-green-900/20';
      case ChallengeStatus.IN_PROGRESS: return 'text-blue-400 bg-blue-900/20';
      case ChallengeStatus.ACTIVE: return 'text-matrix-400 bg-matrix-900/20';
      case ChallengeStatus.BLOCKED: return 'text-red-400 bg-red-900/20';
      case ChallengeStatus.FAILED: return 'text-red-600 bg-red-900/40';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getCategoryIcon = (category: ChallengeCategory) => {
    switch (category) {
      case ChallengeCategory.IMAGE_STEGANOGRAPHY: return '🖼️';
      case ChallengeCategory.AUDIO_STEGANOGRAPHY: return '🎵';
      case ChallengeCategory.SOFTWARE_STEGANOGRAPHY: return '⚙️';
      case ChallengeCategory.TEXT_STEGANOGRAPHY: return '📝';
      case ChallengeCategory.ENCRYPTION_STEGANOGRAPHY: return '🔐';
      case ChallengeCategory.DIGITAL_ARCHAEOLOGY: return '🏛️';
      case ChallengeCategory.CROSS_VECTOR: return '🌐';
      case ChallengeCategory.META_CHALLENGE: return '🎯';
    }
  };

  const getPhaseLabel = (phase: StegPhase) => {
    switch (phase) {
      case StegPhase.PHASE_1_BITPLANE_OFFSET: return 'Phase 1: Bitplane';
      case StegPhase.PHASE_2_CUSTOM_VM: return 'Phase 2: VM';
      case StegPhase.PHASE_3_GPG_NETWORK: return 'Phase 3: GPG';
      case StegPhase.PHASE_4_STEG_NETWORK: return 'Phase 4: Network';
      case StegPhase.PHASE_5_DIGITAL_ARCHAEOLOGY: return 'Phase 5: Archive';
      case StegPhase.PHASE_6_FINAL_ASSEMBLY: return 'Phase 6: Assembly';
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    if (activeTab === 'active') {
      return [ChallengeStatus.ACTIVE, ChallengeStatus.IN_PROGRESS, ChallengeStatus.CREATED].includes(challenge.status);
    } else if (activeTab === 'completed') {
      return [ChallengeStatus.COMPLETED, ChallengeStatus.FAILED].includes(challenge.status);
    }
    return true;
  });

  return (
    <div className={`bg-matrix-900/30 border border-matrix-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-matrix-300 font-mono">
          Challenge Management System
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('create')}
            className="px-3 py-1 bg-matrix-800 hover:bg-matrix-700 border border-matrix-600 rounded text-sm font-mono transition-all duration-200"
          >
            Create Challenge
          </button>
          <button
            onClick={loadChallenges}
            className="px-3 py-1 bg-matrix-800 hover:bg-matrix-700 border border-matrix-600 rounded text-sm font-mono transition-all duration-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-matrix-950/50 p-1 rounded-lg">
        {['active', 'completed', 'create'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded font-mono text-sm transition-all duration-200 ${
              activeTab === tab
                ? 'bg-matrix-800 text-matrix-300 border border-matrix-600'
                : 'text-matrix-500 hover:text-matrix-400 hover:bg-matrix-900/50'
            }`}
          >
            {tab === 'active' && `Active (${challenges.filter(c => [ChallengeStatus.ACTIVE, ChallengeStatus.IN_PROGRESS, ChallengeStatus.CREATED].includes(c.status)).length})`}
            {tab === 'completed' && `Completed (${challenges.filter(c => [ChallengeStatus.COMPLETED, ChallengeStatus.FAILED].includes(c.status)).length})`}
            {tab === 'create' && 'Create New'}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeTab !== 'create' && (
        <div className="grid grid-cols-4 gap-4 mb-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            {Object.values(ChallengeCategory).map(cat => (
              <option key={cat} value={cat}>{getCategoryIcon(cat)} {cat.replace('_', ' ')}</option>
            ))}
          </select>

          <select
            value={filters.phase}
            onChange={(e) => setFilters({ ...filters, phase: e.target.value })}
            className="bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none"
          >
            <option value="">All Phases</option>
            {Object.values(StegPhase).map(phase => (
              <option key={phase} value={phase}>{getPhaseLabel(phase)}</option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            className="bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none"
          >
            <option value="">All Priorities</option>
            {Object.values(ChallengePriority).map(priority => (
              <option key={priority} value={priority}>{priority.toUpperCase()}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            {Object.values(ChallengeStatus).map(status => (
              <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>
      )}

      {/* Challenge List */}
      {activeTab !== 'create' && (
        <div className="space-y-3">
          {filteredChallenges.map(challenge => (
            <div
              key={challenge.id}
              onClick={() => setSelectedChallenge(challenge)}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-matrix-900/20 ${
                selectedChallenge?.id === challenge.id 
                  ? 'border-matrix-500 bg-matrix-900/30' 
                  : 'border-matrix-800 hover:border-matrix-700'
              } ${getPriorityColor(challenge.priority)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg">{getCategoryIcon(challenge.category)}</span>
                    <span className={`px-2 py-1 rounded text-xs font-mono ${getPriorityColor(challenge.priority)}`}>
                      {challenge.priority.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-mono ${getStatusColor(challenge.status)}`}>
                      {challenge.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs text-matrix-500 font-mono">
                      {getPhaseLabel(challenge.phase)}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-matrix-300 mb-1 font-mono">
                    {challenge.name}
                  </h3>
                  
                  <p className="text-sm text-matrix-400 mb-3 line-clamp-2">
                    {challenge.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-matrix-500 font-mono">
                    <span>Files: {challenge.targetFiles.length}</span>
                    <span>Agents: {challenge.assignedAgents.length}</span>
                    <span>Difficulty: {'★'.repeat(challenge.difficulty)}</span>
                    <span>Est: {challenge.estimatedTime}</span>
                    {challenge.createdBy === 'automated_discovery' && (
                      <span className="text-blue-400">🤖 Auto-discovered</span>
                    )}
                  </div>
                </div>

                <div className="ml-4">
                  <div className="text-right mb-2">
                    <span className="text-sm font-mono text-matrix-400">
                      {challenge.progress}% Complete
                    </span>
                  </div>
                  <div className="w-20 h-2 bg-matrix-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-matrix-500 transition-all duration-300"
                      style={{ width: `${challenge.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {challenge.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {challenge.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-matrix-900/50 border border-matrix-800 rounded text-xs text-matrix-400 font-mono"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredChallenges.length === 0 && (
            <div className="text-center py-8 text-matrix-500 font-mono">
              No challenges found matching the current filters.
            </div>
          )}
        </div>
      )}

      {/* Challenge Details Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-matrix-950 border border-matrix-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-matrix-300 font-mono">
                  {selectedChallenge.name}
                </h2>
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="text-matrix-500 hover:text-matrix-300 text-xl font-mono"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-matrix-300 mb-2 font-mono">Challenge Details</h3>
                  <div className="space-y-2 text-sm font-mono">
                    <div>
                      <span className="text-matrix-500">Category:</span> 
                      <span className="ml-2">{getCategoryIcon(selectedChallenge.category)} {selectedChallenge.category}</span>
                    </div>
                    <div>
                      <span className="text-matrix-500">Phase:</span> 
                      <span className="ml-2">{getPhaseLabel(selectedChallenge.phase)}</span>
                    </div>
                    <div>
                      <span className="text-matrix-500">Priority:</span> 
                      <span className={`ml-2 ${getPriorityColor(selectedChallenge.priority)}`}>
                        {selectedChallenge.priority.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="text-matrix-500">Status:</span> 
                      <select
                        value={selectedChallenge.status}
                        onChange={(e) => handleChallengeUpdate(selectedChallenge.id, { status: e.target.value as ChallengeStatus })}
                        className="ml-2 bg-matrix-900 border border-matrix-700 rounded px-2 py-1 text-xs"
                      >
                        {Object.values(ChallengeStatus).map(status => (
                          <option key={status} value={status}>{status.replace('_', ' ').toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-matrix-500">Progress:</span> 
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={selectedChallenge.progress}
                        onChange={(e) => handleChallengeUpdate(selectedChallenge.id, { progress: parseInt(e.target.value) })}
                        className="ml-2 bg-matrix-900 border border-matrix-700 rounded px-2 py-1 text-xs w-16"
                      />
                      <span className="ml-1">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-matrix-300 mb-2 font-mono">Assignment</h3>
                  <div className="space-y-2 text-sm font-mono">
                    <div>
                      <span className="text-matrix-500">Assigned Agents:</span>
                      <div className="mt-1">
                        {selectedChallenge.assignedAgents.map(agent => (
                          <span key={agent} className="inline-block bg-matrix-900/50 border border-matrix-800 rounded px-2 py-1 text-xs mr-1 mb-1">
                            {agent}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-matrix-500">Recommended:</span>
                      <div className="mt-1">
                        {selectedChallenge.recommendedAgents.map(agent => (
                          <span key={agent} className="inline-block bg-blue-900/20 border border-blue-800 rounded px-2 py-1 text-xs mr-1 mb-1 text-blue-400">
                            {agent}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-matrix-300 mb-2 font-mono">Description</h3>
                <p className="text-sm text-matrix-400 font-mono leading-relaxed">
                  {selectedChallenge.description}
                </p>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-matrix-300 mb-2 font-mono">Expected Outcome</h3>
                <p className="text-sm text-matrix-400 font-mono">
                  {selectedChallenge.expectedOutcome}
                </p>
              </div>

              {selectedChallenge.targetFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-bold text-matrix-300 mb-2 font-mono">Target Files</h3>
                  <div className="flex flex-wrap gap-1">
                    {selectedChallenge.targetFiles.map((file, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-matrix-900/50 border border-matrix-800 rounded text-xs text-matrix-400 font-mono"
                      >
                        📁 {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedChallenge.notes && (
                <div className="mt-6">
                  <h3 className="font-bold text-matrix-300 mb-2 font-mono">Notes</h3>
                  <p className="text-sm text-matrix-400 font-mono leading-relaxed">
                    {selectedChallenge.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Challenge Tab */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          <div className="bg-matrix-900/20 border border-matrix-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-matrix-300 mb-4 font-mono">Create New Challenge</h3>
            <CreateChallengeForm onSubmit={() => { loadChallenges(); setActiveTab('active'); }} />
          </div>
        </div>
      )}
    </div>
  );
};

// Create Challenge Form Component
const CreateChallengeForm: React.FC<{ onSubmit: () => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: ChallengeCategory.CROSS_VECTOR,
    phase: StegPhase.PHASE_6_FINAL_ASSEMBLY,
    priority: ChallengePriority.MEDIUM,
    targetFiles: '',
    expectedOutcome: '',
    difficulty: 3,
    estimatedTime: '',
    tags: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await challengeService.createChallenge({
        name: formData.name,
        description: formData.description,
        category: formData.category,
        phase: formData.phase,
        status: ChallengeStatus.CREATED,
        priority: formData.priority,
        createdBy: 'user',
        targetFiles: formData.targetFiles.split(',').map(f => f.trim()).filter(Boolean),
        requiredOperations: [], // Will be populated based on category
        expectedOutcome: formData.expectedOutcome,
        progress: 0,
        subChallenges: [],
        findings: [],
        assignedAgents: [],
        recommendedAgents: [],
        dependencies: [],
        unlocks: [],
        relatedFiles: [],
        difficulty: formData.difficulty as 1 | 2 | 3 | 4 | 5,
        estimatedTime: formData.estimatedTime,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        notes: formData.notes
      });

      onSubmit();
    } catch (error) {
      console.error('Failed to create challenge:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-mono text-matrix-400 mb-1">Challenge Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-mono text-matrix-400 mb-1">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as ChallengeCategory })}
            className="w-full bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none"
          >
            {Object.values(ChallengeCategory).map(cat => (
              <option key={cat} value={cat}>{cat.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-mono text-matrix-400 mb-1">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none h-24"
          required
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-mono text-matrix-400 mb-1">Phase</label>
          <select
            value={formData.phase}
            onChange={(e) => setFormData({ ...formData, phase: e.target.value as StegPhase })}
            className="w-full bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none"
          >
            {Object.values(StegPhase).map(phase => (
              <option key={phase} value={phase}>{phase.replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-mono text-matrix-400 mb-1">Priority</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as ChallengePriority })}
            className="w-full bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none"
          >
            {Object.values(ChallengePriority).map(priority => (
              <option key={priority} value={priority}>{priority.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-mono text-matrix-400 mb-1">Difficulty (1-5)</label>
          <input
            type="number"
            min="1"
            max="5"
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
            className="w-full bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-mono text-matrix-400 mb-1">Target Files (comma-separated)</label>
          <input
            type="text"
            value={formData.targetFiles}
            onChange={(e) => setFormData({ ...formData, targetFiles: e.target.value })}
            className="w-full bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none"
            placeholder="file1.bin, file2.dat, ..."
          />
        </div>

        <div>
          <label className="block text-sm font-mono text-matrix-400 mb-1">Estimated Time</label>
          <input
            type="text"
            value={formData.estimatedTime}
            onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
            className="w-full bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none"
            placeholder="30-60 minutes"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-mono text-matrix-400 mb-1">Expected Outcome</label>
        <input
          type="text"
          value={formData.expectedOutcome}
          onChange={(e) => setFormData({ ...formData, expectedOutcome: e.target.value })}
          className="w-full bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none"
          placeholder="What should this challenge produce?"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-mono text-matrix-400 mb-1">Tags (comma-separated)</label>
        <input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          className="w-full bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none"
          placeholder="xor, bitplane, automated, ..."
        />
      </div>

      <div>
        <label className="block text-sm font-mono text-matrix-400 mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full bg-matrix-900 border border-matrix-700 rounded px-3 py-2 text-sm font-mono focus:border-matrix-500 focus:outline-none h-20"
          placeholder="Additional notes or context..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-matrix-800 hover:bg-matrix-700 border border-matrix-600 rounded font-mono text-sm transition-all duration-200"
        >
          Create Challenge
        </button>
      </div>
    </form>
  );
};

export default ChallengeManager;
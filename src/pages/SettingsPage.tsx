import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Shield, 
  Database, 
  Brain,
  Bell,
  Palette,
  Download,
  Upload,
  RefreshCw,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { cn } from '@utils/cn';

export const SettingsPage: React.FC = () => {
  const { operative } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      analysisComplete: true,
      newFindings: true,
      systemAlerts: true,
      collaborationUpdates: false
    },
    display: {
      theme: 'matrix',
      fontSize: 'medium',
      animations: true,
      scanlines: true,
      matrixRain: true
    },
    analysis: {
      autoSave: true,
      parallelProcessing: true,
      maxConcurrentAnalyses: 3,
      defaultTimeout: 300
    },
    database: {
      cacheSize: 512,
      autoBackup: true,
      compressionLevel: 6
    }
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'display', label: 'Display', icon: Palette },
    { id: 'analysis', label: 'Analysis', icon: Brain },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="matrix-card">
        <div className="matrix-card-header">
          <h3 className="matrix-card-title">Operative Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-matrix-500 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={operative?.display_name || ''}
                className="matrix-input w-full"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-mono text-matrix-500 mb-2">
                Operative ID
              </label>
              <input
                type="text"
                value={operative?.username || ''}
                className="matrix-input w-full"
                disabled
              />
            </div>
            
            <div>
              <label className="block text-sm font-mono text-matrix-500 mb-2">
                Role
              </label>
              <input
                type="text"
                value={operative?.role || ''}
                className="matrix-input w-full"
                disabled
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-mono text-matrix-500 mb-2">
                Clearance Level
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-bg-secondary rounded-lg h-2">
                  <div 
                    className="bg-matrix-500 h-2 rounded-lg transition-all duration-300"
                    style={{ width: `${(operative?.clearance_level || 0) * 10}%` }}
                  />
                </div>
                <span className="text-lg font-mono font-bold text-matrix-500">
                  L{operative?.clearance_level || 0}
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-mono text-matrix-500 mb-2">
                Status
              </label>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-status-success rounded-full animate-pulse" />
                <span className="text-sm font-mono text-matrix-500">ACTIVE</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-mono text-matrix-500 mb-2">
                Last Activity
              </label>
              <span className="text-sm font-mono text-matrix-600">
                {operative?.last_active || 'Now'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="matrix-card">
        <div className="matrix-card-header">
          <h3 className="matrix-card-title">Session Statistics</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
            <div className="text-2xl font-bold font-mono text-matrix-500">247</div>
            <div className="text-xs text-matrix-600">Analyses Run</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
            <div className="text-2xl font-bold font-mono text-matrix-500">89</div>
            <div className="text-xs text-matrix-600">Findings Created</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
            <div className="text-2xl font-bold font-mono text-matrix-500">156</div>
            <div className="text-xs text-matrix-600">Files Processed</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
            <div className="text-2xl font-bold font-mono text-matrix-500">72h</div>
            <div className="text-xs text-matrix-600">Total Session Time</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div className="matrix-card">
        <div className="matrix-card-header">
          <h3 className="matrix-card-title">Access Control</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-mono text-matrix-500 mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                className="matrix-input w-full pr-12"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-matrix-600 hover:text-matrix-500"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-mono text-matrix-500 mb-2">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              className="matrix-input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-mono text-matrix-500 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Confirm new password"
              className="matrix-input w-full"
            />
          </div>
          
          <button className="matrix-btn-primary">
            Update Password
          </button>
        </div>
      </div>
      
      <div className="matrix-card">
        <div className="matrix-card-header">
          <h3 className="matrix-card-title">Session Management</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
            <div>
              <div className="text-sm font-mono text-matrix-500">Auto-logout Timer</div>
              <div className="text-xs text-matrix-600">Automatically log out after inactivity</div>
            </div>
            <select className="matrix-input w-32">
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>2 hours</option>
              <option>4 hours</option>
              <option>Never</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
            <div>
              <div className="text-sm font-mono text-matrix-500">Remember Device</div>
              <div className="text-xs text-matrix-600">Stay logged in on this device</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-bg-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-matrix-500"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDisplayTab = () => (
    <div className="space-y-6">
      <div className="matrix-card">
        <div className="matrix-card-header">
          <h3 className="matrix-card-title">Visual Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
            <div>
              <div className="text-sm font-mono text-matrix-500">Matrix Rain Effect</div>
              <div className="text-xs text-matrix-600">Animated background rain effect</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.display.matrixRain}
                onChange={(e) => updateSetting('display', 'matrixRain', e.target.checked)}
              />
              <div className="w-11 h-6 bg-bg-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-matrix-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
            <div>
              <div className="text-sm font-mono text-matrix-500">Scanline Effect</div>
              <div className="text-xs text-matrix-600">CRT-style scanline overlay</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.display.scanlines}
                onChange={(e) => updateSetting('display', 'scanlines', e.target.checked)}
              />
              <div className="w-11 h-6 bg-bg-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-matrix-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
            <div>
              <div className="text-sm font-mono text-matrix-500">Animations</div>
              <div className="text-xs text-matrix-600">Enable UI animations and transitions</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.display.animations}
                onChange={(e) => updateSetting('display', 'animations', e.target.checked)}
              />
              <div className="w-11 h-6 bg-bg-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-matrix-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
            <div>
              <div className="text-sm font-mono text-matrix-500">Font Size</div>
              <div className="text-xs text-matrix-600">Interface text size</div>
            </div>
            <select 
              className="matrix-input w-32"
              value={settings.display.fontSize}
              onChange={(e) => updateSetting('display', 'fontSize', e.target.value)}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="matrix-card">
        <div className="matrix-card-header">
          <h3 className="matrix-card-title">Notification Preferences</h3>
        </div>
        
        <div className="space-y-4">
          {Object.entries(settings.notifications).map(([key, value]) => {
            const labels = {
              analysisComplete: { title: 'Analysis Complete', desc: 'Notify when analysis sessions finish' },
              newFindings: { title: 'New Findings', desc: 'Notify when team members create findings' },
              systemAlerts: { title: 'System Alerts', desc: 'Critical system and security notifications' },
              collaborationUpdates: { title: 'Collaboration Updates', desc: 'Comments and updates on shared findings' }
            };
            
            const label = labels[key as keyof typeof labels];
            
            return (
              <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
                <div>
                  <div className="text-sm font-mono text-matrix-500">{label.title}</div>
                  <div className="text-xs text-matrix-600">{label.desc}</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={value}
                    onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-bg-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-matrix-500"></div>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="space-y-6">
      <div className="matrix-card">
        <div className="matrix-card-header">
          <h3 className="matrix-card-title">Analysis Engine Settings</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
            <div>
              <div className="text-sm font-mono text-matrix-500">Auto-save Results</div>
              <div className="text-xs text-matrix-600">Automatically save analysis results</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.analysis.autoSave}
                onChange={(e) => updateSetting('analysis', 'autoSave', e.target.checked)}
              />
              <div className="w-11 h-6 bg-bg-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-matrix-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
            <div>
              <div className="text-sm font-mono text-matrix-500">Parallel Processing</div>
              <div className="text-xs text-matrix-600">Run multiple analyses simultaneously</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.analysis.parallelProcessing}
                onChange={(e) => updateSetting('analysis', 'parallelProcessing', e.target.checked)}
              />
              <div className="w-11 h-6 bg-bg-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-matrix-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
            <div>
              <div className="text-sm font-mono text-matrix-500">Max Concurrent Analyses</div>
              <div className="text-xs text-matrix-600">Maximum number of parallel analyses</div>
            </div>
            <input
              type="number"
              min="1"
              max="8"
              value={settings.analysis.maxConcurrentAnalyses}
              onChange={(e) => updateSetting('analysis', 'maxConcurrentAnalyses', parseInt(e.target.value))}
              className="matrix-input w-20"
            />
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
            <div>
              <div className="text-sm font-mono text-matrix-500">Default Timeout (seconds)</div>
              <div className="text-xs text-matrix-600">Analysis timeout for long-running processes</div>
            </div>
            <input
              type="number"
              min="60"
              max="3600"
              step="60"
              value={settings.analysis.defaultTimeout}
              onChange={(e) => updateSetting('analysis', 'defaultTimeout', parseInt(e.target.value))}
              className="matrix-input w-24"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDatabaseTab = () => (
    <div className="space-y-6">
      <div className="matrix-card">
        <div className="matrix-card-header">
          <h3 className="matrix-card-title">Database Configuration</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
            <div>
              <div className="text-sm font-mono text-matrix-500">Cache Size (MB)</div>
              <div className="text-xs text-matrix-600">Memory allocated for database caching</div>
            </div>
            <input
              type="number"
              min="128"
              max="2048"
              step="128"
              value={settings.database.cacheSize}
              onChange={(e) => updateSetting('database', 'cacheSize', parseInt(e.target.value))}
              className="matrix-input w-24"
            />
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
            <div>
              <div className="text-sm font-mono text-matrix-500">Auto Backup</div>
              <div className="text-xs text-matrix-600">Automatically backup analysis results</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={settings.database.autoBackup}
                onChange={(e) => updateSetting('database', 'autoBackup', e.target.checked)}
              />
              <div className="w-11 h-6 bg-bg-primary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-matrix-500"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-bg-secondary/50">
            <div>
              <div className="text-sm font-mono text-matrix-500">Compression Level</div>
              <div className="text-xs text-matrix-600">Data compression level (1-9)</div>
            </div>
            <input
              type="number"
              min="1"
              max="9"
              value={settings.database.compressionLevel}
              onChange={(e) => updateSetting('database', 'compressionLevel', parseInt(e.target.value))}
              className="matrix-input w-20"
            />
          </div>
        </div>
      </div>
      
      <div className="matrix-card">
        <div className="matrix-card-header">
          <h3 className="matrix-card-title">Database Actions</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="matrix-btn-secondary flex items-center gap-2 justify-center py-3">
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <button className="matrix-btn-secondary flex items-center gap-2 justify-center py-3">
            <Upload className="w-4 h-4" />
            Import Data
          </button>
          <button className="matrix-btn-secondary flex items-center gap-2 justify-center py-3">
            <RefreshCw className="w-4 h-4" />
            Optimize DB
          </button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'security': return renderSecurityTab();
      case 'display': return renderDisplayTab();
      case 'notifications': return renderNotificationsTab();
      case 'analysis': return renderAnalysisTab();
      case 'database': return renderDatabaseTab();
      default: return renderProfileTab();
    }
  };

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
            ⚙️ Settings
          </h1>
          <p className="text-matrix-600">
            Configure your investigation platform preferences
          </p>
        </div>
        
        <button className="matrix-btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </motion.div>

      {/* Settings Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="matrix-card">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left',
                      activeTab === tab.id
                        ? 'bg-matrix-500/20 border border-matrix-500 text-matrix-500'
                        : 'hover:bg-matrix-500/10 text-matrix-600 hover:text-matrix-500'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-mono text-sm">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-3"
        >
          {renderTabContent()}
        </motion.div>
      </div>
    </div>
  );
};
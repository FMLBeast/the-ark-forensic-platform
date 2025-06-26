import React from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Database, 
  Brain, 
  Users, 
  Shield, 
  Zap,
  TrendingUp,
  Eye,
  Lock,
  Search
} from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { cn } from '@utils/cn';

export const DashboardPage: React.FC = () => {
  const { operative } = useAuth();

  const statusCards = [
    {
      title: 'Forensic Database',
      description: '32GB of forensic data ready for analysis',
      icon: Database,
      status: 'connected',
      value: '32GB',
      trend: 'up'
    },
    {
      title: 'Analysis Engine',
      description: 'AI-powered investigation tools online',
      icon: Brain,
      status: 'connected',
      value: 'ONLINE',
      trend: 'stable'
    },
    {
      title: 'Collaboration',
      description: 'Team investigation workspace active',
      icon: Users,
      status: 'connected',
      value: '5 ACTIVE',
      trend: 'up'
    },
    {
      title: 'Security Status',
      description: `Clearance Level: ${operative?.clearance_level || 0}`,
      icon: Shield,
      status: 'connected',
      value: `L${operative?.clearance_level || 0}`,
      trend: 'stable'
    }
  ];

  const quickActions = [
    {
      title: 'XOR Analysis',
      description: 'Multi-key XOR decryption analysis',
      icon: Lock,
      shortcut: 'X'
    },
    {
      title: 'Steganography Scan',
      description: 'Hidden content detection',
      icon: Eye,
      shortcut: 'S'
    },
    {
      title: 'Entropy Analysis',
      description: 'File entropy and compression analysis',
      icon: TrendingUp,
      shortcut: 'E'
    },
    {
      title: 'String Extraction',
      description: 'Intelligent string pattern analysis',
      icon: Search,
      shortcut: 'T'
    }
  ];

  const recentActivities = [
    {
      type: 'analysis',
      message: 'XOR decryption completed on image_001.jpg',
      timestamp: '2 minutes ago',
      status: 'success'
    },
    {
      type: 'finding',
      message: 'New steganographic pattern detected',
      timestamp: '15 minutes ago',
      status: 'warning'
    },
    {
      type: 'collaboration',
      message: 'Trinity shared findings on encrypted file',
      timestamp: '1 hour ago',
      status: 'info'
    },
    {
      type: 'system',
      message: 'Database integrity check completed',
      timestamp: '2 hours ago',
      status: 'success'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-matrix-500 font-mono mb-2">
          THE ARK
        </h1>
        <p className="text-matrix-600 font-mono">
          Welcome to The Matrix, {operative?.display_name || 'Operative'}
        </p>
        <p className="text-sm text-matrix-700 mt-2">
          Your investigation platform is operational and ready for forensic analysis.
        </p>
      </motion.div>

      {/* Status Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {statusCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              className="matrix-card group hover:border-matrix-500/50 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  'p-2 rounded-lg',
                  card.status === 'connected' ? 'bg-status-success/20 text-status-success' : 'bg-matrix-500/20 text-matrix-500'
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1">
                  <div className={cn(
                    'w-2 h-2 rounded-full',
                    card.status === 'connected' ? 'bg-status-success animate-pulse' : 'bg-matrix-500 animate-pulse'
                  )} />
                  <span className="text-xs font-mono text-matrix-600 uppercase">
                    {card.status}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-mono text-matrix-500 font-semibold">
                  {card.title}
                </h3>
                <p className="text-sm text-matrix-600">
                  {card.description}
                </p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-lg font-mono font-bold text-matrix-500">
                    {card.value}
                  </span>
                  {card.trend === 'up' && (
                    <TrendingUp className="w-4 h-4 text-status-success" />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="matrix-card"
      >
        <div className="matrix-card-header">
          <h2 className="matrix-card-title flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Analysis
          </h2>
          <span className="text-xs font-mono text-matrix-600">
            READY
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-lg bg-bg-panel border border-matrix-800 hover:border-matrix-600 transition-all duration-200 text-left group"
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon className="w-5 h-5 text-matrix-500 group-hover:text-matrix-400 transition-colors" />
                  <kbd className="px-2 py-1 text-xs bg-matrix-500/20 text-matrix-500 rounded font-mono">
                    {action.shortcut}
                  </kbd>
                </div>
                <h3 className="font-mono text-sm font-semibold text-matrix-500 mb-1">
                  {action.title}
                </h3>
                <p className="text-xs text-matrix-600">
                  {action.description}
                </p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Activity and Intelligence Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="matrix-card"
        >
          <div className="matrix-card-header">
            <h2 className="matrix-card-title flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </h2>
            <span className="text-xs font-mono text-matrix-600">
              LIVE
            </span>
          </div>
          
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-lg bg-bg-secondary/50"
              >
                <div className={cn(
                  'w-2 h-2 rounded-full mt-2',
                  activity.status === 'success' && 'bg-status-success',
                  activity.status === 'warning' && 'bg-status-warning',
                  activity.status === 'info' && 'bg-hud-cyan-500',
                  activity.status === 'error' && 'bg-status-error'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-matrix-500 font-mono">
                    {activity.message}
                  </p>
                  <p className="text-xs text-matrix-700 mt-1">
                    {activity.timestamp}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Intelligence Overview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="matrix-card"
        >
          <div className="matrix-card-header">
            <h2 className="matrix-card-title flex items-center gap-2">
              <Database className="w-5 h-5" />
              Intelligence Overview
            </h2>
            <span className="text-xs font-mono text-status-success">
              CONNECTED
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
                <div className="text-2xl font-bold font-mono text-matrix-500">
                  1,247
                </div>
                <div className="text-xs text-matrix-600">
                  Files Analyzed
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
                <div className="text-2xl font-bold font-mono text-matrix-500">
                  89
                </div>
                <div className="text-xs text-matrix-600">
                  XOR Patterns
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
                <div className="text-2xl font-bold font-mono text-matrix-500">
                  156
                </div>
                <div className="text-xs text-matrix-600">
                  Stego Patterns
                </div>
              </div>
              <div className="text-center p-3 rounded-lg bg-bg-secondary/50">
                <div className="text-2xl font-bold font-mono text-matrix-500">
                  23
                </div>
                <div className="text-xs text-matrix-600">
                  High Entropy
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-matrix-800">
              <p className="text-xs text-matrix-600 font-mono text-center">
                Database last updated: 5 minutes ago
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Platform Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center matrix-card"
      >
        <h3 className="text-lg font-mono font-semibold text-matrix-500 mb-2">
          🎯 Platform Status
        </h3>
        <p className="text-matrix-600 mb-2">
          The Ark Investigation Platform is fully operational.
        </p>
        <p className="text-sm text-matrix-700 font-mono">
          All systems are ready for forensic investigation work.
        </p>
      </motion.div>
    </div>
  );
};
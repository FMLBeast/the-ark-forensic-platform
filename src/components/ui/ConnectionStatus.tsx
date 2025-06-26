import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff, Globe, Monitor } from 'lucide-react';
import { cn } from '@utils/cn';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className }) => {
  const [isLive, setIsLive] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    // Detect connection type
    const isLiveConnection = window.location.port === '3001' || 
                           import.meta.env.NODE_ENV === 'production' ||
                           import.meta.env.VITE_API_URL?.includes('3000');
    
    setIsLive(isLiveConnection);
    setApiUrl(import.meta.env.VITE_API_URL || '/api');

    // Test connection periodically
    const testConnection = async () => {
      try {
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          timeout: 5000 
        } as any);
        setIsConnected(response.ok);
      } catch (error) {
        setIsConnected(false);
      }
    };

    testConnection();
    const interval = setInterval(testConnection, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const connectionType = isLive ? 'LIVE SERVER' : 'LOCAL DEV';
  const connectionIcon = isLive ? Globe : Monitor;
  const statusIcon = isConnected ? Wifi : WifiOff;
  
  const StatusIcon = statusIcon;
  const TypeIcon = connectionIcon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'flex items-center gap-2 px-3 py-1 rounded-lg border font-mono text-xs',
        isConnected 
          ? isLive 
            ? 'bg-status-success/10 border-status-success/30 text-status-success'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          : 'bg-status-error/10 border-status-error/30 text-status-error',
        className
      )}
      title={`Connection: ${connectionType} | API: ${apiUrl} | Status: ${isConnected ? 'Connected' : 'Disconnected'}`}
    >
      <motion.div
        animate={{ 
          scale: isConnected ? [1, 1.2, 1] : 1,
          opacity: isConnected ? [1, 0.7, 1] : 0.5
        }}
        transition={{ 
          duration: 2, 
          repeat: isConnected ? Infinity : 0,
          ease: "easeInOut"
        }}
      >
        <StatusIcon className="w-3 h-3" />
      </motion.div>
      
      <TypeIcon className="w-3 h-3" />
      
      <span className="hidden sm:inline">
        {connectionType}
      </span>
      
      {isLive && (
        <motion.div
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-1 h-1 bg-current rounded-full"
        />
      )}
    </motion.div>
  );
};
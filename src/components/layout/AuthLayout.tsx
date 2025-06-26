import React from 'react';
import { motion } from 'framer-motion';
import { MatrixRain } from '@components/ui/MatrixRain';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-bg-primary relative overflow-hidden">
      {/* Matrix rain background */}
      <MatrixRain opacity={0.3} speed={0.2} />
      
      {/* Animated background grid */}
      <div className="fixed inset-0 hud-grid opacity-10" />
      
      {/* Gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-matrix-500/5 to-transparent" />
      
      {/* Scanlines */}
      <div className="fixed inset-0 scanline-effect opacity-30" />
      
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
      
      {/* Glowing orbs */}
      <div className="fixed top-1/4 left-1/4 w-32 h-32 bg-matrix-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="fixed bottom-1/4 right-1/4 w-48 h-48 bg-hud-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
    </div>
  );
};
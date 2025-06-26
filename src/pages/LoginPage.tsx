import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@hooks/useAuth';
import { cn } from '@utils/cn';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    clearError();

    try {
      await login(username, password);
      toast.success('Authentication successful');
      navigate('/dashboard');
    } catch (err) {
      // Error is handled by the auth context
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Removed preset credentials for security

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-8"
      >
        <div className="flex justify-center mb-4">
          <Shield className="w-16 h-16 text-matrix-500" />
        </div>
        <h1 className="text-3xl font-bold text-matrix-500 font-mono mb-2">
          THE ARK
        </h1>
        <p className="text-matrix-600 font-mono text-sm">
          INVESTIGATION PLATFORM
        </p>
        <div className="mt-4 text-xs text-matrix-700 font-mono">
          ENTER THE MATRIX
        </div>
      </motion.div>

      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="hud-panel p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-mono">{error}</span>
            </motion.div>
          )}

          {/* Username Field */}
          <div className="space-y-2">
            <label className="block text-sm font-mono text-matrix-500">
              Operative ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-matrix-600" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="matrix-input w-full pl-10"
                placeholder="Enter operative ID"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-mono text-matrix-500">
              Access Code
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-matrix-600" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="matrix-input w-full pl-10"
                placeholder="Enter access code"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className={cn(
              'w-full matrix-btn-primary py-3 font-mono font-semibold',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'hover:shadow-matrix transition-all duration-200'
            )}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-matrix-500 border-t-transparent rounded-full animate-spin" />
                AUTHENTICATING<span className="loading-dots"></span>
              </span>
            ) : (
              'ACCESS THE ARK'
            )}
          </button>
        </form>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <div className="text-center p-4 rounded-lg bg-bg-panel/30 border border-matrix-800">
          <div className="text-xs text-matrix-700 font-mono mb-2">
            SECURE ACCESS ONLY
          </div>
          <div className="text-xs text-matrix-600">
            Contact your system administrator for access credentials
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-center"
      >
        <p className="text-xs text-matrix-800 font-mono">
          "There is no spoon... but there is a comprehensive forensic analysis platform."
        </p>
      </motion.div>
    </div>
  );
};
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  Brain, 
  Users, 
  Settings, 
  LogOut,
  Shield,
  Activity
} from 'lucide-react';
import { MatrixRain } from '@components/ui/MatrixRain';
import { ConnectionStatus } from '@components/ui/ConnectionStatus';
import { useAuth } from '@hooks/useAuth';
import { cn } from '@utils/cn';

interface HUDLayoutProps {
  children: React.ReactNode;
}

export const HUDLayout: React.FC<HUDLayoutProps> = ({ children }) => {
  const { operative, logout } = useAuth();
  const location = useLocation();
  // const [isCollapsed, setIsCollapsed] = useState(false); // Future feature

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Forensics', href: '/forensics', icon: Search },
    { name: 'Analysis', href: '/analysis', icon: Brain },
    { name: 'Collaboration', href: '/collaboration', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Matrix rain background with reduced opacity */}
      <MatrixRain opacity={0.15} speed={0.15} />
      
      {/* Animated grid background */}
      <div className="fixed inset-0 hud-grid opacity-5" />
      
      {/* Header */}
      <header className="relative z-40 bg-bg-secondary/90 backdrop-blur-sm border-b border-matrix-700/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <Shield className="w-8 h-8 text-matrix-500" />
                <h1 className="text-2xl font-bold text-matrix-500 font-mono tracking-wider">
                  THE ARK
                </h1>
              </motion.div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={cn(
                      'nav-link relative px-4 py-2 rounded-lg transition-all duration-200',
                      isActive && 'active'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{item.name}</span>
                    
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-matrix-500/10 border border-matrix-700 rounded-lg"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* User Info */}
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <ConnectionStatus />
              
              {/* Status indicator */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <Activity className="w-3 h-3 text-status-success animate-pulse" />
                <span className="text-matrix-600">ONLINE</span>
              </div>
              
              {/* Operative info */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-matrix-500/20 border border-matrix-700 flex items-center justify-center">
                    <span className="text-sm font-mono font-bold text-matrix-500">
                      {operative?.display_name?.[0] || 'O'}
                    </span>
                  </div>
                  <div className="hidden sm:block text-right">
                    <div className="text-sm font-mono text-matrix-500">
                      {operative?.display_name || 'Operative'}
                    </div>
                    <div className="text-xs text-matrix-600">
                      {operative?.role || 'Unknown'} • L{operative?.clearance_level || 0}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-matrix-600 hover:text-matrix-500 hover:bg-matrix-500/10 transition-colors duration-200"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="container mx-auto px-6 py-8"
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-secondary/90 backdrop-blur-sm border-t border-matrix-700/50">
        <div className="flex items-center justify-around py-2">
          {navigation.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors duration-200',
                  isActive ? 'text-matrix-500' : 'text-matrix-600'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-mono">{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
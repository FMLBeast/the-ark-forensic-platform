// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';

// Layout components
import { HUDLayout } from '@components/layout/HUDLayout';
import { AuthLayout } from '@components/layout/AuthLayout';

// Pages
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { ForensicsPage } from '@pages/ForensicsPage';
import { AnalysisPage } from '@pages/AnalysisPage';
import { CollaborationPage } from '@pages/CollaborationPage';
import { SettingsPage } from '@pages/SettingsPage';

// Providers
import { AuthProvider } from '@store/AuthProvider';
import { useAuth } from '@hooks/useAuth';

// Utilities
import { cn } from '@utils/cn';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { operative, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-matrix-500 mx-auto"></div>
          <p className="text-matrix-500 font-hud mt-4">INITIALIZING SYSTEM<span className="loading-dots"></span></p>
        </div>
      </div>
    );
  }

  if (!operative) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// App Routes Component
const AppRoutes: React.FC = () => {
  const { operative } = useAuth();

  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            operative ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <HUDLayout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/forensics" element={<ForensicsPage />} />
                  <Route path="/analysis" element={<AnalysisPage />} />
                  <Route path="/collaboration" element={<CollaborationPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </HUDLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className={cn(
            "min-h-screen bg-bg-primary text-matrix-500",
            "font-hud antialiased",
            "scanline-effect"
          )}>
            {/* Matrix background effect */}
            <div className="fixed inset-0 bg-bg-primary z-[-2]" />
            
            {/* Animated grid background */}
            <div className="fixed inset-0 hud-grid opacity-20 z-[-1]" />
            
            {/* Main application */}
            <AppRoutes />
            
            {/* Global toast notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: 'bg-bg-panel border border-matrix-700 text-matrix-500 font-hud',
                success: {
                  className: 'bg-bg-panel border-status-success text-status-success',
                },
                error: {
                  className: 'bg-bg-panel border-status-error text-status-error',
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
      
      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
};

export default App;
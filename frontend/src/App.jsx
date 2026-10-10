import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './api/queryClient';
import PrivateRoute from './components/PrivateRoute';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import DiscoveryModules from './pages/DiscoveryModules';
import Profile from './pages/Profile';
import NexusPortal from './pages/NexusPortal';
import AdminPanel from './pages/AdminPanel';
import HelpWidget from './components/HelpWidget';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Unauthenticated Entrypoints */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/set-password" element={<Auth />} />

              {/* Secure Friend-Gated & Public Directory Modules */}
              <Route element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }>
                <Route path="/feed" element={<Feed />} />
                <Route path="/discover" element={<DiscoveryModules />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/admin" element={<AdminPanel />} />
                {/* <Route path="/nexus" element={<NexusPortal />} /> */}
              </Route>

              {/* Fallback Redirection */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <HelpWidget />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
}

export default App;

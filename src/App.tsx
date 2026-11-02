import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { Toaster } from 'sonner';

import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import RegistrationPage from './pages/RegistrationPage';
import ParentApprovalPage from './pages/ParentApprovalPage';
import ClearancePage from './pages/ClearancePage';
import GateScanPage from './pages/GateScanPage';
import AdminPage from './pages/AdminPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';

function ProtectedRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { user, dbUser, loading, mustChangePassword } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center font-serif italic text-midnight/40 animate-pulse">Synchronizing Auth State...</div>;
  if (!user) return <Navigate to="/" />;
  
  if (mustChangePassword) {
    return <ChangePasswordPage />;
  }

  if (!dbUser && !loading) {
    return <RegistrationPage />;
  }

  if (roles && !roles.includes(dbUser.role)) {
    return <Navigate to="/dashboard" />;
  }

  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/parent/approve/:token" element={<ParentApprovalPage />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />

          <Route path="/my-requests" element={
            <ProtectedRoute roles={['student']}>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/clearance" element={
            <ProtectedRoute roles={['faculty', 'warden', 'admin', 'co_admin']}>
              <ClearancePage />
            </ProtectedRoute>
          } />

          <Route path="/gate-scan" element={
            <ProtectedRoute roles={['security', 'admin']}>
              <GateScanPage />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute roles={['admin', 'co_admin']}>
              <AdminPage />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute roles={['admin', 'co_admin']}>
              <UserManagementPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}


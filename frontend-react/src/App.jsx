import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Public pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';

// Protected student pages
import DashboardPage from './pages/DashboardPage';
import MySkillsPage from './pages/MySkillsPage';
import ExplorePage from './pages/ExplorePage';
import RequestsPage from './pages/RequestsPage';
import ConnectionsPage from './pages/ConnectionsPage';
import ProfilePage from './pages/ProfilePage';

// Protected admin pages
import AdminDashboard from './pages/AdminDashboard';

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin-login" element={<AdminLoginPage />} />

              {/* Admin-only Route (has its own sidebar layout) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Student Routes — wrapped in AppLayout (sidebar + header) */}
              <Route
                element={
                  <ProtectedRoute requiredRole="student">
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/my-skills" element={<MySkillsPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/connections" element={<ConnectionsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Fallback: redirect unknown paths to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;


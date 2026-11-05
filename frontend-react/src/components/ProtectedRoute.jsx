import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-canvas)' }}>
        <div style={{ textAlign: 'center', color: '#FFFFFF' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Loading SkillSwap...</div>
          <div style={{ fontSize: '0.875rem', opacity: 0.85 }}>Checking secure session</div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    if (requiredRole === 'admin') {
      return <Navigate to="/admin-login" state={{ from: location }} replace />;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role checks
  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/admin-login" replace />;
  }

  if (requiredRole === 'student' && user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;


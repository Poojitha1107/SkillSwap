import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const checkAuth = useCallback(async () => {
    try {
      const res = await API.get('/api/auth/me');
      if (res.authenticated && res.user) {
        setUser(res.user);
        return res.user;
      } else {
        setUser(null);
        return null;
      }
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Listen for 403 suspension events from API client
    const handleBanned = (e) => {
      setUser(null);
      showToast('error', e.detail?.message || 'Your account has been suspended by an administrator.');
    };

    window.addEventListener('skillswap:banned', handleBanned);
    return () => {
      window.removeEventListener('skillswap:banned', handleBanned);
    };
  }, [checkAuth, showToast]);

  const login = async (email, password) => {
    try {
      const res = await API.post('/api/auth/login', { email, password });
      setUser(res.user);
      showToast('success', 'Login successful! Welcome back.');
      return res.user;
    } catch (err) {
      showToast('error', err.message || 'Login failed. Please check your credentials.');
      throw err;
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const res = await API.post('/api/auth/admin-login', { email, password });
      setUser(res.user);
      showToast('success', 'Admin authentication verified.');
      return res.user;
    } catch (err) {
      showToast('error', err.message || 'Admin authentication failed.');
      throw err;
    }
  };

  const register = async (formData) => {
    try {
      const res = await API.post('/api/auth/register', formData);
      setUser(res.user);
      showToast('success', 'Welcome to SkillSwap! Account created successfully.');
      return res.user;
    } catch (err) {
      showToast('error', err.message || 'Registration failed.');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await API.post('/api/auth/logout', {});
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      setUser(null);
      showToast('info', 'Logged out successfully.');
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        checkAuth,
        login,
        adminLogin,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;


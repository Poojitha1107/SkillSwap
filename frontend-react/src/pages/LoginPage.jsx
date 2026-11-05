import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, LogIn, Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFormError('Please enter your college email.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(trimmedEmail, password);
      if (loggedInUser) {
        navigate(loggedInUser.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
      }
    } catch (err) {
      setFormError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1.25rem',
              textDecoration: 'none',
            }}
          >
            <div className="brand-icon">
              <Zap style={{ width: 22, height: 22 }} />
            </div>
            <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Skill<span style={{ color: 'var(--accent-purple)' }}>Swap</span>
            </span>
          </Link>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.35rem', fontWeight: 800 }}>
            Welcome Back
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Sign in to manage your skills and peer requests
          </p>
        </div>

        {/* Inline Form Error */}
        {formError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--status-rose-subtle)',
              border: '1px solid rgba(216, 93, 101, 0.25)',
              color: 'var(--status-rose-text)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>{formError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} id="studentLoginForm">
          <div className="form-group">
            <label className="form-label" htmlFor="loginEmail">
              College Email
            </label>
            <input
              type="email"
              id="loginEmail"
              className="form-control"
              placeholder="student@college.edu"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formError) setFormError('');
              }}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="loginPassword">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="loginPassword"
                className="form-control"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (formError) setFormError('');
                }}
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Log In to SkillSwap</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          New to SkillSwap?{' '}
          <Link to="/register" style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
            Create free account
          </Link>
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            fontSize: '0.825rem',
          }}
        >
          <Link
            to="/admin-login"
            style={{
              color: 'var(--text-muted)',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Shield style={{ width: 14, height: 14 }} /> Platform Administrator Access →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

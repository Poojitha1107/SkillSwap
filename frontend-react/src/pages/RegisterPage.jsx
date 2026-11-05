import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, UserPlus, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    college: '',
    department: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedName) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!trimmedEmail) {
      setFormError('Please enter your college email.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!form.password || form.password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: trimmedName,
        email: trimmedEmail,
        password: form.password,
        college: form.college.trim(),
        department: form.department.trim(),
      };

      const newUser = await register(payload);
      if (newUser) {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setFormError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" style={{ maxWidth: 540 }}>
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
            Join the Student Network
          </h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Create your free peer account to exchange skills and connect
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

        {/* Registration Form */}
        <form onSubmit={handleSubmit} id="studentRegisterForm">
          <div className="form-group">
            <label className="form-label" htmlFor="regName">
              Full Name *
            </label>
            <input
              type="text"
              id="regName"
              name="name"
              className="form-control"
              placeholder="e.g. Maya Lin"
              required
              maxLength={60}
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="regEmail">
              College Email *
            </label>
            <input
              type="email"
              id="regEmail"
              name="email"
              className="form-control"
              placeholder="maya.lin@university.edu"
              required
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="regPassword">
                Password * (min 6 chars)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="regPassword"
                  name="password"
                  className="form-control"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
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
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="regConfirmPassword">
                Confirm Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="regConfirmPassword"
                  name="confirmPassword"
                  className="form-control"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
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
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="regCollege">
                College / Campus
              </label>
              <input
                type="text"
                id="regCollege"
                name="college"
                className="form-control"
                placeholder="e.g. Stanford University"
                maxLength={100}
                value={form.college}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="regDept">
                Department / Major
              </label>
              <input
                type="text"
                id="regDept"
                name="department"
                className="form-control"
                placeholder="e.g. Computer Science"
                maxLength={100}
                value={form.department}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Privacy Guarantee Box */}
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              marginBottom: '1.5rem',
              background: 'var(--bg-surface)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}
          >
            <Lock
              style={{
                width: 15,
                height: 15,
                flexShrink: 0,
                marginTop: 2,
                color: 'var(--accent-purple)',
              }}
            />
            <div>
              <strong>Privacy Guarantee:</strong> Your contact details remain private and are strictly revealed only to
              students whose skill requests you accept.
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <UserPlus size={18} />
                <span>Create Free Student Account</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
            Log in here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

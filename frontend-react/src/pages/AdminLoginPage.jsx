import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminLoginPage = () => {
  const { adminLogin, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const admin = await adminLogin(email, password);
      if (admin) {
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      // Error toast handled inside AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card" style={{ borderColor: 'rgba(239, 68, 68, 0.35)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-lg)', background: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <ShieldAlert style={{ width: 28, height: 28 }} />
          </div>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Administrator Access</h2>
          <p className="text-sm">Restricted to authorized SkillSwap platform personnel</p>
        </div>

        <div style={{ background: '#FEF2F2', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.9rem 1.15rem', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#991B1B', marginBottom: '1.5rem', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
          <ShieldAlert style={{ width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Security Notice:</strong> Public admin sign-up is disabled. Administrator credentials are provisioned via server environment seeding only.
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="adminEmail">Admin Email</label>
            <input
              type="email"
              id="adminEmail"
              className="form-control"
              placeholder="admin@skillswap.edu"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="adminPassword">Password</label>
            <input
              type="password"
              id="adminPassword"
              className="form-control"
              placeholder="••••••••"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-danger btn-lg"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.75rem', background: '#DC2626', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <KeyRound style={{ width: 18, height: 18 }} />
            <span>{loading ? 'Verifying Admin Authority...' : 'Authenticate as Admin'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.875rem' }}>
          <Link to="/login" style={{ color: 'var(--text-secondary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft style={{ width: 14, height: 14 }} /> Return to Student Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;


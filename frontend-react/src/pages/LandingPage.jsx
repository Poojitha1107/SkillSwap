import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Zap, LogIn, ArrowRight, BookOpen, ArrowLeftRight, Lock, Inbox, Users, ShieldCheck, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div style={{ background: 'var(--bg-canvas)', minHeight: '100vh' }}>
      {/* Top Navigation */}
      <header className="navbar">
        <div className="container nav-container">
          <Link to="/" className="nav-brand-logo">
            <div className="brand-icon" style={{ width: 36, height: 36 }}>
              <Zap style={{ width: 20, height: 20 }} />
            </div>
            <span>Skill<span style={{ color: 'var(--accent-purple)' }}>Swap</span></span>
          </Link>

          <nav>
            <ul className="nav-links">
              <li><Link to="/explore" className="nav-link">Explore Skills</Link></li>
              <li><a href="#how-it-works" className="nav-link">How It Works</a></li>
              <li><a href="#features" className="nav-link">Features</a></li>
            </ul>
          </nav>

          <div className="nav-actions">
            <Link to="/login" className="btn btn-outline btn-sm">Log In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container hero-content">
          <div className="hero-badge">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Sparkles style={{ width: 14, height: 14 }} /> The Modern College Peer Network
            </span>
          </div>
          <h1 className="hero-title">
            Exchange Knowledge. <br />
            <span className="text-purple">Master New Skills Together.</span>
          </h1>
          <p className="hero-subtitle">
            SkillSwap connects college students to share knowledge peer-to-peer. Teach what you excel in, learn what you aspire to, and build meaningful academic connections.
          </p>

          <div className="hero-actions">
            <Link to="/register" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Join SkillSwap Free</span>
              <ArrowRight style={{ width: 18, height: 18 }} />
            </Link>
            <Link to="/explore" className="btn btn-dark btn-lg">Browse Skill Catalog</Link>
          </div>

          {/* App Mockup Preview */}
          <div className="hero-mockup-wrapper">
            <div className="mockup-inner">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }}></span>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                  <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600, marginLeft: '0.5rem' }}>Live Student Matches</span>
                </div>
                <span className="badge badge-teaching" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Zap style={{ width: 13, height: 13 }} /> Active Exchange
                </span>
              </div>

              <div className="grid grid-2" style={{ gap: '1.5rem' }}>
                <div style={{ background: 'var(--bg-surface-white)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-lime)' }}>
                  <span className="badge badge-teaching" style={{ marginBottom: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    Teaching
                  </span>
                  <h4 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Full-Stack Web Dev with Node &amp; Express</h4>
                  <p className="text-sm">Mentor: Alex Chen • Computer Science</p>
                </div>
                <div style={{ background: 'var(--bg-surface-white)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-purple)' }}>
                  <span className="badge badge-learning" style={{ marginBottom: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    Wants to Learn
                  </span>
                  <h4 style={{ fontSize: '1.15rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>Figma UI/UX &amp; Design Systems</h4>
                  <p className="text-sm">Learner: Sarah Jenkins • Design Media</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="stats-strip">
        <div className="container grid grid-4">
          {[
            { number: '100%', label: 'Peer-to-Peer Free' },
            { number: '2-Way', label: 'Teaching & Learning' },
            { number: 'Protected', label: 'Private Contact Data' },
            { number: 'Verified', label: 'Student Community' },
          ].map((s) => (
            <div key={s.label} className="stat-item">
              <div className="stat-number">{s.number}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Why SkillSwap</div>
            <h2 className="section-title">Everything you need for authentic peer learning</h2>
            <p>Built specifically for college students to bridge the gap between classroom theory and practical, real-world skills.</p>
          </div>

          <div className="grid grid-3">
            {[
              { icon: BookOpen, title: 'Dual Skill Profiles', desc: 'List both the skills you can mentor others in and the topics you want to learn. Support beginner to advanced tiers.' },
              { icon: ArrowLeftRight, title: 'One-Way or Swap Requests', desc: 'No forced trade-offs. Request to learn from any peer directly without being obligated to teach back unless mutually agreed.' },
              { icon: Lock, title: 'Privacy-First Contacts', desc: 'Phone numbers, WhatsApp, and social links remain completely hidden until a mutual connection request is accepted.' },
              { icon: Inbox, title: 'Centralized Requests Hub', desc: 'Track incoming requests from peers and outgoing requests you\'ve sent with clear status tracking.' },
              { icon: Users, title: 'Dedicated Connections', desc: 'Once a request is accepted, your peer appears in your verified Connections network with full direct collaboration details unlocked.' },
              { icon: ShieldCheck, title: 'Campus Governance', desc: 'Protected by platform administrators to ensure a safe, high-quality, and respectful learning environment for all students.' },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="feature-box">
                  <div className="feature-icon-box">
                    <Icon />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="steps-section" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <div className="section-tag">Simple Process</div>
            <h2 className="section-title">How SkillSwap Works in 3 Steps</h2>
          </div>

          <div className="grid grid-3">
            {[
              { num: '01', title: 'Create Your Profile', desc: 'Sign up with your college email, list skills you can teach, and add topics you are eager to learn.' },
              { num: '02', title: 'Explore & Send Request', desc: 'Search peers by skill category, keyword, or level. Send a personalized request to learn their skill.' },
              { num: '03', title: 'Connect & Learn', desc: 'When your request is accepted, contact information is unlocked in your Connections hub so you can start learning.' },
            ].map((s) => (
              <div key={s.num} className="step-card">
                <div className="step-number">{s.num}</div>
                <h3 style={{ marginBottom: '0.75rem' }}>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-banner">
            <h2 className="cta-title">Ready to level up your college skills?</h2>
            <p className="cta-desc">
              Join student mentors and learners across campus today. It takes less than two minutes to get started.
            </p>
            <Link to="/register" className="btn btn-primary btn-lg" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>Create Free Student Account</span>
              <ArrowRight style={{ width: 18, height: 18 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="brand-icon" style={{ width: 28, height: 28 }}>
              <Zap style={{ width: 16, height: 16 }} />
            </div>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.05rem' }}>SkillSwap</span>
            <span>• Peer-to-Peer College Skill Exchange</span>
          </div>

          <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center' }}>
            <Link to="/explore">Explore</Link>
            <Link to="/login">Student Login</Link>
            <Link to="/admin-login" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Shield style={{ width: 14, height: 14 }} /> Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;


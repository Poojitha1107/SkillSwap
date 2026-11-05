import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Target, Mail, Handshake, Plus, Search, Users, Zap, Inbox, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../services/api';

const DashboardPage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ teaching: 0, learning: 0, pendingIncoming: 0, connections: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  const [recommendedSkills, setRecommendedSkills] = useState([]);
  const [recentConnections, setRecentConnections] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoadingStats(true);
    try {
      const [skillsRes, requestsRes, connectionsRes] = await Promise.all([
        API.get('/api/skills/my'),
        API.get('/api/requests/my'),
        API.get('/api/requests/connections'),
      ]);

      setStats({
        teaching: skillsRes.summary?.teaching || 0,
        learning: skillsRes.summary?.learning || 0,
        pendingIncoming: requestsRes.counts?.incomingPending || 0,
        connections: connectionsRes.count || 0,
      });

      setRecentRequests((requestsRes.incoming || []).slice(0, 3));
      setRecentConnections((connectionsRes.connections || []).slice(0, 3));

      const exploreRes = await API.get('/api/skills/explore?type=Teaching');
      const peerSkills = (exploreRes.skills || []).filter((s) => s.user?._id !== user?.id).slice(0, 3);
      setRecommendedSkills(peerSkills);
    } catch (err) {
      showToast('error', 'Could not refresh statistics from server.');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleRequestAction = async (requestId, status) => {
    try {
      await API.put(`/api/requests/${requestId}/status`, { status });
      showToast('success', `Request marked as ${status}!`);
      loadAll();
    } catch (err) {
      showToast('error', err.message || 'Action failed.');
    }
  };

  return (
    <div className="page-content">

      {/* ── WELCOME BANNER ── */}
      <section className="welcome-hero">
        <div className="welcome-hero-content">
          <div className="welcome-badge">
            <GraduationCap size={15} />
            <span>Peer-to-Peer Academic Network</span>
          </div>
          <h1 className="welcome-hero-title" id="userGreeting">
            Welcome back, {user?.name?.split(' ')[0] || 'Student'}!
          </h1>
          <p className="welcome-hero-desc" id="userSubInfo">
            {[user?.department, user?.college].filter(Boolean).join(' • ') ||
              'Connecting college learners to exchange skills and grow together.'}
          </p>
        </div>
        <div className="welcome-hero-graphic">
          <Zap size={37} strokeWidth={1.8} />
        </div>
      </section>

      {/* ── STATISTICS ── */}
      <section className="stats-grid">

        <div className="stat-card">
          <div>
            <div className="stat-info-label">Skills I Teach</div>
            <div className="stat-info-value" id="statTeaching">
              {loadingStats ? '—' : stats.teaching}
            </div>
          </div>
          <div className="stat-icon stat-icon-lime">
            <GraduationCap size={21} strokeWidth={1.8} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-info-label">Skills I Learn</div>
            <div className="stat-info-value" id="statLearning">
              {loadingStats ? '—' : stats.learning}
            </div>
          </div>
          <div className="stat-icon stat-icon-purple">
            <Target size={21} strokeWidth={1.8} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-info-label">Pending Requests</div>
            <div className="stat-info-value" id="statPending">
              {loadingStats ? '—' : stats.pendingIncoming}
            </div>
          </div>
          <div className="stat-icon stat-icon-amber">
            <Mail size={21} strokeWidth={1.8} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-info-label">Active Connections</div>
            <div className="stat-info-value" id="statConnections">
              {loadingStats ? '—' : stats.connections}
            </div>
          </div>
          <div className="stat-icon stat-icon-navy">
            <Handshake size={21} strokeWidth={1.8} />
          </div>
        </div>

      </section>

      {/* ── QUICK ACTIONS ── */}
      <section style={{ marginBottom: '2.25rem' }}>
        <div className="section-header-row">
          <h3 className="section-heading">Quick Actions</h3>
        </div>

        <div className="grid grid-3">

          <Link to="/my-skills" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: '#D8F36A', color: '#24213A' }}>
              <Plus size={21} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                Manage My Skills
              </div>
              <div className="text-xs text-secondary">
                Add new teaching topics or learning goals
              </div>
            </div>
          </Link>

          <Link to="/explore" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: '#EEE9FA', color: '#7256C7' }}>
              <Search size={21} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                Explore Peer Skills
              </div>
              <div className="text-xs text-secondary">
                Discover mentors and students on campus
              </div>
            </div>
          </Link>

          <Link to="/connections" className="quick-action-card">
            <div className="quick-action-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
              <Users size={21} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                My Connections
              </div>
              <div className="text-xs text-secondary">
                Access unlocked peer contact information
              </div>
            </div>
          </Link>

        </div>
      </section>

      {/* ── BOTTOM CONTENT GRID ── */}
      <div className="grid grid-2" style={{ gap: '2rem', marginBottom: '2.25rem' }}>

        {/* Recent Incoming Requests */}
        <div>
          <div className="section-header-row">
            <h3 className="section-heading">Recent Incoming Requests</h3>
            <Link to="/requests" className="text-sm" style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
              View Hub →
            </Link>
          </div>

          <div id="recentRequestsContainer">
            {recentRequests.length === 0 ? (
              <div className="request-card" style={{ justifyContent: 'center', flexDirection: 'column', alignItems: 'center', padding: '2rem', gap: '0.75rem' }}>
                <Inbox size={32} style={{ color: 'var(--text-muted)' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No pending incoming requests</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  List more skills you can teach or explore other students' learning goals to connect!
                </div>
                <Link to="/my-skills" className="btn btn-primary btn-sm">
                  <Plus size={14} /> Add a Skill
                </Link>
              </div>
            ) : (
              recentRequests.map((req) => (
                <div key={req._id} className="request-card">
                  <div className="request-meta">
                    <div className="user-avatar" style={{ background: '#24213A', color: '#D8F36A' }}>
                      {req.requester?.name ? req.requester.name.charAt(0).toUpperCase() : 'S'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                        {req.requester?.name || 'Student'}
                        <span className={`badge badge-${req.status.toLowerCase()}`} style={{ marginLeft: '0.5rem' }}>
                          {req.status}
                        </span>
                      </div>
                      <div className="text-xs text-secondary">
                        Wants to learn: <strong style={{ color: 'var(--text-primary)' }}>{req.skill?.title || 'Skill'}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="request-actions">
                    {req.status === 'Pending' ? (
                      <>
                        <button onClick={() => handleRequestAction(req._id, 'Accepted')} className="btn btn-primary btn-sm">Accept</button>
                        <button onClick={() => handleRequestAction(req._id, 'Rejected')} className="btn btn-outline btn-sm">Decline</button>
                      </>
                    ) : (
                      <Link to="/requests" className="btn btn-outline btn-sm">View in Hub</Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recommended Peer Skills */}
        <div>
          <div className="section-header-row">
            <h3 className="section-heading">Recommended Peer Skills</h3>
            <Link to="/explore" className="text-sm" style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
              Browse All →
            </Link>
          </div>

          <div id="recommendedSkillsContainer">
            {recommendedSkills.length === 0 ? (
              <div className="request-card" style={{ justifyContent: 'center', flexDirection: 'column', alignItems: 'center', padding: '2rem', gap: '0.75rem' }}>
                <BookOpen size={32} style={{ color: 'var(--text-muted)' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No peer skills available yet</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Be the first to list a skill or invite your friends to SkillSwap!
                </div>
              </div>
            ) : (
              recommendedSkills.map((skill) => (
                <div key={skill._id} className="skill-card" style={{ marginBottom: '12px' }}>
                  <div className="skill-card-top">
                    <div>
                      <span className="badge badge-teaching" style={{ marginBottom: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <GraduationCap size={12} /> Teaching
                      </span>
                      <span className="badge" style={{ marginLeft: '6px' }}>{skill.category}</span>
                      <div className="skill-card-title">{skill.title}</div>
                    </div>
                  </div>
                  <p className="skill-card-desc">{skill.description}</p>
                  <div className="skill-card-footer">
                    <div className="student-tag">
                      <div className="student-tag-avatar">
                        {skill.user?.name ? skill.user.name.charAt(0).toUpperCase() : 'P'}
                      </div>
                      {skill.user?.name || 'Peer'}
                    </div>
                    <Link to="/explore" className="btn btn-secondary btn-sm" style={{ fontSize: '0.775rem', padding: '0.35rem 0.85rem' }}>
                      View &amp; Connect
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;

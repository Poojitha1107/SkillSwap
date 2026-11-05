import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Users,
  BookOpen,
  Inbox,
  LogOut,
  Ban,
  CheckCircle,
  Trash2,
  Loader2,
  Search,
  SearchX,
  RefreshCw,
  Clock,
  Menu,
  AlertTriangle,
  GraduationCap,
  Target,
  ShieldCheck,
  Filter,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../services/api';
import Modal from '../components/Modal';

const CATEGORIES = [
  'All',
  'Programming & Tech',
  'Design & Creative',
  'Academics & Science',
  'Languages',
  'Music & Arts',
  'Business & Career',
  'Other',
];

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Active navigation section
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global state
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Students state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentStatusFilter, setStudentStatusFilter] = useState('all');
  const [studentToModify, setStudentToModify] = useState(null);
  const [processingStudent, setProcessingStudent] = useState(false);

  // Skills state
  const [adminSkills, setAdminSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillTypeFilter, setSkillTypeFilter] = useState('all');
  const [skillCategoryFilter, setSkillCategoryFilter] = useState('All');
  const [skillToDelete, setSkillToDelete] = useState(null);
  const [deletingSkill, setDeletingSkill] = useState(false);

  // Requests state
  const [adminRequests, setAdminRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestSearch, setRequestSearch] = useState('');
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');

  // Handle URL hash changes
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['dashboard', 'students', 'skills', 'requests'].includes(hash)) {
      setActiveSection(hash);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      loadAdminStats(),
      loadStudents(),
      loadSkills(),
      loadRequests(),
    ]);
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await loadAllData();
      showToast('success', 'Platform telemetry and records updated.');
    } catch {
      showToast('error', 'Error refreshing data.');
    } finally {
      setRefreshing(false);
    }
  };

  const loadAdminStats = async () => {
    try {
      const res = await API.get('/api/admin/stats');
      setStats(res.stats || null);
    } catch (err) {
      showToast('error', 'Failed to fetch admin statistics.');
    }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const res = await API.get('/api/admin/students');
      setStudents(res.students || []);
    } catch (err) {
      showToast('error', 'Failed to load students roster.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadSkills = async () => {
    setLoadingSkills(true);
    try {
      const res = await API.get('/api/admin/skills');
      setAdminSkills(res.skills || []);
    } catch (err) {
      showToast('error', 'Failed to load skills moderation records.');
    } finally {
      setLoadingSkills(false);
    }
  };

  const loadRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await API.get('/api/admin/requests');
      setAdminRequests(res.requests || []);
    } catch (err) {
      showToast('error', 'Failed to load requests audit log.');
    } finally {
      setLoadingRequests(false);
    }
  };

  // Student Ban / Unban
  const confirmToggleStudentBan = async () => {
    if (!studentToModify) return;
    setProcessingStudent(true);
    try {
      const res = await API.put(`/api/admin/students/${studentToModify._id}/ban`, {});
      showToast('success', res.message || 'Student status updated.');
      setStudentToModify(null);
      await Promise.all([loadAdminStats(), loadStudents(), loadRequests()]);
    } catch (err) {
      showToast('error', err.message || 'Operation failed.');
    } finally {
      setProcessingStudent(false);
    }
  };

  // Skill Delete
  const confirmDeleteSkill = async () => {
    if (!skillToDelete) return;
    setDeletingSkill(true);
    try {
      await API.delete(`/api/admin/skills/${skillToDelete._id}`);
      showToast('success', 'Skill listing removed by administrator.');
      setSkillToDelete(null);
      await Promise.all([loadAdminStats(), loadSkills(), loadRequests()]);
    } catch (err) {
      showToast('error', err.message || 'Failed to remove skill.');
    } finally {
      setDeletingSkill(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin-login');
  };

  // Switch navigation section and keep hash in sync
  const handleNavClick = (sectionKey) => {
    setActiveSection(sectionKey);
    window.location.hash = sectionKey;
    setMobileMenuOpen(false);
  };

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      if (studentStatusFilter === 'active' && student.isBanned) return false;
      if (studentStatusFilter === 'banned' && !student.isBanned) return false;

      if (studentSearch.trim()) {
        const q = studentSearch.trim().toLowerCase();
        const nameMatch = (student.name || '').toLowerCase().includes(q);
        const emailMatch = (student.email || '').toLowerCase().includes(q);
        const collegeMatch = (student.college || '').toLowerCase().includes(q);
        const deptMatch = (student.department || '').toLowerCase().includes(q);
        const idMatch = (student._id || '').toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !collegeMatch && !deptMatch && !idMatch) {
          return false;
        }
      }
      return true;
    });
  }, [students, studentSearch, studentStatusFilter]);

  // Filtered Skills
  const filteredSkills = useMemo(() => {
    return adminSkills.filter((skill) => {
      if (skillTypeFilter !== 'all' && skill.type !== skillTypeFilter) return false;
      if (skillCategoryFilter !== 'All' && skill.category !== skillCategoryFilter) return false;

      if (skillSearch.trim()) {
        const q = skillSearch.trim().toLowerCase();
        const titleMatch = (skill.title || '').toLowerCase().includes(q);
        const catMatch = (skill.category || '').toLowerCase().includes(q);
        const userNameMatch = (skill.user?.name || '').toLowerCase().includes(q);
        const userEmailMatch = (skill.user?.email || '').toLowerCase().includes(q);
        if (!titleMatch && !catMatch && !userNameMatch && !userEmailMatch) {
          return false;
        }
      }
      return true;
    });
  }, [adminSkills, skillSearch, skillTypeFilter, skillCategoryFilter]);

  // Filtered Requests
  const filteredRequests = useMemo(() => {
    return adminRequests.filter((req) => {
      if (requestStatusFilter !== 'all' && req.status !== requestStatusFilter) return false;

      if (requestSearch.trim()) {
        const q = requestSearch.trim().toLowerCase();
        const reqName = (req.requester?.name || '').toLowerCase().includes(q);
        const reqEmail = (req.requester?.email || '').toLowerCase().includes(q);
        const recName = (req.recipient?.name || '').toLowerCase().includes(q);
        const recEmail = (req.recipient?.email || '').toLowerCase().includes(q);
        const skillTitle = (req.skill?.title || '').toLowerCase().includes(q);
        if (!reqName && !reqEmail && !recName && !recEmail && !skillTitle) {
          return false;
        }
      }
      return true;
    });
  }, [adminRequests, requestSearch, requestStatusFilter]);

  // Calculations for Visual Distribution
  const totalSkillsCount = stats?.skills?.total || 1;
  const teachingPercent = stats ? Math.round((stats.skills.teaching / totalSkillsCount) * 100) : 0;
  const learningPercent = stats ? 100 - teachingPercent : 0;

  const totalRequestsCount = stats?.requests?.total || 1;
  const acceptedPercent = stats ? Math.round((stats.requests.accepted / totalRequestsCount) * 100) : 0;
  const pendingPercent = stats ? Math.round((stats.requests.pending / totalRequestsCount) * 100) : 0;
  const rejectedPercent = stats ? Math.max(0, 100 - acceptedPercent - pendingPercent) : 0;

  // Dynamic header titles
  const getHeaderMeta = () => {
    switch (activeSection) {
      case 'students':
        return {
          title: 'Student Roster & Access Moderation',
          subtitle: 'Monitor active student accounts, verify college credentials, and govern access',
        };
      case 'skills':
        return {
          title: 'Skills Catalog Moderation',
          subtitle: 'Review, moderate, and remove inappropriate skill listings across campus',
        };
      case 'requests':
        return {
          title: 'Platform Requests Audit Trail',
          subtitle: 'Real-time telemetry of all student invitations, acceptances, and agreements',
        };
      case 'dashboard':
      default:
        return {
          title: 'Platform Governance & Real-Time Analytics',
          subtitle: 'Live system telemetry, user access moderation, and catalog oversight',
        };
    }
  };

  const headerMeta = getHeaderMeta();

  const navItems = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'students', label: 'Students', icon: Users, badge: students.length },
    { key: 'skills', label: 'Skills Moderation', icon: BookOpen, badge: adminSkills.length },
    { key: 'requests', label: 'Requests Audit', icon: Inbox, badge: adminRequests.length },
  ];

  return (
    <div className="app-page">
      <div className="app-wrapper">
        <div className="app-shell">
          {/* Mobile Overlay */}
          {mobileMenuOpen && (
            <div
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 998,
              }}
            />
          )}

          {/* Admin Dark Navy Sidebar */}
          <aside
            className={`app-sidebar ${mobileMenuOpen ? 'open' : ''}`}
            style={{ borderRight: '1px solid rgba(239, 68, 68, 0.25)' }}
          >
            <div>
              <Link to="/admin" className="sidebar-brand">
                <div className="brand-icon" style={{ background: '#EF4444', color: '#FFFFFF' }}>
                  <Shield size={20} />
                </div>
                <div className="brand-name">
                  Skill<span>Swap</span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      background: 'rgba(239, 68, 68, 0.2)',
                      color: '#FCA5A5',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      marginLeft: '0.45rem',
                      fontWeight: 800,
                      verticalAlign: 'middle',
                    }}
                  >
                    Admin
                  </span>
                </div>
              </Link>

              <div className="sidebar-section-title">ADMINISTRATION</div>

              <ul className="sidebar-menu">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.key;
                  return (
                    <li key={item.key} className="sidebar-item">
                      <a
                        href={`#${item.key}`}
                        className={isActive ? 'active' : ''}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavClick(item.key);
                        }}
                      >
                        <span className="sidebar-item-icon">
                          <Icon size={18} />
                        </span>
                        <span>{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span
                            style={{
                              marginLeft: 'auto',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '0.1rem 0.45rem',
                              borderRadius: 'var(--radius-full)',
                              background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)',
                              color: isActive ? '#1e1c2e' : '#D1D5DB',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Admin Profile Footer */}
            <div className="sidebar-footer">
              <div className="user-mini-profile">
                <div
                  className="user-avatar"
                  style={{ background: '#EF4444', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Shield size={18} />
                </div>
                <div className="user-mini-meta">
                  <div className="user-mini-name">{user?.name || 'Administrator'}</div>
                  <div className="user-mini-role">Platform Governance</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-outline btn-sm"
                  style={{
                    padding: '0.35rem 0.65rem',
                    color: '#E5E4F0',
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="app-main">
            {/* SaaS Topbar */}
            <div className="main-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button
                  type="button"
                  className="mobile-menu-toggle"
                  onClick={() => setMobileMenuOpen(true)}
                  title="Toggle Menu"
                >
                  <Menu size={20} />
                </button>

                <div>
                  <h1 className="page-title">{headerMeta.title}</h1>
                  <p className="page-subtitle">{headerMeta.subtitle}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefreshAll}
                className="btn btn-dark btn-sm"
                disabled={refreshing}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                title="Refresh live telemetry from database"
              >
                <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh Live Data'}</span>
              </button>
            </div>

            <div className="page-content">
              {/* ========================================================= */}
              {/* 1. OVERVIEW DASHBOARD SECTION                             */}
              {/* ========================================================= */}
              {activeSection === 'dashboard' && (
                <>
                  {/* Real-Time Platform KPI Cards (6 Cards) */}
                  <div className="grid grid-3" style={{ gap: '1.25rem', marginBottom: '2rem' }}>
                    {/* Card 1: Total Students */}
                    <div className="card stat-card">
                      <div>
                        <div className="stat-info-label">Total Registered Students</div>
                        <div className="stat-info-value" id="statTotalStudents">
                          {stats?.students?.total ?? '—'}
                        </div>
                        <div className="text-xs text-muted" id="statActiveStudents" style={{ marginTop: '0.35rem' }}>
                          {stats ? `${stats.students.active} active • ${stats.students.banned} suspended` : 'Loading...'}
                        </div>
                      </div>
                      <div className="stat-icon stat-icon-lime">
                        <Users size={20} />
                      </div>
                    </div>

                    {/* Card 2: Active Students */}
                    <div className="card stat-card">
                      <div>
                        <div className="stat-info-label">Active Student Accounts</div>
                        <div className="stat-info-value" style={{ color: '#15803D' }}>
                          {stats?.students?.active ?? '—'}
                        </div>
                        <div className="text-xs text-muted" style={{ marginTop: '0.35rem' }}>
                          {stats && stats.students.total > 0
                            ? `${Math.round((stats.students.active / stats.students.total) * 100)}% active participation`
                            : 'Good standing'}
                        </div>
                      </div>
                      <div className="stat-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
                        <CheckCircle size={20} />
                      </div>
                    </div>

                    {/* Card 3: Suspended Students */}
                    <div className="card stat-card">
                      <div>
                        <div className="stat-info-label">Suspended Students</div>
                        <div className="stat-info-value" style={{ color: (stats?.students?.banned || 0) > 0 ? '#B91C1C' : 'inherit' }}>
                          {stats?.students?.banned ?? '—'}
                        </div>
                        <div className="text-xs text-muted" style={{ marginTop: '0.35rem' }}>
                          {(stats?.students?.banned || 0) > 0 ? 'Restricted by governance' : 'Zero account suspensions'}
                        </div>
                      </div>
                      <div className="stat-icon" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                        <Ban size={20} />
                      </div>
                    </div>

                    {/* Card 4: Total Skills */}
                    <div className="card stat-card">
                      <div>
                        <div className="stat-info-label">Total Platform Skills</div>
                        <div className="stat-info-value" id="statTotalSkills">
                          {stats?.skills?.total ?? '—'}
                        </div>
                        <div className="text-xs text-muted" id="statSkillsBreakdown" style={{ marginTop: '0.35rem' }}>
                          {stats ? `${stats.skills.teaching} teaching • ${stats.skills.learning} learning` : 'Loading...'}
                        </div>
                      </div>
                      <div className="stat-icon stat-icon-purple">
                        <BookOpen size={20} />
                      </div>
                    </div>

                    {/* Card 5: Pending Requests */}
                    <div className="card stat-card">
                      <div>
                        <div className="stat-info-label">Pending Exchange Requests</div>
                        <div className="stat-info-value" style={{ color: '#A66A19' }}>
                          {stats?.requests?.pending ?? '—'}
                        </div>
                        <div className="text-xs text-muted" style={{ marginTop: '0.35rem' }}>
                          Awaiting peer confirmation
                        </div>
                      </div>
                      <div className="stat-icon stat-icon-amber">
                        <Clock size={20} />
                      </div>
                    </div>

                    {/* Card 6: Accepted Requests */}
                    <div className="card stat-card">
                      <div>
                        <div className="stat-info-label">Accepted Connections</div>
                        <div className="stat-info-value" style={{ color: '#15803D' }}>
                          {stats?.requests?.accepted ?? '—'}
                        </div>
                        <div className="text-xs text-muted" style={{ marginTop: '0.35rem' }}>
                          Active peer collaborations
                        </div>
                      </div>
                      <div className="stat-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
                        <ShieldCheck size={20} />
                      </div>
                    </div>
                  </div>

                  {/* Visual Analytics & Distribution Bars */}
                  {stats && (
                    <div id="adminAnalyticsBars" className="grid grid-2" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
                      {/* Skills Distribution */}
                      <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Skills Catalog Distribution</span>
                          <span className="text-xs text-muted">{stats.skills.total} Total Skills</span>
                        </div>
                        <div
                          style={{
                            height: 12,
                            width: '100%',
                            background: '#E2E8F0',
                            borderRadius: 999,
                            overflow: 'hidden',
                            display: 'flex',
                            marginBottom: '0.85rem',
                          }}
                        >
                          <div
                            style={{ width: `${teachingPercent}%`, background: 'var(--accent-lime)', transition: 'width 0.5s' }}
                            title={`Teaching: ${teachingPercent}%`}
                          />
                          <div
                            style={{ width: `${learningPercent}%`, background: 'var(--accent-purple)', transition: 'width 0.5s' }}
                            title={`Learning: ${learningPercent}%`}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: 'var(--accent-lime)',
                                marginRight: '0.35rem',
                              }}
                            />
                            <strong>{teachingPercent}%</strong> Teaching ({stats.skills.teaching})
                          </div>
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: 'var(--accent-purple)',
                                marginRight: '0.35rem',
                              }}
                            />
                            <strong>{learningPercent}%</strong> Learning ({stats.skills.learning})
                          </div>
                        </div>
                      </div>

                      {/* Request Success Rate */}
                      <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Exchange Request Success Rate</span>
                          <span className="text-xs text-muted">{stats.requests.total} Total Requests</span>
                        </div>
                        <div
                          style={{
                            height: 12,
                            width: '100%',
                            background: '#E2E8F0',
                            borderRadius: 999,
                            overflow: 'hidden',
                            display: 'flex',
                            marginBottom: '0.85rem',
                          }}
                        >
                          <div
                            style={{ width: `${acceptedPercent}%`, background: '#10B981', transition: 'width 0.5s' }}
                            title={`Accepted: ${acceptedPercent}%`}
                          />
                          <div
                            style={{ width: `${pendingPercent}%`, background: '#F59E0B', transition: 'width 0.5s' }}
                            title={`Pending: ${pendingPercent}%`}
                          />
                          <div
                            style={{ width: `${rejectedPercent}%`, background: '#EF4444', transition: 'width 0.5s' }}
                            title={`Rejected: ${rejectedPercent}%`}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: '#10B981',
                                marginRight: '0.35rem',
                              }}
                            />
                            <strong>{acceptedPercent}%</strong> Accepted ({stats.requests.accepted})
                          </div>
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: '#F59E0B',
                                marginRight: '0.35rem',
                              }}
                            />
                            <strong>{pendingPercent}%</strong> Pending ({stats.requests.pending})
                          </div>
                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: '#EF4444',
                                marginRight: '0.35rem',
                              }}
                            />
                            <strong>{rejectedPercent}%</strong> Rejected ({stats.requests.rejected || 0})
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Platform Activity & Quick Navigation */}
                  <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Recent Exchange Activity Log</h3>
                        <p className="text-xs text-secondary">Latest peer skill exchanges initiated across the platform</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleNavClick('requests')}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        <span>View Full Audit Trail</span>
                        <ExternalLink size={14} />
                      </button>
                    </div>

                    <div className="table-wrapper">
                      <table className="data-table" style={{ minWidth: '860px' }}>
                        <thead>
                          <tr>
                            <th style={{ width: '25%' }}>Requester</th>
                            <th style={{ width: '25%' }}>Recipient</th>
                            <th style={{ width: '25%' }}>Target Skill</th>
                            <th style={{ width: '12%' }}>Status</th>
                            <th style={{ width: '13%' }}>Timestamp</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminRequests.slice(0, 5).map((req) => (
                            <tr key={req._id}>
                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {req.requester?.name || 'Unknown Student'}
                                </div>
                                <div className="text-xs text-muted" style={{ wordBreak: 'break-word' }}>
                                  {req.requester?.email || '—'}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {req.recipient?.name || 'Unknown Student'}
                                </div>
                                <div className="text-xs text-muted" style={{ wordBreak: 'break-word' }}>
                                  {req.recipient?.email || '—'}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontWeight: 600 }}>{req.skill?.title || 'Deleted Skill'}</div>
                                {req.skill?.type && (
                                  <div className="text-xs text-muted">{req.skill.type}</div>
                                )}
                              </td>
                              <td>
                                <span className={`badge badge-${(req.status || 'pending').toLowerCase()}`}>
                                  {req.status}
                                </span>
                              </td>
                              <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {adminRequests.length === 0 && (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                                No exchange requests recorded yet.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* ========================================================= */}
              {/* 2. STUDENT MANAGEMENT SECTION                             */}
              {/* ========================================================= */}
              {activeSection === 'students' && (
                <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Student Roster & Access Moderation
                      </h2>
                      <p className="text-xs text-secondary">
                        Review registered campus accounts, monitor activity, and manage access suspension
                      </p>
                    </div>

                    <span className="badge badge-category" style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}>
                      {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
                    </span>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="filter-bar">
                    <div className="search-box">
                      <span className="search-icon">
                        <Search size={18} />
                      </span>
                      <input
                        type="text"
                        id="adminStudentSearch"
                        className="form-control"
                        placeholder="Search by student name, college, email, or student ID..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                      />
                    </div>

                    <select
                      className="form-select"
                      style={{ maxWidth: 200, borderRadius: 'var(--radius-full)', backgroundColor: '#FFFFFF' }}
                      value={studentStatusFilter}
                      onChange={(e) => setStudentStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="active">Active Only</option>
                      <option value="banned">Suspended Only</option>
                    </select>

                    {(studentSearch || studentStatusFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setStudentSearch('');
                          setStudentStatusFilter('all');
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <X size={14} /> Clear Filters
                      </button>
                    )}
                  </div>

                  {/* Student Management Table */}
                  <div className="table-wrapper">
                    <table className="data-table" style={{ minWidth: '920px' }}>
                      <thead>
                        <tr>
                          <th className="col-student-name">Student</th>
                          <th className="col-student-email">College Email</th>
                          <th className="col-student-dept">Campus / Dept.</th>
                          <th className="col-student-joined">Joined Date</th>
                          <th className="col-student-status">Status</th>
                          <th className="col-student-actions">Moderation Action</th>
                        </tr>
                      </thead>
                      <tbody id="studentsTableBody">
                        {loadingStudents ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }} className="text-muted">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Loader2 size={18} className="spin" />
                                <span>Loading students roster...</span>
                              </span>
                            </td>
                          </tr>
                        ) : filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                                <SearchX size={36} style={{ opacity: 0.4 }} />
                                <span>
                                  {studentSearch || studentStatusFilter !== 'all'
                                    ? 'No students matched your search or active filters.'
                                    : 'No students registered on the platform yet.'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((student) => (
                            <tr key={student._id}>
                              {/* 1. Student Name & Monospace ID */}
                              <td className="col-student-name">
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                                  {student.name}
                                </div>
                                <div
                                  className="text-xs text-muted"
                                  style={{ fontFamily: 'monospace', letterSpacing: '0.02em', fontSize: '0.72rem' }}
                                >
                                  ID: {student._id}
                                </div>
                              </td>

                              {/* 2. College Email */}
                              <td className="col-student-email">
                                <div style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                  {student.email}
                                </div>
                              </td>

                              {/* 3. Campus / Department */}
                              <td className="col-student-dept">
                                <div style={{ whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>
                                  {student.college || '—'} / {student.department || '—'}
                                </div>
                              </td>

                              {/* 4. Joined Date */}
                              <td className="col-student-joined">
                                {new Date(student.createdAt).toLocaleDateString()}
                              </td>

                              {/* 5. Status Badge */}
                              <td className="col-student-status">
                                <span
                                  className={`badge ${student.isBanned ? 'badge-banned' : 'badge-active'}`}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                                >
                                  {student.isBanned ? <Ban size={12} /> : <CheckCircle size={12} />}
                                  {student.isBanned ? 'Suspended' : 'Active'}
                                </span>
                              </td>

                              {/* 6. Moderation Action */}
                              <td className="col-student-actions">
                                <button
                                  type="button"
                                  onClick={() => setStudentToModify(student)}
                                  className={`btn ${student.isBanned ? 'btn-success' : 'btn-danger'} btn-sm`}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                                >
                                  {student.isBanned ? <CheckCircle size={14} /> : <Ban size={14} />}
                                  <span>{student.isBanned ? 'Restore Access' : 'Suspend Account'}</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 3. SKILLS MODERATION SECTION                              */}
              {/* ========================================================= */}
              {activeSection === 'skills' && (
                <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Skills Catalog Moderation
                      </h2>
                      <p className="text-xs text-secondary">
                        Review, moderate, and remove inappropriate or violating skill listings across campus
                      </p>
                    </div>

                    <span className="badge badge-category" style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}>
                      {filteredSkills.length} skill{filteredSkills.length !== 1 ? 's' : ''} listed
                    </span>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="filter-bar">
                    <div className="search-box">
                      <span className="search-icon">
                        <Search size={18} />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by skill title, category, or creator name..."
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                      />
                    </div>

                    <select
                      className="form-select"
                      style={{ maxWidth: 180, borderRadius: 'var(--radius-full)', backgroundColor: '#FFFFFF' }}
                      value={skillTypeFilter}
                      onChange={(e) => setSkillTypeFilter(e.target.value)}
                    >
                      <option value="all">All Types</option>
                      <option value="Teaching">Teaching Only</option>
                      <option value="Learning">Learning Only</option>
                    </select>

                    <select
                      className="form-select"
                      style={{ maxWidth: 200, borderRadius: 'var(--radius-full)', backgroundColor: '#FFFFFF' }}
                      value={skillCategoryFilter}
                      onChange={(e) => setSkillCategoryFilter(e.target.value)}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === 'All' ? 'All Categories' : cat}
                        </option>
                      ))}
                    </select>

                    {(skillSearch || skillTypeFilter !== 'all' || skillCategoryFilter !== 'All') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSkillSearch('');
                          setSkillTypeFilter('all');
                          setSkillCategoryFilter('All');
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <X size={14} /> Clear Filters
                      </button>
                    )}
                  </div>

                  {/* Skills Table */}
                  <div className="table-wrapper">
                    <table className="data-table" style={{ minWidth: '900px' }}>
                      <thead>
                        <tr>
                          <th className="col-skill-details">Skill Details</th>
                          <th className="col-skill-type">Type</th>
                          <th className="col-skill-creator">Creator Student</th>
                          <th className="col-skill-date">Listed Date</th>
                          <th className="col-skill-actions">Action</th>
                        </tr>
                      </thead>
                      <tbody id="skillsTableBody">
                        {loadingSkills ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }} className="text-muted">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Loader2 size={18} className="spin" />
                                <span>Loading skills catalog...</span>
                              </span>
                            </td>
                          </tr>
                        ) : filteredSkills.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                                <SearchX size={36} style={{ opacity: 0.4 }} />
                                <span>
                                  {skillSearch || skillTypeFilter !== 'all' || skillCategoryFilter !== 'All'
                                    ? 'No skills matched your search or active filters.'
                                    : 'No skills have been published to the catalog yet.'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredSkills.map((skill) => (
                            <tr key={skill._id}>
                              {/* 1. Skill Details */}
                              <td className="col-skill-details">
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                                  {skill.title}
                                </div>
                                <div className="text-xs text-muted">
                                  {skill.category || '—'} • Level: {skill.level || '—'}
                                </div>
                              </td>

                              {/* 2. Type */}
                              <td className="col-skill-type">
                                <span
                                  className={`badge ${skill.type === 'Teaching' ? 'badge-teaching' : 'badge-learning'}`}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                                >
                                  {skill.type === 'Teaching' ? <GraduationCap size={14} /> : <Target size={14} />}
                                  {skill.type}
                                </span>
                              </td>

                              {/* 3. Creator Student */}
                              <td className="col-skill-creator">
                                <div style={{ fontWeight: 600 }}>{skill.user?.name || 'Unknown User'}</div>
                                <div className="text-xs text-muted" style={{ wordBreak: 'break-word' }}>
                                  {skill.user?.email || '—'}
                                </div>
                                {skill.user?.isBanned && (
                                  <div
                                    className="text-xs"
                                    style={{ color: '#B91C1C', marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                                  >
                                    <Ban size={10} /> Account Suspended
                                  </div>
                                )}
                              </td>

                              {/* 4. Listed Date */}
                              <td className="col-skill-date">
                                {new Date(skill.createdAt).toLocaleDateString()}
                              </td>

                              {/* 5. Moderation Action */}
                              <td className="col-skill-actions">
                                <button
                                  type="button"
                                  onClick={() => setSkillToDelete(skill)}
                                  className="btn btn-danger btn-sm"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                                  title="Remove listing from platform"
                                >
                                  <Trash2 size={14} />
                                  <span>Remove</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* 4. REQUESTS AUDIT SECTION                                 */}
              {/* ========================================================= */}
              {activeSection === 'requests' && (
                <div className="card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Platform Requests Audit Trail
                      </h2>
                      <p className="text-xs text-secondary">
                        Comprehensive log of all student exchange requests, responses, and connection agreements
                      </p>
                    </div>

                    <span className="badge badge-category" style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}>
                      {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} recorded
                    </span>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="filter-bar">
                    <div className="search-box">
                      <span className="search-icon">
                        <Search size={18} />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by requester, recipient, or skill title..."
                        value={requestSearch}
                        onChange={(e) => setRequestSearch(e.target.value)}
                      />
                    </div>

                    <select
                      className="form-select"
                      style={{ maxWidth: 200, borderRadius: 'var(--radius-full)', backgroundColor: '#FFFFFF' }}
                      value={requestStatusFilter}
                      onChange={(e) => setRequestStatusFilter(e.target.value)}
                    >
                      <option value="all">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    {(requestSearch || requestStatusFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setRequestSearch('');
                          setRequestStatusFilter('all');
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <X size={14} /> Clear Filters
                      </button>
                    )}
                  </div>

                  {/* Requests Audit Table */}
                  <div className="table-wrapper">
                    <table className="data-table" style={{ minWidth: '900px' }}>
                      <thead>
                        <tr>
                          <th className="col-req-requester">Requester</th>
                          <th className="col-req-recipient">Recipient</th>
                          <th className="col-req-skill">Target Skill</th>
                          <th className="col-req-status">Status</th>
                          <th className="col-req-date">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody id="requestsTableBody">
                        {loadingRequests ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }} className="text-muted">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Loader2 size={18} className="spin" />
                                <span>Loading audit trail...</span>
                              </span>
                            </td>
                          </tr>
                        ) : filteredRequests.length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: 'var(--text-muted)' }}>
                                <SearchX size={36} style={{ opacity: 0.4 }} />
                                <span>
                                  {requestSearch || requestStatusFilter !== 'all'
                                    ? 'No requests matched your active filters or search terms.'
                                    : 'No skill exchange requests recorded yet.'}
                                </span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredRequests.map((req) => (
                            <tr key={req._id}>
                              {/* 1. Requester */}
                              <td className="col-req-requester">
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {req.requester?.name || 'Unknown Student'}
                                </div>
                                <div className="text-xs text-muted" style={{ wordBreak: 'break-word' }}>
                                  {req.requester?.email || '—'}
                                </div>
                              </td>

                              {/* 2. Recipient */}
                              <td className="col-req-recipient">
                                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                                  {req.recipient?.name || 'Unknown Student'}
                                </div>
                                <div className="text-xs text-muted" style={{ wordBreak: 'break-word' }}>
                                  {req.recipient?.email || '—'}
                                </div>
                              </td>

                              {/* 3. Target Skill */}
                              <td className="col-req-skill">
                                <div style={{ fontWeight: 600 }}>{req.skill?.title || 'Deleted Skill'}</div>
                                {req.skill?.category && (
                                  <div className="text-xs text-muted">
                                    {req.skill.category} {req.skill.type ? `• ${req.skill.type}` : ''}
                                  </div>
                                )}
                              </td>

                              {/* 4. Status Badge */}
                              <td className="col-req-status">
                                <span className={`badge badge-${(req.status || 'pending').toLowerCase()}`}>
                                  {req.status}
                                </span>
                              </td>

                              {/* 5. Timestamp */}
                              <td className="col-req-date">
                                {new Date(req.createdAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. CONFIRMATION MODALS                                    */}
      {/* ========================================================= */}

      {/* Student Suspend / Restore Confirmation Modal */}
      <Modal
        isOpen={Boolean(studentToModify)}
        onClose={() => !processingStudent && setStudentToModify(null)}
        title={studentToModify?.isBanned ? 'Restore Student Access' : 'Suspend Student Account'}
      >
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: studentToModify?.isBanned ? '#DCFCE7' : '#FEE2E2',
                color: studentToModify?.isBanned ? '#15803D' : '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {studentToModify?.isBanned ? <CheckCircle size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                {studentToModify?.name}
              </div>
              <div className="text-xs text-muted">
                {studentToModify?.email} • {studentToModify?.college || 'Student'}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            {studentToModify?.isBanned
              ? 'Are you sure you want to restore platform access for this student? They will immediately be able to log back in, manage their listings, and request skills.'
              : 'Are you sure you want to suspend access for this student? This will immediately revoke their ability to log in and automatically cancel all active (Pending and Accepted) exchange requests to protect student privacy.'}
          </p>

          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <strong>Student MongoDB ID:</strong>{' '}
            <span style={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}>{studentToModify?._id}</span>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setStudentToModify(null)}
            disabled={processingStudent}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${studentToModify?.isBanned ? 'btn-success' : 'btn-danger'} btn-sm`}
            onClick={confirmToggleStudentBan}
            disabled={processingStudent}
          >
            {processingStudent ? (
              <>
                <Loader2 size={14} className="spin" />
                <span>Processing...</span>
              </>
            ) : studentToModify?.isBanned ? (
              <>
                <CheckCircle size={14} />
                <span>Restore Access</span>
              </>
            ) : (
              <>
                <Ban size={14} />
                <span>Suspend Account</span>
              </>
            )}
          </button>
        </div>
      </Modal>

      {/* Skill Deletion Confirmation Modal */}
      <Modal
        isOpen={Boolean(skillToDelete)}
        onClose={() => !deletingSkill && setSkillToDelete(null)}
        title="Remove Skill Listing"
      >
        <div className="modal-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#FEE2E2',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Trash2 size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                {skillToDelete?.title}
              </div>
              <div className="text-xs text-muted">
                {skillToDelete?.category} • Posted by {skillToDelete?.user?.name || 'Fellow Student'}
              </div>
            </div>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
            Are you sure you want to permanently remove this skill listing? Any active exchange requests (Pending or Accepted) associated with this listing will be immediately cancelled. This action cannot be undone.
          </p>

          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '0.85rem 1.15rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <strong>Skill ID:</strong>{' '}
            <span style={{ fontFamily: 'monospace', letterSpacing: '0.02em' }}>{skillToDelete?._id}</span>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setSkillToDelete(null)}
            disabled={deletingSkill}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={confirmDeleteSkill}
            disabled={deletingSkill}
          >
            {deletingSkill ? (
              <>
                <Loader2 size={14} className="spin" />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Remove Listing</span>
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  GraduationCap,
  Target,
  Clock,
  CheckCircle,
  Users,
  ArrowRight,
  Lock,
  Loader2,
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

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const ExplorePage = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [category, setCategory] = useState('All');
  const [level, setLevel] = useState('All');
  const [search, setSearch] = useState('');
  const [resultsCount, setResultsCount] = useState(0);

  // Request status map and confirmed connected peers
  const [requestStatusBySkill, setRequestStatusBySkill] = useState({});
  const [connectedPeerIds, setConnectedPeerIds] = useState(new Set());
  const [statusesLoaded, setStatusesLoaded] = useState(false);

  // Request modal
  const [modalOpen, setModalOpen] = useState(false);
  const [targetSkill, setTargetSkill] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [sendingRequest, setSendingRequest] = useState(false);

  const searchTimerRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadMyRequestStatuses();
    } else {
      setStatusesLoaded(true);
    }
  }, [user]);

  const loadMyRequestStatuses = async () => {
    try {
      const [requestsRes, connectionsRes] = await Promise.all([
        API.get('/api/requests/my').catch(() => ({ incoming: [], outgoing: [] })),
        API.get('/api/requests/connections').catch(() => ({ connections: [] })),
      ]);

      const statusMap = {};
      const peerSet = new Set();
      const priority = { Accepted: 3, Pending: 2, Rejected: 1, Cancelled: 1 };

      (connectionsRes.connections || []).forEach((conn) => {
        if (conn.peer?.id) peerSet.add(conn.peer.id.toString());
      });

      (requestsRes.outgoing || []).forEach((req) => {
        const skillId =
          req.skill?._id?.toString() || (typeof req.skill === 'string' ? req.skill : null);
        if (!skillId) return;

        const existing = statusMap[skillId];
        if (!existing || (priority[req.status] || 0) > (priority[existing] || 0)) {
          statusMap[skillId] = req.status;
        }

        if (req.status === 'Accepted' && req.recipient) {
          const rid = req.recipient._id?.toString() || req.recipient.toString();
          peerSet.add(rid);
        }
      });

      (requestsRes.incoming || []).forEach((req) => {
        const skillId =
          req.skill?._id?.toString() || (typeof req.skill === 'string' ? req.skill : null);
        if (req.status === 'Accepted') {
          if (skillId) statusMap[skillId] = 'Accepted';
          if (req.requester) {
            const rid = req.requester._id?.toString() || req.requester.toString();
            peerSet.add(rid);
          }
        }
      });

      setRequestStatusBySkill(statusMap);
      setConnectedPeerIds(peerSet);
    } catch (err) {
      console.error('Unable to load request statuses:', err);
    } finally {
      setStatusesLoaded(true);
    }
  };

  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (category !== 'All') params.append('category', category);
      if (level !== 'All') params.append('level', level);
      if (filterType !== 'All') params.append('type', filterType);

      const res = await API.get(`/api/skills/explore?${params.toString()}`);
      setSkills(res.skills || []);
      setResultsCount(res.count !== undefined ? res.count : (res.skills || []).length);
    } catch (err) {
      showToast('error', 'Error fetching skills.');
    } finally {
      setLoading(false);
    }
  }, [search, category, level, filterType]);

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(loadSkills, 350);
    return () => clearTimeout(searchTimerRef.current);
  }, [loadSkills]);

  const openRequestModal = (skill) => {
    if (!user) {
      showToast('info', 'Please log in to send skill requests.');
      return;
    }

    const skillOwnerId =
      skill.user?._id?.toString() || (typeof skill.user === 'string' ? skill.user : null);
    if (skillOwnerId && connectedPeerIds.has(skillOwnerId)) {
      showToast(
        'info',
        'You are already connected with this peer! You can reach out directly via their details in Connections.'
      );
    }

    setTargetSkill(skill);
    setRequestMessage('');
    setModalOpen(true);
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!targetSkill) return;

    const existingStatus = requestStatusBySkill[targetSkill._id];
    if (existingStatus === 'Pending' || existingStatus === 'Accepted') {
      showToast('info', 'You have already requested this skill.');
      setModalOpen(false);
      return;
    }

    setSendingRequest(true);
    try {
      await API.post('/api/requests', {
        skillId: targetSkill._id,
        message: requestMessage.trim(),
      });

      showToast('success', 'Skill request sent successfully! You will be notified when accepted.');
      setModalOpen(false);
      setRequestStatusBySkill((prev) => ({ ...prev, [targetSkill._id]: 'Pending' }));
    } catch (err) {
      showToast('error', err.message || 'Failed to send request.');
    } finally {
      setSendingRequest(false);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('All');
    setLevel('All');
    setFilterType('All');
  };

  const currentUserId = user?.id || user?._id;

  const renderActionButton = (skill) => {
    const skillOwnerId =
      skill.user?._id?.toString() || (typeof skill.user === 'string' ? skill.user : null);
    const isOwner = currentUserId && skillOwnerId && skillOwnerId === currentUserId.toString();
    const requestStatus = requestStatusBySkill[skill._id];
    const isPeerConnected = skillOwnerId && connectedPeerIds.has(skillOwnerId);

    if (isOwner) {
      return <span className="badge badge-category explore-owner-badge">Your Listing</span>;
    }
    if (!user) {
      return (
        <button onClick={() => openRequestModal(skill)} className="btn btn-primary btn-sm explore-connect-btn">
          Connect <ArrowRight size={14} />
        </button>
      );
    }
    if (!statusesLoaded) {
      return (
        <button className="btn btn-secondary btn-sm explore-connect-btn" disabled>
          Loading...
        </button>
      );
    }
    if (requestStatus === 'Pending') {
      return (
        <button className="btn btn-secondary btn-sm explore-connect-btn" disabled>
          <Clock size={14} /> Request Sent
        </button>
      );
    }
    if (requestStatus === 'Accepted') {
      return (
        <Link
          to="/connections"
          className="btn btn-secondary btn-sm explore-connect-btn"
          title="View unlocked contact details in Connections"
        >
          <CheckCircle size={14} /> Connected
        </Link>
      );
    }
    if (isPeerConnected) {
      return (
        <Link
          to="/connections"
          className="btn btn-secondary btn-sm explore-connect-btn"
          title="You are already connected with this student! View contact info in Connections."
        >
          <Users size={14} /> Connected Peer
        </Link>
      );
    }
    return (
      <button onClick={() => openRequestModal(skill)} className="btn btn-primary btn-sm explore-connect-btn">
        Connect <ArrowRight size={14} />
      </button>
    );
  };

  return (
    <div className="page-content">
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 className="page-title">Explore Peer Skills</h1>
          <p className="page-subtitle">Discover fellow students sharing their knowledge or seeking mentors</p>
        </div>

        <span
          id="resultsCount"
          className="badge badge-category"
          style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
        >
          {resultsCount} skill{resultsCount !== 1 ? 's' : ''} found
        </span>
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <span className="search-icon">
            <Search size={18} />
          </span>
          <input
            type="text"
            id="searchInput"
            className="form-control"
            placeholder="Search by skill title, concept, topic, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          id="categoryFilter"
          className="form-select"
          style={{ maxWidth: 220, borderRadius: 'var(--radius-full)', backgroundColor: '#FFFFFF' }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All Categories' : c}
            </option>
          ))}
        </select>

        <select
          id="levelFilter"
          className="form-select"
          style={{ maxWidth: 180, borderRadius: 'var(--radius-full)', backgroundColor: '#FFFFFF' }}
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l === 'All' ? 'All Levels' : l}
            </option>
          ))}
        </select>
      </div>

      {/* Type Filter Tabs */}
      <div className="tabs-bar">
        <button
          id="filterTab-All"
          className={`tab-btn ${filterType === 'All' ? 'active' : ''}`}
          onClick={() => setFilterType('All')}
        >
          All Listings
        </button>

        <button
          id="filterTab-Teaching"
          className={`tab-btn ${filterType === 'Teaching' ? 'active' : ''}`}
          onClick={() => setFilterType('Teaching')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <GraduationCap size={16} />
          <span>Available to Learn (Peers Teaching)</span>
        </button>

        <button
          id="filterTab-Learning"
          className={`tab-btn ${filterType === 'Learning' ? 'active' : ''}`}
          onClick={() => setFilterType('Learning')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <Target size={16} />
          <span>Mentoring Opportunities (Peers Wanting to Learn)</span>
        </button>
      </div>

      {/* Explore Skills Grid */}
      <div className="grid grid-3" id="exploreSkillsGrid">
        {loading ? (
          <p className="text-muted" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
            Searching skill catalog...
          </p>
        ) : skills.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state-icon">
              <Search size={32} />
            </div>
            <div className="empty-state-title">No matching skills found</div>
            <div className="empty-state-desc">Try adjusting your keywords or clearing your active filters.</div>
            <button onClick={resetFilters} className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
              Clear All Filters
            </button>
          </div>
        ) : (
          skills.map((skill) => {
            const studentName = skill.user?.name || 'Fellow Student';
            const studentCollege = skill.user?.college || skill.user?.department || 'Campus Peer';
            const studentInitials = studentName.charAt(0).toUpperCase();
            const typeLabel = skill.type === 'Teaching' ? 'Teaching' : 'Wants to Learn';

            return (
              <div key={skill._id} className="card skill-card explore-skill-card">
                <div className="explore-card-content">
                  <div className="explore-card-badges">
                    <span
                      className={`badge ${skill.type === 'Teaching' ? 'badge-teaching' : 'badge-learning'}`}
                    >
                      {skill.type === 'Teaching' ? <GraduationCap size={14} /> : <Target size={14} />}
                      {typeLabel}
                    </span>
                    <span className="badge badge-category explore-category-badge">{skill.category}</span>
                  </div>

                  <h4 className="skill-card-title explore-skill-title">{skill.title}</h4>
                  <p className="skill-card-desc explore-skill-description">
                    {skill.description || 'No description provided.'}
                  </p>

                  <div className="explore-level-row">
                    <span className="explore-level-label">Level</span>
                    <span className="explore-level-value">{skill.level}</span>
                  </div>
                </div>

                <div className="explore-card-footer">
                  <div className="explore-student-info">
                    <div className="student-tag-avatar">{studentInitials}</div>
                    <div className="explore-student-details">
                      <div className="explore-student-name">{studentName}</div>
                      <div className="explore-student-college">{studentCollege}</div>
                    </div>
                  </div>
                  {renderActionButton(skill)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Send Request Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Send Skill Request">
        <form onSubmit={handleSendRequest} id="sendRequestForm">
          <div className="modal-body">
            {targetSkill && (
              <div
                style={{
                  background: 'var(--bg-surface-elevated)',
                  padding: '1.15rem',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '1.35rem',
                }}
              >
                <div
                  className="text-xs text-muted"
                  style={{ textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}
                >
                  Target Skill
                </div>
                <div
                  id="modalSkillTitle"
                  style={{
                    fontWeight: 800,
                    fontSize: '1.15rem',
                    color: 'var(--text-primary)',
                    margin: '0.35rem 0',
                  }}
                >
                  {targetSkill.title}
                </div>
                <div className="text-sm text-secondary">
                  Offered by:{' '}
                  <strong id="modalStudentName" style={{ color: 'var(--text-primary)' }}>
                    {targetSkill.user?.name || 'Fellow Student'}
                  </strong>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="requestMessage">
                Personal Learning Note / Introduction (Optional)
              </label>
              <textarea
                id="requestMessage"
                className="form-textarea"
                placeholder="Introduce yourself and explain what specific topics or schedule you'd like to collaborate on..."
                rows={3}
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
              />
            </div>

            <div
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.45rem',
              }}
            >
              <Lock size={15} style={{ flexShrink: 0, marginTop: 2, color: 'var(--accent-purple)' }} />
              <div>
                <strong>Privacy Note:</strong> Direct contact details (email, WhatsApp, phone) will automatically unlock
                once this student accepts your request.
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={sendingRequest}>
              {sendingRequest ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Send Request</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ExplorePage;

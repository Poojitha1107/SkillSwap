import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Inbox, Send, Users, Plus, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useNotifications } from '../context/NotificationContext';
import API from '../services/api';

const RequestsPage = () => {
  const { showToast } = useToast();
  const { refreshNotifications } = useNotifications();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam && tabParam.toLowerCase() === 'outgoing' ? 'outgoing' : 'incoming';
  });
  const [requestsData, setRequestsData] = useState({ incoming: [], outgoing: [], counts: {} });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      const lower = tabParam.toLowerCase();
      if (lower === 'incoming' || lower === 'outgoing') {
        setActiveTab(lower);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/requests/my');
      setRequestsData(res);
    } catch (err) {
      showToast('error', 'Error loading requests.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId, status) => {
    if (updatingId) return;
    setUpdatingId(requestId);
    try {
      await API.put(`/api/requests/${requestId}/status`, { status });
      if (status === 'Accepted') {
        showToast(
          'success',
          'Request accepted! You and this student are now connected. Contact details unlocked in Connections.'
        );
      } else if (status === 'Cancelled') {
        showToast('info', 'Request cancelled.');
      } else {
        showToast('info', `Request marked as ${status}.`);
      }
      await loadRequests();
      refreshNotifications();
    } catch (err) {
      showToast('error', err.message || 'Failed to update request.');
    } finally {
      setUpdatingId(null);
    }
  };

  const list = activeTab === 'incoming' ? requestsData.incoming : requestsData.outgoing;
  const incomingPendingCount = requestsData.counts?.incomingPending || 0;
  const outgoingPendingCount = requestsData.counts?.outgoingPending || 0;

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
          <h1 className="page-title">Skill Requests Hub</h1>
          <p className="page-subtitle">
            Manage peer invitations to teach and monitor your outgoing learning requests
          </p>
        </div>

        <Link
          to="/explore"
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} />
          <span>Find More Skills</span>
        </Link>
      </div>

      {/* Request Tabs */}
      <div className="tabs-bar">
        <button
          id="tabBtn-incoming"
          className={`tab-btn ${activeTab === 'incoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('incoming')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <Inbox size={16} />
          <span>Incoming Requests (<span id="incomingCount">{incomingPendingCount}</span>)</span>
        </button>

        <button
          id="tabBtn-outgoing"
          className={`tab-btn ${activeTab === 'outgoing' ? 'active' : ''}`}
          onClick={() => setActiveTab('outgoing')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <Send size={16} />
          <span>Outgoing Requests (<span id="outgoingCount">{outgoingPendingCount}</span>)</span>
        </button>
      </div>

      {/* Requests List */}
      <div id="requestsContainer">
        {loading ? (
          <p className="text-muted" style={{ textAlign: 'center', padding: '3rem' }}>
            Loading your requests...
          </p>
        ) : !list || list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              {activeTab === 'incoming' ? <Inbox size={32} /> : <Send size={32} />}
            </div>
            <div className="empty-state-title">No {activeTab} requests</div>
            <div className="empty-state-desc">
              {activeTab === 'incoming'
                ? 'When another student requests to learn from you, you will see it here.'
                : 'Browse skills on the Explore page and send requests to students whose skills you want to learn.'}
            </div>
            {activeTab === 'outgoing' && (
              <Link to="/explore" className="btn btn-primary btn-sm" style={{ marginTop: '0.5rem' }}>
                Explore Skills
              </Link>
            )}
          </div>
        ) : (
          list.map((req) => {
            const isIncoming = activeTab === 'incoming';
            const peer = isIncoming ? req.requester : req.recipient;
            const peerName = peer?.name || 'Student';
            const statusClass = `badge-${req.status.toLowerCase()}`;
            const isProcessing = updatingId === req._id;

            return (
              <div key={req._id} className="request-card">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="request-meta">
                    <div
                      className="user-avatar"
                      style={{
                        width: 44,
                        height: 44,
                        fontSize: '1.1rem',
                        background: 'var(--sidebar-bg)',
                        color: 'var(--accent-lime)',
                        flexShrink: 0,
                      }}
                    >
                      {peerName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.65rem',
                          marginBottom: '0.25rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                          {peerName}
                        </span>
                        <span className={`badge ${statusClass}`}>{req.status}</span>
                      </div>
                      <div className="text-sm text-secondary">
                        {isIncoming ? 'Requested to learn:' : 'You requested to learn:'}{' '}
                        {req.skill?.title ? (
                          <strong style={{ color: 'var(--text-primary)' }}>{req.skill.title}</strong>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            [Listing Removed]
                          </span>
                        )}
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                          • {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {req.message && (
                    <div className="request-message">
                      <strong>Message:</strong> "{req.message}"
                    </div>
                  )}
                </div>

                <div className="request-actions">
                  {isIncoming && req.status === 'Pending' && (
                    req.skill && peer && !peer.isBanned ? (
                      <>
                        <button
                          onClick={() => updateStatus(req._id, 'Accepted')}
                          className="btn btn-primary btn-sm"
                          disabled={isProcessing}
                        >
                          {isProcessing ? <Loader2 size={14} className="spin" /> : 'Accept Request'}
                        </button>
                        <button
                          onClick={() => updateStatus(req._id, 'Rejected')}
                          className="btn btn-outline btn-sm"
                          disabled={isProcessing}
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-muted" style={{ fontStyle: 'italic', marginRight: '0.5rem' }}>
                          {!req.skill ? 'Listing removed' : 'Account suspended'}
                        </span>
                        <button
                          onClick={() => updateStatus(req._id, 'Rejected')}
                          className="btn btn-outline btn-sm"
                          disabled={isProcessing}
                        >
                          Dismiss
                        </button>
                      </>
                    )
                  )}

                  {!isIncoming && req.status === 'Pending' && (
                    <button
                      onClick={() => updateStatus(req._id, 'Cancelled')}
                      className="btn btn-outline btn-sm"
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 size={14} className="spin" /> : 'Cancel Request'}
                    </button>
                  )}

                  {req.status === 'Accepted' && req.skill && peer && !peer.isBanned && (
                    <Link
                      to="/connections"
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Users size={14} />
                      <span>View in Connections</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RequestsPage;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, CheckCircle, Lock, UserMinus, Loader2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import API from '../services/api';
import Modal from '../components/Modal';

const ConnectionsPage = () => {
  const { showToast } = useToast();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Disconnect modal state
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [peerToDisconnect, setPeerToDisconnect] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/requests/connections');
      setConnections(res.connections || []);
    } catch (err) {
      showToast('error', 'Error fetching connections.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDisconnectModal = (peer) => {
    setPeerToDisconnect(peer);
    setDisconnectModalOpen(true);
  };

  const handleConfirmDisconnect = async () => {
    if (!peerToDisconnect) return;
    const peerId = peerToDisconnect.id || peerToDisconnect._id;
    setDisconnecting(true);
    try {
      await API.delete(`/api/requests/connections/${peerId}`);
      showToast('success', `Disconnected from ${peerToDisconnect.name || 'student'}.`);
      setDisconnectModalOpen(false);
      setPeerToDisconnect(null);
      await loadConnections();
    } catch (err) {
      showToast('error', err.message || 'Failed to disconnect connection.');
    } finally {
      setDisconnecting(false);
    }
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
          <h1 className="page-title">My Learning Network</h1>
          <p className="page-subtitle">
            Connect, collaborate and learn with your accepted skill exchange partners.
          </p>
        </div>

        <span
          id="connectionsTotal"
          className="badge badge-accepted"
          style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
        >
          {connections.length} active connection{connections.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Connections Grid */}
      <div className="grid grid-2" id="connectionsGrid" style={{ gap: '1.75rem' }}>
        {loading ? (
          <p className="text-muted" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
            Loading your learning network...
          </p>
        ) : connections.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state-icon">
              <Users style={{ width: 32, height: 32 }} />
            </div>
            <div className="empty-state-title">No connections yet</div>
            <div className="empty-state-desc">
              Connections are formed when you accept a skill request or when another student accepts yours. Once connected, your contact details are revealed here so you can collaborate!
            </div>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/explore" className="btn btn-primary btn-sm">Explore Skills</Link>
              <Link to="/requests" className="btn btn-outline btn-sm">Check Requests Hub</Link>
            </div>
          </div>
        ) : (
          connections.map((conn, idx) => {
            const peer = conn.peer || {};
            const initials = peer.name ? peer.name.charAt(0).toUpperCase() : 'S';
            const contact = peer.contactInfo || {};
            const hasAnyDirectContact = contact.phone || contact.whatsapp || contact.linkedin || contact.github;

            return (
              <div key={conn._id || conn.id || peer._id || peer.id || idx} className="card connection-card">
                <div className="connection-header">
                  <div className="connection-avatar">{initials}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                      {peer.name}
                    </h3>
                    <div className="text-sm text-secondary">
                      {peer.department || 'Student'} • {peer.college || 'Campus'}
                    </div>
                  </div>
                  <span className="badge badge-accepted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <CheckCircle style={{ width: 14, height: 14 }} /> Connected
                  </span>
                </div>

                {peer.bio && (
                  <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {peer.bio}
                  </p>
                )}

                {/* Connected Skills */}
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '0.85rem 1.15rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--accent-purple)' }}>Connected For:</span>
                  <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {(conn.connectedSkills || []).map((s, sIdx) => (
                      <div key={sIdx}>
                        • <strong>{s.title}</strong> ({s.category}) — <em style={{ color: 'var(--text-muted)' }}>{s.role}</em>
                      </div>
                    ))}
                  </div>
                </div>

                {/* UNLOCKED CONTACT DETAILS */}
                <div className="contact-box">
                  <div style={{ fontSize: '0.775rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--status-emerald-text)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Lock style={{ width: 14, height: 14 }} /> Unlocked Direct Contact Information
                  </div>

                  <div className="contact-row">
                    <span className="contact-label">Email:</span>
                    <a href={`mailto:${peer.email}`} className="contact-value" style={{ color: 'var(--accent-purple)', textDecoration: 'underline' }}>
                      {peer.email || 'Not provided'}
                    </a>
                  </div>

                  {contact.phone && (
                    <div className="contact-row">
                      <span className="contact-label">Phone:</span>
                      <a href={`tel:${contact.phone}`} className="contact-value">
                        {contact.phone}
                      </a>
                    </div>
                  )}

                  {contact.whatsapp && (
                    <div className="contact-row">
                      <span className="contact-label">WhatsApp:</span>
                      <a
                        href={`https://wa.me/${encodeURIComponent(contact.whatsapp.replace(/[^0-9]/g, ''))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-value"
                        style={{ color: '#15803D' }}
                      >
                        Chat on WhatsApp ↗
                      </a>
                    </div>
                  )}

                  {contact.linkedin && (
                    <div className="contact-row">
                      <span className="contact-label">LinkedIn:</span>
                      <a
                        href={contact.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-value"
                        style={{ color: '#0369A1' }}
                      >
                        LinkedIn Profile ↗
                      </a>
                    </div>
                  )}

                  {contact.github && (
                    <div className="contact-row">
                      <span className="contact-label">GitHub:</span>
                      <a
                        href={contact.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="contact-value"
                      >
                        GitHub Profile ↗
                      </a>
                    </div>
                  )}

                  {!hasAnyDirectContact && (
                    <div className="text-xs text-muted" style={{ marginTop: '0.4rem', fontStyle: 'italic' }}>
                      Additional phone and social channels have not been provided yet by this peer.
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '0.85rem',
                    paddingTop: '0.85rem',
                    borderTop: '1px solid var(--border-color, #E5E4F0)',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    Connected since {conn.connectedAt ? new Date(conn.connectedAt).toLocaleDateString() : 'Recently'}
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline btn-sm disconnect-btn"
                    onClick={() => handleOpenDisconnectModal(peer)}
                    style={{
                      color: 'var(--status-crimson-text, #DC2626)',
                      borderColor: 'rgba(239, 68, 68, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    <UserMinus size={14} />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Disconnect Confirmation Modal */}
      <Modal
        isOpen={disconnectModalOpen}
        onClose={() => {
          if (!disconnecting) setDisconnectModalOpen(false);
        }}
        title="Disconnect Connection"
      >
        <div className="modal-body">
          <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Are you sure you want to disconnect from <strong>{peerToDisconnect?.name}</strong>?
          </p>
          <p className="text-sm text-secondary" style={{ marginTop: '0.65rem', lineHeight: 1.5 }}>
            Both students will immediately lose access to direct contact information and this partner will be removed from your Learning Network.
          </p>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setDisconnectModalOpen(false)}
            disabled={disconnecting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            disabled={disconnecting}
            onClick={handleConfirmDisconnect}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {disconnecting ? (
              <>
                <Loader2 size={14} className="spin" />
                <span>Disconnecting...</span>
              </>
            ) : (
              <>
                <UserMinus size={14} />
                <span>Confirm Disconnect</span>
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ConnectionsPage;

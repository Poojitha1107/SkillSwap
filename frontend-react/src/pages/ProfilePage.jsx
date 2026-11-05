import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  RotateCcw,
  ShieldCheck,
  Lock,
  GraduationCap,
  Target,
  BookOpen,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API from '../services/api';

const normalizeUrl = (url) => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userSkills, setUserSkills] = useState([]);

  const [initialForm, setInitialForm] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    college: '',
    department: '',
    bio: '',
    contactInfo: {
      phone: '',
      altEmail: '',
      whatsapp: '',
      linkedin: '',
      github: '',
    },
  });

  useEffect(() => {
    loadProfileAndSkills();
  }, []);

  const loadProfileAndSkills = async () => {
    setLoading(true);
    try {
      const [profileRes, skillsRes] = await Promise.all([
        API.get('/api/users/profile/me'),
        API.get('/api/skills/my').catch(() => ({ skills: [] })),
      ]);

      const u = profileRes.user;
      const profileData = {
        name: u.name || '',
        email: u.email || '',
        college: u.college || '',
        department: u.department || '',
        bio: u.bio || '',
        contactInfo: {
          phone: u.contactInfo?.phone || '',
          altEmail: u.contactInfo?.altEmail || '',
          whatsapp: u.contactInfo?.whatsapp || '',
          linkedin: u.contactInfo?.linkedin || '',
          github: u.contactInfo?.github || '',
        },
      };

      setForm(profileData);
      setInitialForm(profileData);
      setUserSkills(skillsRes.skills || []);
    } catch (err) {
      showToast('error', 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in form.contactInfo) {
      setForm((prev) => ({
        ...prev,
        contactInfo: { ...prev.contactInfo, [name]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleReset = () => {
    if (initialForm) {
      setForm(initialForm);
      showToast('info', 'Form reset to saved profile data.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      showToast('error', 'Full Name is required and cannot be blank.');
      return;
    }
    if (form.bio.length > 300) {
      showToast('error', 'Bio cannot exceed 300 characters.');
      return;
    }
    if (form.contactInfo.altEmail && !/^\S+@\S+\.\S+$/.test(form.contactInfo.altEmail.trim())) {
      showToast('error', 'Please enter a valid alternative email address.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: trimmedName,
        college: form.college.trim(),
        department: form.department.trim(),
        bio: form.bio.trim(),
        contactInfo: {
          phone: form.contactInfo.phone.trim(),
          altEmail: form.contactInfo.altEmail.trim(),
          whatsapp: form.contactInfo.whatsapp.trim(),
          linkedin: normalizeUrl(form.contactInfo.linkedin),
          github: normalizeUrl(form.contactInfo.github),
        },
      };

      const res = await API.put('/api/users/profile/me', payload);
      showToast('success', 'Profile and privacy settings saved successfully!');

      const updatedData = {
        name: res.user.name || '',
        email: res.user.email || form.email,
        college: res.user.college || '',
        department: res.user.department || '',
        bio: res.user.bio || '',
        contactInfo: {
          phone: res.user.contactInfo?.phone || '',
          altEmail: res.user.contactInfo?.altEmail || '',
          whatsapp: res.user.contactInfo?.whatsapp || '',
          linkedin: res.user.contactInfo?.linkedin || '',
          github: res.user.contactInfo?.github || '',
        },
      };

      setForm(updatedData);
      setInitialForm(updatedData);

      // Keep AuthContext user in sync
      updateUser({
        name: res.user.name,
        college: res.user.college,
        department: res.user.department,
      });
    } catch (err) {
      showToast('error', err.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = form.name ? form.name.charAt(0).toUpperCase() : 'U';
  const bioLen = form.bio ? form.bio.length : 0;
  const teachingSkills = userSkills.filter((s) => s.type === 'Teaching');
  const learningSkills = userSkills.filter((s) => s.type === 'Learning');

  if (loading) {
    return (
      <div className="page-content" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--accent-purple)', margin: '0 auto 1rem' }} />
        <p className="text-muted">Loading profile settings...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Page Title & Subtitle */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 className="page-title">Profile & Privacy Settings</h1>
        <p className="page-subtitle">
          Manage your student persona and configure contact details shared with connected peers
        </p>
      </div>

      {/* 1. Student Persona Header Card */}
      <div
        className="card"
        style={{
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
          padding: '1.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div
            className="user-avatar"
            id="profileAvatar"
            style={{
              width: 72,
              height: 72,
              fontSize: '2rem',
              background: 'var(--sidebar-bg)',
              color: 'var(--accent-lime)',
              boxShadow: 'var(--shadow-sm)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <h2
              id="profileHeaderName"
              style={{ fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '0.2rem', fontWeight: 800 }}
            >
              {form.name || 'Student'}
            </h2>
            <div id="profileHeaderEmail" className="text-secondary text-sm">
              {form.email}
            </div>
            {user?._id && (
              <div
                className="text-xs text-muted"
                style={{ fontFamily: 'monospace', letterSpacing: '0.02em', marginTop: '0.2rem' }}
              >
                ID: {user._id}
              </div>
            )}
            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={14} /> Verified Campus Peer
              </span>
              {form.college && <span className="badge badge-category">{form.college}</span>}
              {form.department && <span className="badge badge-category">{form.department}</span>}
            </div>
          </div>
        </div>

        {/* Privacy Architecture Summary Box */}
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            maxWidth: '380px',
          }}
        >
          <div
            style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              marginBottom: '0.35rem',
            }}
          >
            <Lock size={14} style={{ color: 'var(--accent-purple)' }} />
            Two-Tier Privacy Protection
          </div>
          <p className="text-xs text-secondary" style={{ margin: 0, lineHeight: 1.45 }}>
            Academic info is public in Explore. Direct phone, WhatsApp, and social channels remain strictly hidden until you accept a connection request.
          </p>
        </div>
      </div>

      {/* 2. Teaching & Learning Skills Display Section */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>My Listed Skills Showcase</h3>
            <p className="text-xs text-secondary" style={{ margin: '0.25rem 0 0' }}>
              Skills currently active in the campus exchange directory
            </p>
          </div>
          <Link to="/my-skills" className="btn btn-outline btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>Manage Skills</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-2" style={{ gap: '1.25rem' }}>
          {/* Teaching Skills */}
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              <GraduationCap size={16} style={{ color: '#52651C' }} />
              <span>Skills I Teach ({teachingSkills.length})</span>
            </div>
            {teachingSkills.length === 0 ? (
              <p className="text-xs text-muted" style={{ margin: 0 }}>No teaching skills listed yet. Add topics you can mentor peers in.</p>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {teachingSkills.map((s) => (
                  <span key={s._id} className="badge badge-teaching" style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}>
                    {s.title}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Learning Skills */}
          <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              <Target size={16} style={{ color: 'var(--accent-purple)' }} />
              <span>Skills I Want to Learn ({learningSkills.length})</span>
            </div>
            {learningSkills.length === 0 ? (
              <p className="text-xs text-muted" style={{ margin: 0 }}>No learning goals listed yet. Add skills you wish to learn.</p>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {learningSkills.map((s) => (
                  <span key={s._id} className="badge badge-learning" style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}>
                    {s.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Settings Form Card */}
      <div className="card" style={{ maxWidth: 860, padding: '2rem' }}>
        <form onSubmit={handleSubmit} id="profileForm">
          {/* Section A: Academic Persona */}
          <h3
            style={{
              fontSize: '1.25rem',
              marginBottom: '1.25rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 800,
            }}
          >
            <GraduationCap size={20} style={{ color: 'var(--accent-purple)' }} />
            Academic Persona (Public to Campus)
          </h3>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="profileName">
                Full Name *
              </label>
              <input
                type="text"
                id="profileName"
                name="name"
                className="form-control"
                maxLength={60}
                required
                placeholder="e.g. Maya Lin"
                value={form.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profileEmail">
                College Email (Primary Account)
              </label>
              <input
                type="email"
                id="profileEmail"
                name="email"
                className="form-control"
                disabled
                value={form.email}
                style={{ opacity: 0.65, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="profileCollege">
                College / Campus
              </label>
              <input
                type="text"
                id="profileCollege"
                name="college"
                className="form-control"
                maxLength={100}
                placeholder="e.g. Stanford University"
                value={form.college}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="profileDepartment">
                Major / Department
              </label>
              <input
                type="text"
                id="profileDepartment"
                name="department"
                className="form-control"
                maxLength={100}
                placeholder="e.g. Computer Science"
                value={form.department}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label" htmlFor="profileBio" style={{ marginBottom: 0 }}>
                Student Bio & Academic Focus
              </label>
              <span
                id="bioCharCount"
                className="text-xs"
                style={{
                  color: bioLen > 300 ? '#EF4444' : 'var(--text-muted)',
                  fontWeight: bioLen > 300 ? 700 : 400,
                }}
              >
                {bioLen}/300
              </span>
            </div>
            <textarea
              id="profileBio"
              name="bio"
              className="form-textarea"
              maxLength={300}
              placeholder="Share your academic background, passions, and exchange interests..."
              value={form.bio}
              onChange={handleChange}
              rows={3}
            />
          </div>

          {/* Section B: Private Contact Information */}
          <h3
            style={{
              fontSize: '1.25rem',
              marginTop: '2.25rem',
              marginBottom: '0.5rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 800,
            }}
          >
            <Lock size={20} style={{ color: 'var(--status-emerald-text)' }} />
            Private Contact Information
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            These contact channels are protected and hidden from explore cards. They will strictly unlock only for peers whose skill exchange request is <strong>Accepted</strong>.
          </p>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="contactPhone">
                Phone Number
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="phone"
                className="form-control"
                maxLength={25}
                placeholder="+1 (555) 019-2834"
                value={form.contactInfo.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contactWhatsapp">
                WhatsApp Contact
              </label>
              <input
                type="text"
                id="contactWhatsapp"
                name="whatsapp"
                className="form-control"
                maxLength={25}
                placeholder="e.g. +15550192834 (with country code)"
                value={form.contactInfo.whatsapp}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="contactAltEmail">
              Alternative Contact Email
            </label>
            <input
              type="email"
              id="contactAltEmail"
              name="altEmail"
              className="form-control"
              placeholder="personal.email@gmail.com"
              value={form.contactInfo.altEmail}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="contactLinkedin">
                LinkedIn Profile URL
              </label>
              <input
                type="text"
                id="contactLinkedin"
                name="linkedin"
                className="form-control"
                maxLength={200}
                placeholder="https://linkedin.com/in/username"
                value={form.contactInfo.linkedin}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contactGithub">
                GitHub Profile URL
              </label>
              <input
                type="text"
                id="contactGithub"
                name="github"
                className="form-control"
                maxLength={200}
                placeholder="https://github.com/username"
                value={form.contactInfo.github}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Action Buttons: Cancel/Reset & Save */}
          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '1rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              className="btn btn-outline btn-lg"
              onClick={handleReset}
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RotateCcw size={16} />
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              id="saveProfileBtn"
              className="btn btn-primary btn-lg"
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check size={18} />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;

import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Plus,
  Edit3,
  Trash2,
  GraduationCap,
  Target,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import API from '../services/api';
import Modal from '../components/Modal';

const CATEGORIES = [
  'Programming & Tech',
  'Design & Creative',
  'Academics & Science',
  'Languages',
  'Music & Arts',
  'Business & Career',
  'Other',
];

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const emptySkillForm = {
  title: '',
  type: 'Teaching',
  category: 'Programming & Tech',
  level: 'Intermediate',
  description: '',
};

const SkillFields = ({ formState, setFormState, idPrefix = '' }) => (
  <>
    <div className="form-group">
      <label className="form-label" htmlFor={`${idPrefix}skillTitle`}>
        Skill Title *
      </label>
      <input
        type="text"
        id={`${idPrefix}skillTitle`}
        className="form-control"
        placeholder="e.g. Modern Full-Stack Development with Node.js"
        required
        maxLength={80}
        value={formState.title}
        onChange={(e) => setFormState((p) => ({ ...p, title: e.target.value }))}
      />
    </div>

    <div className="grid grid-2">
      <div className="form-group">
        <label className="form-label" htmlFor={`${idPrefix}skillType`}>
          Listing Type *
        </label>
        <select
          id={`${idPrefix}skillType`}
          className="form-select"
          required
          value={formState.type}
          onChange={(e) => setFormState((p) => ({ ...p, type: e.target.value }))}
        >
          <option value="Teaching">Teaching (I can mentor peers)</option>
          <option value="Learning">Learning (I want to learn this)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor={`${idPrefix}skillLevel`}>
          Proficiency Level *
        </label>
        <select
          id={`${idPrefix}skillLevel`}
          className="form-select"
          required
          value={formState.level}
          onChange={(e) => setFormState((p) => ({ ...p, level: e.target.value }))}
        >
          {LEVELS.map((lvl) => (
            <option key={lvl} value={lvl}>
              {lvl}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="form-group">
      <label className="form-label" htmlFor={`${idPrefix}skillCategory`}>
        Category *
      </label>
      <select
        id={`${idPrefix}skillCategory`}
        className="form-select"
        required
        value={formState.category}
        onChange={(e) => setFormState((p) => ({ ...p, category: e.target.value }))}
      >
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>

    <div className="form-group">
      <label className="form-label" htmlFor={`${idPrefix}skillDescription`}>
        Description & Learning Scope *
      </label>
      <textarea
        id={`${idPrefix}skillDescription`}
        className="form-textarea"
        placeholder="Detail the concepts, tools, or goals covered in this skill listing..."
        required
        maxLength={500}
        rows={4}
        value={formState.description}
        onChange={(e) => setFormState((p) => ({ ...p, description: e.target.value }))}
      />
    </div>
  </>
);

const MySkillsPage = () => {
  const { showToast } = useToast();
  const location = useLocation();

  const [skills, setSkills] = useState([]);
  const [summary, setSummary] = useState({ total: 0, teaching: 0, learning: 0 });
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addForm, setAddForm] = useState(emptySkillForm);
  const [editForm, setEditForm] = useState({ ...emptySkillForm, _id: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleOpenAddModal = useCallback((defaultType = null) => {
    const typeToSet = defaultType || (activeTab === 'Learning' ? 'Learning' : 'Teaching');
    setAddForm({ ...emptySkillForm, type: typeToSet });
    setAddModalOpen(true);
  }, [activeTab]);

  useEffect(() => {
    loadMySkills();
  }, []);

  useEffect(() => {
    if (location.state?.openAddModal) {
      handleOpenAddModal();
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleOpenAddModal]);

  const loadMySkills = async () => {
    setLoading(true);
    try {
      const res = await API.get('/api/skills/my');
      const loadedSkills = res.skills || [];
      setSkills(loadedSkills);
      setSummary(
        res.summary || {
          total: loadedSkills.length,
          teaching: loadedSkills.filter((s) => s.type === 'Teaching').length,
          learning: loadedSkills.filter((s) => s.type === 'Learning').length,
        }
      );
    } catch (err) {
      showToast('error', err.message || 'Could not load your skills.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSkills = skills.filter((s) => {
    if (activeTab === 'All') return true;
    return s.type === activeTab;
  });

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    const title = addForm.title.trim();
    const description = addForm.description.trim();

    if (!title) {
      showToast('error', 'Skill Title is required.');
      return;
    }
    if (!description) {
      showToast('error', 'Description is required.');
      return;
    }

    setSubmitting(true);
    try {
      await API.post('/api/skills', {
        title,
        type: addForm.type,
        category: addForm.category,
        level: addForm.level,
        description,
      });

      showToast('success', 'Skill added successfully!');
      setAddModalOpen(false);
      setAddForm(emptySkillForm);
      loadMySkills();
    } catch (err) {
      showToast('error', err.message || 'Failed to add skill.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditModal = (skill) => {
    setEditForm({
      _id: skill._id,
      title: skill.title,
      type: skill.type,
      category: skill.category,
      level: skill.level,
      description: skill.description,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const title = editForm.title.trim();
    const description = editForm.description.trim();

    if (!title) {
      showToast('error', 'Skill Title is required.');
      return;
    }
    if (!description) {
      showToast('error', 'Description is required.');
      return;
    }

    setSubmitting(true);
    try {
      await API.put(`/api/skills/${editForm._id}`, {
        title,
        type: editForm.type,
        category: editForm.category,
        level: editForm.level,
        description,
      });

      showToast('success', 'Skill updated successfully!');
      setEditModalOpen(false);
      loadMySkills();
    } catch (err) {
      showToast('error', err.message || 'Failed to update skill.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (skillId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this skill listing?\n\nThis will cancel any pending or accepted exchange requests associated with it.'
      )
    ) {
      return;
    }

    try {
      await API.delete(`/api/skills/${skillId}`);
      showToast('success', 'Skill deleted.');
      loadMySkills();
    } catch (err) {
      showToast('error', err.message || 'Could not delete skill.');
    }
  };

  return (
    <div className="page-content">
      {/* Page Title & Add Button */}
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
          <h1 className="page-title">My Skills Catalog</h1>
          <p className="page-subtitle">Manage skills you can teach and topics you are eager to learn</p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="btn btn-primary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} />
          <span>Add New Skill</span>
        </button>
      </div>

      {/* Pill Tab Filter Bar */}
      <div className="tabs-bar">
        <button
          id="tabBtn-All"
          className={`tab-btn ${activeTab === 'All' ? 'active' : ''}`}
          onClick={() => setActiveTab('All')}
        >
          All Listings (<span id="countTotal">{summary.total}</span>)
        </button>

        <button
          id="tabBtn-Teaching"
          className={`tab-btn ${activeTab === 'Teaching' ? 'active' : ''}`}
          onClick={() => setActiveTab('Teaching')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <GraduationCap size={16} />
          <span>Skills I Teach (<span id="countTeaching">{summary.teaching}</span>)</span>
        </button>

        <button
          id="tabBtn-Learning"
          className={`tab-btn ${activeTab === 'Learning' ? 'active' : ''}`}
          onClick={() => setActiveTab('Learning')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <Target size={16} />
          <span>Skills I Want to Learn (<span id="countLearning">{summary.learning}</span>)</span>
        </button>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-3" id="mySkillsGrid">
        {loading ? (
          <p className="text-muted" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
            Loading your skills...
          </p>
        ) : filteredSkills.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1/-1' }}>
            <div className="empty-state-icon">
              <BookOpen size={32} />
            </div>
            <div className="empty-state-title">
              No {activeTab !== 'All' ? activeTab.toLowerCase() : ''} skills listed yet
            </div>
            <div className="empty-state-desc">
              Share what you can teach to help peers, or list what you want to learn so others can reach out.
            </div>
            <button
              onClick={() => handleOpenAddModal(activeTab === 'Learning' ? 'Learning' : 'Teaching')}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}
            >
              <Plus size={16} />
              <span>Add New Skill</span>
            </button>
          </div>
        ) : (
          filteredSkills.map((skill) => (
            <div key={skill._id} className="card skill-card">
              <div>
                <div className="skill-card-top">
                  <span
                    className={`badge ${skill.type === 'Teaching' ? 'badge-teaching' : 'badge-learning'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    {skill.type === 'Teaching' ? (
                      <GraduationCap style={{ width: 14, height: 14 }} />
                    ) : (
                      <Target style={{ width: 14, height: 14 }} />
                    )}
                    {skill.type === 'Teaching' ? 'Teaching' : 'Want to Learn'}
                  </span>
                  <span className="badge badge-category">{skill.category}</span>
                </div>
                <h4 className="skill-card-title">{skill.title}</h4>
                <p className="skill-card-desc">{skill.description}</p>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                  Level: <strong style={{ color: 'var(--text-primary)' }}>{skill.level}</strong> • Created{' '}
                  {new Date(skill.createdAt).toLocaleDateString()}
                </div>
                <div className="skill-card-footer">
                  <button
                    onClick={() => handleOpenEditModal(skill)}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(skill._id)}
                    className="btn btn-danger btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Skill Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="List a New Skill">
        <form onSubmit={handleAddSubmit} id="addSkillForm">
          <div className="modal-body">
            <SkillFields formState={addForm} setFormState={setAddForm} idPrefix="add-" />
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setAddModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Listing</span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Skill Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Skill Listing">
        <form onSubmit={handleEditSubmit} id="editSkillForm">
          <div className="modal-body">
            <SkillFields formState={editForm} setFormState={setEditForm} idPrefix="edit-" />
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MySkillsPage;

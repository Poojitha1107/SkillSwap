import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Menu } from 'lucide-react';

const TopBar = ({ onMenuToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isMySkillsPage = location.pathname === '/my-skills';

  return (
    <div className="main-topbar">

      {/* Left side: mobile toggle + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {onMenuToggle && (
          <button
            className="mobile-menu-toggle"
            onClick={onMenuToggle}
            title="Toggle Menu"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="topbar-search">
          <span className="topbar-search-icon">
            <Search size={18} />
          </span>
          <input
            type="text"
            placeholder="Search skills, topics, peers..."
            onClick={() => navigate('/explore')}
            readOnly
            style={{ cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Right side: action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {!isMySkillsPage && (
          <Link to="/my-skills" state={{ openAddModal: true }} className="btn btn-primary btn-sm">
            <Plus size={16} />
            List New Skill
          </Link>
        )}
        <Link to="/explore" className="btn btn-secondary btn-sm">
          Browse Catalog
        </Link>
      </div>

    </div>
  );
};

export default TopBar;

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  BookOpen,
  Search,
  Inbox,
  Users,
  UserRound,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/my-skills', label: 'My Skills', icon: BookOpen },
  { to: '/explore', label: 'Explore Skills', icon: Search },
  { to: '/requests', label: 'Requests Hub', icon: Inbox },
  { to: '/connections', label: 'Connections', icon: Users },
  { to: '/profile', label: 'Profile & Privacy', icon: UserRound },
];

const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen, onLogout }) => {
  const { user } = useAuth();
  const { pendingIncomingCount } = useNotifications();
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'S';

  return (
    <aside
      className="app-sidebar"
      style={mobileMenuOpen ? { transform: 'translateX(0)', zIndex: 999 } : {}}
    >
      {/* Top section: brand + nav */}
      <div>

        {/* Brand */}
        <Link to="/dashboard" className="sidebar-brand">
          <div className="brand-icon">
            <Zap size={23} strokeWidth={2.2} />
          </div>
          <div className="brand-name">
            Skill<span>Swap</span>
          </div>
          {mobileMenuOpen && (
            <button
              onClick={(e) => { e.preventDefault(); setMobileMenuOpen(false); }}
              style={{
                marginLeft: 'auto',
                color: '#FFFFFF',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={20} />
            </button>
          )}
        </Link>

        {/* Navigation */}
        <div className="sidebar-section-title">MAIN MENU</div>
        <ul className="sidebar-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isRequests = item.to === '/requests';
            const showBadge = isRequests && pendingIncomingCount > 0;

            return (
              <li key={item.to} className="sidebar-item">
                <NavLink
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) => (isActive ? 'active' : undefined)}
                >
                  <span className="sidebar-item-icon">
                    <Icon size={19} strokeWidth={1.8} />
                  </span>
                  <span>{item.label}</span>
                  {showBadge && (
                    <span
                      id="sidebarRequestsBadge"
                      className="badge"
                      style={{
                        marginLeft: 'auto',
                        background: 'var(--accent-lime, #CCFF00)',
                        color: '#0A0E1A',
                        fontWeight: 800,
                        fontSize: '0.725rem',
                        padding: '0.12rem 0.5rem',
                        borderRadius: '999px',
                        lineHeight: 1.2,
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      ({pendingIncomingCount})
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

      </div>

      {/* Footer: user profile + logout */}
      <div className="sidebar-footer">
        <div className="user-mini-profile">
          <Link
            to="/profile"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: 'inherit', flex: 1, minWidth: 0 }}
          >
            <div className="user-avatar" id="sidebarUserAvatar">
              {initials}
            </div>
            <div className="user-mini-meta">
              <div className="user-mini-name" id="sidebarUserName">
                {user?.name || 'Student'}
              </div>
              <div className="user-mini-role" id="sidebarUserRole">
                {user?.department || user?.college || 'Student'}
              </div>
            </div>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="btn btn-outline btn-sm"
            title="Sign Out"
            style={{
              padding: '0.35rem 0.65rem',
              color: '#E5E4F0',
              borderColor: 'rgba(255,255,255,0.2)',
              minWidth: 34,
              minHeight: 34,
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

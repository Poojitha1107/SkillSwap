import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

const AppLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-page">
      <div className="app-wrapper">
        <div className="app-shell">

          {/* Mobile overlay */}
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

          {/* Sidebar */}
          <Sidebar
            mobileMenuOpen={mobileMenuOpen}
            setMobileMenuOpen={setMobileMenuOpen}
            onLogout={handleLogout}
          />

          {/* Main content area */}
          <main className="app-main">
            {/* Single TopBar — only rendered here, never in page components */}
            <TopBar onMenuToggle={() => setMobileMenuOpen(true)} />

            {/* Page content via React Router */}
            <Outlet />
          </main>

        </div>
      </div>
    </div>
  );
};

export default AppLayout;

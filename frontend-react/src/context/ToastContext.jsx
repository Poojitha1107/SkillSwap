import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type, message, duration = 4000, onClick = null) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, type, message, onClick };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const renderIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle style={{ width: 18, height: 18, color: '#10B981', flexShrink: 0 }} />;
      case 'error':
        return <AlertCircle style={{ width: 18, height: 18, color: '#EF4444', flexShrink: 0 }} />;
      case 'info':
      default:
        return <Info style={{ width: 18, height: 18, color: '#8B5CF6', flexShrink: 0 }} />;
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" id="toastContainer">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            onClick={() => {
              if (toast.onClick) {
                toast.onClick();
                removeToast(toast.id);
              }
            }}
            style={toast.onClick ? { cursor: 'pointer' } : {}}
          >
            <div style={{ display: 'flex', alignSelf: 'center', alignItems: 'center', gap: '0.65rem' }}>
              {renderIcon(toast.type)}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              style={{
                cursor: 'pointer',
                opacity: 0.7,
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '0.5rem',
                background: 'none',
                border: 'none',
              }}
              title="Dismiss"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;


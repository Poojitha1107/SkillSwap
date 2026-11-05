import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = '560px' }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay active"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-container" style={{ maxWidth }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;


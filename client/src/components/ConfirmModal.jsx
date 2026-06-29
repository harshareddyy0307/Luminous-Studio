import React from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';
import './ConfirmModal.css';

const ConfirmModal = ({ 
  isOpen, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?', 
  onConfirm, 
  onCancel, 
  confirmText = 'Delete', 
  cancelText = 'Cancel',
  type = 'danger'
}) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-card animate-fade-in-scale" onClick={e => e.stopPropagation()}>
        <button className="confirm-modal-close" onClick={onCancel} aria-label="Close modal">
          <FiX />
        </button>
        
        <div className="confirm-modal-body">
          <div className={`confirm-modal-icon confirm-modal-icon--${type}`}>
            <FiAlertTriangle />
          </div>
          <div className="confirm-modal-content">
            <h3 className="confirm-modal-title">{title}</h3>
            <p className="confirm-modal-message">{message}</p>
          </div>
        </div>
        
        <div className="confirm-modal-actions">
          <button className="btn btn-secondary confirm-modal-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button 
            className={`btn confirm-modal-btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

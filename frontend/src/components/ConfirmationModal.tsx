import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 3000 }}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '420px', borderRadius: 'var(--radius-md)' }}
      >
        <div className="modal-header" style={{ padding: '1rem 1.25rem' }}>
          <h3 className="modal-title" style={{ fontSize: '1.15rem', color: isDanger ? 'var(--danger)' : 'var(--text-main)' }}>
            {title}
          </h3>
          <button className="btn-close" onClick={onCancel} style={{ fontSize: '1.25rem' }}>
            &times;
          </button>
        </div>
        <div className="modal-body" style={{ padding: '1.25rem 1.5rem', fontSize: '0.92rem', color: 'var(--text-muted)' }}>
          <p style={{ lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>{message}</p>
        </div>
        <div className="modal-footer" style={{ padding: '0.85rem 1.25rem', gap: '0.5rem' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={onCancel}
            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className={isDanger ? 'btn-danger' : 'btn-primary'} 
            onClick={onConfirm}
            style={{ 
              padding: '0.5rem 1.25rem', 
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

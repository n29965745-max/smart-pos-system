import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] sm:rounded-lg rounded-t-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-in">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-tertiary)] z-10">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
        {footer && <div className="p-4 sm:p-6 border-t border-[var(--border-color)] flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
};

import React, { ReactNode, useEffect } from 'react';

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: ReactNode;
  className?: string;
}

/**
 * Responsive Modal Component
 * Full screen on mobile, centered dialog on desktop
 */
export default function ResponsiveModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  className = ''
}: ResponsiveModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
    full: 'sm:max-w-full sm:m-4'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-0 sm:p-4">
        <div
          className={`
            relative w-full bg-[var(--bg-primary)] 
            min-h-screen sm:min-h-0
            sm:rounded-xl sm:shadow-2xl
            flex flex-col
            ${sizeClasses[size]}
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border-color)] flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] truncate pr-4">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex-shrink-0 p-4 sm:p-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Responsive Form Group
 * Stacks form fields properly on mobile
 */
export function ResponsiveFormGroup({
  label,
  children,
  required = false,
  error,
  hint,
  className = ''
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-[var(--text-primary)]">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-[var(--text-secondary)]">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

/**
 * Responsive Form Input
 * Touch-optimized input field
 */
export function ResponsiveInput({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  className = ''
}: {
  type?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`
        w-full px-4 py-3 sm:py-2.5
        bg-[var(--bg-tertiary)] border border-[var(--border-color)]
        rounded-lg text-sm text-[var(--text-primary)]
        placeholder-[var(--text-secondary)]
        focus:ring-2 focus:ring-emerald-500 focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        outline-none transition-all
        ${className}
      `}
    />
  );
}

/**
 * Responsive Button Group
 * Stacks buttons vertically on mobile
 */
export function ResponsiveButtonGroup({
  children,
  align = 'right',
  className = ''
}: {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  };

  return (
    <div className={`
      flex flex-col-reverse sm:flex-row gap-3
      ${alignClasses[align]}
      ${className}
    `}>
      {children}
    </div>
  );
}

/**
 * Responsive Button
 * Touch-optimized button with proper sizing
 */
export function ResponsiveButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className = ''
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}) {
  const variantClasses = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    secondary: 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)]',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 sm:py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${fullWidth ? 'w-full sm:w-auto' : ''}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        font-medium rounded-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        active:scale-95
        min-h-[44px] sm:min-h-[36px]
        ${className}
      `}
    >
      {children}
    </button>
  );
}

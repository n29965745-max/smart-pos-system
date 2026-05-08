import React, { ReactNode, useState } from 'react';

interface ResponsiveFiltersProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Responsive Filter Bar
 * Stacks filters vertically on mobile, horizontal on desktop
 */
export default function ResponsiveFilters({
  children,
  title,
  subtitle,
  actions,
  className = ''
}: ResponsiveFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Title */}
        {(title || subtitle) && (
          <div className="flex-1 min-w-0">
            {title && (
              <h1 className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] truncate">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="sm:hidden flex items-center gap-2 px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters {showFilters ? '▲' : '▼'}
        </button>

        {/* Desktop Actions */}
        {actions && (
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className={`
        ${showFilters ? 'block' : 'hidden'} sm:block
        flex flex-col sm:flex-row sm:flex-wrap gap-3
      `}>
        {children}
      </div>

      {/* Mobile Actions */}
      {actions && (
        <div className="sm:hidden flex flex-col gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * Responsive Filter Group
 * Groups related filters together
 */
export function ResponsiveFilterGroup({
  label,
  children,
  className = ''
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        {children}
      </div>
    </div>
  );
}

/**
 * Responsive Search Bar
 * Full width on mobile, flexible on desktop
 */
export function ResponsiveSearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className = ''
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative flex-1 min-w-0 sm:max-w-md ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  );
}

/**
 * Responsive Select Dropdown
 * Optimized for mobile touch
 */
export function ResponsiveSelect({
  value,
  onChange,
  options,
  placeholder = 'Select...',
  className = ''
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none cursor-pointer ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.5rem center',
        backgroundSize: '1.5em 1.5em',
        paddingRight: '2.5rem'
      }}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

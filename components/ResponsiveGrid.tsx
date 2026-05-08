import React, { ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

/**
 * Responsive Grid Component
 * Automatically adjusts columns based on screen size
 */
export default function ResponsiveGrid({ 
  children, 
  cols = { default: 1, sm: 2, lg: 4 },
  gap = 4,
  className = ''
}: ResponsiveGridProps) {
  const gridClasses = [
    'grid',
    `gap-${gap}`,
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

/**
 * Responsive Card Component
 * Mobile-optimized card with proper padding and spacing
 */
export function ResponsiveCard({ 
  children, 
  className = '',
  padding = 'default'
}: { 
  children: ReactNode; 
  className?: string;
  padding?: 'none' | 'sm' | 'default' | 'lg';
}) {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    default: 'p-4 sm:p-5 lg:p-6',
    lg: 'p-5 sm:p-6 lg:p-8'
  };

  return (
    <div className={`bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Responsive Stat Card
 * Optimized for dashboard metrics
 */
export function ResponsiveStatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  children,
  className = ''
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: { value: number; isPositive: boolean };
  children?: ReactNode;
  className?: string;
}) {
  return (
    <ResponsiveCard className={className}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] truncate pr-2">{title}</p>
        {icon && <span className="text-lg sm:text-xl flex-shrink-0">{icon}</span>}
      </div>
      
      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-1 break-words">
        {value}
      </p>
      
      {subtitle && (
        <p className="text-xs text-[var(--text-secondary)] mt-1">{subtitle}</p>
      )}
      
      {trend && (
        <div className={`text-xs mt-2 ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
          {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
        </div>
      )}
      
      {children}
    </ResponsiveCard>
  );
}

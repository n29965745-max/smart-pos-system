import React, { useState, useEffect } from 'react';

interface DateRangeFilterProps {
  value: string;
  onChange: (value: string) => void;
  startDate?: string;
  endDate?: string;
  onDateChange?: (start: string, end: string) => void;
}

const getDisplayLabel = (value: string): string => {
  const labels: { [key: string]: string } = {
    'today': 'Today',
    'yesterday': 'Yesterday',
    'last7days': 'Last 7 Days',
    'last30days': 'Last 30 Days',
    'thisMonth': 'This Month',
    'lastMonth': 'Last Month',
    'thisYear': 'This Year',
    'all': 'All'
  };
  return labels[value] || 'All';
};

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DateRangeFilter({ 
  value, 
  onChange, 
  startDate = '', 
  endDate = '',
  onDateChange 
}: DateRangeFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  // Compute displayed dates based on selected range
  const getComputedDates = (range: string): { start: string; end: string } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
      case 'today':
        return { start: formatDate(today), end: formatDate(today) };
      case 'yesterday': {
        const y = new Date(today); y.setDate(y.getDate() - 1);
        return { start: formatDate(y), end: formatDate(y) };
      }
      case 'last7days': {
        const s = new Date(today); s.setDate(s.getDate() - 6);
        return { start: formatDate(s), end: formatDate(today) };
      }
      case 'last30days': {
        const s = new Date(today); s.setDate(s.getDate() - 29);
        return { start: formatDate(s), end: formatDate(today) };
      }
      case 'thisMonth':
        return { start: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)), end: formatDate(today) };
      case 'lastMonth': {
        const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const e = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: formatDate(s), end: formatDate(e) };
      }
      case 'thisYear':
        return { start: formatDate(new Date(now.getFullYear(), 0, 1)), end: formatDate(today) };
      default:
        return { start: formatDate(today), end: formatDate(today) };
    }
  };

  // Use provided dates if set (manual override), otherwise compute from range
  const computed = getComputedDates(value);
  const displayStart = startDate || computed.start;
  const displayEnd = endDate || computed.end;

  const handleRangeSelect = (range: string) => {
    onChange(range);
    setShowDropdown(false);
    // Update date inputs to reflect the selected range
    if (range !== 'all') {
      const dates = getComputedDates(range);
      onDateChange?.(dates.start, dates.end);
    }
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="min-h-[44px] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2.5 sm:px-3 py-2 text-xs sm:text-sm text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors flex items-center gap-1.5 sm:gap-2 min-w-[100px] sm:min-w-[120px] justify-between whitespace-nowrap"
        >
          <span>{getDisplayLabel(value)}</span>
          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute left-0 mt-2 w-48 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg shadow-xl z-50 py-1">
              {['all', 'today', 'yesterday', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'thisYear'].map((opt) => (
                <button
                  key={opt}
                  onClick={() => handleRangeSelect(opt)}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg-primary)] transition-colors ${value === opt ? 'text-emerald-400' : 'text-[var(--text-primary)]'}`}
                >
                  {getDisplayLabel(opt)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Date pickers - Horizontal layout */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-h-[44px] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2 sm:px-3 py-2">
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--text-secondary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <input
          type="text"
          value={displayStart ? formatToDDMMYYYY(displayStart) : ''}
          placeholder="dd/mm/yyyy"
          onFocus={(e) => {
            e.target.type = 'date';
            e.target.value = displayStart;
          }}
          onBlur={(e) => {
            e.target.type = 'text';
            e.target.value = displayStart ? formatToDDMMYYYY(displayStart) : '';
          }}
          onChange={(e) => {
            if (e.target.type === 'date') {
              onDateChange?.(e.target.value, displayEnd);
            }
          }}
          className="bg-transparent border-none text-[9px] sm:text-[10px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none w-[62px] sm:w-[75px]"
        />
      </div>
      
      <span className="text-[var(--text-secondary)] text-xs sm:text-sm shrink-0">to</span>
      
      <div className="flex items-center gap-1.5 sm:gap-2 min-h-[44px] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2 sm:px-3 py-2">
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--text-secondary)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <input
          type="text"
          value={displayEnd ? formatToDDMMYYYY(displayEnd) : ''}
          placeholder="dd/mm/yyyy"
          onFocus={(e) => {
            e.target.type = 'date';
            e.target.value = displayEnd;
          }}
          onBlur={(e) => {
            e.target.type = 'text';
            e.target.value = displayEnd ? formatToDDMMYYYY(displayEnd) : '';
          }}
          onChange={(e) => {
            if (e.target.type === 'date') {
              onDateChange?.(displayStart, e.target.value);
            }
          }}
          className="bg-transparent border-none text-[9px] sm:text-[10px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none w-[62px] sm:w-[75px]"
        />
      </div>
    </div>
  );
}

// Helper function to format YYYY-MM-DD to DD/MM/YYYY
function formatToDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function getDateRange(range: string): { startDate: Date | null; endDate: Date | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { startDate: today, endDate: todayEnd };
    
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return { startDate: yesterday, endDate: yesterdayEnd };
    
    case 'last7days':
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 6); // Include today, so -6 not -7
      const last7End = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { startDate: last7, endDate: last7End };
    
    case 'last30days':
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 29); // Include today, so -29 not -30
      const last30End = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { startDate: last30, endDate: last30End };
    
    case 'thisMonth':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { startDate: monthStart, endDate: monthEnd };
    
    case 'lastMonth':
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: lastMonthStart, endDate: lastMonthEnd };
    
    case 'thisYear':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { startDate: yearStart, endDate: yearEnd };
    
    case 'all':
    default:
      return { startDate: null, endDate: null };
  }
}

// Helper function to format date in local timezone as YYYY-MM-DD
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

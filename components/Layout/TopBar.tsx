import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from '../../contexts/ThemeContext';

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const { theme, setTheme } = useTheme();

  const [superAdminReturn, setSuperAdminReturn] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
    // Check if we're in impersonation mode
    const returnPath = localStorage.getItem('superadmin_return');
    if (returnPath) setSuperAdminReturn(returnPath);
  }, []);

  const returnToAdmin = () => {
    const superAdminToken = localStorage.getItem('superadmin_token');
    if (superAdminToken) {
      localStorage.setItem('token', superAdminToken);
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_return');
      router.push('/admin');
    }
  };

  const themes = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'blue-professional', label: 'Blue Professional', icon: '💼' },
    { value: 'ocean', label: 'Ocean', icon: '🌊' },
    { value: 'forest', label: 'Forest', icon: '🌲' },
    { value: 'system', label: 'System', icon: '💻' },
  ];

  const pageTitle: Record<string, string> = {
    '/dashboard-pro': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/dashboard-advanced': 'Dashboard',
    '/pos-advanced': 'Point of Sale',
    '/pos': 'Point of Sale',
    '/products-pro': 'Products',
    '/inventory-pro': 'Inventory',
    '/inventory': 'Inventory',
    '/customers-pro': 'Customers',
    '/customers': 'Customers',
    '/sales-pro': 'Sales',
    '/reports-pro': 'Reports',
    '/ai-assistant': 'AI Assistant',
    '/settings': 'Settings',
    '/transactions': 'Transactions',
    '/returns': 'Returns',
    '/expenses': 'Expenses',
    '/debts': 'Debt Management',
    '/sales-analytics': 'Sales Analytics',
    '/inventory-analytics': 'Inventory Analytics',
    '/product-performance': 'Product Performance',
    '/user-management': 'User Management',
    '/shop-settings': 'Shop Settings',
    '/my-profile': 'My Profile',
  };

  return (
    <header className="bg-[var(--bg-primary)] border-b border-[var(--border-color)] px-4 md:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Hamburger - mobile only */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Return to Admin banner — shown when impersonating a tenant */}
        {superAdminReturn && (
          <button
            onClick={returnToAdmin}
            className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-lg text-xs font-semibold hover:bg-amber-500/30 transition-colors"
            title="Return to Admin Panel"
          >
            ← Admin
          </button>
        )}

        {/* AI Accountant - hidden on small mobile */}
        <button className="hidden sm:flex px-3 md:px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs md:text-sm font-medium items-center gap-1 md:gap-2">
          <span>🤖</span>
          <span className="hidden md:inline">AI Accountant</span>
        </button>

        {/* Theme Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] transition-colors"
            title="Choose Theme"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </button>

          {showThemeMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowThemeMenu(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg shadow-xl z-20 py-2 max-h-[70vh] overflow-y-auto">
                <div className="px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] border-b border-[var(--border-color)]">
                  Choose Theme
                </div>
                {themes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => { setTheme(t.value as any); setShowThemeMenu(false); }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-[var(--bg-secondary)] flex items-center gap-2 ${
                      theme === t.value ? 'text-emerald-500 font-medium' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                    {theme === t.value && <span className="ml-auto">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Export - hidden on mobile */}
        <button className="hidden md:block p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]" title="Export">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] relative" title="Notifications">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-[var(--border-color)]">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-[var(--text-primary)] leading-tight">
              {user?.username || 'User'}
            </p>
            <p className="text-xs text-[var(--text-secondary)] truncate max-w-[140px]">
              {user?.email || ''}
            </p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-600 font-semibold text-sm">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

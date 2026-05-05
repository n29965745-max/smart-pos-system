import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const router = useRouter();
  // Initialize from localStorage immediately - no delay on first render
  const [shopSettings, setShopSettings] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('shopSettings');
      if (cached) {
        try { return JSON.parse(cached); } catch {}
      }
    }
    return null;
  });
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    fetchShopSettings();
    fetchTenantSlug();
  }, []);

  const fetchTenantSlug = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tenant', token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      if (res.ok) {
        const data = await res.json();
        if (data.tenant?.slug) {
          setTenantSlug(data.tenant.slug);
          // Store with tenant ID to avoid cross-tenant contamination
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user.tenantId) {
            localStorage.setItem(`tenantSlug_${user.tenantId}`, data.tenant.slug);
          }
        }
      } else {
        // Clear slug if fetch fails (e.g., wrong tenant)
        setTenantSlug(null);
      }
    } catch {
      setTenantSlug(null);
    }
  };

  const fetchShopSettings = async () => {
    try {
      const userData = localStorage.getItem('user');
      let url = '/api/shop-settings';
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.email) {
            url = `/api/shop-settings?email=${encodeURIComponent(user.email)}`;
          }
        } catch (e) {}
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.settings) {
        setShopSettings(data.settings);
        localStorage.setItem('shopSettings', JSON.stringify(data.settings));
      }
    } catch (error) {
      console.error('Error fetching shop settings:', error);
    }
  };

  const menuItems = [
    { label: 'Dashboard', href: '/dashboard-pro', icon: '📊' },
    { label: 'Point of Sale', href: '/pos', icon: '🛒' },
    { label: 'Transactions', href: '/transactions', icon: '💳' },
    { label: 'Returns', href: '/returns', icon: '↩️' },
    { label: 'Expenses', href: '/expenses', icon: '💸' },
    { label: 'Inventory', href: '/inventory', icon: '📦' },
    { label: 'Customers', href: '/customers', icon: '👥' },
    { label: 'Debts', href: '/debts', icon: '💰' },
    { label: 'Customer Messages', href: '/customer-messages', icon: '💬' },
    { label: 'Sales Analytics', href: '/sales-analytics', icon: '📈' },
    { label: 'Inventory Analytics', href: '/inventory-analytics', icon: '📊' },
    { label: 'Product Performance', href: '/product-performance', icon: '🎯' },
    { label: 'User Management', href: '/user-management', icon: '👤' },
    { label: 'Shop Settings', href: '/shop-settings', icon: '🏪' },
    { label: 'My Profile', href: '/my-profile', icon: '⚙️' },
    { label: 'Admin Panel', href: '/admin', icon: '🔧', adminOnly: true },
  ];

  const isActive = (href: string) => router.pathname === href;

  // Read user role from localStorage for frontend-only guard
  // Backend always enforces this independently
  const isSuperAdmin = (() => {
    if (typeof window === 'undefined') return false;
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      return u.system_role === 'superadmin';
    } catch { return false; }
  })();

  const visibleMenuItems = menuItems.filter(item => !item.adminOnly || isSuperAdmin);

  const handleLogout = () => {
    // Clear all tenant-specific data
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.tenantId) {
      localStorage.removeItem(`tenantSlug_${user.tenantId}`);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('shopSettings');
    router.push('/login');
  };

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    onClose?.();
  };

  return (
    <aside className="w-64 bg-[var(--bg-primary)] border-r border-[var(--border-color)] overflow-y-auto flex flex-col h-screen">
      {/* Mobile close button */}
      <div className="flex items-center justify-between p-4 lg:hidden border-b border-[var(--border-color)]">
        <span className="text-lg font-bold text-emerald-500">Menu</span>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {shopSettings ? (
        <div className="p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            {shopSettings.logo_url && (
              <div className="flex-shrink-0">
                <img
                  src={shopSettings.logo_url}
                  alt="Logo"
                  className="w-12 h-12 object-cover rounded-full border-2 border-emerald-500/20"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-emerald-500 truncate">
                {shopSettings.business_name}
              </h1>
              {shopSettings.business_tagline && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                  {shopSettings.business_tagline}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border-b border-[var(--border-color)]">
          <div className="h-6 w-32 bg-[var(--bg-secondary)] rounded animate-pulse"></div>
        </div>
      )}

      <nav className="px-3 py-4 space-y-1 flex-1">
        {visibleMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={handleNavClick}
            className={`flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm ${
              isActive(item.href)
                ? 'bg-emerald-500/10 text-emerald-500 font-medium'
                : 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <span className="text-lg mr-3">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border-color)]">
        {tenantSlug && (
          <a
            href={`/s/${tenantSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 rounded-lg transition-colors mb-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Go to Your Shop
          </a>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => {
              const theme = localStorage.getItem('theme');
              localStorage.clear();
              if (theme) localStorage.setItem('theme', theme);
              localStorage.removeItem('shopSettings');
              window.location.href = '/login';
            }}
            className="flex-shrink-0 p-3 text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors border border-[var(--border-color)]"
            title="Clear & Restart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={handleLogout}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}

import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

export default function ShopSettingsPage() {
  const [settings, setSettings] = useState({
    business_name: '',
    business_tagline: '',
    business_type: '',
    business_email: '',
    business_phone: '',
    business_address: '',
    logo_url: '',
    primary_color: '#10b981',
    currency: 'KES',
    currency_symbol: 'KSh',
    tiktok_url: '',
    instagram_url: '',
    facebook_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  const [slug, setSlug] = useState('');
  const [slugInput, setSlugInput] = useState('');
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugEditing, setSlugEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const shopUrl = typeof window !== 'undefined' && slug
    ? `${window.location.origin}/s/${slug}`
    : '';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Try to get user from localStorage, but fallback to fetching default settings
      const userData = localStorage.getItem('user');
      let url = '/api/shop-settings';
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.email) {
            url = `/api/shop-settings?email=${encodeURIComponent(user.email)}`;
          }
        } catch (e) {
          console.log('Could not parse user data, fetching default settings');
        }
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok && data.settings) {
        setSettings(data.settings);
      }

      // Fetch tenant slug
      const token = localStorage.getItem('token');
      const tenantRes = await fetch('/api/tenant', token ? { headers: { Authorization: `Bearer ${token}` } } : {});
      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        if (tenantData.tenant?.slug) {
          setSlug(tenantData.tenant.slug);
          setSlugInput(tenantData.tenant.slug);
          // Store with tenant ID to avoid cross-tenant contamination
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user.tenantId) {
            localStorage.setItem(`tenantSlug_${user.tenantId}`, tenantData.tenant.slug);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    if (!shopUrl) return;
    navigator.clipboard.writeText(shopUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSlug = async () => {
    if (!slugInput || slugInput === slug) { setSlugEditing(false); return; }
    setSlugSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tenant/update-slug', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ slug: slugInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSlug(data.slug);
      setSlugInput(data.slug);
      // Store with tenant ID to avoid cross-tenant contamination
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.tenantId) {
        localStorage.setItem(`tenantSlug_${user.tenantId}`, data.slug);
      }
      setSlugEditing(false);
      showToast('Shop URL updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update slug', 'error');
    } finally {
      setSlugSaving(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const userData = localStorage.getItem('user');
      let user_email = 'admin@system.local'; // Default fallback
      
      if (userData) {
        try {
          const user = JSON.parse(userData);
          if (user.email) {
            user_email = user.email;
          }
        } catch (e) {
          console.log('Could not parse user data, using default email');
        }
      }

      const response = await fetch('/api/shop-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email,
          ...settings
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Update localStorage cache so sidebar shows new settings immediately
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.tenantId) {
          localStorage.setItem(`shopSettings_${user.tenantId}`, JSON.stringify(settings));
        }
        showToast('Settings saved successfully! Refresh to see changes.', 'success');
      } else {
        showToast(data.error || 'Failed to save settings', 'error');
      }
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] p-4 md:p-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)]">Shop Settings</h1>
          <p className="text-base md:text-sm text-[var(--text-secondary)] mt-2">
            Customize your shop's branding and business information
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Shop URL */}
          {slug && (
            <div className="bg-[var(--bg-tertiary)] border border-emerald-500/30 rounded-lg p-4 md:p-6">
              <h2 className="text-xl md:text-lg font-semibold text-[var(--text-primary)] mb-1">Your Shop URL</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Share this link with your customers. They can view your shop page and log in from here.
              </p>

              {/* URL display + copy */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-sm text-emerald-400 font-mono truncate">
                  {shopUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  {copied ? '✓ Copied!' : 'Copy Link'}
                </button>
                <a
                  href={shopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Open ↗
                </a>
              </div>

              {/* Slug editor */}
              <div>
                <p className="text-xs text-[var(--text-secondary)] mb-2">
                  Slug: <span className="font-mono text-[var(--text-primary)]">{slug}</span>
                  {!slugEditing && (
                    <button
                      type="button"
                      onClick={() => setSlugEditing(true)}
                      className="ml-2 text-emerald-500 hover:text-emerald-400 text-xs underline"
                    >
                      Customize
                    </button>
                  )}
                </p>
                {slugEditing && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap">/s/</span>
                    <input
                      type="text"
                      value={slugInput}
                      onChange={e => setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                      className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] font-mono focus:ring-2 focus:ring-emerald-500"
                      placeholder="your-shop-name"
                    />
                    <button
                      type="button"
                      onClick={handleSaveSlug}
                      disabled={slugSaving}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                    >
                      {slugSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSlugEditing(false); setSlugInput(slug); }}
                      className="px-3 py-2 border border-[var(--border-color)] text-[var(--text-secondary)] text-sm rounded-lg hover:bg-[var(--bg-secondary)]"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Lowercase letters, numbers and hyphens only. This is your permanent link until you connect a custom domain.
                </p>
              </div>
            </div>
          )}

          {/* Business Information */}
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4 md:p-6">
            <h2 className="text-xl md:text-lg font-semibold text-[var(--text-primary)] mb-4">Business Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base md:text-sm font-medium text-[var(--text-primary)] mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.business_name}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-base text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your business name"
                />
              </div>

              <div>
                <label className="block text-base md:text-sm font-medium text-[var(--text-primary)] mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  value={settings.business_tagline}
                  onChange={(e) => setSettings({ ...settings, business_tagline: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-base text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your tagline"
                />
              </div>

              <div>
                <label className="block text-base md:text-sm font-medium text-[var(--text-primary)] mb-2">
                  Business Type
                </label>
                <select
                  value={settings.business_type}
                  onChange={(e) => setSettings({ ...settings, business_type: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-base text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Select Type</option>
                  <option value="Retail Store">Retail Store</option>
                  <option value="Supermarket">Supermarket</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Pharmacy">Pharmacy</option>
                  <option value="Electronics Shop">Electronics Shop</option>
                  <option value="Clothing Store">Clothing Store</option>
                  <option value="Hardware Store">Hardware Store</option>
                  <option value="Bookstore">Bookstore</option>
                  <option value="Convenience Store">Convenience Store</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-base md:text-sm font-medium text-[var(--text-primary)] mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-base text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-sm md:text-xs text-[var(--text-secondary)] mt-2">
                  Enter a direct link to your logo image (PNG, JPG, or SVG)
                </p>
                {settings.logo_url && (
                  <div className="mt-3 p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg">
                    <p className="text-xs text-[var(--text-secondary)] mb-2">Logo Preview (will appear circular in sidebar):</p>
                    <img 
                      src={settings.logo_url} 
                      alt="Logo preview" 
                      className="w-14 h-14 object-cover rounded-full border-2 border-emerald-500/20"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling!.classList.remove('hidden');
                      }}
                    />
                    <p className="text-xs text-red-500 hidden">Failed to load image</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-base md:text-sm font-medium text-[var(--text-primary)] mb-2">
                  Business Email
                </label>
                <input
                  type="email"
                  value={settings.business_email}
                  onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-base text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500"
                  placeholder="business@example.com"
                />
              </div>

              <div>
                <label className="block text-base md:text-sm font-medium text-[var(--text-primary)] mb-2">
                  Business Phone
                </label>
                <input
                  type="tel"
                  value={settings.business_phone}
                  onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-base text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500"
                  placeholder="+254 700 000 000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-base md:text-sm font-medium text-[var(--text-primary)] mb-2">
                  Business Address
                </label>
                <textarea
                  value={settings.business_address}
                  onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                  rows={3}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-base text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter your business address"
                />
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4 md:p-6">
            <h2 className="text-xl md:text-lg font-semibold text-[var(--text-primary)] mb-4">Branding</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base md:text-sm font-medium text-[var(--text-primary)] mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="h-12 w-20 rounded border border-[var(--border-color)]"
                  />
                  <input
                    type="text"
                    value={settings.primary_color}
                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                    className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-base text-[var(--text-primary)]"
                    placeholder="#10b981"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Currency */}
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4 md:p-6">
            <h2 className="text-xl md:text-lg font-semibold text-[var(--text-primary)] mb-4">Currency</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base md:text-sm font-medium text-[var(--text-primary)] mb-2">
                  Currency Code
                </label>
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-base text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500"
                  placeholder="KES"
                />
              </div>

              <div>
                <label className="block text-base md:text-sm font-medium text-[var(--text-primary)] mb-2">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={settings.currency_symbol}
                  onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-base text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500"
                  placeholder="KSh"
                />
              </div>
            </div>
          </div>

          {/* Social Media Links */}
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4 md:p-6">
            <h2 className="text-xl md:text-lg font-semibold text-[var(--text-primary)] mb-4">Social Media Links</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Add your social media profile URLs. These will appear on your landing page.
            </p>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-base md:text-sm font-medium text-[var(--text-primary)] mb-2">
                  TikTok URL
                </label>
                <input
                  type="url"
                  value={settings.tiktok_url}
                  onChange={(e) => setSettings({ ...settings, tiktok_url: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-base text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://www.tiktok.com/@yourusername"
                />
              </div>

              <div>
                <label className="block text-base md:text-sm font-medium text-[var(--text-primary)] mb-2">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={settings.instagram_url}
                  onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-base text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://www.instagram.com/yourusername"
                />
              </div>

              <div>
                <label className="block text-base md:text-sm font-medium text-[var(--text-primary)] mb-2">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={settings.facebook_url}
                  onChange={(e) => setSettings({ ...settings, facebook_url: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-base text-[var(--text-primary)] focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://www.facebook.com/yourpage"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 text-base border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 text-base bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 font-medium"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

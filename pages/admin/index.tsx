/**
 * Admin Panel — Tenant Management
 * Route: /admin
 * Access: superadmin only
 */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

interface Tenant {
  id: string;
  business_name: string;
  slug: string;
  business_email: string;
  business_phone: string;
  is_active: boolean;
  theme_color: string;
  created_at: string;
  user_count: number;
}

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

export default function AdminPanel() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    business_name: '', slug: '', business_email: '', business_phone: '',
    business_type: 'Retail Store', currency: 'KES', currency_symbol: 'KSh',
    theme_color: '#10b981', owner_name: '', owner_email: '', owner_password: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }

    // Frontend guard: check user role from localStorage
    // Backend will also enforce this — this is just UX protection
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        // Only superadmin or Admin role can access this page
        if (user.role !== 'Admin' && user.system_role !== 'superadmin') {
          router.replace('/dashboard-pro');
          return;
        }
      }
    } catch {}

    loadTenants();
  }, []);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tenants', { headers: authHeaders() });
      if (res.status === 403) { router.replace('/dashboard-pro'); return; }
      const data = await res.json();
      setTenants(data.tenants || []);
    } catch { setError('Failed to load tenants'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.business_name || !form.slug || !form.owner_email || !form.owner_password) {
      return setError('All required fields must be filled');
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const shopUrl = `${window.location.origin}/s/${form.slug}`;
      setSuccess(`✅ "${form.business_name}" created!\n🔗 Shop URL: ${shopUrl}\n👤 Owner: ${form.owner_email}`);
      setShowCreate(false);
      setForm({ business_name: '', slug: '', business_email: '', business_phone: '', business_type: 'Retail Store', currency: 'KES', currency_symbol: 'KSh', theme_color: '#10b981', owner_name: '', owner_email: '', owner_password: '' });
      loadTenants();
    } catch (err: any) { setError(err.message); }
    finally { setCreating(false); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await fetch(`/api/admin/tenants/${id}`, {
      method: 'PUT', headers: authHeaders(), body: JSON.stringify({ is_active: !current }),
    });
    loadTenants();
  };

  const s = { // styles
    page: { minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
    header: { padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    logo: { display: 'flex', alignItems: 'center', gap: 10 },
    logoIcon: { width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 18 },
    main: { padding: '32px', maxWidth: 1200, margin: '0 auto' },
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 },
    btn: { padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
    btnPrimary: { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' },
    btnGhost: { background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)' },
    input: { width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const },
    label: { display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6, fontWeight: 500 },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
    badge: (active: boolean) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: active ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: active ? '#6ee7b7' : '#fca5a5' }),
  };

  return (
    <>
      <Head><title>Admin Panel — SmartPOS</title></Head>
      <div style={s.page}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.logo}>
            <div style={s.logoIcon}>S</div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff' }}>SmartPOS Admin</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Tenant Management</div>
            </div>
          </div>
          <button style={{ ...s.btn, ...s.btnGhost }} onClick={() => { localStorage.clear(); router.push('/login'); }}>
            Sign Out
          </button>
        </div>

        <div style={s.main}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Tenants', value: tenants.length },
              { label: 'Active', value: tenants.filter(t => t.is_active).length },
              { label: 'Inactive', value: tenants.filter(t => !t.is_active).length },
            ].map(stat => (
              <div key={stat.label} style={s.card}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Alerts */}
          {error && <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 14 }}>{error}</div>}
          {success && <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', fontSize: 14 }}>{success}</div>}

          {/* Tenants table */}
          <div style={s.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>Tenants</h2>
              <button style={{ ...s.btn, ...s.btnPrimary }} onClick={() => setShowCreate(true)}>+ New Tenant</button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading...</div>
            ) : tenants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>No tenants yet. Create your first one.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Business', 'Shop URL', 'Email', 'Users', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tenants.map(t => {
                    const shopUrl = `${window.location.origin}/s/${t.slug}`;
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px', color: '#f1f5f9', fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.theme_color }} />
                            {t.business_name}
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <a 
                              href={shopUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{ color: '#10b981', fontSize: 13, fontFamily: 'monospace', textDecoration: 'none' }}
                              title={shopUrl}
                            >
                              /s/{t.slug}
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(shopUrl);
                                setSuccess(`✅ Copied: ${shopUrl}`);
                                setTimeout(() => setSuccess(''), 2000);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
                              title="Copy full URL"
                            >
                              📋
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '12px', color: '#94a3b8', fontSize: 13 }}>{t.business_email || '—'}</td>
                        <td style={{ padding: '12px', color: '#94a3b8' }}>{t.user_count}</td>
                        <td style={{ padding: '12px' }}><span style={s.badge(t.is_active)}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td style={{ padding: '12px', color: '#64748b', fontSize: 13 }}>{new Date(t.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ ...s.btn, ...s.btnGhost, padding: '6px 12px', fontSize: 12 }} onClick={() => router.push(`/admin/tenants/${t.id}`)}>
                              View
                            </button>
                            <button style={{ ...s.btn, padding: '6px 12px', fontSize: 12, background: t.is_active ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: t.is_active ? '#fca5a5' : '#6ee7b7', border: 'none', cursor: 'pointer', borderRadius: 8, fontWeight: 600 }} onClick={() => toggleActive(t.id, t.is_active)}>
                              {t.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Create Tenant Modal */}
        {showCreate && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
            <div style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: 20, fontWeight: 700 }}>Create New Tenant</h3>
                <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 20 }}>✕</button>
              </div>

              {error && <div style={{ marginBottom: 16, padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#fca5a5', fontSize: 13 }}>{error}</div>}

              <form onSubmit={handleCreate}>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Business Info</div>
                  <div style={s.grid2}>
                    <div>
                      <label style={s.label}>Business Name *</label>
                      <input style={s.input} value={form.business_name} onChange={e => setForm(p => ({ ...p, business_name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') }))} placeholder="Nyla Wigs" required />
                    </div>
                    <div>
                      <label style={s.label}>Slug * (URL identifier)</label>
                      <input style={s.input} value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} placeholder="nyla-wigs" required />
                    </div>
                    <div>
                      <label style={s.label}>Business Email</label>
                      <input style={s.input} type="email" value={form.business_email} onChange={e => setForm(p => ({ ...p, business_email: e.target.value }))} placeholder="info@nylawigs.com" />
                    </div>
                    <div>
                      <label style={s.label}>Phone</label>
                      <input style={s.input} value={form.business_phone} onChange={e => setForm(p => ({ ...p, business_phone: e.target.value }))} placeholder="+254700000000" />
                    </div>
                    <div>
                      <label style={s.label}>Currency</label>
                      <select style={s.input} value={form.currency} onChange={e => setForm(p => ({ ...p, currency: e.target.value }))}>
                        {['KES', 'USD', 'UGX', 'TZS', 'NGN', 'GHS'].map(c => <option key={c} value={c} style={{ background: '#1e293b' }}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={s.label}>Theme Color</label>
                      <input style={{ ...s.input, padding: '6px 14px' }} type="color" value={form.theme_color} onChange={e => setForm(p => ({ ...p, theme_color: e.target.value }))} />
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Owner Account</div>
                  <div style={s.grid2}>
                    <div>
                      <label style={s.label}>Owner Name</label>
                      <input style={s.input} value={form.owner_name} onChange={e => setForm(p => ({ ...p, owner_name: e.target.value }))} placeholder="Jane Doe" />
                    </div>
                    <div>
                      <label style={s.label}>Owner Email *</label>
                      <input style={s.input} type="email" value={form.owner_email} onChange={e => setForm(p => ({ ...p, owner_email: e.target.value }))} placeholder="jane@nylawigs.com" required />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={s.label}>Temporary Password *</label>
                      <input style={s.input} type="password" value={form.owner_password} onChange={e => setForm(p => ({ ...p, owner_password: e.target.value }))} placeholder="Min. 8 characters" required minLength={8} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="button" onClick={() => setShowCreate(false)} style={{ ...s.btn, ...s.btnGhost, flex: 1 }}>Cancel</button>
                  <button type="submit" disabled={creating} style={{ ...s.btn, ...s.btnPrimary, flex: 2, opacity: creating ? 0.6 : 1 }}>
                    {creating ? 'Creating...' : 'Create Tenant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

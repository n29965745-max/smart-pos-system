/**
 * Tenant-branded login page
 * Route: /s/[slug]/login
 * Example: /s/nyla-wigs/login
 */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  theme_color: string;
  logo_url: string | null;
  tagline: string | null;
}

export default function TenantLogin() {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    const token = localStorage.getItem('token');
    if (token) { router.replace('/dashboard-pro'); return; }

    fetch(`/api/tenant/by-slug/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.tenant) setTenant(d.tenant);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.error || 'Login failed');

      // Verify this user belongs to this tenant
      if (!data.is_super_admin && data.user.tenant_id !== tenant?.id) {
        throw new Error('This account does not belong to this shop');
      }

      const user = {
        id: data.user.id,
        username: data.user.full_name,
        email: data.user.email,
        phone: data.user.phone,
        role: data.user.role || 'Admin',
        system_role: data.user.system_role || 'user',
        tenant_id: data.user.tenant_id,
      };

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('tenant_id', user.tenant_id || '');

      if (data.is_super_admin) {
        router.push('/admin');
      } else {
        router.push('/dashboard-pro');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b', fontFamily: 'sans-serif' }}>Loading...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', color: '#e2e8f0' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Shop not found</h1>
        <Link href="/" style={{ color: '#10b981', textDecoration: 'none' }}>← Back to home</Link>
      </div>
    );
  }

  if (!tenant) return null;

  const color = tenant.theme_color || '#10b981';
  const initial = tenant.name.charAt(0).toUpperCase();

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <>
      <Head>
        <title>Sign In — {tenant.name}</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
      }}>
        {/* Left panel */}
        <div className="hidden lg:flex" style={{ width: '50%', padding: '48px', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
          {/* Glow */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '20%', left: '20%', width: 300, height: 300, borderRadius: '50%', background: color, opacity: 0.08, filter: 'blur(60px)' }} />
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Logo + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48 }}>
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}`, background: '#fff', padding: 3 }} />
              ) : (
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: '#fff' }}>
                  {initial}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{tenant.name}</div>
                {tenant.tagline && <div style={{ fontSize: 13, color: '#64748b' }}>{tenant.tagline}</div>}
              </div>
            </div>

            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>
              Business Management<br />
              <span style={{ color }}>System</span>
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.6, maxWidth: 380 }}>
              Streamline your inventory, boost sales, and grow your business with our modern POS solution
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {['Real-time inventory tracking', 'Customer management & SMS', 'Advanced analytics & reports'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, color: '#94a3b8', fontSize: 14 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — login form */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px' }}>
          <div style={{ width: '100%', maxWidth: 420 }}>
            {/* Mobile logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
              {tenant.logo_url ? (
                <img src={tenant.logo_url} alt={tenant.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}`, background: '#fff', padding: 2 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff' }}>
                  {initial}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 16 }}>{tenant.name}</div>
                {tenant.tagline && <div style={{ fontSize: 12, color: '#64748b' }}>{tenant.tagline}</div>}
              </div>
            </div>

            {/* Card */}
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 32, backdropFilter: 'blur(20px)' }}>
              <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Welcome back</h2>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28 }}>Sign in to your account to continue</p>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    style={inputStyle}
                    onFocus={e => e.currentTarget.style.borderColor = color}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    style={inputStyle}
                    onFocus={e => e.currentTarget.style.borderColor = color}
                    onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>

                {error && (
                  <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13 }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '13px',
                    borderRadius: 10,
                    background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 15,
                    border: 'none',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    marginTop: 4,
                  }}
                >
                  {submitting ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <a href="#" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>Forgot your password?</a>
              </div>
            </div>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#334155' }}>
              Protected by enterprise-grade security
            </p>

            <p style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: '#334155' }}>
              <Link href={`/s/${slug}`} style={{ color: '#475569', textDecoration: 'none' }}>← Back to {tenant.name}</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

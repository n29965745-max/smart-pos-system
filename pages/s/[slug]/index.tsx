/**
 * Tenant-branded landing page
 * Route: /s/[slug]
 * Example: /s/nyla-wigs
 */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  type: string;
  theme_color: string;
  logo_url: string | null;
  tagline: string | null;
  phone: string | null;
}

export default function TenantLanding() {
  const router = useRouter();
  const { slug } = router.query as { slug: string };
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;

    // If already logged in, go to dashboard
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/dashboard-pro');
      return;
    }

    fetch(`/api/tenant/by-slug/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.tenant) setTenant(d.tenant);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, router]);

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
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Shop not found</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>The shop "{slug}" doesn't exist or is inactive.</p>
        <Link href="/" style={{ color: '#10b981', textDecoration: 'none' }}>← Back to home</Link>
      </div>
    );
  }

  if (!tenant) return null;

  const color = tenant.theme_color || '#10b981';
  const initial = tenant.name.charAt(0).toUpperCase();

  return (
    <>
      <Head>
        <title>{tenant.name} — Business Management System</title>
        <meta name="description" content={`${tenant.name} — ${tenant.tagline || 'Business Management System'}`} />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
      }}>
        {/* Ambient glow */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '20%', left: '30%', width: 400, height: 400, borderRadius: '50%', background: color, opacity: 0.06, filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: '20%', right: '30%', width: 300, height: 300, borderRadius: '50%', background: color, opacity: 0.04, filter: 'blur(60px)' }} />
        </div>

        {/* Logo */}
        <div style={{ marginBottom: 24, position: 'relative', zIndex: 1 }}>
          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${color}`, background: '#fff', padding: 4 }}
              onError={e => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: `linear-gradient(135deg, ${color}, ${color}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 800, color: '#fff', border: `3px solid ${color}40` }}>
              {initial}
            </div>
          )}
        </div>

        {/* Business name */}
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, margin: '0 0 8px', color: '#fff', position: 'relative', zIndex: 1 }}>
          {tenant.name}
        </h1>
        <h2 style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 700, margin: '0 0 16px', color, position: 'relative', zIndex: 1 }}>
          Business Management System
        </h2>

        {tenant.tagline && (
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6, position: 'relative', zIndex: 1 }}>
            {tenant.tagline}
          </p>
        )}

        {/* CTA buttons */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
          <Link
            href={`/s/${slug}/login`}
            style={{
              padding: '14px 32px',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              color: '#fff',
              textDecoration: 'none',
              fontSize: 16,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            🔐 Login to Dashboard
          </Link>
        </div>

        {/* Features */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 40, position: 'relative', zIndex: 1 }}>
          {['Real-time inventory tracking', 'Customer management & SMS', 'Advanced analytics & reports'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: 14 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              {f}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 1, color: '#475569', fontSize: 13 }}>
          {tenant.phone && <div style={{ marginBottom: 4 }}>📞 {tenant.phone}</div>}
          <div>© {new Date().getFullYear()} {tenant.name}. All rights reserved.</div>
        </div>
      </div>
    </>
  );
}

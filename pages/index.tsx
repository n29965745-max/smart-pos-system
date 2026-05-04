import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // If already logged in, go straight to dashboard
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/dashboard-pro');
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>SmartPOS — Modern Point of Sale for Growing Businesses</title>
        <meta name="description" content="Manage inventory, track sales, send SMS to customers — all in one place." />
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: '#e2e8f0',
      }}>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, color: '#fff' }}>S</div>
            <span style={{ fontWeight: 700, fontSize: 20, color: '#fff' }}>SmartPOS</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/login" style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
              Sign In
            </Link>
            <Link href="/signup" style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
              Get Started Free
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <div style={{ textAlign: 'center', padding: '80px 20px 60px' }}>
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 20, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', fontSize: 13, marginBottom: 24 }}>
            Built for small & medium retail businesses
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 800, lineHeight: 1.1, margin: '0 0 20px', color: '#fff' }}>
            The POS system that<br />
            <span style={{ color: '#10b981' }}>grows with your shop</span>
          </h1>
          <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Manage inventory, track sales, handle debts, and send SMS to customers — all from one dashboard.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{ padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', textDecoration: 'none', fontSize: 16, fontWeight: 700, display: 'inline-block' }}>
              Start for free →
            </Link>
            <Link href="/login" style={{ padding: '14px 32px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', color: '#cbd5e1', textDecoration: 'none', fontSize: 16, fontWeight: 500, display: 'inline-block' }}>
              Sign in to your shop
            </Link>
          </div>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 1000, margin: '0 auto', padding: '0 20px 80px' }}>
          {[
            { icon: '🛒', title: 'Point of Sale', desc: 'Fast checkout with barcode scanning, cart management, and receipt printing.' },
            { icon: '📦', title: 'Inventory', desc: 'Real-time stock tracking, low stock alerts, and restock management.' },
            { icon: '👥', title: 'Customers & Debts', desc: 'Track customer credit, manage debts, and view purchase history.' },
            { icon: '📊', title: 'Analytics', desc: 'Sales reports, profit tracking, and business insights at a glance.' },
            { icon: '💬', title: 'SMS Marketing', desc: 'Send thank-you messages and promotions to customers via Africa\'s Talking.' },
            { icon: '🔒', title: 'Multi-Tenant', desc: 'Each shop gets its own isolated data. Secure and scalable by design.' },
          ].map(f => (
            <div key={f.title} style={{ padding: 24, borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', padding: '40px 20px 80px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Ready to get started?</h2>
          <p style={{ color: '#64748b', marginBottom: 28 }}>Set up your shop in under 2 minutes. No credit card required.</p>
          <Link href="/signup" style={{ padding: '14px 36px', borderRadius: 12, background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', textDecoration: 'none', fontSize: 16, fontWeight: 700, display: 'inline-block' }}>
            Create your shop →
          </Link>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#334155', fontSize: 13 }}>
          © 2026 SmartPOS · <Link href="/login" style={{ color: '#475569', textDecoration: 'none' }}>Sign In</Link> · <Link href="/signup" style={{ color: '#475569', textDecoration: 'none' }}>Sign Up</Link>
        </div>
      </div>
    </>
  );
}

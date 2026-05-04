import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

const BUSINESS_TYPES = [
  'Retail Store', 'Boutique / Fashion', 'Grocery / Supermarket',
  'Electronics', 'Pharmacy', 'Restaurant / Cafe', 'Hardware Store',
  'Beauty & Cosmetics', 'Wholesale', 'Other',
];

export default function Signup() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1 = shop info, 2 = account info
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    business_name: '',
    business_type: 'Retail Store',
    business_email: '',
    business_phone: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    confirm_password: '',
  });

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.business_name.trim()) return setError('Shop name is required');
    if (!form.business_phone.trim()) return setError('Phone number is required');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.admin_name.trim()) return setError('Your name is required');
    if (!form.admin_email.trim()) return setError('Email is required');
    if (form.admin_password.length < 8) return setError('Password must be at least 8 characters');
    if (form.admin_password !== form.confirm_password) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await fetch('/api/tenant/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: form.business_name,
          business_type: form.business_type,
          business_email: form.business_email || form.admin_email,
          business_phone: form.business_phone,
          admin_name: form.admin_name,
          admin_email: form.admin_email,
          admin_password: form.admin_password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      // Redirect to login with success message
      router.push('/login?registered=1');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-500 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>S</div>
            <span className="text-white text-2xl font-bold">SmartPOS</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            Start selling smarter<br />
            <span style={{ color: '#10b981' }}>in minutes</span>
          </h1>
          <p className="text-slate-400 text-lg mb-10">
            Set up your shop, manage inventory, track sales, and send SMS to customers — all in one place.
          </p>
          <div className="space-y-4">
            {['Free to get started', 'No credit card required', 'Full POS + inventory system', 'SMS customer messaging'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.2)' }}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-slate-300">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-slate-500 text-sm">© 2026 SmartPOS. All rights reserved.</p>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map(s => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                    style={{
                      background: step >= s ? '#10b981' : 'rgba(255,255,255,0.1)',
                      color: step >= s ? '#fff' : '#94a3b8',
                    }}>
                    {step > s ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s}
                  </div>
                  <span className="text-sm hidden sm:block" style={{ color: step >= s ? '#e2e8f0' : '#64748b' }}>
                    {s === 1 ? 'Shop Info' : 'Your Account'}
                  </span>
                </div>
                {s < 2 && <div className="flex-1 h-px" style={{ background: step > s ? '#10b981' : 'rgba(255,255,255,0.1)' }} />}
              </React.Fragment>
            ))}
          </div>

          <div className="rounded-2xl p-8" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
            <h2 className="text-2xl font-bold text-white mb-1">
              {step === 1 ? 'Tell us about your shop' : 'Create your account'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {step === 1 ? 'Step 1 of 2 — Shop details' : 'Step 2 of 2 — Admin login credentials'}
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                {error}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleNext} className="space-y-4">
                <Field label="Shop Name *" value={form.business_name} onChange={v => set('business_name', v)} placeholder="e.g. Nyla Wigs" />
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>Business Type</label>
                  <select
                    value={form.business_type}
                    onChange={e => set('business_type', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                  >
                    {BUSINESS_TYPES.map(t => <option key={t} value={t} style={{ background: '#1e293b' }}>{t}</option>)}
                  </select>
                </div>
                <Field label="Phone Number *" value={form.business_phone} onChange={v => set('business_phone', v)} placeholder="+254700000000" type="tel" />
                <Field label="Business Email (optional)" value={form.business_email} onChange={v => set('business_email', v)} placeholder="shop@example.com" type="email" />

                <button type="submit" className="w-full py-3 rounded-xl font-semibold text-white transition-all mt-2"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  Continue →
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Field label="Your Full Name *" value={form.admin_name} onChange={v => set('admin_name', v)} placeholder="Jane Doe" />
                <Field label="Email Address *" value={form.admin_email} onChange={v => set('admin_email', v)} placeholder="you@example.com" type="email" />
                <Field label="Password *" value={form.admin_password} onChange={v => set('admin_password', v)} placeholder="Min. 8 characters" type="password" />
                <Field label="Confirm Password *" value={form.confirm_password} onChange={v => set('confirm_password', v)} placeholder="Repeat password" type="password" />

                <div className="flex gap-3 mt-2">
                  <button type="button" onClick={() => { setStep(1); setError(''); }}
                    className="flex-1 py-3 rounded-xl font-semibold transition-all"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#94a3b8' }}>
                    ← Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                    {loading ? 'Creating shop...' : 'Create Shop'}
                  </button>
                </div>
              </form>
            )}

            <p className="text-center text-sm mt-6" style={{ color: '#64748b' }}>
              Already have an account?{' '}
              <Link href="/login" className="font-medium" style={{ color: '#10b981' }}>Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable input field
function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all placeholder-slate-600"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
        onFocus={e => e.currentTarget.style.borderColor = '#10b981'}
        onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      />
    </div>
  );
}

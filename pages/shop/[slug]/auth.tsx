import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useShopTheme } from '@/hooks/useShopTheme';

interface Product {
  id: string;
  name: string;
  retail_price: number;
  image_url?: string;
}

// ── Left panel: auto-sliding product ad carousel ──────────────────────────────
function AdCarousel({ slug, primary, shopName }: { slug: string; primary: string; shopName: string }) {
  const [slides, setSlides] = useState<Product[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetch(`/api/ecommerce/products/simple?tenantSlug=${slug}&limit=20`)
      .then(r => r.json())
      .then(d => {
        // Pick 5 products that have images, fallback to any 5
        const withImages = (d.products || []).filter((p: Product) => p.image_url);
        const pool = withImages.length >= 5 ? withImages : (d.products || []);
        setSlides(pool.slice(0, 5));
      })
      .catch(() => {});
  }, [slug]);

  const next = useCallback(() => setCurrent(c => (c + 1) % Math.max(slides.length, 1)), [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(next, 3500);
    return () => clearInterval(t);
  }, [slides.length, next]);

  // Ad copy per slide
  const adCopy = [
    { headline: 'New Arrivals', sub: 'Fresh styles just dropped' },
    { headline: 'Best Sellers', sub: 'What everyone is buying' },
    { headline: 'Limited Stock', sub: 'Grab yours before it\'s gone' },
    { headline: 'Top Deals', sub: 'Save big on quality products' },
    { headline: 'Shop Now', sub: 'Fast delivery to your door' },
  ];

  if (slides.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: primary }}>
        <div className="text-center text-white p-8">
          <div className="text-7xl mb-4">🛍️</div>
          <h2 className="text-3xl font-bold mb-2">{shopName}</h2>
          <p className="text-white/80">Discover amazing products</p>
        </div>
      </div>
    );
  }

  const slide = slides[current];
  const copy = adCopy[current % adCopy.length];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Slides */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          {s.image_url ? (
            <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl" style={{ backgroundColor: primary }}>📦</div>
          )}
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
      ))}

      {/* Ad text overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
        <div className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 text-white" style={{ backgroundColor: primary }}>
          {shopName}
        </div>
        <h2 className="text-3xl font-bold mb-1">{copy.headline}</h2>
        <p className="text-white/80 text-sm mb-4">{copy.sub}</p>
        <p className="text-lg font-semibold">{slide.name}</p>
        <p className="text-white/70 text-sm">KES {slide.retail_price.toLocaleString()}</p>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 right-6 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="w-2 h-2 rounded-full transition-all"
            style={{ backgroundColor: i === current ? 'white' : 'rgba(255,255,255,0.4)', transform: i === current ? 'scale(1.3)' : 'scale(1)' }}
          />
        ))}
      </div>

      {/* Arrow nav */}
      <button
        onClick={() => setCurrent(c => (c - 1 + slides.length) % slides.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center transition"
      >‹</button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center transition"
      >›</button>
    </div>
  );
}

// ── Main auth page ─────────────────────────────────────────────────────────────
export default function ShopAuth() {
  const router = useRouter();
  const { slug } = router.query;
  const theme = useShopTheme(slug);
  const p = theme.primary;

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/api/ecommerce/auth/login' : '/api/ecommerce/auth/register';
      const body = mode === 'login'
        ? { email, password, tenantSlug: slug }
        : { email, password, name, phone, tenantSlug: slug };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
      localStorage.setItem(`customer_${slug}`, JSON.stringify(data.customer || data));
      router.push(`/shop/${slug}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>{mode === 'login' ? 'Sign In' : 'Register'} – {theme.name || slug}</title></Head>

      <div className="min-h-screen flex">
        {/* ── LEFT: Ad Carousel ── */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <AdCarousel slug={slug as string} primary={p} shopName={theme.name || String(slug)} />
        </div>

        {/* ── RIGHT: Auth Card ── */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center bg-gray-50 p-6">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 relative">
            {/* Close / back */}
            <Link href={`/shop/${slug}`} className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 text-xl leading-none">×</Link>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h1>

            {/* Protected badge */}
            <div className="flex items-center gap-2 text-green-600 text-sm mb-6">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
              </svg>
              Your information is protected
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Enter your full name"
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 bg-gray-50"
                      style={{ '--tw-ring-color': p } as any}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-gray-50"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none bg-gray-50"
                />
              </div>

              {/* CTA Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-4 rounded-xl font-semibold text-base transition disabled:opacity-60 mt-2"
                style={{ backgroundColor: p }}
              >
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            {/* Toggle mode */}
            <p className="text-center text-sm text-gray-500 mt-4">
              {mode === 'login' ? (
                <>Don't have an account?{' '}
                  <button onClick={() => { setMode('register'); setError(''); }} className="font-semibold" style={{ color: p }}>Register</button>
                </>
              ) : (
                <>Already have an account?{' '}
                  <button onClick={() => { setMode('login'); setError(''); }} className="font-semibold" style={{ color: p }}>Sign In</button>
                </>
              )}
            </p>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">Or continue with</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Social buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-5 leading-relaxed">
              By continuing, you agree to our{' '}
              <a href="#" className="underline">Terms of Service</a> and{' '}
              <a href="#" className="underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

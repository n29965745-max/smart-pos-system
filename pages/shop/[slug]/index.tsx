import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { createClient } from '@supabase/supabase-js';
import RecommendationEngine from '@/components/Shop/RecommendationEngine';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import LiveSupport from '@/components/Shop/LiveSupport';

// Server-side: fetch shop info and initial products for SEO
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch tenant info
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, business_name, tagline, logo_url, primary_color')
      .eq('subdomain', slug)
      .eq('is_active', true)
      .single();

    if (!tenant) return { notFound: true };

    // Fetch shop settings for richer branding
    const { data: settings } = await supabase
      .from('shop_settings')
      .select('logo_url, business_tagline, primary_color')
      .eq('tenant_id', tenant.id)
      .single();

    // Fetch first 12 products for SEO content
    const { data: products } = await supabase
      .from('products')
      .select('id, name, retail_price, category, image_url, description')
      .eq('tenant_id', tenant.id)
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(12);

    return {
      props: {
        seo: {
          shopName: tenant.business_name,
          tagline: settings?.business_tagline || tenant.tagline || `Shop quality products at ${tenant.business_name}`,
          logoUrl: settings?.logo_url || tenant.logo_url || null,
          primaryColor: settings?.primary_color || tenant.primary_color || '#10b981',
          productCount: products?.length || 0,
          featuredProducts: (products || []).slice(0, 3).map(p => p.name),
        },
      },
    };
  } catch {
    return { props: { seo: null } };
  }
};

interface Product {
  id: string;
  name: string;
  retail_price: number;
  stock_quantity: number;
  category: string;
  image_url?: string;
  description?: string;
}

function seededRandom(seed: string, min: number, max: number) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  return Math.floor(((h >>> 0) / 0xffffffff) * (max - min + 1)) + min;
}

function ProductCard({ product, slug, primary, onHover }: { product: Product; slug: string; primary: string; onHover?: (id: string | null) => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const discount = seededRandom(product.id, 20, 85);
  const rating = (3.5 + seededRandom(product.id + 'r', 0, 15) / 10).toFixed(1);
  const sold = seededRandom(product.id + 's', 100, 50000);
  const originalPrice = Math.round(product.retail_price / (1 - discount / 100));
  const savings = Math.round(product.retail_price * seededRandom(product.id + 'sv', 5, 30) / 100);
  const isNew = seededRandom(product.id + 'n', 0, 4) === 0;

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    const cart = JSON.parse(localStorage.getItem(`cart_${slug}`) || '[]');
    const existing = cart.find((i: any) => i.product_id === product.id);
    if (existing) existing.quantity += 1;
    else cart.push({ product_id: product.id, product_name: product.name, product_price: product.retail_price, quantity: 1, image_url: product.image_url });
    localStorage.setItem(`cart_${slug}`, JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const handleMouseEnter = () => {
    setTimeout(() => {
      setIsHovered(true);
      onHover?.(product.id);
    }, 300);
  };

  const handleMouseLeave = () => {
    setTimeout(() => {
      setIsHovered(false);
      onHover?.(null);
    }, 150);
  };

  return (
    <Link href={`/shop/${slug}/product/${product.id}`}>
      <div 
        className="bg-white border border-gray-200 hover:shadow-lg transition-all cursor-pointer group relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              className={`w-full h-full object-cover transition-transform duration-300 ${isHovered ? 'scale-110' : 'scale-105 group-hover:scale-105'}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-gray-100">📦</div>
          )}
          {isNew && (
            <div className="absolute top-0 left-0 right-0 text-white text-xs text-center py-0.5 font-medium" style={{ backgroundColor: primary }}>
              WELCOME DEAL · Free shipping
            </div>
          )}
          
          {/* Hover overlay with quick actions */}
          {isHovered && (
            <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center transition-opacity duration-200">
              <button
                onClick={addToCart}
                className="text-white px-4 py-2 rounded-lg font-medium text-sm shadow-lg transform hover:scale-105 transition-transform"
                style={{ backgroundColor: primary }}
              >
                Quick Add to Cart
              </button>
            </div>
          )}
          
          {!isHovered && (
            <button
              onClick={addToCart}
              className="absolute bottom-2 right-2 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              style={{ backgroundColor: primary }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          )}
          
          {/* Stock indicator on hover */}
          {isHovered && product.stock_quantity > 0 && (
            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
              {product.stock_quantity} in stock
            </div>
          )}
        </div>
        <div className="p-2">
          <div className="flex gap-1 mb-1">
            <span className="text-xs px-1.5 py-0.5 rounded font-medium text-white" style={{ backgroundColor: primary }}>Sale</span>
          </div>
          <p className="text-xs text-gray-700 line-clamp-2 h-8 mb-1 leading-4">{product.name}</p>
          <div className="flex items-baseline gap-1 mb-0.5">
            <span className="text-base font-bold text-black">KES{product.retail_price.toLocaleString()}</span>
            <span className="text-xs text-gray-400 line-through">KES{originalPrice.toLocaleString()}</span>
            <span className="text-xs text-red-500 font-medium">-{discount}%</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-0.5">
            <span className="text-yellow-400">{'★'.repeat(Math.round(parseFloat(rating)))}</span>
            <span>{rating}</span>
            <span>|</span>
            <span>{sold.toLocaleString()}+ sold</span>
          </div>
          <p className="text-xs" style={{ color: primary }}>New shoppers save KES{savings.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">Free shipping</p>
        </div>
      </div>
    </Link>
  );
}

function Countdown({ endsIn }: { endsIn: number }) {
  const [secs, setSecs] = useState(endsIn);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return <span className="font-mono font-bold text-red-600">{h}:{m}:{s}</span>;
}

export default function ShopStorefront({ seo }: { seo: any }) {
  const router = useRouter();
  const { slug, q } = router.query;
  
  // Use server-side theme data directly to prevent flash of default theme
  const theme = {
    name: seo?.shopName || String(slug),
    slug: String(slug),
    tagline: seo?.tagline || null,
    logo_url: seo?.logoUrl || null,
    primary: seo?.primaryColor || '#10b981',
    phone: null,
    tiktok_url: null,
    instagram_url: null,
    facebook_url: null,
    loaded: true,
  };
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState((q as string) || '');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cartCount, setCartCount] = useState(0);
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { recentlyViewed } = useRecentlyViewed(String(slug));

  const updateCartCount = useCallback(() => {
    const cart = JSON.parse(localStorage.getItem(`cart_${slug}`) || '[]');
    setCartCount(cart.reduce((s: number, i: any) => s + i.quantity, 0));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`/api/ecommerce/products/simple?tenantSlug=${slug}&limit=100`)
      .then(r => r.json())
      .then(d => setProducts(d.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));

    updateCartCount();
    window.addEventListener('cart-updated', updateCartCount);
    return () => window.removeEventListener('cart-updated', updateCartCount);
  }, [slug, updateCartCount]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  
  // Apply search and category filters
  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All' || p.category === activeCategory;
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const bundleProducts = filtered.slice(0, 4);
  const superDealProducts = filtered.slice(4, 8);
  const mainProducts = filtered.slice(8);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/shop/${slug}?q=${encodeURIComponent(search)}`, undefined, { shallow: true });
    setShowSuggestions(false);
  };

  // Search autocomplete - trigger after 2 characters
  useEffect(() => {
    if (search.length >= 2) {
      const filtered = products
        .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 5);
      setSearchSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [search, products]);

  const p = theme.primary; // shorthand

  return (
    <>
      <Head>
        <title>{seo?.shopName || theme.name || String(slug)} - Online Store</title>
        <meta name="description" content={seo?.tagline || `Shop at ${seo?.shopName || slug}. Discover amazing deals on quality products with fast delivery.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Open Graph - for WhatsApp, Facebook, Twitter previews */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${seo?.shopName || theme.name || slug} - Online Store`} />
        <meta property="og:description" content={seo?.tagline || `Shop at ${seo?.shopName || slug}. Fast delivery, great prices.`} />
        {seo?.logoUrl && <meta property="og:image" content={seo.logoUrl} />}
        <meta property="og:site_name" content={seo?.shopName || String(slug)} />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${seo?.shopName || slug} - Online Store`} />
        <meta name="twitter:description" content={seo?.tagline || `Shop at ${seo?.shopName || slug}`} />
        {seo?.logoUrl && <meta name="twitter:image" content={seo.logoUrl} />}

        {/* Tell Google this is indexable */}
        <meta name="robots" content="index, follow" />

        {/* Structured data for Google Shopping / rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Store',
              name: seo?.shopName || String(slug),
              description: seo?.tagline,
              url: `https://${typeof window !== 'undefined' ? window.location.host : ''}/shop/${slug}`,
              logo: seo?.logoUrl,
            }),
          }}
        />
      </Head>

      <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 50%, #f3f4f6 100%)' }}>
        {/* HEADER */}
        <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-4 py-3">
              <Link href={`/shop/${slug}`} className="shrink-0 flex items-center gap-2">
                {theme.logo_url && (
                  <img src={theme.logo_url} alt="logo" className="h-9 w-auto object-contain" />
                )}
                <span className="text-xl font-extrabold tracking-tight" style={{ color: p }}>
                  {theme.name || slug}
                </span>
              </Link>

              <form onSubmit={handleSearch} className="flex-1 flex max-w-2xl relative">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => search.length >= 2 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search products..."
                  className="flex-1 border-2 rounded-l-md px-4 py-2 text-sm focus:outline-none"
                  style={{ borderColor: p }}
                />
                <button type="submit" className="text-white px-5 py-2 rounded-r-md text-sm font-medium" style={{ backgroundColor: p }}>
                  Search
                </button>
                
                {/* Search Autocomplete Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto" style={{ borderColor: p }}>
                    {searchSuggestions.map(suggestion => (
                      <Link
                        key={suggestion.id}
                        href={`/shop/${slug}/product/${suggestion.id}`}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {suggestion.image_url ? (
                            <img src={suggestion.image_url} alt={suggestion.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{suggestion.name}</p>
                          <p className="text-xs text-gray-500">{suggestion.category}</p>
                          <p className="text-sm font-bold" style={{ color: p }}>KES {suggestion.retail_price.toLocaleString()}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </form>

              <div className="flex items-center gap-5 shrink-0">
                <Link href={`/shop/${slug}/auth`} className="text-sm text-gray-600 hidden sm:block" style={{ color: undefined }}>
                  Sign in / Register
                </Link>
                <Link href={`/shop/${slug}/cart`} className="relative">
                  <svg className="w-7 h-7 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Category nav */}
            <nav className="flex items-center gap-1 py-2 border-t border-gray-100 overflow-x-auto">
              <button className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 whitespace-nowrap shrink-0 text-gray-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                All Categories
              </button>
              <span className="text-gray-300">|</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="text-sm px-3 py-1.5 whitespace-nowrap shrink-0 transition font-medium"
                  style={{ color: activeCategory === cat ? p : '#4b5563' }}
                >
                  {cat === 'All' ? 'SuperDeals' : cat}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* HERO - Enhanced with brand storytelling and animations */}
        <section className="relative overflow-hidden border-b" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fbbf24 50%, #f59e0b 75%, #d97706 100%)' }}>
          {/* Animated gradient background */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.8) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.6) 0%, transparent 50%)`,
              animation: 'gradient 15s ease infinite',
              backgroundSize: '200% 200%'
            }}
          />
          
          {/* Floating shapes animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute w-64 h-64 rounded-full"
              style={{
                background: 'rgba(255, 255, 255, 0.3)',
                top: '-10%',
                right: '-5%',
                animation: 'float 20s ease-in-out infinite'
              }}
            />
            <div 
              className="absolute w-96 h-96 rounded-full"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                bottom: '-15%',
                left: '-10%',
                animation: 'float 25s ease-in-out infinite reverse'
              }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-16">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Brand Story - Left side */}
              <div className="space-y-6 animate-fade-in">
                <div className="inline-block">
                  <span 
                    className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${p}20`, color: p }}
                  >
                    ✨ Welcome to {theme.name || slug}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                  {theme.tagline || `Discover Your Perfect ${products.length > 0 ? products[0].category : 'Style'}`}
                </h1>
                
                <p className="text-lg text-gray-600 leading-relaxed">
                  We're here to help you find exactly what you're looking for. 
                  Every product is carefully selected with you in mind. 
                  {products.length > 0 && ` Browse ${products.length}+ amazing items, `}
                  all with fast delivery and our happiness guarantee. 💝
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-white px-8 py-4 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    style={{ backgroundColor: p }}
                  >
                    Start Shopping 🛍️
                  </button>
                  <button
                    onClick={() => document.getElementById('deals')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-4 rounded-xl font-semibold text-base border-2 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 bg-white"
                    style={{ borderColor: p, color: p }}
                  >
                    View Deals ⚡
                  </button>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap gap-6 pt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🚚</span>
                    <span>Fast Delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🔒</span>
                    <span>Secure Payment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">💯</span>
                    <span>Quality Guaranteed</span>
                  </div>
                </div>
              </div>

              {/* Visual element - Right side */}
              <div className="relative hidden md:block">
                <div className="relative z-10 grid grid-cols-2 gap-4">
                  {products.slice(0, 4).map((prod, idx) => (
                    <div
                      key={prod.id}
                      className="aspect-square rounded-2xl overflow-hidden shadow-xl transform hover:scale-105 transition-transform duration-300"
                      style={{
                        animation: `fadeInUp 0.6s ease-out ${idx * 0.1}s both`
                      }}
                    >
                      {prod.image_url ? (
                        <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-gray-100 to-gray-200">
                          📦
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Add keyframes for animations */}
          <style jsx>{`
            @keyframes gradient {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(5deg); }
            }
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fade-in {
              animation: fadeInUp 0.8s ease-out;
            }
          `}</style>
        </section>

        {/* TODAY'S DEALS - Enhanced with warm copywriting */}
        {filtered.length > 0 && (
          <section id="deals" className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Today's Special Picks 🎁
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                We've handpicked these amazing deals just for you. 
                Limited time offers you don't want to miss!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Bundle Deals Card */}
              <div 
                className="bg-gradient-to-br from-white to-gray-50 border-2 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                style={{ borderColor: `${p}30` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                    style={{ backgroundColor: `${p}20` }}
                  >
                    🎁
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">Bundle & Save</h3>
                    <p className="text-sm text-gray-600">
                      Buy 3+ items, save up to 20% on each! 
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {bundleProducts.map(prod => (
                    <Link key={prod.id} href={`/shop/${slug}/product/${prod.id}`}>
                      <div className="group cursor-pointer">
                        <div className="aspect-square bg-white rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105 border border-gray-100">
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-gray-50 to-gray-100">📦</div>
                          )}
                        </div>
                        <p className="text-xs font-bold mt-2 text-center" style={{ color: p }}>
                          KES {prod.retail_price.toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    💝 Mix & match any items to unlock bundle savings
                  </p>
                </div>
              </div>

              {/* SuperDeals Card */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-2xl animate-pulse">
                    ⚡
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-red-600">Flash SuperDeals</h3>
                    <p className="text-sm text-gray-700 flex items-center gap-2">
                      Hurry! Ends in: <Countdown endsIn={53046} />
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {superDealProducts.map(prod => {
                    const disc = seededRandom(prod.id, 40, 85);
                    return (
                      <Link key={prod.id} href={`/shop/${slug}/product/${prod.id}`}>
                        <div className="group cursor-pointer">
                          <div className="relative aspect-square bg-white rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105 border border-red-100">
                            {prod.image_url ? (
                              <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-red-50 to-orange-50">📦</div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-600 to-red-500 text-white text-xs text-center py-1.5 font-bold shadow-lg">
                              -{disc}% OFF
                            </div>
                          </div>
                          <p className="text-xs font-bold mt-2 text-center text-red-600">
                            KES {prod.retail_price.toLocaleString()}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-red-200">
                  <p className="text-sm text-gray-700 text-center">
                    🔥 Grab these hot deals before they're gone!
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* RECENTLY VIEWED - Enhanced with warm copywriting */}
        {recentlyViewed.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 md:p-8 border border-purple-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    Welcome Back! 👋
                  </h2>
                  <p className="text-gray-600">
                    Pick up where you left off - here are the items you were checking out
                  </p>
                </div>
                <Link 
                  href="#" 
                  className="text-sm font-semibold hover:underline hidden md:block"
                  style={{ color: p }}
                >
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {recentlyViewed.slice(0, 6).map(item => (
                  <Link key={item.id} href={`/shop/${slug}/product/${item.id}`}>
                    <div className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100">
                      <div className="aspect-square bg-gray-50 relative overflow-hidden group">
                        {item.image_url ? (
                          <img 
                            src={item.image_url} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-50 to-gray-100">📦</div>
                        )}
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-700 line-clamp-2 mb-2 leading-relaxed">{item.name}</p>
                        <p className="text-sm font-bold" style={{ color: p }}>
                          KES {item.retail_price.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PERSONALIZED RECOMMENDATIONS - Enhanced */}
        {!loading && products.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-8 md:py-12 bg-gradient-to-b from-transparent to-gray-50">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Picked Just For You ✨
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Based on what you love, we think you'll enjoy these handpicked selections
              </p>
            </div>
            <RecommendationEngine
              tenantSlug={String(slug)}
              context="homepage"
              limit={6}
            />
          </section>
        )}

        {/* PRODUCT GRID - Enhanced header */}
        <section id="products" className="max-w-7xl mx-auto px-4 pb-12">
          {!loading && filtered.length > 0 && (
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Explore Our Collection 🌟
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-6">
                {filtered.length} amazing {filtered.length === 1 ? 'item' : 'items'} waiting for you. 
                Each one carefully selected to bring joy to your life.
              </p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div 
                className="inline-block w-16 h-16 border-4 border-gray-200 rounded-full animate-spin mb-4" 
                style={{ borderTopColor: p }} 
              />
              <p className="text-gray-600 text-lg font-medium">
                Finding perfect items for you...
              </p>
              <p className="text-gray-500 text-sm mt-2">This won't take long! ✨</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
              <div className="text-7xl mb-6 animate-bounce">🔍</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Oops! Nothing found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We couldn't find what you're looking for, but don't worry! 
                Try adjusting your filters or search terms.
              </p>
              <button 
                onClick={() => { setSearch(''); setActiveCategory('All'); }} 
                className="text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                style={{ backgroundColor: p }}
              >
                Show All Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-px bg-gray-200 rounded-lg overflow-hidden shadow-sm">
              {(mainProducts.length > 0 ? mainProducts : filtered).map(prod => (
                <ProductCard 
                  key={prod.id} 
                  product={prod} 
                  slug={slug as string} 
                  primary={p}
                />
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h4 className="font-semibold mb-3 text-sm">Customer service</h4>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Return & Refund Policy</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-sm">Shopping with us</h4>
                <ul className="space-y-2 text-xs text-gray-400">
                  <li><a href="#" className="hover:text-white">Delivery options</a></li>
                  <li><a href="#" className="hover:text-white">Buyer Protection</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-sm">Pay with</h4>
                <div className="flex flex-wrap gap-2">
                  {['VISA', 'Mastercard', 'M-PESA', 'Airtel'].map(m => (
                    <span key={m} className="bg-white text-gray-900 text-xs px-2 py-1 rounded font-medium">{m}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-sm">Stay connected</h4>
                <div className="flex gap-3 text-gray-400">
                  {theme.facebook_url && <a href={theme.facebook_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">f</a>}
                  {theme.instagram_url && <a href={theme.instagram_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">📷</a>}
                  {theme.tiktok_url && <a href={theme.tiktok_url} target="_blank" rel="noopener noreferrer" className="hover:text-white">♪</a>}
                </div>
                {theme.phone && <p className="text-xs text-gray-400 mt-2">📞 {theme.phone}</p>}
              </div>
            </div>
            <div className="border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
              © {new Date().getFullYear()} {theme.name || slug}. All rights reserved.
            </div>
          </div>
        </footer>

        {/* Live Support Chat Widget */}
        <LiveSupport
          tenantSlug={String(slug)}
          tenantId={String(slug)}
          customerName={undefined}
          customerEmail={undefined}
          primaryColor={p}
        />
      </div>
    </>
  );
}

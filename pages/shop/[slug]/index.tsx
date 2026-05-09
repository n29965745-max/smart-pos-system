import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import FlashDealBanner from '@/components/Ecommerce/FlashDealBanner';
import RecommendedProducts from '@/components/Ecommerce/RecommendedProducts';
import BundleDeals from '@/components/Ecommerce/BundleDeals';
import TrustBadges from '@/components/Ecommerce/TrustBadges';
import GamificationWidget from '@/components/Ecommerce/GamificationWidget';

interface Product {
  id: string;
  name: string;
  retail_price: number;
  stock_quantity: number;
  category: string;
  image_url?: string;
  description?: string;
}

interface ShopSettings {
  business_name: string;
  logo_url?: string;
}

export default function DesktopStorefront() {
  const router = useRouter();
  const { slug } = router.query;
  const [products, setProducts] = useState<Product[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [flashDeals, setFlashDeals] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  useEffect(() => {
    if (slug) {
      fetchShopSettings();
      fetchProducts();
      loadCartCount();
      fetchFlashDeals();
      fetchBundles();
      fetchRecommendations();
    }
  }, [slug]);

  const fetchShopSettings = async () => {
    try {
      const res = await fetch(`/api/tenant/by-slug/${slug}`);
      const data = await res.json();
      setShopSettings({
        business_name: data.tenant?.name || 'ShopMart',
        logo_url: data.tenant?.logo_url
      });
    } catch (error) {
      console.error('Failed to load shop settings:', error);
      setShopSettings({ business_name: 'ShopMart' });
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ecommerce/products/simple?tenantSlug=${slug}&limit=100`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = () => {
    const cart = localStorage.getItem(`cart_${slug}`);
    if (cart) {
      const items = JSON.parse(cart);
      setCartCount(items.reduce((sum: number, item: any) => sum + item.quantity, 0));
    }
  };

  const fetchFlashDeals = async () => {
    try {
      const res = await fetch(`/api/ecommerce/flash-deals?tenantSlug=${slug}`);
      const data = await res.json();
      setFlashDeals(data.deals || []);
    } catch (error) {
      console.error('Failed to load flash deals:', error);
    }
  };

  const fetchBundles = async () => {
    try {
      const res = await fetch(`/api/ecommerce/bundles?tenantSlug=${slug}`);
      const data = await res.json();
      setBundles(data.bundles || []);
    } catch (error) {
      console.error('Failed to load bundles:', error);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch(`/api/ecommerce/recommendations?tenantSlug=${slug}&limit=6`);
      const data = await res.json();
      setRecommendations(data.products || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const addToCart = (productId: string) => {
    const cart = localStorage.getItem(`cart_${slug}`);
    const items = cart ? JSON.parse(cart) : [];
    const existing = items.find((i: any) => i.product_id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ product_id: productId, quantity: 1 });
    }
    localStorage.setItem(`cart_${slug}`, JSON.stringify(items));
    loadCartCount();
  };

  const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty', 'Toys', 'Automotive', 'Books'];
  const featuredProducts = products.slice(0, 6);
  const superDeals = products.slice(6, 12);
  const allProducts = products.slice(12);

  return (
    <>
      <Head>
        <title>{shopSettings?.business_name || 'ShopMart'} - Online Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div className="min-h-screen bg-gray-50">
        {/* Top Header */}
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4">
            {/* Top Bar */}
            <div className="flex items-center justify-between py-4">
              <Link href={`/shop/${slug}`}>
                <div className="flex items-center gap-2 cursor-pointer">
                  {shopSettings?.logo_url ? (
                    <img src={shopSettings.logo_url} alt="Logo" className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="text-3xl font-bold text-orange-600">{shopSettings?.business_name || 'ShopMart'}</div>
                  )}
                </div>
              </Link>

              {/* Search Bar */}
              <div className="flex-1 max-w-2xl mx-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-orange-500 rounded-lg focus:outline-none focus:border-orange-600"
                  />
                  <button className="absolute right-0 top-0 bottom-0 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-r-lg transition">
                    Search
                  </button>
                </div>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-6">
                <Link href={`/shop/${slug}/cart`}>
                  <div className="relative cursor-pointer hover:text-orange-600 transition">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </div>
                </Link>
                <button className="text-sm hover:text-orange-600 transition">Sign In / Register</button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-8 py-3 border-t text-sm">
              <button className="flex items-center gap-1 hover:text-orange-600 transition font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                All Categories
              </button>
              <Link href={`/shop/${slug}`} className="hover:text-orange-600 transition text-orange-600 font-medium">SuperDeals</Link>
              {categories.slice(0, 6).map((cat) => (
                <Link key={cat} href={`/shop/${slug}?category=${cat}`} className="hover:text-orange-600 transition">{cat}</Link>
              ))}
              <button className="hover:text-orange-600 transition">More ▼</button>
            </nav>
          </div>
        </header>

        {/* Flash Deal Banner */}
        {flashDeals.length > 0 && (
          <FlashDealBanner slug={slug as string} deals={flashDeals} />
        )}

        {/* Hero Banner */}
        <section className="bg-gradient-to-r from-orange-50 to-pink-50 py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-4">Welcome to {shopSettings?.business_name}</h1>
                <p className="text-xl text-gray-600 mb-6">Discover amazing deals on quality products</p>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition">
                  Shop Now
                </button>
              </div>
              <div className="text-8xl">🛍️</div>
            </div>
          </div>
        </section>

        {/* Today's Deals Section */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Today's deals</h2>
            <Link href={`/shop/${slug}/deals`} className="text-orange-600 hover:text-orange-700 font-medium">View all →</Link>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Bundle Deals */}
            <div className="bg-white rounded-lg p-6 border">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🎁</span>
                <div>
                  <h3 className="font-bold text-lg">Bundle deals</h3>
                  <p className="text-sm text-gray-600">3+ from KES 2,39 each</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {featuredProducts.slice(0, 3).map((product) => (
                  <Link key={product.id} href={`/shop/${slug}/product/${product.id}`}>
                    <div className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition cursor-pointer">
                      <div className="aspect-square bg-white rounded flex items-center justify-center mb-2">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className="text-4xl">📦</span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-orange-600">KES{product.retail_price.toLocaleString()}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* SuperDeals */}
            <div className="bg-white rounded-lg p-6 border">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="font-bold text-lg text-red-600">SuperDeals</h3>
                  <p className="text-sm text-gray-600">Ends in: 14:54:06</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {featuredProducts.slice(3, 6).map((product) => (
                  <Link key={product.id} href={`/shop/${slug}/product/${product.id}`}>
                    <div className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition cursor-pointer relative">
                      <div className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        -{Math.floor(Math.random() * 50 + 20)}%
                      </div>
                      <div className="aspect-square bg-white rounded flex items-center justify-center mb-2">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className="text-4xl">📦</span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-orange-600">KES{product.retail_price.toLocaleString()}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* All Products Grid */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">All Products</h2>
          
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-lg">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold mb-2">No Products Available</h3>
              <p className="text-gray-600">Check back soon for new items!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allProducts.map((product) => {
                const rating = (4 + Math.random()).toFixed(1);
                const sold = Math.floor(Math.random() * 10000);
                return (
                  <Link key={product.id} href={`/shop/${slug}/product/${product.id}`}>
                    <div className="bg-white rounded-lg border hover:shadow-lg transition cursor-pointer group">
                      <div className="relative aspect-square bg-gray-50 rounded-t-lg overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            addToCart(product.id);
                          }}
                          className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition hover:bg-orange-500 hover:text-white"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </button>
                      </div>
                      <div className="p-3">
                        <div className="text-sm line-clamp-2 h-10 mb-2 text-gray-700">{product.name}</div>
                        <div className="text-lg font-bold text-orange-600 mb-1">
                          KES{product.retail_price.toLocaleString()}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-gray-500">
                            <span className="text-yellow-400">★★★★★</span>
                            <span>{rating}</span>
                          </div>
                          <span className="text-gray-400">{sold}+ sold</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Recommended Products */}
        {recommendations.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-8">
            <RecommendedProducts 
              slug={slug as string} 
              products={recommendations}
              title="Recommended for You"
              subtitle="Based on your browsing history"
            />
          </section>
        )}

        {/* Bundle Deals */}
        {bundles.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 py-8">
            <BundleDeals slug={slug as string} bundles={bundles} />
          </section>
        )}

        {/* Trust Badges */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <TrustBadges />
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="font-bold mb-4">Customer Service</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Transaction Services</a></li>
                  <li><a href="#" className="hover:text-white">Terms & Conditions</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">Shopping with us</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white">Making payments</a></li>
                  <li><a href="#" className="hover:text-white">Delivery options</a></li>
                  <li><a href="#" className="hover:text-white">Buyer Protection</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">Collaborate with us</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white">Partnerships</a></li>
                  <li><a href="#" className="hover:text-white">Affiliate program</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold mb-4">Pay with</h3>
                <div className="flex gap-2 flex-wrap">
                  <div className="bg-white rounded px-3 py-1 text-xs text-gray-900 font-medium">VISA</div>
                  <div className="bg-white rounded px-3 py-1 text-xs text-gray-900 font-medium">Mastercard</div>
                  <div className="bg-white rounded px-3 py-1 text-xs text-gray-900 font-medium">M-PESA</div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
              <p>© 2026 {shopSettings?.business_name || 'ShopMart'}. All rights reserved.</p>
            </div>
          </div>
        </footer>

        {/* Gamification Widget */}
        <GamificationWidget slug={slug as string} customerId={undefined} />
      </div>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useShopTheme } from '@/hooks/useShopTheme';

interface CartItem {
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  image_url?: string;
}

export default function Checkout() {
  const router = useRouter();
  const { slug } = router.query;
  const theme = useShopTheme(slug);
  const p = theme.primary;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'Kenya',
    paymentMethod: 'cod',
    customerNotes: '',
  });

  // Load cart from localStorage
  useEffect(() => {
    if (!slug) return;
    const raw = localStorage.getItem(`cart_${slug}`);
    const items: CartItem[] = raw ? JSON.parse(raw) : [];
    if (items.length === 0) {
      router.replace(`/shop/${slug}/cart`);
      return;
    }
    setCartItems(items);
    setLoading(false);
  }, [slug]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/ecommerce/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: slug,
          cartItems,
          shippingAddress: {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            street: formData.street,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: formData.country,
          },
          paymentMethod: formData.paymentMethod,
          customerNotes: formData.customerNotes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Checkout failed. Please try again.');
        return;
      }

      // Clear cart
      localStorage.removeItem(`cart_${slug}`);
      window.dispatchEvent(new Event('cart-updated'));

      router.push(`/shop/${slug}/order-success?orderId=${data.orderId}&orderNumber=${encodeURIComponent(data.orderNumber)}`);
    } catch (err: any) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const subtotal = cartItems.reduce((s, i) => s + i.product_price * i.quantity, 0);
  const shippingFee = subtotal >= 5000 ? 0 : 500;
  const total = subtotal + shippingFee;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: p }} />
      </div>
    );
  }

  return (
    <>
      <Head><title>Checkout – {theme.name || slug}</title></Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <Link href={`/shop/${slug}`} className="flex items-center gap-2 font-extrabold text-xl" style={{ color: p }}>
              {theme.logo_url && <img src={theme.logo_url} alt="logo" className="h-8 w-auto object-contain" />}
              <span>{theme.name || slug}</span>
            </Link>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ── Left: Form ── */}
              <div className="lg:col-span-2 space-y-5">
                {/* Contact */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="font-bold text-lg text-gray-900 mb-4">Contact Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
                      <input
                        type="text" name="fullName" value={formData.fullName}
                        onChange={handleChange} required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 text-sm text-gray-900"
                        style={{ '--tw-ring-color': p } as any}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone *</label>
                        <input
                          type="tel" name="phone" value={formData.phone}
                          onChange={handleChange} required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                        <input
                          type="email" name="email" value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-sm text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="font-bold text-lg text-gray-900 mb-4">Delivery Address</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Street Address *</label>
                      <input
                        type="text" name="street" value={formData.street}
                        onChange={handleChange} required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-sm text-gray-900"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
                        <input
                          type="text" name="city" value={formData.city}
                          onChange={handleChange} required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">County / State</label>
                        <input
                          type="text" name="state" value={formData.state}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-sm text-gray-900"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Postal Code</label>
                        <input
                          type="text" name="postalCode" value={formData.postalCode}
                          onChange={handleChange}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-sm text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Country *</label>
                        <input
                          type="text" name="country" value={formData.country}
                          onChange={handleChange} required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-sm text-gray-900"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="font-bold text-lg text-gray-900 mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    {[
                      { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when you receive your order' },
                      { value: 'mpesa', label: 'M-Pesa', desc: 'Pay via M-Pesa mobile money' },
                    ].map(opt => (
                      <label
                        key={opt.value}
                        className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition"
                        style={{ borderColor: formData.paymentMethod === opt.value ? p : '#d1d5db' }}
                      >
                        <input
                          type="radio" name="paymentMethod" value={opt.value}
                          checked={formData.paymentMethod === opt.value}
                          onChange={handleChange} className="mr-3"
                        />
                        <div>
                          <p className="font-medium text-sm text-gray-900">{opt.label}</p>
                          <p className="text-xs text-gray-500">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h2 className="font-bold text-lg text-gray-900 mb-4">Order Notes <span className="text-gray-400 font-normal text-sm">(optional)</span></h2>
                  <textarea
                    name="customerNotes" value={formData.customerNotes}
                    onChange={handleChange} rows={3}
                    placeholder="Any special instructions..."
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none text-sm text-gray-900 resize-none"
                  />
                </div>
              </div>

              {/* ── Right: Summary ── */}
              <div className="lg:col-span-1">
                <div className="bg-white p-6 rounded-lg shadow-sm sticky top-20">
                  <h2 className="font-bold text-lg text-gray-900 mb-4">Order Summary</h2>

                  <div className="space-y-3 mb-4 pb-4 border-b max-h-60 overflow-y-auto">
                    {cartItems.map(item => (
                      <div key={item.product_id} className="flex gap-3 items-start">
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden shrink-0">
                          {item.image_url
                            ? <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-700 line-clamp-2">{item.product_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium text-gray-900 shrink-0">
                          KES {(item.product_price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm mb-4 pb-4 border-b">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">KES {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className={shippingFee === 0 ? 'text-green-600 font-medium' : 'text-gray-900'}>
                        {shippingFee === 0 ? 'FREE' : `KES ${shippingFee.toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between font-bold text-base text-gray-900 mb-5">
                    <span>Total</span>
                    <span style={{ color: p }}>KES {total.toLocaleString()}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full text-white py-3 rounded-lg font-bold text-sm transition disabled:opacity-50"
                    style={{ backgroundColor: p }}
                  >
                    {submitting ? 'Placing order...' : `Place Order · KES ${total.toLocaleString()}`}
                  </button>

                  <div className="mt-4 space-y-1 text-xs text-gray-500">
                    <p>✓ Secure checkout</p>
                    <p>✓ 7-day return policy</p>
                    <p>✓ Buyer protection</p>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

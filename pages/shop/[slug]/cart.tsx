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

function Countdown({ endsIn }: { endsIn: number }) {
  const [secs, setSecs] = useState(endsIn);
  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return <span className="font-mono font-bold">{h} : {m} : {s}</span>;
}

export default function CartPage() {
  const router = useRouter();
  const { slug } = router.query;
  const theme = useShopTheme(slug);
  const p = theme.primary;
  const [items, setItems] = useState<CartItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!slug) return;
    const cart = JSON.parse(localStorage.getItem(`cart_${slug}`) || '[]');
    setItems(cart);
    setSelected(new Set(cart.map((i: CartItem) => i.product_id)));
  }, [slug]);

  const save = (updated: CartItem[]) => {
    setItems(updated);
    localStorage.setItem(`cart_${slug}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('cart-updated'));
  };

  const updateQty = (productId: string, delta: number) => {
    const updated = items.map(i => i.product_id === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i);
    save(updated);
  };

  const removeItem = (productId: string) => {
    save(items.filter(i => i.product_id !== productId));
    setSelected(s => { const n = new Set(s); n.delete(productId); return n; });
  };

  const toggleSelect = (productId: string) => {
    setSelected(s => { const n = new Set(s); n.has(productId) ? n.delete(productId) : n.add(productId); return n; });
  };

  const selectedItems = items.filter(i => selected.has(i.product_id));
  const subtotal = selectedItems.reduce((s, i) => s + i.product_price * i.quantity, 0);
  const total = subtotal;

  return (
    <>
      <Head><title>Cart – {slug}</title></Head>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 transition shrink-0"
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
            <span className="text-gray-300">|</span>
            <span className="text-lg font-semibold text-gray-700">Cart</span>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {items.length === 0 ? (
            /* ── EMPTY CART ── */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white border rounded-lg p-8">
                {/* Deal timer */}
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-4 py-2 mb-6 text-sm">
                  <span className="font-semibold text-green-700">SUMMER READY</span>
                  <span className="text-gray-600 flex items-center gap-2">Ends: <Countdown endsIn={53046} /></span>
                  <span className="">›</span>
                </div>

                <div className="text-center py-12">
                  <div className="text-8xl mb-4">🛒</div>
                  <p className="text-gray-600 mb-6">Your cart is empty</p>
                  <div className="flex gap-3 justify-center">
                    <Link href={`/shop/${slug}/auth`}>
                      <button className="px-8 py-2.5 text-white rounded-full font-medium text-sm transition" style={{ backgroundColor: p }}>Sign in</button>
                    </Link>
                    <Link href={`/shop/${slug}`}>
                      <button className="px-8 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-medium text-sm transition">Explore items</button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-white border rounded-lg p-6 h-fit">
                <h2 className="font-bold text-lg mb-4">Summary</h2>
                <div className="flex justify-between text-sm mb-6">
                  <span className="text-gray-600">Estimated total</span>
                  <span className="font-bold">KES 0.00</span>
                </div>
                <button disabled className="w-full bg-orange-400 text-white py-3 rounded font-bold text-sm opacity-60 cursor-not-allowed">
                  Checkout (0)
                </button>
                <div className="mt-4 border-t pt-4">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Buyer protection</p>
                  <p className="text-xs text-gray-500">✓ Get a full refund if the item is not as described or not delivered</p>
                </div>
              </div>
            </div>
          ) : (
            /* ── CART WITH ITEMS ── */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {/* Deal timer */}
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded px-4 py-2 text-sm">
                  <span className="font-semibold text-green-700">SUMMER READY</span>
                  <span className="text-gray-600 flex items-center gap-2">Ends: <Countdown endsIn={53046} /></span>
                  <span className="">›</span>
                </div>

                {/* Select all */}
                <div className="bg-white border rounded-lg px-4 py-3 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selected.size === items.length}
                    onChange={() => setSelected(selected.size === items.length ? new Set() : new Set(items.map(i => i.product_id)))}
                    className="w-4 h-4 "
                  />
                  <span className="text-sm font-medium">Select all ({items.length})</span>
                </div>

                {/* Items */}
                {items.map(item => (
                  <div key={item.product_id} className="bg-white border rounded-lg p-4 flex gap-4">
                    <input
                      type="checkbox"
                      checked={selected.has(item.product_id)}
                      onChange={() => toggleSelect(item.product_id)}
                      className="w-4 h-4  mt-1 shrink-0"
                    />
                    <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden shrink-0">
                      {item.image_url ? <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 line-clamp-2 mb-2">{item.product_name}</p>
                      <p className="text-base font-bold text-black">KES {item.product_price.toLocaleString()}</p>
                      <p className="text-xs text-green-600 mt-0.5">Free shipping</p>
                    </div>
                    <div className="flex flex-col items-end justify-between shrink-0">
                      <button onClick={() => removeItem(item.product_id)} className="text-gray-400 hover:text-red-500 text-xs">✕ Remove</button>
                      <div className="flex items-center border border-gray-300 rounded">
                        <button onClick={() => updateQty(item.product_id, -1)} className="px-3 py-1 text-gray-600 hover:bg-gray-100 text-sm">−</button>
                        <span className="px-3 py-1 text-sm font-medium border-x border-gray-300">{item.quantity}</span>
                        <button onClick={() => updateQty(item.product_id, 1)} className="px-3 py-1 text-gray-600 hover:bg-gray-100 text-sm">+</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-white border rounded-lg p-6 h-fit sticky top-20">
                <h2 className="font-bold text-lg mb-4">Summary</h2>
                <div className="space-y-2 text-sm mb-4 pb-4 border-b">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal ({selectedItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="font-medium">KES {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">FREE</span>
                  </div>
                </div>
                <div className="flex justify-between font-bold text-base mb-4">
                  <span>Estimated total</span>
                  <span>KES {total.toLocaleString()}</span>
                </div>
                <Link href={`/shop/${slug}/checkout`}>
                  <button className="w-full text-white py-3 rounded font-bold text-sm transition" style={{ backgroundColor: p }}>
                    Checkout ({selectedItems.reduce((s, i) => s + i.quantity, 0)})
                  </button>
                </Link>
                <div className="mt-4 border-t pt-4">
                  <p className="text-xs font-semibold text-gray-700 mb-1">Buyer protection</p>
                  <p className="text-xs text-gray-500">✓ Get a full refund if the item is not as described or not delivered</p>
                </div>
              </div>
            </div>
          )}

          {/* More to love */}
          <div className="mt-10">
            <h3 className="text-lg font-bold mb-4">More to love</h3>
            <Link href={`/shop/${slug}`} className="text-orange-600 text-sm hover:underline">Browse all products →</Link>
          </div>
        </div>
      </div>
    </>
  );
}

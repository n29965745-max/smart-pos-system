import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useShopTheme } from '@/hooks/useShopTheme';

interface StoredOrder {
  orderNumber?: string;
  total?: number;
  paymentMethod?: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    city?: string;
  };
}

export default function OrderSuccess() {
  const router = useRouter();
  const { slug, orderNumber } = router.query;
  const theme = useShopTheme(slug);
  const [order, setOrder] = useState<StoredOrder | null>(null);

  useEffect(() => {
    if (!orderNumber || Array.isArray(orderNumber)) return;

    const stored = sessionStorage.getItem(`order_${orderNumber}`);
    if (!stored) return;

    try {
      setOrder(JSON.parse(stored));
    } catch {
      setOrder(null);
    }
  }, [orderNumber]);

  const displayOrderNumber = Array.isArray(orderNumber)
    ? orderNumber[0]
    : order?.orderNumber || orderNumber || 'Order';

  return (
    <>
      <Head>
        <title>Order Confirmed - {theme.name || slug}</title>
      </Head>

      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-9 w-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900">Order confirmed</h1>
          <p className="mt-3 text-gray-600">
            Thank you for shopping with {theme.name || slug}. We have received your order.
          </p>

          <div className="mt-8 w-full rounded-lg border border-gray-200 bg-white p-5 text-left shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm text-gray-500">Order number</span>
              <span className="font-semibold text-gray-900">{displayOrderNumber}</span>
            </div>

            {order?.shippingAddress?.fullName && (
              <div className="flex items-center justify-between border-b border-gray-100 py-3">
                <span className="text-sm text-gray-500">Customer</span>
                <span className="font-medium text-gray-900">{order.shippingAddress.fullName}</span>
              </div>
            )}

            {order?.total !== undefined && (
              <div className="flex items-center justify-between pt-3">
                <span className="text-sm text-gray-500">Total</span>
                <span className="font-semibold text-gray-900">KES {order.total.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/shop/${slug}`}
              className="rounded-lg px-5 py-3 text-sm font-semibold text-white"
              style={{ backgroundColor: theme.primary }}
            >
              Continue shopping
            </Link>
            <Link
              href={`/shop/${slug}/cart`}
              className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700"
            >
              View cart
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

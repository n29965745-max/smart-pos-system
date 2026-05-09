import Link from 'next/link';

interface BundleDeal {
  id: string;
  title: string;
  description: string;
  bundle_price: number;
  original_total: number;
  savings_percentage: number;
  products: Array<{
    id: string;
    name: string;
    image_url?: string;
    retail_price: number;
  }>;
}

interface BundleDealsProps {
  slug: string;
  bundles: BundleDeal[];
}

export default function BundleDeals({ slug, bundles }: BundleDealsProps) {
  if (bundles.length === 0) return null;

  return (
    <div className="bg-white rounded-lg p-6 border">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-3xl">🎁</span>
        <div>
          <h2 className="text-2xl font-bold">Bundle Deals</h2>
          <p className="text-sm text-gray-600">Buy together and save more</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bundles.map((bundle) => (
          <div key={bundle.id} className="border rounded-lg p-4 hover:shadow-lg transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{bundle.title}</h3>
                <p className="text-sm text-gray-600">{bundle.description}</p>
              </div>
              <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                Save {bundle.savings_percentage}%
              </div>
            </div>

            {/* Bundle Products */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {bundle.products.map((product, index) => (
                <div key={product.id} className="relative">
                  <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">📦</span>
                    )}
                  </div>
                  {index < bundle.products.length - 1 && (
                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10">
                      +
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pricing */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <div>
                <div className="text-sm text-gray-500 line-through">
                  KES{bundle.original_total.toLocaleString()}
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  KES{bundle.bundle_price.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">You save</div>
                <div className="text-lg font-bold text-green-600">
                  KES{(bundle.original_total - bundle.bundle_price).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-bold transition">
              Add Bundle to Cart
            </button>

            {/* Individual Products Link */}
            <div className="mt-3 text-center">
              <button className="text-sm text-gray-600 hover:text-gray-900">
                Or buy items separately →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

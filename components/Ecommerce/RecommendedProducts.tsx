import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  retail_price: number;
  image_url?: string;
  stock_quantity: number;
}

interface RecommendedProductsProps {
  slug: string;
  products: Product[];
  title?: string;
  subtitle?: string;
}

export default function RecommendedProducts({ 
  slug, 
  products, 
  title = "You May Also Like",
  subtitle = "Based on your browsing history"
}: RecommendedProductsProps) {
  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-lg p-6 border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        <Link href={`/shop/${slug}`} className="text-orange-600 hover:text-orange-700 font-medium text-sm">
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {products.map((product) => {
          const rating = (4 + Math.random()).toFixed(1);
          const sold = Math.floor(Math.random() * 5000);
          const discount = Math.floor(Math.random() * 30 + 10);

          return (
            <Link key={product.id} href={`/shop/${slug}/product/${product.id}`}>
              <div className="bg-white rounded-lg border hover:shadow-lg transition cursor-pointer group">
                <div className="relative aspect-square bg-gray-50 rounded-t-lg overflow-hidden">
                  {product.image_url ? (
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                  )}
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    -{discount}%
                  </div>
                  {product.stock_quantity < 10 && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded font-bold animate-pulse">
                      LOW STOCK
                    </div>
                  )}
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
    </div>
  );
}

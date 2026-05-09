import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import axios from 'axios';
import SocialProof from '@/components/Ecommerce/SocialProof';
import RecommendedProducts from '@/components/Ecommerce/RecommendedProducts';

interface Product {
  id: string;
  name: string;
  description: string;
  retail_price: number;
  stock_quantity: number;
  category: string;
  image_url?: string;
  avgRating: string;
  reviewCount: number;
}

export default function ProductDetail() {
  const router = useRouter();
  const { slug, id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (slug && id) {
      fetchProduct();
      fetchRecommendations();
    }
  }, [slug, id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`/api/ecommerce/products/${id}?tenantSlug=${slug}`);
      setProduct(res.data.product);
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get(`/api/ecommerce/recommendations?tenantSlug=${slug}&productId=${id}&limit=6`);
      setRecommendations(res.data.products || []);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setAddingToCart(true);
    try {
      // Get or create cart
      const sessionId = localStorage.getItem('sessionId') || Math.random().toString(36);
      localStorage.setItem('sessionId', sessionId);

      const cartRes = await axios.get(`/api/ecommerce/cart?sessionId=${sessionId}`);
      const cartId = cartRes.data.cart.id;

      // Add to cart
      await axios.post('/api/ecommerce/cart', {
        cartId,
        productId: product.id,
        quantity
      });

      alert('Added to cart!');
      router.push(`/shop/${slug}/cart`);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/shop/${slug}`}>
              <button className="text-gray-600 hover:text-gray-900">
                ← Back to Shop
              </button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div>
            <div className="bg-gradient-to-br from-emerald-400 to-teal-600 rounded-lg h-96 flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-8xl">📦</div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>

            {/* Social Proof */}
            <div className="mb-4">
              <SocialProof 
                productId={product.id}
                currentViewers={Math.floor(Math.random() * 20) + 5}
                recentPurchases={Math.floor(Math.random() * 100) + 50}
              />
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={i < Math.floor(parseFloat(product.avgRating)) ? 'text-yellow-400' : 'text-gray-300'}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-gray-600">({product.reviewCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="mb-6">
              <span className="text-3xl font-bold text-emerald-600">
                KSh {product.retail_price.toLocaleString()}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-600 mb-8">{product.description}</p>

            {/* Stock Status */}
            <div className="mb-6">
              {product.stock_quantity > 0 ? (
                <span className="text-green-600 font-medium">
                  ✓ In Stock ({product.stock_quantity} available)
                </span>
              ) : (
                <span className="text-red-600 font-medium">✗ Out of Stock</span>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <h3 className="font-semibold mb-3">Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-emerald-500"
                >
                  −
                </button>
                <span className="text-xl font-bold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:border-emerald-500"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0 || addingToCart}
              className="w-full bg-emerald-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>

            {/* Info */}
            <div className="mt-8 space-y-3 text-sm text-gray-600 bg-gray-100 p-4 rounded-lg">
              <p>✓ Free shipping on orders over KSh 5,000</p>
              <p>✓ 7-day return policy</p>
              <p>✓ Secure checkout</p>
              <p>✓ Cash on delivery available</p>
            </div>
          </div>
        </div>

        {/* Recommended Products */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            <RecommendedProducts 
              slug={slug as string}
              products={recommendations}
              title="You May Also Like"
              subtitle="Customers who viewed this also viewed"
            />
          </div>
        )}
      </div>
    </div>
  );
}

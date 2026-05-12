/**
 * Recommendation Service
 * 
 * Generates personalized product recommendations based on:
 * - Same category products
 * - Co-purchased items (frequently bought together)
 * - Trending products (highest sales)
 * - Browsing history
 * 
 * Tasks: 2.3
 * Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  category?: string;
  retail_price: number;
  stock_quantity: number;
  image_url?: string;
}

export interface Recommendation {
  product: Product;
  reason: 'same-category' | 'co-purchased' | 'trending' | 'browsing-history';
  score: number;
}

interface RecommendationCandidate {
  product: Product;
  reason: 'same-category' | 'co-purchased' | 'trending' | 'browsing-history';
  score: number;
}

class RecommendationService {
  /**
   * Generate recommendations for a product
   */
  async generateRecommendations(
    tenantId: string,
    productId: string,
    browsingHistory: string[] = [],
    limit: number = 6
  ): Promise<Recommendation[]> {
    try {
      // Set tenant context for RLS
      await supabase.rpc('set_config', {
        setting: 'app.current_tenant_id',
        value: tenantId
      });

      // Check cache first
      const cached = await this.getCachedRecommendations(tenantId, productId);
      if (cached && cached.length > 0) {
        return cached.slice(0, limit);
      }

      // Get the current product
      const { data: currentProduct } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('tenant_id', tenantId)
        .single();

      if (!currentProduct) {
        throw new Error('Product not found');
      }

      const candidates: RecommendationCandidate[] = [];

      // 1. Same category (weight: 0.4)
      const sameCategoryProducts = await this.getSameCategoryProducts(
        tenantId,
        currentProduct.category,
        productId,
        10
      );
      candidates.push(...sameCategoryProducts.map(p => ({
        product: p,
        reason: 'same-category' as const,
        score: 0.4
      })));

      // 2. Co-purchased (weight: 0.3)
      const coPurchasedProducts = await this.getCoPurchasedProducts(
        tenantId,
        productId,
        10
      );
      candidates.push(...coPurchasedProducts.map(p => ({
        product: p,
        reason: 'co-purchased' as const,
        score: 0.3
      })));

      // 3. Browsing history (weight: 0.2)
      if (browsingHistory.length > 0) {
        const historyProducts = await this.getSimilarToViewed(
          tenantId,
          browsingHistory,
          productId,
          10
        );
        candidates.push(...historyProducts.map(p => ({
          product: p,
          reason: 'browsing-history' as const,
          score: 0.2
        })));
      }

      // 4. Trending (weight: 0.1)
      const trendingProducts = await this.getTrendingProducts(tenantId, productId, 10);
      candidates.push(...trendingProducts.map(p => ({
        product: p,
        reason: 'trending' as const,
        score: 0.1
      })));

      // Deduplicate, rank, and filter
      const recommendations = this.deduplicateAndRank(candidates)
        .filter(c => c.product.stock_quantity > 0) // Only in-stock products
        .slice(0, limit);

      // Cache the results
      await this.cacheRecommendations(tenantId, productId, recommendations);

      return recommendations;
    } catch (error: any) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Get products from the same category
   */
  private async getSameCategoryProducts(
    tenantId: string,
    category: string | null,
    excludeProductId: string,
    limit: number
  ): Promise<Product[]> {
    if (!category) return [];

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('category', category)
        .neq('id', excludeProductId)
        .gt('stock_quantity', 0)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching same category products:', error);
      return [];
    }
  }

  /**
   * Get products frequently bought together
   */
  private async getCoPurchasedProducts(
    tenantId: string,
    productId: string,
    limit: number
  ): Promise<Product[]> {
    try {
      // Find orders that contain this product
      const { data: orderItems } = await supabase
        .from('online_order_items')
        .select('order_id')
        .eq('product_id', productId);

      if (!orderItems || orderItems.length === 0) return [];

      const orderIds = orderItems.map(item => item.order_id);

      // Find other products in those orders
      const { data: coPurchasedItems } = await supabase
        .from('online_order_items')
        .select('product_id, products(*)')
        .in('order_id', orderIds)
        .neq('product_id', productId);

      if (!coPurchasedItems) return [];

      // Count frequency and get unique products
      const productCounts = new Map<string, { product: Product; count: number }>();
      
      coPurchasedItems.forEach((item: any) => {
        if (item.products && item.products.tenant_id === tenantId) {
          const existing = productCounts.get(item.product_id);
          if (existing) {
            existing.count++;
          } else {
            productCounts.set(item.product_id, {
              product: item.products,
              count: 1
            });
          }
        }
      });

      // Sort by frequency and return top products
      return Array.from(productCounts.values())
        .sort((a, b) => b.count - a.count)
        .map(item => item.product)
        .filter(p => p.stock_quantity > 0)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching co-purchased products:', error);
      return [];
    }
  }

  /**
   * Get trending products (highest sales in last 7 days)
   */
  async getTrendingProducts(
    tenantId: string,
    excludeProductId: string,
    limit: number
  ): Promise<Product[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get orders from last 7 days
      const { data: recentOrders } = await supabase
        .from('online_orders')
        .select('id')
        .eq('tenant_id', tenantId)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (!recentOrders || recentOrders.length === 0) {
        // Fallback to all products if no recent orders
        const { data } = await supabase
          .from('products')
          .select('*')
          .eq('tenant_id', tenantId)
          .neq('id', excludeProductId)
          .gt('stock_quantity', 0)
          .limit(limit);
        
        return data || [];
      }

      const orderIds = recentOrders.map(o => o.id);

      // Get product sales counts
      const { data: orderItems } = await supabase
        .from('online_order_items')
        .select('product_id, quantity, products(*)')
        .in('order_id', orderIds);

      if (!orderItems) return [];

      // Count total quantity sold per product
      const salesCounts = new Map<string, { product: Product; totalSold: number }>();
      
      orderItems.forEach((item: any) => {
        if (item.products && item.products.tenant_id === tenantId && item.product_id !== excludeProductId) {
          const existing = salesCounts.get(item.product_id);
          if (existing) {
            existing.totalSold += item.quantity;
          } else {
            salesCounts.set(item.product_id, {
              product: item.products,
              totalSold: item.quantity
            });
          }
        }
      });

      // Sort by sales and return top products
      return Array.from(salesCounts.values())
        .sort((a, b) => b.totalSold - a.totalSold)
        .map(item => item.product)
        .filter(p => p.stock_quantity > 0)
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching trending products:', error);
      return [];
    }
  }

  /**
   * Get products similar to browsing history
   */
  private async getSimilarToViewed(
    tenantId: string,
    browsingHistory: string[],
    excludeProductId: string,
    limit: number
  ): Promise<Product[]> {
    try {
      // Get categories from browsing history
      const { data: viewedProducts } = await supabase
        .from('products')
        .select('category')
        .eq('tenant_id', tenantId)
        .in('id', browsingHistory);

      if (!viewedProducts || viewedProducts.length === 0) return [];

      const categories = [...new Set(viewedProducts.map(p => p.category).filter(Boolean))];
      
      if (categories.length === 0) return [];

      // Get products from those categories
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('category', categories)
        .neq('id', excludeProductId)
        .gt('stock_quantity', 0)
        .limit(limit);

      return data || [];
    } catch (error) {
      console.error('Error fetching similar products:', error);
      return [];
    }
  }

  /**
   * Deduplicate and rank recommendations
   */
  private deduplicateAndRank(candidates: RecommendationCandidate[]): Recommendation[] {
    const productMap = new Map<string, Recommendation>();

    candidates.forEach(candidate => {
      const existing = productMap.get(candidate.product.id);
      if (existing) {
        // If product already exists, add scores
        existing.score += candidate.score;
      } else {
        productMap.set(candidate.product.id, {
          product: candidate.product,
          reason: candidate.reason,
          score: candidate.score
        });
      }
    });

    // Sort by score descending
    return Array.from(productMap.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Get cached recommendations
   */
  private async getCachedRecommendations(
    tenantId: string,
    productId: string
  ): Promise<Recommendation[] | null> {
    try {
      const { data, error } = await supabase
        .from('product_recommendations_cache')
        .select('recommended_product_ids, expires_at')
        .eq('tenant_id', tenantId)
        .eq('product_id', productId)
        .single();

      if (error || !data) return null;

      // Check if cache is expired
      if (new Date(data.expires_at) < new Date()) {
        return null;
      }

      // Fetch the recommended products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('id', data.recommended_product_ids);

      if (!products) return null;

      return products.map(p => ({
        product: p,
        reason: 'same-category' as const,
        score: 1.0
      }));
    } catch (error) {
      console.error('Error fetching cached recommendations:', error);
      return null;
    }
  }

  /**
   * Cache recommendations
   */
  private async cacheRecommendations(
    tenantId: string,
    productId: string,
    recommendations: Recommendation[]
  ): Promise<void> {
    try {
      const productIds = recommendations.map(r => r.product.id);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await supabase
        .from('product_recommendations_cache')
        .upsert({
          tenant_id: tenantId,
          product_id: productId,
          recommended_product_ids: productIds,
          generated_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'tenant_id,product_id'
        });
    } catch (error) {
      console.error('Error caching recommendations:', error);
      // Don't throw - caching failure shouldn't break recommendations
    }
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;

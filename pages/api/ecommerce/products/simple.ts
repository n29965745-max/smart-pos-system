/**
 * Public Products API — read-only, no auth required (storefront use)
 *
 * Security measures:
 * - Uses service role but ONLY reads products for the resolved tenant
 * - tenant_id is resolved server-side from slug — never from client
 * - Explicit WHERE tenant_id = <resolved> on every query (defense-in-depth)
 * - Rate limiting via in-memory sliding window (per IP)
 * - Input validation on all query params
 * - Only exposes safe product fields (no cost_price, no internal data)
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Simple in-memory rate limiter (per IP, 60 req/min) ──────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

// ─── Safe product fields — never expose cost_price or internal data ───────────
const SAFE_FIELDS = 'id, name, retail_price, stock_quantity, category, image_url, sku, description';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  try {
    const { tenantSlug, limit: rawLimit = '50' } = req.query;

    // Validate tenantSlug
    if (!tenantSlug || typeof tenantSlug !== 'string') {
      return res.status(400).json({ error: 'Tenant slug required' });
    }
    if (!/^[a-z0-9-_]{1,100}$/i.test(tenantSlug)) {
      return res.status(400).json({ error: 'Invalid tenant slug' });
    }

    // Validate limit
    const limit = Math.min(Math.max(parseInt(rawLimit as string) || 50, 1), 100);

    // Resolve tenant server-side — never trust client-provided tenant_id
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, is_active')
      .eq('subdomain', tenantSlug)
      .single();

    if (!tenant) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    if (tenant.is_active === false) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Fetch products — explicit tenant_id filter (defense-in-depth on top of RLS)
    const { data: products, error } = await supabase
      .from('products')
      .select(SAFE_FIELDS)
      .eq('tenant_id', tenant.id)   // server-resolved, never from client
      .gt('stock_quantity', 0)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[products/simple] DB error:', error.message);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }

    // Cache-friendly response headers
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');

    return res.status(200).json({
      products: products ?? [],
      total: products?.length ?? 0
    });
  } catch (error: any) {
    console.error('[products/simple] error:', error?.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

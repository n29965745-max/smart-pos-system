/**
 * Product Recommendations API Endpoint
 * 
 * GET /api/ecommerce/recommendations?tenantSlug=xxx&productId=xxx&browsingHistory=id1,id2,id3
 * 
 * Returns personalized product recommendations.
 * 
 * Tasks: 3.3
 * Requirements: 7.1, 7.2, 7.3, 7.5
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import recommendationService from '../../../services/recommendation.service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Rate limiting: 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Rate limiting
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ipString = Array.isArray(ip) ? ip[0] : ip;
    
    if (!checkRateLimit(ipString)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter: 60
      });
    }

    const { tenantSlug, productId, browsingHistory, context, limit } = req.query;

    if (!tenantSlug || typeof tenantSlug !== 'string') {
      return res.status(400).json({ success: false, error: 'Tenant slug is required' });
    }

    // Get tenant by slug
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ success: false, error: 'Shop not found' });
    }

    const tenantId = tenant.id;

    // Parse browsing history
    let browsingHistoryArray: string[] = [];
    if (browsingHistory && typeof browsingHistory === 'string') {
      browsingHistoryArray = browsingHistory.split(',').filter(Boolean);
    }

    // Parse limit
    const limitNumber = limit && typeof limit === 'string' ? parseInt(limit, 10) : 6;

    // Generate recommendations
    let recommendations;
    
    if (productId && typeof productId === 'string') {
      // Product-specific recommendations
      recommendations = await recommendationService.generateRecommendations(
        tenantId,
        productId,
        browsingHistoryArray,
        limitNumber
      );
    } else {
      // Homepage recommendations (trending products)
      recommendations = await recommendationService.getTrendingProducts(
        tenantId,
        '', // No product to exclude
        limitNumber
      );
      
      recommendations = recommendations.map(product => ({
        product,
        reason: 'trending' as const,
        score: 1.0
      }));
    }

    return res.status(200).json({
      success: true,
      data: {
        recommendations,
        context: context || (productId ? 'product-detail' : 'homepage'),
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error in recommendations endpoint:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

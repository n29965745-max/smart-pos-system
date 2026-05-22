/**
 * Auth Middleware
 *
 * Validates the session token from the Authorization header,
 * looks up the user in the custom users table, and attaches
 * user_id + tenant_id to the request context.
 *
 * Tenant identity is ALWAYS server-derived — never trusted from client headers.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { verifyToken } from './secure-route';

// Admin client for user lookup — isolated here, not exported to request handlers
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface AuthContext {
  userId: string;
  tenantId: string;
  userRole: string;
  userEmail: string;
}

// Extend NextApiRequest to carry auth context
export interface AuthenticatedRequest extends NextApiRequest {
  auth: AuthContext;
}

type ApiHandler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void;

/**
 * withAuth — wraps an API handler with authentication + tenant resolution.
 *
 * Flow:
 * 1. Read Authorization header: "Bearer <token>"
 * 2. Verify the signed auth token and extract the user ID
 * 3. Look up user in users table to get tenant_id
 * 4. Attach auth context to request
 * 5. Reject if user not found or inactive
 */
export function withAuth(handler: ApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: missing token' });
      }

      const token = authHeader.replace('Bearer ', '').trim();

      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: empty token' });
      }

      let userId: string;
      try {
        userId = verifyToken(token);
      } catch {
        return res.status(401).json({ error: 'Unauthorized: invalid token' });
      }

      // Look up user in database — this is the ONLY source of truth for tenant_id
      const { data: user, error } = await adminSupabase
        .from('users')
        .select('id, tenant_id, role, email, is_active')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized: user not found' });
      }

      if (!user.is_active) {
        return res.status(401).json({ error: 'Unauthorized: account disabled' });
      }

      if (!user.tenant_id) {
        return res.status(401).json({ error: 'Unauthorized: user has no tenant' });
      }

      // Attach auth context — tenant_id is server-derived, never from client
      (req as AuthenticatedRequest).auth = {
        userId: user.id,
        tenantId: user.tenant_id,
        userRole: user.role,
        userEmail: user.email,
      };

      return handler(req as AuthenticatedRequest, res);
    } catch (err: any) {
      console.error('Auth middleware error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

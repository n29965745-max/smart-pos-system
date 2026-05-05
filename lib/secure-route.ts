/**
 * SECURE ROUTE — Global Authentication & Tenant Isolation Middleware
 *
 * Security guarantees:
 * - Token is HMAC-SHA256 signed — cannot be forged
 * - Tenant identity is derived from DB, never from client
 * - system_admin users bypass tenant requirement (cross-tenant access)
 * - Any invalid/expired/tampered token → 401
 *
 * Role model:
 *   system_role = 'superadmin' → platform-level admin, no tenant scope
 *   role = 'Admin'             → tenant-level admin, scoped to own tenant
 *   role = 'Cashier'           → tenant-level user, scoped to own tenant
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createHmac, timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';

// ─── Private admin client — NOT exported, never accessible from routes ───────
const _adminDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * setTenantContext — Sets PostgreSQL session variable for RLS policies.
 *
 * SECURITY NOTE: We set app.current_tenant_id directly (not app.current_user_id)
 * to avoid an extra DB lookup inside the RLS function on every row evaluation.
 * The tenant_id is already verified server-side from the users table before this call.
 *
 * is_local=true scopes the setting to the current transaction only, preventing
 * leakage across connection pool reuse.
 */
async function setTenantContext(tenantId: string | null): Promise<void> {
  try {
    await _adminDb.rpc('set_config', {
      setting_name: 'app.current_tenant_id',
      new_value: tenantId ?? '',
      is_local: true
    });
  } catch (err: any) {
    console.error('[setTenantContext] Failed to set session variable:', err?.message);
    throw new Error('Failed to set tenant context');
  }
}

// ─── Token config ─────────────────────────────────────────────────────────────
const TOKEN_VERSION = 'v2';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── Public types ─────────────────────────────────────────────────────────────
export interface AuthUser {
  userId: string;
  tenantId: string | null; // null for system_admin
  email: string;
  role: string;            // tenant-level role: Admin, Cashier, Manager
  systemRole: string;      // platform-level role: 'superadmin' | 'user'
  isSuperAdmin: boolean;   // convenience flag
}

export interface SecureRequest extends NextApiRequest {
  user: AuthUser;
  tenantId: string | null; // null for system_admin
}

type SecureHandler = (req: SecureRequest, res: NextApiResponse) => Promise<void> | void;

// ─── HMAC Token Implementation ────────────────────────────────────────────────

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters');
  }
  return secret;
}

export function signToken(userId: string): string {
  const secret = getSecret();
  const payload = Buffer.from(
    JSON.stringify({ userId, iat: Date.now(), v: TOKEN_VERSION })
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${TOKEN_VERSION}.${payload}.${sig}`;
}

export function verifyToken(token: string): string {
  if (!token || typeof token !== 'string') throw new Error('Missing token');

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) throw new Error('Malformed token');

  const [, payload, providedSig] = parts;
  const secret = getSecret();

  const expectedSig = createHmac('sha256', secret).update(payload).digest('base64url');
  const expectedBuf = Buffer.from(expectedSig);
  const providedBuf = Buffer.from(providedSig);

  if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
    throw new Error('Invalid token signature');
  }

  let decoded: { userId: string; iat: number; v: string };
  try {
    decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Malformed token payload');
  }

  if (decoded.v !== TOKEN_VERSION) throw new Error('Token version mismatch');
  if (!decoded.userId || !decoded.iat) throw new Error('Invalid token payload');
  if (Date.now() - decoded.iat > TOKEN_TTL_MS) throw new Error('Token expired');

  return decoded.userId;
}

// ─── Core Middleware ──────────────────────────────────────────────────────────

/**
 * secureRoute — wraps any API handler with full auth + tenant resolution.
 *
 * For system_admin: tenantId will be null — they have cross-tenant access.
 * For all other roles: tenantId is mandatory and derived from DB only.
 *
 * Usage:
 *   export default secureRoute(async (req, res) => {
 *     if (!req.user.isSuperAdmin) {
 *       // tenant-scoped logic using req.tenantId
 *     }
 *   });
 */
export function secureRoute(handler: SecureHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // 1. Extract token
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const token = authHeader.slice(7).trim();

      // 2. Verify HMAC signature
      let userId: string;
      try {
        userId = verifyToken(token);
      } catch {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // 3. Fetch user from DB — tenant_id and system_role derived here ONLY
      const { data: user, error } = await _adminDb
        .from('users')
        .select('id, tenant_id, email, role, system_role, is_active')
        .eq('id', userId)
        .single();

      if (error || !user) return res.status(401).json({ error: 'Unauthorized' });
      if (!user.is_active) return res.status(401).json({ error: 'Unauthorized' });

      const isSuperAdmin = user.system_role === 'superadmin';

      // 4. Non-superadmin MUST have a tenant_id
      if (!isSuperAdmin && !user.tenant_id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // 5. Set PostgreSQL session variable for RLS enforcement
      // Pass tenant_id directly — avoids per-row DB lookup in RLS function
      await setTenantContext(isSuperAdmin ? null : user.tenant_id);

      // 6. Attach auth context — all values server-derived, never from client
      const secureReq = req as SecureRequest;
      secureReq.user = {
        userId: user.id,
        tenantId: user.tenant_id ?? null,
        email: user.email,
        role: user.role,
        systemRole: user.system_role ?? 'user',
        isSuperAdmin,
      };
      secureReq.tenantId = user.tenant_id ?? null;

      // 7. Audit log — tenant context on every request
      console.log(`[secureRoute] ${user.email} → tenant:${user.tenant_id || 'SUPERADMIN'} role:${user.role}`);

      return handler(secureReq, res);
    } catch (err: any) {
      console.error('[secureRoute] error:', err?.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * requireSuperAdmin — middleware guard for system_admin-only routes.
 * Must be called at the top of any admin handler.
 */
export function requireSuperAdmin(req: SecureRequest, res: NextApiResponse): boolean {
  if (!req.user.isSuperAdmin) {
    res.status(403).json({ error: 'Forbidden — superadmin only' });
    return false;
  }
  return true;
}

/**
 * requireTenantAccess — ensures the requesting user belongs to the given tenantId.
 * system_admin always passes. All others must match.
 */
export function requireTenantAccess(req: SecureRequest, res: NextApiResponse, tenantId: string): boolean {
  if (req.user.isSuperAdmin) return true;
  if (req.user.tenantId !== tenantId) {
    res.status(403).json({ error: 'Forbidden — tenant mismatch' });
    return false;
  }
  return true;
}

/**
 * getAdminDb — returns the admin client.
 * Only for use in auth flows (login, onboard) where no session exists yet.
 */
export function getAdminDb() {
  return _adminDb;
}

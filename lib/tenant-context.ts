/**
 * Tenant Context
 *
 * SECURITY: Tenant identity is ALWAYS derived server-side from the authenticated user.
 * Never trust X-Tenant-ID headers or any client-supplied tenant identifier.
 *
 * Use withAuth() middleware — it attaches req.auth.tenantId after verifying the token.
 * Import AuthenticatedRequest and read req.auth.tenantId directly.
 */

export { withAuth } from './auth-middleware';
export type { AuthContext, AuthenticatedRequest } from './auth-middleware';

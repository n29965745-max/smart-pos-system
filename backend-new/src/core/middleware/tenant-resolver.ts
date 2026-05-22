/**
 * Tenant Resolution Middleware
 * 
 * Extracts tenant from request and injects database connection
 * Supports:
 * - Subdomain-based resolution (shop1.yourpos.com)
 * - JWT-based resolution (for API/mobile)
 * - Header-based resolution (X-Tenant-Slug)
 */

import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { getTenantDBManager } from '../database/tenant-db-manager';
import jwt from 'jsonwebtoken';

// ============================================================================
// TYPES
// ============================================================================

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  db: Pool;
  userId?: string;
  userRole?: string;
}

// Extend Express Request to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      user?: {
        id: string;
        email: string;
        tenantId: string;
        role: string;
      };
    }
  }
}

// ============================================================================
// TENANT RESOLVER MIDDLEWARE
// ============================================================================

export class TenantResolver {
  private jwtSecret: string;
  private allowedDomains: string[];
  
  constructor(jwtSecret: string, allowedDomains: string[]) {
    this.jwtSecret = jwtSecret;
    this.allowedDomains = allowedDomains;
  }
  
  /**
   * Main middleware function
   */
  resolve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 1. Extract tenant slug from request
      const tenantSlug = this.extractTenantSlug(req);
      
      if (!tenantSlug) {
        res.status(400).json({
          error: 'Tenant not specified',
          message: 'Please provide tenant via subdomain, JWT, or X-Tenant-Slug header',
        });
        return;
      }
      
      // 2. Get tenant database connection
      const dbManager = getTenantDBManager();
      const tenantDB = await dbManager.getTenantDB(tenantSlug);
      
      // 3. Get tenant ID from registry
      const tenantId = await this.getTenantId(tenantSlug);
      
      // 4. Attach tenant context to request
      req.tenant = {
        tenantId,
        tenantSlug,
        db: tenantDB,
      };
      
      // 5. Extract user info if JWT present
      const userInfo = this.extractUserFromJWT(req);
      if (userInfo) {
        req.tenant.userId = userInfo.userId;
        req.tenant.userRole = userInfo.role;
        req.user = {
          id: userInfo.userId,
          email: userInfo.email,
          tenantId: userInfo.tenantId,
          role: userInfo.role,
        };
      }
      
      // Log tenant access
      console.log(`[Tenant] ${tenantSlug} | User: ${req.tenant.userId || 'anonymous'} | ${req.method} ${req.path}`);
      
      next();
      
    } catch (error: any) {
      console.error('[TenantResolver] Error:', error);
      
      if (error.message.includes('Tenant not found')) {
        res.status(404).json({
          error: 'Tenant not found',
          message: 'The specified tenant does not exist',
        });
      } else if (error.message.includes('suspended')) {
        res.status(403).json({
          error: 'Tenant suspended',
          message: 'This tenant account has been suspended',
        });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: 'Failed to resolve tenant',
        });
      }
    }
  };
  
  // ==========================================================================
  // TENANT EXTRACTION STRATEGIES
  // ==========================================================================
  
  /**
   * Extract tenant slug from request
   * Priority: Header > JWT > Subdomain
   */
  private extractTenantSlug(req: Request): string | null {
    // Strategy 1: X-Tenant-Slug header (highest priority)
    const headerSlug = req.headers['x-tenant-slug'] as string;
    if (headerSlug) {
      return this.sanitizeSlug(headerSlug);
    }
    
    // Strategy 2: JWT token
    const jwtSlug = this.extractTenantFromJWT(req);
    if (jwtSlug) {
      return jwtSlug;
    }
    
    // Strategy 3: Subdomain
    const subdomainSlug = this.extractTenantFromSubdomain(req);
    if (subdomainSlug) {
      return subdomainSlug;
    }
    
    return null;
  }
  
  /**
   * Extract tenant from subdomain
   * Example: shop1.yourpos.com → shop1
   */
  private extractTenantFromSubdomain(req: Request): string | null {
    const host = req.hostname || req.headers.host || '';
    
    // Check if host matches allowed domains
    for (const domain of this.allowedDomains) {
      if (host.endsWith(domain)) {
        // Extract subdomain
        const subdomain = host.replace(`.${domain}`, '').replace(domain, '');
        
        if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
          return this.sanitizeSlug(subdomain);
        }
      }
    }
    
    return null;
  }
  
  /**
   * Extract tenant from JWT token
   */
  private extractTenantFromJWT(req: Request): string | null {
    try {
      const token = this.extractToken(req);
      if (!token) return null;
      
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      return decoded.tenantSlug || decoded.tenant_slug || null;
      
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Extract user info from JWT token
   */
  private extractUserFromJWT(req: Request): {
    userId: string;
    email: string;
    tenantId: string;
    role: string;
  } | null {
    try {
      const token = this.extractToken(req);
      if (!token) return null;
      
      const decoded = jwt.verify(token, this.jwtSecret) as any;
      
      return {
        userId: decoded.userId || decoded.user_id,
        email: decoded.email,
        tenantId: decoded.tenantId || decoded.tenant_id,
        role: decoded.role,
      };
      
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Extract JWT token from Authorization header
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
  }
  
  /**
   * Get tenant ID from slug
   */
  private async getTenantId(tenantSlug: string): Promise<string> {
    const dbManager = getTenantDBManager();
    const tenants = await dbManager.getAllTenants();
    
    const tenant = tenants.find(t => t.slug === tenantSlug);
    if (!tenant) {
      throw new Error(`Tenant not found: ${tenantSlug}`);
    }
    
    return tenant.id;
  }
  
  /**
   * Sanitize tenant slug
   */
  private sanitizeSlug(slug: string): string {
    return slug.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }
}

// ============================================================================
// MIDDLEWARE FACTORY
// ============================================================================

export function createTenantResolver(
  jwtSecret: string,
  allowedDomains: string[]
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const resolver = new TenantResolver(jwtSecret, allowedDomains);
  return resolver.resolve;
}

// ============================================================================
// OPTIONAL: REQUIRE AUTHENTICATION
// ============================================================================

/**
 * Middleware to require authenticated user
 * Use after tenant resolver
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || !req.tenant?.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }
  
  next();
}

/**
 * Middleware to require specific role
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${allowedRoles.join(' or ')}`,
      });
      return;
    }
    
    next();
  };
}

// ============================================================================
// HELPER: GET TENANT DB FROM REQUEST
// ============================================================================

/**
 * Get tenant database from request
 * Use this in all repositories/services
 */
export function getTenantDB(req: Request): Pool {
  if (!req.tenant?.db) {
    throw new Error('Tenant database not available. Did you forget to use tenant resolver middleware?');
  }
  
  return req.tenant.db;
}

/**
 * Get tenant context from request
 */
export function getTenantContext(req: Request): TenantContext {
  if (!req.tenant) {
    throw new Error('Tenant context not available. Did you forget to use tenant resolver middleware?');
  }
  
  return req.tenant;
}

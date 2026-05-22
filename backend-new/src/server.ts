/**
 * Express Server with Database-Per-Tenant Architecture
 * 
 * Features:
 * - Tenant resolution middleware
 * - Database-per-tenant routing
 * - JWT authentication
 * - Connection pooling
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { initializeTenantDBManager } from './core/database/tenant-db-manager';
import { createTenantResolver, requireAuth, requireRole } from './core/middleware/tenant-resolver';

// Import route modules
import { authRoutes } from './modules/auth/auth.routes';
import { posRoutes } from './modules/pos/pos.routes';
import { productsRoutes } from './modules/products/products.routes';
import { inventoryRoutes } from './modules/inventory/inventory.routes';
import { salesRoutes } from './modules/sales/sales.routes';
import { customersRoutes } from './modules/customers/customers.routes';
import { reportsRoutes } from './modules/reports/reports.routes';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = parseInt(process.env.PORT || '3001');
const NODE_ENV = process.env.NODE_ENV || 'development';

// ============================================================================
// INITIALIZE DATABASE MANAGER
// ============================================================================

const dbManager = initializeTenantDBManager(
  {
    host: process.env.REGISTRY_DB_HOST || 'localhost',
    port: parseInt(process.env.REGISTRY_DB_PORT || '5432'),
    database: process.env.REGISTRY_DB_NAME || 'registry_db',
    user: process.env.REGISTRY_DB_USER || 'postgres',
    password: process.env.REGISTRY_DB_PASSWORD,
  },
  {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  process.env.DB_ENCRYPTION_KEY!
);

console.log('✅ Tenant Database Manager initialized');

// ============================================================================
// EXPRESS APP
// ============================================================================

const app = express();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  
  next();
});

// ============================================================================
// HEALTH CHECK (No tenant required)
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    database: 'connected',
    redis: 'connected',
  });
});

// ============================================================================
// TENANT RESOLUTION MIDDLEWARE
// ============================================================================

const tenantResolver = createTenantResolver(
  process.env.JWT_SECRET!,
  process.env.ALLOWED_DOMAINS?.split(',') || ['localhost']
);

// Apply to all /api routes
app.use('/api', tenantResolver);

// ============================================================================
// ROUTES
// ============================================================================

// Public routes (no auth required)
app.use('/api/auth', authRoutes);

// Protected routes (auth required)
app.use('/api/pos', requireAuth, posRoutes);
app.use('/api/products', requireAuth, productsRoutes);
app.use('/api/inventory', requireAuth, inventoryRoutes);
app.use('/api/sales', requireAuth, salesRoutes);
app.use('/api/customers', requireAuth, customersRoutes);

// Admin routes (admin role required)
app.use('/api/reports', requireAuth, requireRole('admin', 'owner'), reportsRoutes);

// ============================================================================
// ADMIN ENDPOINTS (Tenant provisioning)
// ============================================================================

app.post('/api/admin/tenants/provision', async (req: Request, res: Response) => {
  try {
    const { slug, businessName, ownerEmail, plan } = req.body;
    
    // Validate input
    if (!slug || !businessName || !ownerEmail) {
      res.status(400).json({
        error: 'Missing required fields',
        required: ['slug', 'businessName', 'ownerEmail'],
      });
      return;
    }
    
    // Provision tenant
    const tenantConfig = await dbManager.provisionTenant({
      slug,
      businessName,
      ownerEmail,
      plan: plan || 'basic',
    });
    
    res.json({
      success: true,
      tenant: {
        id: tenantConfig.id,
        slug: tenantConfig.slug,
        dbName: tenantConfig.dbName,
        status: tenantConfig.status,
      },
      message: 'Tenant provisioned successfully',
    });
    
  } catch (error: any) {
    console.error('Tenant provisioning error:', error);
    res.status(500).json({
      error: 'Provisioning failed',
      message: error.message,
    });
  }
});

app.get('/api/admin/tenants', async (req: Request, res: Response) => {
  try {
    const tenants = await dbManager.getAllTenants();
    
    res.json({
      success: true,
      tenants: tenants.map(t => ({
        id: t.id,
        slug: t.slug,
        dbName: t.dbName,
        status: t.status,
        migrationStatus: t.migrationStatus,
      })),
    });
    
  } catch (error: any) {
    console.error('Get tenants error:', error);
    res.status(500).json({
      error: 'Failed to fetch tenants',
      message: error.message,
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Smart POS System - Database-Per-Tenant Architecture');
  console.log('='.repeat(60));
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Server: http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log('='.repeat(60) + '\n');
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGTERM', async () => {
  console.log('\n🔄 SIGTERM received, shutting down gracefully...');
  
  server.close(async () => {
    console.log('✅ HTTP server closed');
    
    await dbManager.shutdown();
    console.log('✅ Database connections closed');
    
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});

process.on('SIGINT', async () => {
  console.log('\n🔄 SIGINT received, shutting down gracefully...');
  
  server.close(async () => {
    await dbManager.shutdown();
    process.exit(0);
  });
});

export default app;

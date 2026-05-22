/**
 * Tenant Database Manager
 * 
 * Manages database-per-tenant connections with:
 * - Connection pooling
 * - Automatic tenant DB creation
 * - Migration management
 * - Connection caching
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import Redis from 'ioredis';

// ============================================================================
// TYPES
// ============================================================================

export interface TenantConfig {
  id: string;
  slug: string;
  dbName: string;
  dbHost: string;
  dbPort: number;
  dbUser: string;
  dbPassword: string;
  status: 'active' | 'suspended' | 'migrating';
  migrationStatus: 'pending' | 'in_progress' | 'completed';
}

export interface ConnectionPoolConfig {
  max: number;
  min: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

// ============================================================================
// TENANT DATABASE MANAGER
// ============================================================================

export class TenantDatabaseManager {
  private registryPool: Pool;
  private tenantPools: Map<string, Pool> = new Map();
  private redis: Redis;
  private encryptionKey: Buffer;
  
  private readonly CACHE_TTL = 3600; // 1 hour
  private readonly CACHE_PREFIX = 'tenant:db:';
  
  constructor(
    registryConfig: PoolConfig,
    redisConfig: { host: string; port: number; password?: string },
    encryptionKey: string
  ) {
    // Central registry database connection
    this.registryPool = new Pool({
      ...registryConfig,
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    // Redis for caching tenant configs
    this.redis = new Redis(redisConfig);
    
    // Encryption key for DB credentials
    this.encryptionKey = Buffer.from(encryptionKey, 'hex');
    
    // Cleanup on shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }
  
  // ==========================================================================
  // TENANT RESOLUTION
  // ==========================================================================
  
  /**
   * Get tenant database connection by slug
   */
  async getTenantDB(tenantSlug: string): Promise<Pool> {
    // Check if pool already exists
    if (this.tenantPools.has(tenantSlug)) {
      return this.tenantPools.get(tenantSlug)!;
    }
    
    // Get tenant config (with caching)
    const config = await this.getTenantConfig(tenantSlug);
    
    if (!config) {
      throw new Error(`Tenant not found: ${tenantSlug}`);
    }
    
    if (config.status !== 'active') {
      throw new Error(`Tenant is ${config.status}: ${tenantSlug}`);
    }
    
    // Create new connection pool
    const pool = await this.createTenantPool(config);
    this.tenantPools.set(tenantSlug, pool);
    
    return pool;
  }
  
  /**
   * Get tenant configuration from registry (with Redis caching)
   */
  private async getTenantConfig(tenantSlug: string): Promise<TenantConfig | null> {
    const cacheKey = `${this.CACHE_PREFIX}${tenantSlug}`;
    
    // Try cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Query registry database
    const result = await this.registryPool.query(
      `SELECT 
        id, slug, db_name, db_host, db_port, 
        db_user, db_password_encrypted, 
        status, migration_status
      FROM tenants 
      WHERE slug = $1 AND status != 'deleted'`,
      [tenantSlug]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    // Decrypt password
    const dbPassword = this.decrypt(row.db_password_encrypted);
    
    const config: TenantConfig = {
      id: row.id,
      slug: row.slug,
      dbName: row.db_name,
      dbHost: row.db_host,
      dbPort: row.db_port,
      dbUser: row.db_user,
      dbPassword,
      status: row.status,
      migrationStatus: row.migration_status,
    };
    
    // Cache for 1 hour
    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(config));
    
    // Update last accessed timestamp
    await this.registryPool.query(
      'UPDATE tenants SET last_accessed_at = NOW() WHERE id = $1',
      [config.id]
    );
    
    return config;
  }
  
  /**
   * Create connection pool for tenant database
   */
  private async createTenantPool(config: TenantConfig): Promise<Pool> {
    const poolConfig: PoolConfig = {
      host: config.dbHost,
      port: config.dbPort,
      database: config.dbName,
      user: config.dbUser,
      password: config.dbPassword,
      max: 10,                    // Max connections per tenant
      min: 2,                     // Min idle connections
      idleTimeoutMillis: 30000,   // Close idle connections after 30s
      connectionTimeoutMillis: 5000,
    };
    
    const pool = new Pool(poolConfig);
    
    // Test connection
    try {
      const client = await pool.connect();
      client.release();
    } catch (error) {
      throw new Error(`Failed to connect to tenant DB ${config.dbName}: ${error}`);
    }
    
    return pool;
  }
  
  // ==========================================================================
  // TENANT PROVISIONING
  // ==========================================================================
  
  /**
   * Create new tenant database and run migrations
   */
  async provisionTenant(params: {
    slug: string;
    businessName: string;
    ownerEmail: string;
    plan?: string;
  }): Promise<TenantConfig> {
    const { slug, businessName, ownerEmail, plan = 'basic' } = params;
    
    // Validate slug
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error('Invalid slug format. Use lowercase letters, numbers, and hyphens only.');
    }
    
    // Check if slug already exists
    const existing = await this.getTenantConfig(slug);
    if (existing) {
      throw new Error(`Tenant slug already exists: ${slug}`);
    }
    
    const dbName = `tenant_${slug}_db`;
    const dbUser = `tenant_${slug}_user`;
    const dbPassword = this.generateSecurePassword();
    
    const client = await this.registryPool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Create tenant record
      const tenantResult = await client.query(
        `INSERT INTO tenants (
          slug, business_name, db_name, db_host, db_port, 
          db_user, db_password_encrypted, plan, status, migration_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`,
        [
          slug,
          businessName,
          dbName,
          process.env.DB_HOST || 'localhost',
          parseInt(process.env.DB_PORT || '5432'),
          dbUser,
          this.encrypt(dbPassword),
          plan,
          'active',
          'completed', // New tenants are already migrated
        ]
      );
      
      const tenantId = tenantResult.rows[0].id;
      
      // 2. Create PostgreSQL database
      await this.createPostgresDatabase(dbName, dbUser, dbPassword);
      
      // 3. Run tenant migrations
      await this.runTenantMigrations(dbName, dbUser, dbPassword);
      
      // 4. Link owner to tenant
      const userResult = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [ownerEmail]
      );
      
      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        
        await client.query(
          `INSERT INTO tenant_users (tenant_id, user_id, role, status, joined_at)
          VALUES ($1, $2, $3, $4, NOW())`,
          [tenantId, userId, 'owner', 'active']
        );
      }
      
      await client.query('COMMIT');
      
      console.log(`✅ Tenant provisioned: ${slug} (${dbName})`);
      
      return {
        id: tenantId,
        slug,
        dbName,
        dbHost: process.env.DB_HOST || 'localhost',
        dbPort: parseInt(process.env.DB_PORT || '5432'),
        dbUser,
        dbPassword,
        status: 'active',
        migrationStatus: 'completed',
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`❌ Failed to provision tenant ${slug}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Create PostgreSQL database and user
   */
  private async createPostgresDatabase(
    dbName: string,
    dbUser: string,
    dbPassword: string
  ): Promise<void> {
    // Connect to postgres database to create new database
    const adminPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: 'postgres',
      user: process.env.DB_ADMIN_USER || 'postgres',
      password: process.env.DB_ADMIN_PASSWORD,
    });
    
    try {
      // Create user
      await adminPool.query(
        `CREATE USER ${dbUser} WITH PASSWORD '${dbPassword}'`
      );
      
      // Create database
      await adminPool.query(
        `CREATE DATABASE ${dbName} OWNER ${dbUser}`
      );
      
      // Grant privileges
      await adminPool.query(
        `GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser}`
      );
      
      console.log(`✅ Created database: ${dbName}`);
      
    } finally {
      await adminPool.end();
    }
  }
  
  /**
   * Run migrations on tenant database
   */
  private async runTenantMigrations(
    dbName: string,
    dbUser: string,
    dbPassword: string
  ): Promise<void> {
    const pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: dbName,
      user: dbUser,
      password: dbPassword,
    });
    
    try {
      // Read and execute tenant schema
      const fs = require('fs');
      const path = require('path');
      
      const schemaPath = path.join(__dirname, '../../migrations/tenant/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      await pool.query(schema);
      
      console.log(`✅ Migrations completed for: ${dbName}`);
      
    } finally {
      await pool.end();
    }
  }
  
  // ==========================================================================
  // UTILITIES
  // ==========================================================================
  
  /**
   * Invalidate tenant cache (call after config changes)
   */
  async invalidateTenantCache(tenantSlug: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${tenantSlug}`;
    await this.redis.del(cacheKey);
    
    // Close existing pool to force reconnection
    const pool = this.tenantPools.get(tenantSlug);
    if (pool) {
      await pool.end();
      this.tenantPools.delete(tenantSlug);
    }
  }
  
  /**
   * Get all active tenants
   */
  async getAllTenants(): Promise<TenantConfig[]> {
    const result = await this.registryPool.query(
      `SELECT 
        id, slug, db_name, db_host, db_port, 
        db_user, db_password_encrypted, 
        status, migration_status
      FROM tenants 
      WHERE status = 'active'
      ORDER BY created_at DESC`
    );
    
    return result.rows.map(row => ({
      id: row.id,
      slug: row.slug,
      dbName: row.db_name,
      dbHost: row.db_host,
      dbPort: row.db_port,
      dbUser: row.db_user,
      dbPassword: this.decrypt(row.db_password_encrypted),
      status: row.status,
      migrationStatus: row.migration_status,
    }));
  }
  
  /**
   * Encrypt database password
   */
  private encrypt(text: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return `${iv.toString('hex')}:${encrypted}`;
  }
  
  /**
   * Decrypt database password
   */
  private decrypt(encrypted: string): string {
    const [ivHex, encryptedText] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const decipher = createDecipheriv('aes-256-cbc', this.encryptionKey, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
  
  /**
   * Generate secure random password
   */
  private generateSecurePassword(): string {
    return randomBytes(32).toString('base64');
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('🔄 Shutting down Tenant Database Manager...');
    
    // Close all tenant pools
    for (const [slug, pool] of this.tenantPools.entries()) {
      await pool.end();
      console.log(`✅ Closed pool for tenant: ${slug}`);
    }
    
    // Close registry pool
    await this.registryPool.end();
    console.log('✅ Closed registry pool');
    
    // Close Redis
    await this.redis.quit();
    console.log('✅ Closed Redis connection');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let tenantDBManager: TenantDatabaseManager | null = null;

export function initializeTenantDBManager(
  registryConfig: PoolConfig,
  redisConfig: { host: string; port: number; password?: string },
  encryptionKey: string
): TenantDatabaseManager {
  if (!tenantDBManager) {
    tenantDBManager = new TenantDatabaseManager(
      registryConfig,
      redisConfig,
      encryptionKey
    );
  }
  return tenantDBManager;
}

export function getTenantDBManager(): TenantDatabaseManager {
  if (!tenantDBManager) {
    throw new Error('TenantDatabaseManager not initialized. Call initializeTenantDBManager() first.');
  }
  return tenantDBManager;
}

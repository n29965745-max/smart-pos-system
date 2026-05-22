/**
 * Export Tenant Data from Shared Database
 * 
 * Extracts all data for a specific tenant from the old shared database
 * Prepares data for import into new tenant-specific database
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface ExportResult {
  tenantId: string;
  tenantSlug: string;
  exportPath: string;
  tables: {
    [tableName: string]: {
      rowCount: number;
      filePath: string;
    };
  };
  exportedAt: Date;
  success: boolean;
  errors: string[];
}

// ============================================================================
// TENANT DATA EXPORTER
// ============================================================================

export class TenantDataExporter {
  private oldDB: Pool;
  private exportDir: string;
  
  // Tables to export (in dependency order)
  private readonly TABLES_TO_EXPORT = [
    'products',
    'customers',
    'staff',
    'categories',
    'suppliers',
    'sales',
    'sale_items',
    'inventory_movements',
    'purchases',
    'purchase_items',
    'payments',
    'expenses',
    'expense_categories',
    'returns',
    'return_items',
    'loyalty_transactions',
    'sms_messages',
    'sms_templates',
    'shop_settings',
  ];
  
  constructor(oldDBConfig: any, exportDir: string) {
    this.oldDB = new Pool(oldDBConfig);
    this.exportDir = exportDir;
    
    // Create export directory if not exists
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }
  }
  
  /**
   * Export all data for a tenant
   */
  async exportTenant(tenantId: string): Promise<ExportResult> {
    console.log(`\n🔄 Starting export for tenant: ${tenantId}`);
    
    const result: ExportResult = {
      tenantId,
      tenantSlug: '',
      exportPath: '',
      tables: {},
      exportedAt: new Date(),
      success: false,
      errors: [],
    };
    
    try {
      // 1. Get tenant info
      const tenantInfo = await this.getTenantInfo(tenantId);
      result.tenantSlug = tenantInfo.slug;
      
      // 2. Create tenant export directory
      const tenantExportDir = path.join(this.exportDir, tenantInfo.slug);
      if (!fs.existsSync(tenantExportDir)) {
        fs.mkdirSync(tenantExportDir, { recursive: true });
      }
      result.exportPath = tenantExportDir;
      
      // 3. Export each table
      for (const tableName of this.TABLES_TO_EXPORT) {
        try {
          const tableResult = await this.exportTable(
            tableName,
            tenantId,
            tenantExportDir
          );
          
          result.tables[tableName] = tableResult;
          
          console.log(`  ✅ ${tableName}: ${tableResult.rowCount} rows`);
          
        } catch (error: any) {
          console.error(`  ❌ ${tableName}: ${error.message}`);
          result.errors.push(`${tableName}: ${error.message}`);
        }
      }
      
      // 4. Export metadata
      await this.exportMetadata(tenantInfo, tenantExportDir, result);
      
      result.success = result.errors.length === 0;
      
      console.log(`\n${result.success ? '✅' : '⚠️'} Export completed for ${tenantInfo.slug}`);
      console.log(`   Total tables: ${Object.keys(result.tables).length}`);
      console.log(`   Total rows: ${this.getTotalRows(result)}`);
      console.log(`   Errors: ${result.errors.length}`);
      
      return result;
      
    } catch (error: any) {
      console.error(`\n❌ Export failed for tenant ${tenantId}:`, error);
      result.errors.push(`Fatal error: ${error.message}`);
      return result;
    }
  }
  
  /**
   * Export single table for tenant
   */
  private async exportTable(
    tableName: string,
    tenantId: string,
    exportDir: string
  ): Promise<{ rowCount: number; filePath: string }> {
    // Query data filtered by tenant_id
    const query = `
      SELECT * FROM ${tableName}
      WHERE tenant_id = $1
      ORDER BY created_at ASC
    `;
    
    const result = await this.oldDB.query(query, [tenantId]);
    
    // Transform data (remove tenant_id column)
    const transformedData = result.rows.map(row => {
      const { tenant_id, ...rest } = row;
      return rest;
    });
    
    // Write to JSON file
    const filePath = path.join(exportDir, `${tableName}.json`);
    fs.writeFileSync(
      filePath,
      JSON.stringify(transformedData, null, 2),
      'utf8'
    );
    
    return {
      rowCount: transformedData.length,
      filePath,
    };
  }
  
  /**
   * Get tenant information
   */
  private async getTenantInfo(tenantId: string): Promise<any> {
    const result = await this.oldDB.query(
      'SELECT * FROM tenants WHERE id = $1',
      [tenantId]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Tenant not found: ${tenantId}`);
    }
    
    return result.rows[0];
  }
  
  /**
   * Export metadata file
   */
  private async exportMetadata(
    tenantInfo: any,
    exportDir: string,
    exportResult: ExportResult
  ): Promise<void> {
    const metadata = {
      tenant: {
        id: tenantInfo.id,
        slug: tenantInfo.slug,
        business_name: tenantInfo.business_name,
        created_at: tenantInfo.created_at,
      },
      export: {
        exported_at: exportResult.exportedAt,
        tables: Object.keys(exportResult.tables).length,
        total_rows: this.getTotalRows(exportResult),
        errors: exportResult.errors,
      },
      tables: exportResult.tables,
    };
    
    const metadataPath = path.join(exportDir, '_metadata.json');
    fs.writeFileSync(
      metadataPath,
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
  }
  
  /**
   * Calculate total rows exported
   */
  private getTotalRows(result: ExportResult): number {
    return Object.values(result.tables).reduce(
      (sum, table) => sum + table.rowCount,
      0
    );
  }
  
  /**
   * Export all tenants
   */
  async exportAllTenants(): Promise<ExportResult[]> {
    console.log('\n🔄 Starting export for ALL tenants...\n');
    
    // Get all tenant IDs
    const result = await this.oldDB.query(
      `SELECT id, slug FROM tenants 
       WHERE status = 'active' 
       ORDER BY created_at ASC`
    );
    
    const tenants = result.rows;
    console.log(`Found ${tenants.length} tenants to export\n`);
    
    const results: ExportResult[] = [];
    
    for (const tenant of tenants) {
      const exportResult = await this.exportTenant(tenant.id);
      results.push(exportResult);
      
      // Small delay between exports
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 EXPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tenants: ${results.length}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(60) + '\n');
    
    return results;
  }
  
  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.oldDB.end();
  }
}

// ============================================================================
// CLI USAGE
// ============================================================================

if (require.main === module) {
  const exporter = new TenantDataExporter(
    {
      host: process.env.OLD_DB_HOST || 'localhost',
      port: parseInt(process.env.OLD_DB_PORT || '5432'),
      database: process.env.OLD_DB_NAME || 'smart_pos_shared',
      user: process.env.OLD_DB_USER || 'postgres',
      password: process.env.OLD_DB_PASSWORD,
    },
    process.env.EXPORT_DIR || './exports'
  );
  
  const tenantId = process.argv[2];
  
  if (tenantId === 'all') {
    // Export all tenants
    exporter.exportAllTenants()
      .then(() => {
        console.log('\n✅ All exports completed');
        process.exit(0);
      })
      .catch(error => {
        console.error('\n❌ Export failed:', error);
        process.exit(1);
      })
      .finally(() => exporter.close());
  } else if (tenantId) {
    // Export single tenant
    exporter.exportTenant(tenantId)
      .then(result => {
        console.log('\n✅ Export completed');
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error('\n❌ Export failed:', error);
        process.exit(1);
      })
      .finally(() => exporter.close());
  } else {
    console.log('Usage:');
    console.log('  Export single tenant: npm run export-tenant <tenant-id>');
    console.log('  Export all tenants:   npm run export-tenant all');
    process.exit(1);
  }
}

/**
 * Import Tenant Data into New Database
 * 
 * Imports exported data into tenant-specific database
 * Validates data integrity and handles conflicts
 */

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

export interface ImportResult {
  tenantSlug: string;
  importPath: string;
  tables: {
    [tableName: string]: {
      rowsImported: number;
      rowsFailed: number;
      errors: string[];
    };
  };
  importedAt: Date;
  success: boolean;
  totalRows: number;
  totalFailed: number;
}

// ============================================================================
// TENANT DATA IMPORTER
// ============================================================================

export class TenantDataImporter {
  private tenantDB: Pool;
  private importDir: string;
  
  // Import order (respects foreign key dependencies)
  private readonly IMPORT_ORDER = [
    'categories',
    'suppliers',
    'products',
    'customers',
    'staff',
    'sales',
    'sale_items',
    'inventory_movements',
    'purchases',
    'purchase_items',
    'payments',
    'expense_categories',
    'expenses',
    'returns',
    'return_items',
    'loyalty_transactions',
    'sms_templates',
    'sms_messages',
    'shop_settings',
  ];
  
  constructor(tenantDBConfig: any, importDir: string) {
    this.tenantDB = new Pool(tenantDBConfig);
    this.importDir = importDir;
  }
  
  /**
   * Import all data for a tenant
   */
  async importTenant(tenantSlug: string): Promise<ImportResult> {
    console.log(`\n🔄 Starting import for tenant: ${tenantSlug}`);
    
    const result: ImportResult = {
      tenantSlug,
      importPath: path.join(this.importDir, tenantSlug),
      tables: {},
      importedAt: new Date(),
      success: false,
      totalRows: 0,
      totalFailed: 0,
    };
    
    try {
      // 1. Verify export directory exists
      if (!fs.existsSync(result.importPath)) {
        throw new Error(`Export directory not found: ${result.importPath}`);
      }
      
      // 2. Load metadata
      const metadata = this.loadMetadata(result.importPath);
      console.log(`   Exported: ${metadata.export.exported_at}`);
      console.log(`   Tables: ${metadata.export.tables}`);
      console.log(`   Rows: ${metadata.export.total_rows}`);
      
      // 3. Begin transaction
      const client = await this.tenantDB.connect();
      
      try {
        await client.query('BEGIN');
        
        // 4. Import each table
        for (const tableName of this.IMPORT_ORDER) {
          const filePath = path.join(result.importPath, `${tableName}.json`);
          
          if (!fs.existsSync(filePath)) {
            console.log(`  ⏭️  ${tableName}: file not found, skipping`);
            continue;
          }
          
          try {
            const tableResult = await this.importTable(
              client,
              tableName,
              filePath
            );
            
            result.tables[tableName] = tableResult;
            result.totalRows += tableResult.rowsImported;
            result.totalFailed += tableResult.rowsFailed;
            
            console.log(`  ✅ ${tableName}: ${tableResult.rowsImported} rows imported`);
            
            if (tableResult.rowsFailed > 0) {
              console.log(`     ⚠️  ${tableResult.rowsFailed} rows failed`);
            }
            
          } catch (error: any) {
            console.error(`  ❌ ${tableName}: ${error.message}`);
            result.tables[tableName] = {
              rowsImported: 0,
              rowsFailed: 0,
              errors: [error.message],
            };
          }
        }
        
        // 5. Update sequences
        await this.updateSequences(client);
        
        // 6. Commit transaction
        await client.query('COMMIT');
        
        result.success = result.totalFailed === 0;
        
        console.log(`\n${result.success ? '✅' : '⚠️'} Import completed for ${tenantSlug}`);
        console.log(`   Total rows imported: ${result.totalRows}`);
        console.log(`   Total rows failed: ${result.totalFailed}`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
      return result;
      
    } catch (error: any) {
      console.error(`\n❌ Import failed for tenant ${tenantSlug}:`, error);
      result.success = false;
      return result;
    }
  }
  
  /**
   * Import single table
   */
  private async importTable(
    client: any,
    tableName: string,
    filePath: string
  ): Promise<{
    rowsImported: number;
    rowsFailed: number;
    errors: string[];
  }> {
    const result = {
      rowsImported: 0,
      rowsFailed: 0,
      errors: [] as string[],
    };
    
    // Load data from JSON file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const rows = JSON.parse(fileContent);
    
    if (rows.length === 0) {
      return result;
    }
    
    // Get column names from first row
    const columns = Object.keys(rows[0]);
    
    // Build INSERT query
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const query = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      ON CONFLICT (id) DO UPDATE SET
        ${columns.filter(c => c !== 'id').map(c => `${c} = EXCLUDED.${c}`).join(', ')}
    `;
    
    // Import each row
    for (const row of rows) {
      try {
        const values = columns.map(col => row[col]);
        await client.query(query, values);
        result.rowsImported++;
      } catch (error: any) {
        result.rowsFailed++;
        result.errors.push(`Row ${result.rowsImported + result.rowsFailed}: ${error.message}`);
        
        // Stop if too many errors
        if (result.errors.length > 100) {
          result.errors.push('Too many errors, stopping import for this table');
          break;
        }
      }
    }
    
    return result;
  }
  
  /**
   * Update sequences after import
   */
  private async updateSequences(client: any): Promise<void> {
    console.log('\n  🔄 Updating sequences...');
    
    const tables = this.IMPORT_ORDER;
    
    for (const tableName of tables) {
      try {
        // Check if table has id column
        const checkQuery = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1 AND column_name = 'id'
        `;
        
        const checkResult = await client.query(checkQuery, [tableName]);
        
        if (checkResult.rows.length > 0) {
          // Update sequence
          const updateQuery = `
            SELECT setval(
              pg_get_serial_sequence('${tableName}', 'id'),
              COALESCE((SELECT MAX(id) FROM ${tableName}), 1),
              true
            )
          `;
          
          await client.query(updateQuery);
        }
      } catch (error: any) {
        console.log(`     ⚠️  ${tableName}: ${error.message}`);
      }
    }
    
    console.log('  ✅ Sequences updated');
  }
  
  /**
   * Load metadata file
   */
  private loadMetadata(exportDir: string): any {
    const metadataPath = path.join(exportDir, '_metadata.json');
    
    if (!fs.existsSync(metadataPath)) {
      throw new Error('Metadata file not found');
    }
    
    const content = fs.readFileSync(metadataPath, 'utf8');
    return JSON.parse(content);
  }
  
  /**
   * Validate imported data
   */
  async validateImport(tenantSlug: string): Promise<{
    valid: boolean;
    checks: Array<{ table: string; check: string; passed: boolean; message: string }>;
  }> {
    console.log(`\n🔍 Validating import for tenant: ${tenantSlug}`);
    
    const checks: Array<{ table: string; check: string; passed: boolean; message: string }> = [];
    
    // Check 1: Products count
    const productsResult = await this.tenantDB.query('SELECT COUNT(*) FROM products');
    const productsCount = parseInt(productsResult.rows[0].count);
    checks.push({
      table: 'products',
      check: 'row_count',
      passed: productsCount > 0,
      message: `${productsCount} products found`,
    });
    
    // Check 2: Sales integrity
    const salesIntegrityResult = await this.tenantDB.query(`
      SELECT COUNT(*) FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE si.id IS NULL
    `);
    const orphanedSales = parseInt(salesIntegrityResult.rows[0].count);
    checks.push({
      table: 'sales',
      check: 'integrity',
      passed: orphanedSales === 0,
      message: orphanedSales === 0 ? 'All sales have items' : `${orphanedSales} sales without items`,
    });
    
    // Check 3: Inventory movements
    const inventoryResult = await this.tenantDB.query('SELECT COUNT(*) FROM inventory_movements');
    const inventoryCount = parseInt(inventoryResult.rows[0].count);
    checks.push({
      table: 'inventory_movements',
      check: 'row_count',
      passed: true,
      message: `${inventoryCount} movements found`,
    });
    
    // Check 4: Foreign key integrity
    const fkCheckResult = await this.tenantDB.query(`
      SELECT COUNT(*) FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE p.id IS NULL AND si.product_id IS NOT NULL
    `);
    const brokenFKs = parseInt(fkCheckResult.rows[0].count);
    checks.push({
      table: 'sale_items',
      check: 'foreign_keys',
      passed: brokenFKs === 0,
      message: brokenFKs === 0 ? 'All foreign keys valid' : `${brokenFKs} broken references`,
    });
    
    const allPassed = checks.every(c => c.passed);
    
    console.log('\n📊 Validation Results:');
    for (const check of checks) {
      const icon = check.passed ? '✅' : '❌';
      console.log(`  ${icon} ${check.table}.${check.check}: ${check.message}`);
    }
    
    return {
      valid: allPassed,
      checks,
    };
  }
  
  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.tenantDB.end();
  }
}

// ============================================================================
// CLI USAGE
// ============================================================================

if (require.main === module) {
  const tenantSlug = process.argv[2];
  const action = process.argv[3] || 'import';
  
  if (!tenantSlug) {
    console.log('Usage:');
    console.log('  Import: npm run import-tenant <tenant-slug>');
    console.log('  Validate: npm run import-tenant <tenant-slug> validate');
    process.exit(1);
  }
  
  const importer = new TenantDataImporter(
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: `tenant_${tenantSlug}_db`,
      user: `tenant_${tenantSlug}_user`,
      password: process.env.TENANT_DB_PASSWORD,
    },
    process.env.EXPORT_DIR || './exports'
  );
  
  if (action === 'validate') {
    importer.validateImport(tenantSlug)
      .then(result => {
        console.log(`\n${result.valid ? '✅' : '❌'} Validation ${result.valid ? 'passed' : 'failed'}`);
        process.exit(result.valid ? 0 : 1);
      })
      .catch(error => {
        console.error('\n❌ Validation failed:', error);
        process.exit(1);
      })
      .finally(() => importer.close());
  } else {
    importer.importTenant(tenantSlug)
      .then(result => {
        console.log('\n✅ Import completed');
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error('\n❌ Import failed:', error);
        process.exit(1);
      })
      .finally(() => importer.close());
  }
}

'use client';

import { getLocalClient } from './local-client';

export type TMigrationVersion = string; // Format: 'YYYY.MM.DD.HH'

export type TMigration = {
  version: TMigrationVersion;
  description: string;
  up: (client: ReturnType<typeof getLocalClient>['getClient']) => Promise<void>;
  down?: (client: ReturnType<typeof getLocalClient>['getClient']) => Promise<void>;
  requiresDataTransform?: boolean;
  estimatedDuration?: number; // in milliseconds
};

export type TMigrationStatus = {
  version: TMigrationVersion;
  appliedAt: Date;
  duration: number;
  success: boolean;
  error?: string;
};

class MigrationManager {
  private migrations: TMigration[] = [];
  private readonly MIGRATION_TABLE = 'schema_migrations';

  constructor() {
    this.registerMigrations();
  }

  private registerMigrations() {
    // Migration 1: Add indexes for better performance
    this.migrations.push({
      version: '2024.01.01.01',
      description: 'Add performance indexes',
      up: async (client) => {
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_savings_goals_priority ON savings_goals(priority);`);
      },
      down: async (client) => {
        await client.execute(`DROP INDEX IF EXISTS idx_transactions_amount;`);
        await client.execute(`DROP INDEX IF EXISTS idx_transactions_type;`);
        await client.execute(`DROP INDEX IF EXISTS idx_budgets_period;`);
        await client.execute(`DROP INDEX IF EXISTS idx_savings_goals_priority;`);
      },
      estimatedDuration: 1000,
    });

    // Migration 2: Add full-text search capability
    this.migrations.push({
      version: '2024.01.02.01',
      description: 'Add full-text search indexes',
      up: async (client) => {
        // Create FTS tables for search
        await client.execute(`
          CREATE VIRTUAL TABLE IF NOT EXISTS categories_fts USING fts5(
            name, description, content=categories, content_rowid=id
          );
        `);
        
        await client.execute(`
          CREATE VIRTUAL TABLE IF NOT EXISTS transactions_fts USING fts5(
            description, payee, content=transactions, content_rowid=id
          );
        `);

        // Populate FTS tables with existing data
        await client.execute(`
          INSERT INTO categories_fts(rowid, name, description)
          SELECT id, name, COALESCE(description, '') FROM categories;
        `);

        await client.execute(`
          INSERT INTO transactions_fts(rowid, description, payee)
          SELECT id, COALESCE(description, ''), COALESCE(payee, '') FROM transactions;
        `);

        // Create triggers to keep FTS in sync
        await client.execute(`
          CREATE TRIGGER IF NOT EXISTS categories_fts_insert AFTER INSERT ON categories
          BEGIN
            INSERT INTO categories_fts(rowid, name, description)
            VALUES (NEW.id, NEW.name, COALESCE(NEW.description, ''));
          END;
        `);

        await client.execute(`
          CREATE TRIGGER IF NOT EXISTS categories_fts_update AFTER UPDATE ON categories
          BEGIN
            INSERT INTO categories_fts(categories_fts, rowid, name, description)
            VALUES ('delete', OLD.id, OLD.name, COALESCE(OLD.description, ''));
            INSERT INTO categories_fts(rowid, name, description)
            VALUES (NEW.id, NEW.name, COALESCE(NEW.description, ''));
          END;
        `);
      },
      requiresDataTransform: true,
      estimatedDuration: 3000,
    });

    // Migration 3: Add audit trail
    this.migrations.push({
      version: '2024.01.03.01',
      description: 'Add audit trail for data changes',
      up: async (client) => {
        await client.execute(`
          CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            table_name TEXT NOT NULL,
            record_id INTEGER NOT NULL,
            action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
            old_values TEXT,
            new_values TEXT,
            user_id TEXT,
            timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            synced INTEGER NOT NULL DEFAULT 0
          );
        `);

        await client.execute(`
          CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
        `);
        await client.execute(`
          CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
        `);
      },
      estimatedDuration: 500,
    });

    // Migration 4: Add data validation constraints
    this.migrations.push({
      version: '2024.01.04.01',
      description: 'Add data validation constraints',
      requiresDataTransform: true,
      up: async (client) => {
        // Add check constraints for data integrity
        // Note: SQLite doesn't support adding constraints to existing tables,
        // so we need to recreate tables with constraints

        // For now, we'll add triggers for validation
        await client.execute(`
          CREATE TRIGGER IF NOT EXISTS validate_transaction_amount
          BEFORE INSERT ON transactions
          WHEN NEW.amount <= 0
          BEGIN
            SELECT RAISE(ABORT, 'Transaction amount must be positive');
          END;
        `);

        await client.execute(`
          CREATE TRIGGER IF NOT EXISTS validate_budget_amount
          BEFORE INSERT ON budgets
          WHEN NEW.amount <= 0
          BEGIN
            SELECT RAISE(ABORT, 'Budget amount must be positive');
          END;
        `);
      },
      estimatedDuration: 1000,
    });
  }

  async initializeMigrationSystem(): Promise<void> {
    const client = getLocalClient().getClient();

    try {
      // Create migration tracking table
      await client.execute(`
        CREATE TABLE IF NOT EXISTS ${this.MIGRATION_TABLE} (
          version TEXT PRIMARY KEY,
          description TEXT NOT NULL,
          applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          duration INTEGER NOT NULL DEFAULT 0,
          success INTEGER NOT NULL DEFAULT 1,
          error TEXT,
          checksum TEXT
        );
      `);

      console.log('✅ Migration system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize migration system:', error);
      throw error;
    }
  }

  async getAppliedMigrations(): Promise<TMigrationStatus[]> {
    const client = getLocalClient().getClient();

    try {
      const result = await client.execute(`
        SELECT version, applied_at, duration, success, error
        FROM ${this.MIGRATION_TABLE}
        ORDER BY version
      `);

      return result.rows.map(row => ({
        version: row.version as TMigrationVersion,
        appliedAt: new Date(row.applied_at as string),
        duration: row.duration as number,
        success: Boolean(row.success),
        error: row.error as string | undefined
      }));
    } catch (error) {
      console.error('❌ Failed to get applied migrations:', error);
      return [];
    }
  }

  async getPendingMigrations(): Promise<TMigration[]> {
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = new Set(
      appliedMigrations.filter(m => m.success).map(m => m.version)
    );

    return this.migrations.filter(migration => !appliedVersions.has(migration.version));
  }

  async runMigrations(
    onProgress?: (current: number, total: number, migration: TMigration) => void
  ): Promise<{ success: number; failed: number; errors: Error[] }> {
    const pendingMigrations = await this.getPendingMigrations();
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return { success: 0, failed: 0, errors: [] };
    }

    console.log(`🔄 Running ${pendingMigrations.length} pending migrations...`);

    const results = { success: 0, failed: 0, errors: [] as Error[] };
    const client = getLocalClient().getClient();

    for (let i = 0; i < pendingMigrations.length; i++) {
      const migration = pendingMigrations[i];
      
      onProgress?.(i + 1, pendingMigrations.length, migration);
      
      console.log(`🔄 Running migration ${migration.version}: ${migration.description}`);
      
      const startTime = Date.now();
      let success = false;
      let error: string | undefined;

      try {
        // Run in transaction for data integrity
        await client.execute('BEGIN TRANSACTION;');

        await migration.up(client);

        await client.execute('COMMIT;');

        success = true;
        results.success++;
        
        const duration = Date.now() - startTime;
        console.log(`✅ Migration ${migration.version} completed in ${duration}ms`);

        // Record successful migration
        await this.recordMigration(migration, duration, success);

      } catch (migrationError) {
        await client.execute('ROLLBACK;');
        
        error = migrationError instanceof Error ? migrationError.message : 'Unknown error';
        results.failed++;
        results.errors.push(migrationError as Error);
        
        console.error(`❌ Migration ${migration.version} failed:`, migrationError);

        // Record failed migration
        await this.recordMigration(migration, Date.now() - startTime, success, error);

        // Stop on first error to maintain consistency
        break;
      }
    }

    return results;
  }

  private async recordMigration(
    migration: TMigration,
    duration: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    const client = getLocalClient().getClient();
    
    try {
      await client.execute(`
        INSERT OR REPLACE INTO ${this.MIGRATION_TABLE} 
        (version, description, applied_at, duration, success, error)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
      `, [
        migration.version,
        migration.description,
        duration,
        success ? 1 : 0,
        error || null
      ]);
    } catch (recordError) {
      console.error('❌ Failed to record migration:', recordError);
    }
  }

  async rollbackMigration(version: TMigrationVersion): Promise<boolean> {
    const migration = this.migrations.find(m => m.version === version);
    
    if (!migration?.down) {
      throw new Error(`Migration ${version} does not support rollback`);
    }

    const client = getLocalClient().getClient();
    
    try {
      console.log(`🔄 Rolling back migration ${version}...`);

      await client.execute('BEGIN TRANSACTION;');
      await migration.down(client);
      await client.execute('COMMIT;');

      // Remove from migration record
      await client.execute(`
        DELETE FROM ${this.MIGRATION_TABLE} WHERE version = ?
      `, [version]);

      console.log(`✅ Migration ${version} rolled back successfully`);
      return true;

    } catch (error) {
      await client.execute('ROLLBACK;');
      console.error(`❌ Rollback failed for migration ${version}:`, error);
      throw error;
    }
  }

  async getMigrationInfo(): Promise<{
    appliedCount: number;
    pendingCount: number;
    totalCount: number;
    lastApplied?: TMigrationStatus;
  }> {
    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = await this.getPendingMigrations();
    const successfulMigrations = appliedMigrations.filter(m => m.success);

    return {
      appliedCount: successfulMigrations.length,
      pendingCount: pendingMigrations.length,
      totalCount: this.migrations.length,
      lastApplied: successfulMigrations[successfulMigrations.length - 1]
    };
  }

  // Check if database needs migrations
  async needsMigration(): Promise<boolean> {
    const pendingMigrations = await this.getPendingMigrations();
    return pendingMigrations.length > 0;
  }

  // Get estimated migration time
  async getEstimatedMigrationTime(): Promise<number> {
    const pendingMigrations = await this.getPendingMigrations();
    return pendingMigrations.reduce((total, migration) => {
      return total + (migration.estimatedDuration || 1000);
    }, 0);
  }

  // Data integrity check after migrations
  async validateDataIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const client = getLocalClient().getClient();
    const issues: string[] = [];

    try {
      // Check for foreign key violations
      await client.execute('PRAGMA foreign_key_check;');

      // Check for negative amounts
      const negativeAmounts = await client.execute(`
        SELECT COUNT(*) as count FROM transactions WHERE amount <= 0
      `);
      
      if ((negativeAmounts.rows[0].count as number) > 0) {
        issues.push('Found transactions with negative or zero amounts');
      }

      // Check for orphaned records
      const orphanedTransactions = await client.execute(`
        SELECT COUNT(*) as count 
        FROM transactions t 
        LEFT JOIN categories c ON t.category_id = c.id 
        WHERE c.id IS NULL
      `);

      if ((orphanedTransactions.rows[0].count as number) > 0) {
        issues.push('Found transactions with missing categories');
      }

      return {
        valid: issues.length === 0,
        issues
      };

    } catch (error) {
      console.error('❌ Data integrity check failed:', error);
      return {
        valid: false,
        issues: [`Data integrity check failed: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }
}

// Singleton instance
let migrationManagerInstance: MigrationManager | null = null;

export function getMigrationManager(): MigrationManager {
  if (!migrationManagerInstance) {
    migrationManagerInstance = new MigrationManager();
  }
  return migrationManagerInstance;
}

export { MigrationManager };

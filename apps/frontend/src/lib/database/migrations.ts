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

const MIGRATION_TABLE = 'schema_migrations';

function getMigrations(): TMigration[] {
  return [
    {
      version: '2024.01.01.01',
      description: 'Add performance indexes',
      up: async function addPerformanceIndexes(client) {
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount);`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_savings_goals_priority ON savings_goals(priority);`);
      },
      down: async function removePerformanceIndexes(client) {
        await client.execute(`DROP INDEX IF EXISTS idx_transactions_amount;`);
        await client.execute(`DROP INDEX IF EXISTS idx_transactions_type;`);
        await client.execute(`DROP INDEX IF EXISTS idx_budgets_period;`);
        await client.execute(`DROP INDEX IF EXISTS idx_savings_goals_priority;`);
      },
      estimatedDuration: 1000,
    },
    {
      version: '2024.01.02.01',
      description: 'Add full-text search indexes',
      up: async function addFullTextSearch(client) {
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

        await client.execute(`
          INSERT INTO categories_fts(rowid, name, description)
          SELECT id, name, COALESCE(description, '') FROM categories;
        `);

        await client.execute(`
          INSERT INTO transactions_fts(rowid, description, payee)
          SELECT id, COALESCE(description, ''), COALESCE(payee, '') FROM transactions;
        `);

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
    },
    {
      version: '2024.01.03.01',
      description: 'Add audit trail for data changes',
      up: async function addAuditTrail(client) {
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
    },
    {
      version: '2024.01.04.01',
      description: 'Add data validation constraints',
      requiresDataTransform: true,
      up: async function addValidationConstraints(client) {
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
    },
    {
      version: '2024.01.05.01',
      description: 'Update budgets table with additional fields',
      requiresDataTransform: true,
      up: async function updateBudgetsTable(client) {
        // Add new columns to budgets table
        await client.execute(`ALTER TABLE budgets ADD COLUMN name TEXT;`);
        await client.execute(`ALTER TABLE budgets ADD COLUMN description TEXT;`);
        await client.execute(`ALTER TABLE budgets ADD COLUMN spent REAL DEFAULT 0 NOT NULL;`);
        await client.execute(`ALTER TABLE budgets ADD COLUMN alert_threshold REAL DEFAULT 0.8;`);
        await client.execute(`ALTER TABLE budgets ADD COLUMN rollover INTEGER DEFAULT 0 NOT NULL;`);
        await client.execute(`ALTER TABLE budgets ADD COLUMN carryover_amount REAL DEFAULT 0;`);
        await client.execute(`ALTER TABLE budgets ADD COLUMN color TEXT DEFAULT '#3B82F6';`);
        await client.execute(`ALTER TABLE budgets ADD COLUMN priority TEXT DEFAULT 'medium' NOT NULL;`);
        await client.execute(`ALTER TABLE budgets ADD COLUMN auto_renew INTEGER DEFAULT 1 NOT NULL;`);
        await client.execute(`ALTER TABLE budgets ADD COLUMN reset_day INTEGER DEFAULT 1;`);
        
        // Update period enum to include additional values
        await client.execute(`
          CREATE TABLE budgets_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
            synced INTEGER DEFAULT 0 NOT NULL,
            category_id INTEGER NOT NULL REFERENCES categories(id),
            name TEXT NOT NULL,
            description TEXT,
            amount REAL NOT NULL,
            spent REAL DEFAULT 0 NOT NULL,
            period TEXT CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')) NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT,
            is_active INTEGER DEFAULT 1 NOT NULL,
            alert_threshold REAL DEFAULT 0.8,
            rollover INTEGER DEFAULT 0 NOT NULL,
            carryover_amount REAL DEFAULT 0,
            color TEXT DEFAULT '#3B82F6',
            priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium' NOT NULL,
            auto_renew INTEGER DEFAULT 1 NOT NULL,
            reset_day INTEGER DEFAULT 1
          );
        `);
        
        // Migrate existing data
        await client.execute(`
          INSERT INTO budgets_new (
            id, created_at, updated_at, synced, category_id, name, description,
            amount, spent, period, start_date, end_date, is_active,
            alert_threshold, rollover, carryover_amount, color, priority,
            auto_renew, reset_day
          )
          SELECT 
            id, created_at, updated_at, synced, category_id,
            COALESCE(name, 'Budget ' || id) as name,
            description,
            amount,
            COALESCE(spent, 0) as spent,
            period,
            start_date, end_date, is_active,
            COALESCE(alert_threshold, 0.8) as alert_threshold,
            COALESCE(rollover, 0) as rollover,
            COALESCE(carryover_amount, 0) as carryover_amount,
            COALESCE(color, '#3B82F6') as color,
            COALESCE(priority, 'medium') as priority,
            COALESCE(auto_renew, 1) as auto_renew,
            COALESCE(reset_day, 1) as reset_day
          FROM budgets;
        `);
        
        // Replace old table
        await client.execute(`DROP TABLE budgets;`);
        await client.execute(`ALTER TABLE budgets_new RENAME TO budgets;`);
        
        // Recreate indexes
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period);`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_budgets_priority ON budgets(priority);`);
        await client.execute(`CREATE INDEX IF NOT EXISTS idx_budgets_is_active ON budgets(is_active);`);
      },
      down: async function revertBudgetsTable(client) {
        // Create old table structure
        await client.execute(`
          CREATE TABLE budgets_old (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
            synced INTEGER DEFAULT 0 NOT NULL,
            category_id INTEGER NOT NULL REFERENCES categories(id),
            amount REAL NOT NULL,
            period TEXT CHECK (period IN ('monthly', 'yearly')) NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT,
            is_active INTEGER DEFAULT 1
          );
        `);
        
        // Migrate data back
        await client.execute(`
          INSERT INTO budgets_old (id, created_at, updated_at, synced, category_id, amount, period, start_date, end_date, is_active)
          SELECT id, created_at, updated_at, synced, category_id, amount, 
                 CASE WHEN period IN ('weekly', 'quarterly') THEN 'monthly' ELSE period END,
                 start_date, end_date, is_active
          FROM budgets;
        `);
        
        await client.execute(`DROP TABLE budgets;`);
        await client.execute(`ALTER TABLE budgets_old RENAME TO budgets;`);
      },
      estimatedDuration: 2000,
    },
  ];
}

export function createMigrationSystem() {
  async function initializeMigrationSystem(): Promise<void> {
    const client = getLocalClient().getClient();

    try {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
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

  async function getAppliedMigrations(): Promise<TMigrationStatus[]> {
    const client = getLocalClient().getClient();

    try {
      const result = await client.execute(`
        SELECT version, applied_at, duration, success, error
        FROM ${MIGRATION_TABLE}
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

  async function getPendingMigrations(): Promise<TMigration[]> {
    const appliedMigrations = await getAppliedMigrations();
    const appliedVersions = new Set(
      appliedMigrations.filter(m => m.success).map(m => m.version)
    );
    
    const migrations = getMigrations();
    return migrations.filter(migration => !appliedVersions.has(migration.version));
  }

  async function recordMigration(
    migration: TMigration,
    duration: number,
    success: boolean,
    error?: string
  ): Promise<void> {
    const client = getLocalClient().getClient();
    
    try {
      await client.execute(`
        INSERT OR REPLACE INTO ${MIGRATION_TABLE} 
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

  async function runMigrations(
    onProgress?: (current: number, total: number, migration: TMigration) => void
  ): Promise<{ success: number; failed: number; errors: Error[] }> {
    const pendingMigrations = await getPendingMigrations();
    
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
        await client.execute('BEGIN TRANSACTION;');
        await migration.up(client);
        await client.execute('COMMIT;');

        success = true;
        results.success++;
        
        const duration = Date.now() - startTime;
        console.log(`✅ Migration ${migration.version} completed in ${duration}ms`);

        await recordMigration(migration, duration, success);

      } catch (migrationError) {
        await client.execute('ROLLBACK;');
        
        error = migrationError instanceof Error ? migrationError.message : 'Unknown error';
        results.failed++;
        results.errors.push(migrationError as Error);
        
        console.error(`❌ Migration ${migration.version} failed:`, migrationError);
        await recordMigration(migration, Date.now() - startTime, success, error);
        
        break;
      }
    }

    return results;
  }

  async function rollbackMigration(version: TMigrationVersion): Promise<boolean> {
    const migrations = getMigrations();
    const migration = migrations.find(m => m.version === version);
    
    if (!migration?.down) {
      throw new Error(`Migration ${version} does not support rollback`);
    }

    const client = getLocalClient().getClient();
    
    try {
      console.log(`🔄 Rolling back migration ${version}...`);

      await client.execute('BEGIN TRANSACTION;');
      await migration.down(client);
      await client.execute('COMMIT;');

      await client.execute(`
        DELETE FROM ${MIGRATION_TABLE} WHERE version = ?
      `, [version]);

      console.log(`✅ Migration ${version} rolled back successfully`);
      return true;

    } catch (error) {
      await client.execute('ROLLBACK;');
      console.error(`❌ Rollback failed for migration ${version}:`, error);
      throw error;
    }
  }

  async function getMigrationInfo(): Promise<{
    appliedCount: number;
    pendingCount: number;
    totalCount: number;
    lastApplied?: TMigrationStatus;
  }> {
    const appliedMigrations = await getAppliedMigrations();
    const pendingMigrations = await getPendingMigrations();
    const successfulMigrations = appliedMigrations.filter(m => m.success);
    const migrations = getMigrations();

    return {
      appliedCount: successfulMigrations.length,
      pendingCount: pendingMigrations.length,
      totalCount: migrations.length,
      lastApplied: successfulMigrations[successfulMigrations.length - 1]
    };
  }

  async function needsMigration(): Promise<boolean> {
    const pendingMigrations = await getPendingMigrations();
    return pendingMigrations.length > 0;
  }

  async function getEstimatedMigrationTime(): Promise<number> {
    const pendingMigrations = await getPendingMigrations();
    return pendingMigrations.reduce((total, migration) => {
      return total + (migration.estimatedDuration || 1000);
    }, 0);
  }

  async function validateDataIntegrity(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const client = getLocalClient().getClient();
    const issues: string[] = [];

    try {
      await client.execute('PRAGMA foreign_key_check;');

      const negativeAmounts = await client.execute(`
        SELECT COUNT(*) as count FROM transactions WHERE amount <= 0
      `);
      
      if ((negativeAmounts.rows[0].count as number) > 0) {
        issues.push('Found transactions with negative or zero amounts');
      }

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

  return {
    initializeMigrationSystem,
    getAppliedMigrations,
    getPendingMigrations,
    runMigrations,
    rollbackMigration,
    getMigrationInfo,
    needsMigration,
    getEstimatedMigrationTime,
    validateDataIntegrity,
  };
}

let migrationSystemInstance: ReturnType<typeof createMigrationSystem> | null = null;

export function getMigrationSystem() {
  if (!migrationSystemInstance) {
    migrationSystemInstance = createMigrationSystem();
  }
  return migrationSystemInstance;
}

import { getLocalClient } from './local-client';
import { 
  categoriesSchema, 
  transactionsSchema, 
  savingsGoalsSchema,
  savingsTransactionsSchema,
  budgetsSchema,
  recurringTransactionsSchema 
} from './schemas';

export async function initializeLocalDatabase(): Promise<void> {
  const client = getLocalClient().getClient();

  try {
    console.log('🗄️ Initializing local database tables...');

    // Create Categories table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'debt', 'investment', 'savings')),
        color TEXT DEFAULT '#3B82F6',
        icon TEXT DEFAULT '📁',
        is_active INTEGER NOT NULL DEFAULT 1,
        monthly_budget_limit REAL,
        is_demo INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Create Transactions table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        category_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        description TEXT,
        payee TEXT,
        reference TEXT,
        tags TEXT DEFAULT '[]',
        recurring_transaction_id INTEGER,
        savings_goal_id INTEGER,
        debt_payment_id INTEGER,
        is_demo INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    `);

    // Create Savings Goals table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        target_amount REAL NOT NULL,
        current_amount REAL NOT NULL DEFAULT 0,
        target_date TEXT,
        is_completed INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        color TEXT DEFAULT '#3B82F6',
        icon TEXT DEFAULT '🎯',
        is_active INTEGER NOT NULL DEFAULT 1,
        monthly_target REAL,
        category TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Create Savings Transactions table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS savings_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        savings_goal_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
        date TEXT NOT NULL,
        description TEXT,
        reference TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (savings_goal_id) REFERENCES savings_goals(id)
      );
    `);

    // Create Budgets table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        amount REAL NOT NULL,
        spent REAL NOT NULL DEFAULT 0,
        period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
        start_date TEXT NOT NULL,
        end_date TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        alert_threshold REAL DEFAULT 0.8,
        rollover INTEGER NOT NULL DEFAULT 0,
        carryover_amount REAL DEFAULT 0,
        color TEXT DEFAULT '#3B82F6',
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        auto_renew INTEGER NOT NULL DEFAULT 1,
        reset_day INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    `);

    // Create Recurring Transactions table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        category_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly')),
        interval INTEGER DEFAULT 1,
        day_of_week INTEGER,
        day_of_month INTEGER,
        month_of_year INTEGER,
        start_date TEXT NOT NULL,
        end_date TEXT,
        max_occurrences INTEGER,
        is_active INTEGER NOT NULL DEFAULT 1,
        auto_generate INTEGER NOT NULL DEFAULT 1,
        notify_on_generation INTEGER NOT NULL DEFAULT 0,
        payee TEXT,
        reference TEXT,
        tags TEXT DEFAULT '[]',
        last_generated TEXT,
        generated_count INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER NOT NULL DEFAULT 0
      );
    `);

    // Create indexes for better performance
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_synced ON transactions(synced);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_categories_synced ON categories(synced);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_budgets_category ON budgets(category_id);`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_savings_transactions_goal ON savings_transactions(savings_goal_id);`);

    console.log('✅ Local database tables initialized successfully');

  } catch (error) {
    console.error('❌ Failed to initialize local database:', error);
    throw error;
  }
}

// Seed the database with some demo categories if empty
export async function seedDemoData(): Promise<void> {
  const client = getLocalClient().getClient();

  try {
    // Check if we already have categories
    const existingCategories = await client.execute('SELECT COUNT(*) as count FROM categories');
    const count = existingCategories.rows[0].count as number;

    if (count > 0) {
      console.log('📊 Database already has data, skipping seed');
      return;
    }

    console.log('🌱 Seeding demo data...');

    // Insert demo categories
    const demoCategories = [
      { name: 'Salary', type: 'income', color: '#10B981', icon: '💰', is_demo: 1 },
      { name: 'Freelancing', type: 'income', color: '#3B82F6', icon: '💻', is_demo: 1 },
      { name: 'Groceries', type: 'expense', color: '#EF4444', icon: '🛒', is_demo: 1 },
      { name: 'Transportation', type: 'expense', color: '#F59E0B', icon: '🚗', is_demo: 1 },
      { name: 'Entertainment', type: 'expense', color: '#8B5CF6', icon: '🎬', is_demo: 1 },
      { name: 'Utilities', type: 'expense', color: '#6B7280', icon: '💡', is_demo: 1 },
    ];

    for (const category of demoCategories) {
      await client.execute(`
        INSERT INTO categories (name, type, color, icon, is_demo, synced)
        VALUES (?, ?, ?, ?, ?, 0)
      `, [category.name, category.type, category.color, category.icon, category.is_demo]);
    }

    console.log('✅ Demo data seeded successfully');

  } catch (error) {
    console.error('❌ Failed to seed demo data:', error);
    throw error;
  }
}

// Helper to drop all tables (for development/testing)
export async function resetLocalDatabase(): Promise<void> {
  const client = getLocalClient().getClient();

  try {
    console.log('🗑️ Resetting local database...');

    const tables = [
      'savings_transactions',
      'budgets', 
      'transactions',
      'recurring_transactions',
      'savings_goals',
      'categories'
    ];

    for (const table of tables) {
      await client.execute(`DROP TABLE IF EXISTS ${table}`);
    }

    console.log('✅ Local database reset successfully');

  } catch (error) {
    console.error('❌ Failed to reset local database:', error);
    throw error;
  }
}

// Get database info
export async function getDatabaseInfo(): Promise<{
  tables: string[];
  size: number;
  recordCounts: Record<string, number>;
}> {
  const client = getLocalClient().getClient();

  try {
    // Get table list
    const tablesResult = await client.execute(`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    const tables = tablesResult.rows.map(row => row.name as string);

    // Get record counts for each table
    const recordCounts: Record<string, number> = {};
    for (const table of tables) {
      const countResult = await client.execute(`SELECT COUNT(*) as count FROM ${table}`);
      recordCounts[table] = countResult.rows[0].count as number;
    }

    // Get approximate database size using PRAGMA page_count and page_size
    let size = 0;
    try {
      const pageSizeResult = await client.execute('PRAGMA page_size');
      const pageCountResult = await client.execute('PRAGMA page_count');
      
      const pageSize = pageSizeResult.rows[0]?.page_size as number || 0;
      const pageCount = pageCountResult.rows[0]?.page_count as number || 0;
      
      size = pageSize * pageCount;
    } catch (error) {
      console.warn('Could not determine database size:', error);
    }

    return {
      tables,
      size,
      recordCounts
    };

  } catch (error) {
    console.error('❌ Failed to get database info:', error);
    throw error;
  }
}

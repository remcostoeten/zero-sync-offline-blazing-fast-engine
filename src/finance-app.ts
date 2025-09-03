import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create the Turso client with offline sync enabled
const client = createClient({
  url: 'file:finance.db',
  syncUrl: process.env.TURSO_SYNC_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// ============================================================================
// DATABASE SCHEMA SETUP
// ============================================================================

async function setupFinanceDatabase() {
  console.log('🏗️  Setting up finance database schema...');
  
  try {
    // Categories table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        color TEXT DEFAULT '#3B82F6',
        icon TEXT DEFAULT '💰',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0
      )
    `);

    // Transactions table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        category_id INTEGER NOT NULL,
        note TEXT,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);

    // Savings goals table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        target_amount REAL NOT NULL,
        current_amount REAL DEFAULT 0,
        deadline TEXT,
        description TEXT,
        color TEXT DEFAULT '#10B981',
        icon TEXT DEFAULT '🎯',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0
      )
    `);

    // Savings transactions table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS savings_transactions (
        id INTEGER PRIMARY KEY,
        savings_goal_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
        note TEXT,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (savings_goal_id) REFERENCES savings_goals (id)
      )
    `);

    // Budgets table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS budgets (
        id INTEGER PRIMARY KEY,
        category_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        period TEXT NOT NULL CHECK (period IN ('monthly', 'yearly')),
        start_date TEXT NOT NULL,
        end_date TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);

    // Recurring transactions table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
        category_id INTEGER NOT NULL,
        recurrence_rule TEXT NOT NULL CHECK (recurrence_rule IN ('weekly', 'monthly', 'yearly')),
        next_due_date TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (category_id) REFERENCES categories (id)
      )
    `);

    // Tags table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#6B7280',
        description TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0
      )
    `);

    // Transaction tags junction table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS transaction_tags (
        transaction_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0,
        PRIMARY KEY (transaction_id, tag_id),
        FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
      )
    `);

    // Audit log table for tracking changes
    await client.execute(`
      CREATE TABLE IF NOT EXISTS finance_audit_log (
        id INTEGER PRIMARY KEY,
        action TEXT NOT NULL,
        table_name TEXT NOT NULL,
        record_id INTEGER,
        old_values TEXT,
        new_values TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        synced INTEGER DEFAULT 0
      )
    `);

    console.log('✅ Finance database schema created successfully');
  } catch (error) {
    console.error('❌ Error setting up database schema:', error);
  }
}

// ============================================================================
// CATEGORY MANAGEMENT
// ============================================================================

async function createCategory(name: string, type: 'income' | 'expense', color?: string, icon?: string) {
  try {
    await client.execute({
      sql: `INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)`,
      args: [name, type, color || '#3B82F6', icon || '💰'],
    });

    console.log(`📂 Category created: ${name} (${type})`);
    
    // Log the action
    await logAuditAction('CREATE', 'categories', undefined, JSON.stringify({ name, type, color, icon }));
    
    return true;
  } catch (error) {
    console.error('❌ Error creating category:', error);
    return false;
  }
}

async function getCategories(type?: 'income' | 'expense') {
  try {
    let sql = 'SELECT * FROM categories';
    let args: any[] = [];
    
    if (type) {
      sql += ' WHERE type = ?';
      args.push(type);
    }
    
    sql += ' ORDER BY name ASC';
    
    const result = await client.execute({ sql, args });
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    return [];
  }
}

async function updateCategory(id: number, updates: { name?: string; type?: 'income' | 'expense'; color?: string; icon?: string }) {
  try {
    const oldCategory = await client.execute('SELECT * FROM categories WHERE id = ?', [id]);
    
    let sql = 'UPDATE categories SET updated_at = datetime(\'now\')';
    let args: any[] = [];
    
    if (updates.name !== undefined) {
      sql += ', name = ?';
      args.push(updates.name);
    }
    
    if (updates.type !== undefined) {
      sql += ', type = ?';
      args.push(updates.type);
    }
    
    if (updates.color !== undefined) {
      sql += ', color = ?';
      args.push(updates.color);
    }
    
    if (updates.icon !== undefined) {
      sql += ', icon = ?';
      args.push(updates.icon);
    }
    
    sql += ' WHERE id = ?';
    args.push(id);
    
    await client.execute({ sql, args });

    console.log(`🔄 Category ${id} updated successfully`);
    
    // Log the action
    await logAuditAction('UPDATE', 'categories', id, JSON.stringify(oldCategory.rows[0]), JSON.stringify(updates));
    
    return true;
  } catch (error) {
    console.error('❌ Error updating category:', error);
    return false;
  }
}

async function deleteCategory(id: number) {
  try {
    // Check if category is used in transactions
    const transactions = await client.execute('SELECT COUNT(*) as count FROM transactions WHERE category_id = ?', [id]);
    const count = transactions.rows[0]?.count || 0;
    
    if (count > 0) {
      console.log(`⚠️  Cannot delete category ${id} - it has ${count} associated transactions`);
      return false;
    }
    
    const oldCategory = await client.execute('SELECT * FROM categories WHERE id = ?', [id]);
    
    await client.execute('DELETE FROM categories WHERE id = ?', [id]);

    console.log(`🗑️  Category ${id} deleted successfully`);
    
    // Log the action
    await logAuditAction('DELETE', 'categories', id, JSON.stringify(oldCategory.rows[0]), undefined);
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    return false;
  }
}

// ============================================================================
// TRANSACTION MANAGEMENT
// ============================================================================

async function createTransaction(amount: number, type: 'income' | 'expense', categoryId: number, note?: string, date?: string) {
  try {
    const transactionDate = date || new Date().toISOString().split('T')[0];
    
    await client.execute({
      sql: `INSERT INTO transactions (amount, type, category_id, note, date) VALUES (?, ?, ?, ?, ?)`,
      args: [amount, type, categoryId, note || '', transactionDate],
    });

    console.log(`💸 Transaction created: ${type} $${amount} on ${transactionDate}`);
    
    // Log the action
    await logAuditAction('CREATE', 'transactions', undefined, JSON.stringify({ amount, type, categoryId, note, date: transactionDate }));
    
    return true;
  } catch (error) {
    console.error('❌ Error creating transaction:', error);
    return false;
  }
}

async function getTransactions(filters?: {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  type?: 'income' | 'expense';
  limit?: number;
}) {
  try {
    let sql = `
      SELECT t.*, c.name as category_name, c.type as category_type, c.color as category_color, c.icon as category_icon
      FROM transactions t 
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    
    let args: any[] = [];
    
    if (filters?.startDate) {
      sql += ' AND t.date >= ?';
      args.push(filters.startDate);
    }
    
    if (filters?.endDate) {
      sql += ' AND t.date <= ?';
      args.push(filters.endDate);
    }
    
    if (filters?.categoryId) {
      sql += ' AND t.category_id = ?';
      args.push(filters.categoryId);
    }
    
    if (filters?.type) {
      sql += ' AND t.type = ?';
      args.push(filters.type);
    }
    
    sql += ' ORDER BY t.date DESC, t.created_at DESC';
    
    if (filters?.limit) {
      sql += ' LIMIT ?';
      args.push(filters.limit);
    }
    
    const result = await client.execute({ sql, args });
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching transactions:', error);
    return [];
  }
}

async function updateTransaction(id: number, updates: { amount?: number; type?: 'income' | 'expense'; categoryId?: number; note?: string; date?: string }) {
  try {
    const oldTransaction = await client.execute('SELECT * FROM transactions WHERE id = ?', [id]);
    
    let sql = 'UPDATE transactions SET updated_at = datetime(\'now\')';
    let args: any[] = [];
    
    if (updates.amount !== undefined) {
      sql += ', amount = ?';
      args.push(updates.amount);
    }
    
    if (updates.type !== undefined) {
      sql += ', type = ?';
      args.push(updates.type);
    }
    
    if (updates.categoryId !== undefined) {
      sql += ', category_id = ?';
      args.push(updates.categoryId);
    }
    
    if (updates.note !== undefined) {
      sql += ', note = ?';
      args.push(updates.note);
    }
    
    if (updates.date !== undefined) {
      sql += ', date = ?';
      args.push(updates.date);
    }
    
    sql += ' WHERE id = ?';
    args.push(id);
    
    await client.execute({ sql, args });

    console.log(`🔄 Transaction ${id} updated successfully`);
    
    // Log the action
    await logAuditAction('UPDATE', 'transactions', id, JSON.stringify(oldTransaction.rows[0]), JSON.stringify(updates));
    
    return true;
  } catch (error) {
    console.error('❌ Error updating transaction:', error);
    return false;
  }
}

async function deleteTransaction(id: number) {
  try {
    const oldTransaction = await client.execute('SELECT * FROM transactions WHERE id = ?', [id]);
    
    await client.execute('DELETE FROM transactions WHERE id = ?', [id]);

    console.log(`🗑️  Transaction ${id} deleted successfully`);
    
    // Log the action
    await logAuditAction('DELETE', 'transactions', id, JSON.stringify(oldTransaction.rows[0]), undefined);
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting transaction:', error);
    return false;
  }
}

// ============================================================================
// SUMMARY AND ANALYTICS
// ============================================================================

async function getFinancialSummary(filters?: { startDate?: string; endDate?: string }) {
  try {
    let dateFilter = '';
    let args: any[] = [];
    
    if (filters?.startDate && filters?.endDate) {
      dateFilter = 'WHERE date BETWEEN ? AND ?';
      args = [filters.startDate, filters.endDate];
    } else if (filters?.startDate) {
      dateFilter = 'WHERE date >= ?';
      args = [filters.startDate];
    } else if (filters?.endDate) {
      dateFilter = 'WHERE date <= ?';
      args = [filters.endDate];
    }
    
    // Overall totals
    const overallResult = await client.execute(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense,
        COUNT(*) as total_transactions
      FROM transactions ${dateFilter}
    `, args);
    
    const overall = overallResult.rows[0];
    const netIncome = (overall.total_income || 0) - (overall.total_expense || 0);
    
    // Monthly breakdown
    const monthlyResult = await client.execute(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
        COUNT(*) as transactions
      FROM transactions ${dateFilter}
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
      LIMIT 12
    `, args);
    
    // Category breakdown
    const categoryResult = await client.execute(`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.color,
        c.icon,
        SUM(t.amount) as total_amount,
        COUNT(t.id) as transaction_count
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id ${dateFilter ? 'AND ' + dateFilter.replace('WHERE', '') : ''}
      GROUP BY c.id, c.name, c.type, c.color, c.icon
      ORDER BY total_amount DESC
    `, args);
    
    // Recent transactions
    const recentTransactions = await getTransactions({ limit: 10 });
    
    // Savings summary
    const savingsGoals = await getSavingsGoals();
    const totalSavingsTarget = savingsGoals.reduce((sum: number, goal: any) => sum + goal.target_amount, 0);
    const totalSavingsProgress = savingsGoals.reduce((sum: number, goal: any) => sum + goal.net_contribution, 0);
    const totalSavingsRemaining = totalSavingsTarget - totalSavingsProgress;
    
    // Budget analysis
    const budgetVsActual = await getBudgetVsActual();
    const totalBudget = budgetVsActual.reduce((sum: any, item: any) => sum + item.budget_amount, 0);
    const totalActual = budgetVsActual.reduce((sum: any, item: any) => sum + item.actual_amount, 0);
    const budgetRemaining = totalBudget - totalActual;
    
    // Analytics and trends
    const currentMonth = new Date().toISOString().slice(0, 7);
    const previousMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7);
    
    const currentMonthData = await getTransactions({ startDate: `${currentMonth}-01`, endDate: `${currentMonth}-31` });
    const previousMonthData = await getTransactions({ startDate: `${previousMonth}-01`, endDate: `${previousMonth}-31` });
    
    const currentIncome = currentMonthData.filter((t: any) => t.type === 'income').reduce((sum: any, t: any) => sum + t.amount, 0);
    const currentExpense = currentMonthData.filter((t: any) => t.type === 'expense').reduce((sum: any, t: any) => sum + t.amount, 0);
    const previousIncome = previousMonthData.filter((t: any) => t.type === 'income').reduce((sum: any, t: any) => sum + t.amount, 0);
    const previousExpense = previousMonthData.filter((t: any) => t.type === 'expense').reduce((sum: any, t: any) => sum + t.amount, 0);
    
    const incomeGrowth = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0;
    const expenseGrowth = previousExpense > 0 ? ((currentExpense - previousExpense) / previousExpense) * 100 : 0;
    
    // Average spend per category
    const categoryAverages = categoryResult.rows.map((cat: any) => ({
      ...cat,
      averageAmount: cat.transaction_count > 0 ? cat.total_amount / cat.transaction_count : 0
    }));
    
    // Savings rate
    const savingsRate = currentIncome > 0 ? ((currentIncome - currentExpense) / currentIncome) * 100 : 0;
    
    return {
      overall: {
        totalIncome: overall.total_income || 0,
        totalExpense: overall.total_expense || 0,
        netIncome,
        totalTransactions: overall.total_transactions || 0,
        totalSavingsTarget,
        totalSavingsProgress,
        totalSavingsRemaining,
        totalBudget,
        totalActual,
        budgetRemaining
      },
      monthly: monthlyResult.rows,
      categories: categoryAverages,
      recentTransactions,
      savings: {
        goals: savingsGoals,
        summary: {
          totalGoals: savingsGoals.length,
          completedGoals: savingsGoals.filter((g: any) => g.is_complete).length,
          totalTarget: totalSavingsTarget,
          totalProgress: totalSavingsProgress,
          totalRemaining: totalSavingsRemaining,
          overallProgress: totalSavingsTarget > 0 ? (totalSavingsProgress / totalSavingsTarget) * 100 : 0
        }
      },
      budgets: {
        overview: budgetVsActual,
        summary: {
          totalBudget,
          totalActual,
          budgetRemaining,
          percentageUsed: totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0
        }
      },
      analytics: {
        trends: {
          currentMonth: { income: currentIncome, expense: currentExpense },
          previousMonth: { income: previousIncome, expense: previousExpense },
          incomeGrowth,
          expenseGrowth
        },
        averages: {
          spendPerCategory: categoryAverages,
          savingsRate
        }
      }
    };
  } catch (error) {
    console.error('❌ Error generating financial summary:', error);
    return null;
  }
}

// ============================================================================
// BUDGET MANAGEMENT
// ============================================================================

async function createBudget(categoryId: number, amount: number, period: 'monthly' | 'yearly', startDate: string, endDate?: string) {
  try {
    await client.execute({
      sql: `INSERT INTO budgets (category_id, amount, period, start_date, end_date) VALUES (?, ?, ?, ?, ?)`,
      args: [categoryId, amount, period, startDate, endDate || null],
    });

    console.log(`💰 Budget created: Category ${categoryId} - $${amount} ${period}`);
    
    await logAuditAction('CREATE', 'budgets', undefined, JSON.stringify({ categoryId, amount, period, startDate, endDate }));
    
    return true;
  } catch (error) {
    console.error('❌ Error creating budget:', error);
    return false;
  }
}

async function getBudgets() {
  try {
    const result = await client.execute(`
      SELECT 
        b.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        c.type as category_type
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.is_active = 1
      ORDER BY b.start_date DESC
    `);
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching budgets:', error);
    return [];
  }
}

async function updateBudget(id: number, updates: { 
  amount?: number; 
  period?: 'monthly' | 'yearly'; 
  startDate?: string; 
  endDate?: string;
  isActive?: boolean;
}) {
  try {
    const oldBudget = await client.execute('SELECT * FROM budgets WHERE id = ?', [id]);
    
    let sql = 'UPDATE budgets SET updated_at = datetime(\'now\')';
    let args: any[] = [];
    
    if (updates.amount !== undefined) {
      sql += ', amount = ?';
      args.push(updates.amount);
    }
    
    if (updates.period !== undefined) {
      sql += ', period = ?';
      args.push(updates.period);
    }
    
    if (updates.startDate !== undefined) {
      sql += ', start_date = ?';
      args.push(updates.startDate);
    }
    
    if (updates.endDate !== undefined) {
      sql += ', end_date = ?';
      args.push(updates.endDate);
    }
    
    if (updates.isActive !== undefined) {
      sql += ', is_active = ?';
      args.push(updates.isActive ? 1 : 0);
    }
    
    sql += ' WHERE id = ?';
    args.push(id);
    
    await client.execute({ sql, args });

    console.log(`🔄 Budget ${id} updated successfully`);
    
    await logAuditAction('UPDATE', 'budgets', id, JSON.stringify(oldBudget.rows[0]), JSON.stringify(updates));
    
    return true;
  } catch (error) {
    console.error('❌ Error updating budget:', error);
    return false;
  }
}

async function deleteBudget(id: number) {
  try {
    const oldBudget = await client.execute('SELECT * FROM budgets WHERE id = ?', [id]);
    
    await client.execute('DELETE FROM budgets WHERE id = ?', [id]);

    console.log(`🗑️  Budget ${id} deleted successfully`);
    
    await logAuditAction('DELETE', 'budgets', id, JSON.stringify(oldBudget.rows[0]), undefined);
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting budget:', error);
    return false;
  }
}

async function getBudgetVsActual(categoryId?: number, month?: string) {
  try {
    const currentMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    let sql = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        c.type as category_type,
        COALESCE(b.amount, 0) as budget_amount,
        COALESCE(SUM(t.amount), 0) as actual_amount,
        COALESCE(b.amount, 0) - COALESCE(SUM(t.amount), 0) as difference,
        CASE 
          WHEN b.amount IS NULL THEN 0
          WHEN b.amount = 0 THEN 0
          ELSE (COALESCE(SUM(t.amount), 0) / b.amount) * 100
        END as percentage_used
      FROM categories c
      LEFT JOIN budgets b ON c.id = b.category_id AND b.is_active = 1 
        AND b.period = 'monthly' 
        AND b.start_date <= ? 
        AND (b.end_date IS NULL OR b.end_date >= ?)
      LEFT JOIN transactions t ON c.id = t.category_id 
        AND strftime('%Y-%m', t.date) = ?
    `;
    
    let args: any[] = [currentMonth, currentMonth, currentMonth];
    
    if (categoryId) {
      sql += ' WHERE c.id = ?';
      args.push(categoryId);
    }
    
    sql += ' GROUP BY c.id, c.name, c.color, c.icon, c.type, b.amount';
    sql += ' ORDER BY c.type DESC, c.name';
    
    const result = await client.execute({ sql, args });
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching budget vs actual:', error);
    return [];
  }
}

// ============================================================================
// RECURRING TRANSACTIONS
// ============================================================================

async function createRecurringTransaction(name: string, amount: number, type: 'income' | 'expense', categoryId: number, recurrenceRule: 'weekly' | 'monthly' | 'yearly', nextDueDate: string, note?: string) {
  try {
    await client.execute({
      sql: `INSERT INTO recurring_transactions (name, amount, type, category_id, recurrence_rule, next_due_date, note) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [name, amount, type, categoryId, recurrenceRule, nextDueDate, note || null],
    });

    console.log(`🔄 Recurring transaction created: ${name} - $${amount} ${recurrenceRule}`);
    
    await logAuditAction('CREATE', 'recurring_transactions', undefined, JSON.stringify({ name, amount, type, categoryId, recurrenceRule, nextDueDate, note }));
    
    return true;
  } catch (error) {
    console.error('❌ Error creating recurring transaction:', error);
    return false;
  }
}

async function getRecurringTransactions() {
  try {
    const result = await client.execute(`
      SELECT 
        rt.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon
      FROM recurring_transactions rt
      LEFT JOIN categories c ON rt.category_id = c.id
      WHERE rt.is_active = 1
      ORDER BY rt.next_due_date ASC
    `);
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching recurring transactions:', error);
    return [];
  }
}

async function updateRecurringTransaction(id: number, updates: any) {
  try {
    const oldRecurring = await client.execute('SELECT * FROM recurring_transactions WHERE id = ?', [id]);
    
    let sql = 'UPDATE recurring_transactions SET updated_at = datetime(\'now\')';
    let args: any[] = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        sql += `, ${dbKey} = ?`;
        args.push(value);
      }
    });
    
    sql += ' WHERE id = ?';
    args.push(id);
    
    await client.execute({ sql, args });

    console.log(`🔄 Recurring transaction ${id} updated successfully`);
    
    await logAuditAction('UPDATE', 'recurring_transactions', id, JSON.stringify(oldRecurring.rows[0]), JSON.stringify(updates));
    
    return true;
  } catch (error) {
    console.error('❌ Error updating recurring transaction:', error);
    return false;
  }
}

async function deleteRecurringTransaction(id: number) {
  try {
    const oldRecurring = await client.execute('SELECT * FROM recurring_transactions WHERE id = ?', [id]);
    
    await client.execute('DELETE FROM recurring_transactions WHERE id = ?', [id]);

    console.log(`🗑️  Recurring transaction ${id} deleted successfully`);
    
    await logAuditAction('DELETE', 'recurring_transactions', id, JSON.stringify(oldRecurring.rows[0]), undefined);
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting recurring transaction:', error);
    return false;
  }
}

async function generateRecurringTransactions() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const recurring = await getRecurringTransactions();
    let generated = 0;
    
    for (const rec of recurring) {
      if (rec.next_due_date <= today) {
        // Create the transaction
        await createTransaction(rec.amount, rec.type, rec.category_id, rec.note, rec.next_due_date);
        
        // Calculate next due date
        let nextDate = new Date(rec.next_due_date);
        switch (rec.recurrence_rule) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }
        
        // Update next due date
        await updateRecurringTransaction(rec.id, { nextDueDate: nextDate.toISOString().split('T')[0] });
        generated++;
      }
    }
    
    if (generated > 0) {
      console.log(`🔄 Generated ${generated} recurring transactions`);
    }
    
    return generated;
  } catch (error) {
    console.error('❌ Error generating recurring transactions:', error);
    return 0;
  }
}

// ============================================================================
// TAGS MANAGEMENT
// ============================================================================

async function createTag(name: string, color?: string, description?: string) {
  try {
    await client.execute({
      sql: `INSERT INTO tags (name, color, description) VALUES (?, ?, ?)`,
      args: [name, color || '#6B7280', description || null],
    });

    console.log(`🏷️  Tag created: ${name}`);
    
    await logAuditAction('CREATE', 'tags', undefined, JSON.stringify({ name, color, description }));
    
    return true;
  } catch (error) {
    console.error('❌ Error creating tag:', error);
    return false;
  }
}

async function getTags() {
  try {
    const result = await client.execute('SELECT * FROM tags ORDER BY name');
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching tags:', error);
    return [];
  }
}

async function updateTag(id: number, updates: { name?: string; color?: string; description?: string }) {
  try {
    const oldTag = await client.execute('SELECT * FROM tags WHERE id = ?', [id]);
    
    let sql = 'UPDATE tags SET updated_at = datetime(\'now\')';
    let args: any[] = [];
    
    if (updates.name !== undefined) {
      sql += ', name = ?';
      args.push(updates.name);
    }
    
    if (updates.color !== undefined) {
      sql += ', color = ?';
      args.push(updates.color);
    }
    
    if (updates.description !== undefined) {
      sql += ', description = ?';
      args.push(updates.description);
    }
    
    sql += ' WHERE id = ?';
    args.push(id);
    
    await client.execute({ sql, args });

    console.log(`🔄 Tag ${id} updated successfully`);
    
    await logAuditAction('UPDATE', 'tags', id, JSON.stringify(oldTag.rows[0]), JSON.stringify(updates));
    
    return true;
  } catch (error) {
    console.error('❌ Error updating tag:', error);
    return false;
  }
}

async function deleteTag(id: number) {
  try {
    const oldTag = await client.execute('SELECT * FROM tags WHERE id = ?', [id]);
    
    await client.execute('DELETE FROM tags WHERE id = ?', [id]);

    console.log(`🗑️  Tag ${id} deleted successfully`);
    
    await logAuditAction('DELETE', 'tags', id, JSON.stringify(oldTag.rows[0]), undefined);
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting tag:', error);
    return false;
  }
}

async function addTagsToTransaction(transactionId: number, tagIds: number[]) {
  try {
    for (const tagId of tagIds) {
      await client.execute({
        sql: `INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)`,
        args: [transactionId, tagId],
      });
    }
    
    console.log(`🏷️  Added ${tagIds.length} tags to transaction ${transactionId}`);
    return true;
  } catch (error) {
    console.error('❌ Error adding tags to transaction:', error);
    return false;
  }
}

async function removeTagsFromTransaction(transactionId: number, tagIds: number[]) {
  try {
    for (const tagId of tagIds) {
      await client.execute('DELETE FROM transaction_tags WHERE transaction_id = ? AND tag_id = ?', [transactionId, tagId]);
    }
    
    console.log(`🏷️  Removed ${tagIds.length} tags from transaction ${transactionId}`);
    return true;
  } catch (error) {
    console.error('❌ Error removing tags from transaction:', error);
    return false;
  }
}

async function getTransactionTags(transactionId: number) {
  try {
    const result = await client.execute(`
      SELECT t.* FROM tags t
      INNER JOIN transaction_tags tt ON t.id = tt.tag_id
      WHERE tt.transaction_id = ?
      ORDER BY t.name
    `, [transactionId]);
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching transaction tags:', error);
    return [];
  }
}

// ============================================================================
// SAVINGS MANAGEMENT
// ============================================================================

async function createSavingsGoal(name: string, targetAmount: number, deadline?: string, description?: string, color?: string, icon?: string) {
  try {
    await client.execute({
      sql: `INSERT INTO savings_goals (name, target_amount, deadline, description, color, icon) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [name, targetAmount, deadline || null, description || null, color || '#10B981', icon || '🎯'],
    });

    console.log(`🎯 Savings goal created: ${name} - Target: $${targetAmount}`);
    
    // Log the action
    await logAuditAction('CREATE', 'savings_goals', undefined, JSON.stringify({ name, targetAmount, deadline, description, color, icon }));
    
    return true;
  } catch (error) {
    console.error('❌ Error creating savings goal:', error);
    return false;
  }
}

async function getSavingsGoals() {
  try {
    const result = await client.execute(`
      SELECT 
        sg.*,
        COALESCE(SUM(CASE WHEN st.type = 'deposit' THEN st.amount ELSE 0 END), 0) as total_deposits,
        COALESCE(SUM(CASE WHEN st.type = 'withdrawal' THEN st.amount ELSE 0 END), 0) as total_withdrawals,
        COALESCE(SUM(CASE WHEN st.type = 'deposit' THEN st.amount ELSE -st.amount END), 0) as net_contribution
      FROM savings_goals sg
      LEFT JOIN savings_transactions st ON sg.id = st.savings_goal_id
      GROUP BY sg.id, sg.name, sg.target_amount, sg.current_amount, sg.deadline, sg.description, sg.color, sg.icon, sg.created_at, sg.updated_at, sg.synced
      ORDER BY sg.created_at DESC
    `);
    
    return result.rows.map((row: any) => ({
      ...row,
      progress: Math.min((row.net_contribution / row.target_amount) * 100, 100),
      remaining: Math.max(row.target_amount - row.net_contribution, 0),
      is_complete: row.net_contribution >= row.target_amount
    }));
  } catch (error) {
    console.error('❌ Error fetching savings goals:', error);
    return [];
  }
}

async function updateSavingsGoal(id: number, updates: { 
  name?: string; 
  targetAmount?: number; 
  deadline?: string; 
  description?: string; 
  color?: string; 
  icon?: string;
  currentAmount?: number;
}) {
  try {
    const oldGoal = await client.execute('SELECT * FROM savings_goals WHERE id = ?', [id]);
    
    let sql = 'UPDATE savings_goals SET updated_at = datetime(\'now\')';
    let args: any[] = [];
    
    if (updates.name !== undefined) {
      sql += ', name = ?';
      args.push(updates.name);
    }
    
    if (updates.targetAmount !== undefined) {
      sql += ', target_amount = ?';
      args.push(updates.targetAmount);
    }
    
    if (updates.deadline !== undefined) {
      sql += ', deadline = ?';
      args.push(updates.deadline);
    }
    
    if (updates.description !== undefined) {
      sql += ', description = ?';
      args.push(updates.description);
    }
    
    if (updates.color !== undefined) {
      sql += ', color = ?';
      args.push(updates.color);
    }
    
    if (updates.icon !== undefined) {
      sql += ', icon = ?';
      args.push(updates.icon);
    }
    
    if (updates.currentAmount !== undefined) {
      sql += ', current_amount = ?';
      args.push(updates.currentAmount);
    }
    
    sql += ' WHERE id = ?';
    args.push(id);
    
    await client.execute({ sql, args });

    console.log(`🔄 Savings goal ${id} updated successfully`);
    
    // Log the action
    await logAuditAction('UPDATE', 'savings_goals', id, JSON.stringify(oldGoal.rows[0]), JSON.stringify(updates));
    
    return true;
  } catch (error) {
    console.error('❌ Error updating savings goal:', error);
    return false;
  }
}

async function deleteSavingsGoal(id: number) {
  try {
    // Check if goal has transactions
    const transactions = await client.execute('SELECT COUNT(*) as count FROM savings_transactions WHERE savings_goal_id = ?', [id]);
    const count = transactions.rows[0]?.count || 0;
    
    if (count > 0) {
      console.log(`⚠️  Cannot delete savings goal ${id} - it has ${count} associated transactions`);
      return false;
    }
    
    const oldGoal = await client.execute('SELECT * FROM savings_goals WHERE id = ?', [id]);
    
    await client.execute('DELETE FROM savings_goals WHERE id = ?', [id]);

    console.log(`🗑️  Savings goal ${id} deleted successfully`);
    
    // Log the action
    await logAuditAction('DELETE', 'savings_goals', id, JSON.stringify(oldGoal.rows[0]), undefined);
    
    return true;
  } catch (error) {
    console.error('❌ Error deleting savings goal:', error);
    return false;
  }
}

async function addSavingsTransaction(goalId: number, amount: number, type: 'deposit' | 'withdrawal', note?: string, date?: string) {
  try {
    const transactionDate = date || new Date().toISOString().split('T')[0];
    
    await client.execute({
      sql: `INSERT INTO savings_transactions (savings_goal_id, amount, type, note, date) VALUES (?, ?, ?, ?, ?)`,
      args: [goalId, amount, type, note || '', transactionDate],
    });

    // Update the goal's current amount
    const goal = await client.execute('SELECT * FROM savings_goals WHERE id = ?', [goalId]);
    const currentAmount = goal.rows[0]?.current_amount || 0;
    const newAmount = type === 'deposit' ? currentAmount + amount : currentAmount - amount;
    
    await client.execute('UPDATE savings_goals SET current_amount = ? WHERE id = ?', [newAmount, goalId]);

    console.log(`💰 Savings transaction: ${type} $${amount} for goal ${goalId} on ${transactionDate}`);
    
    // Log the action
    await logAuditAction('CREATE', 'savings_transactions', undefined, JSON.stringify({ goalId, amount, type, note, date: transactionDate }));
    
    return true;
  } catch (error) {
    console.error('❌ Error adding savings transaction:', error);
    return false;
  }
}

async function getSavingsTransactions(goalId?: number) {
  try {
    let sql = `
      SELECT st.*, sg.name as goal_name, sg.color as goal_color, sg.icon as goal_icon
      FROM savings_transactions st 
      LEFT JOIN savings_goals sg ON st.savings_goal_id = sg.id
    `;
    
    let args: any[] = [];
    
    if (goalId) {
      sql += ' WHERE st.savings_goal_id = ?';
      args.push(goalId);
    }
    
    sql += ' ORDER BY st.date DESC, st.created_at DESC';
    
    const result = await client.execute({ sql, args });
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching savings transactions:', error);
    return [];
  }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

async function logAuditAction(action: string, tableName: string, recordId?: number, oldValues?: string, newValues?: string) {
  try {
    await client.execute({
      sql: `INSERT INTO finance_audit_log (action, table_name, record_id, old_values, new_values) 
             VALUES (?, ?, ?, ?, ?)`,
      args: [action, tableName, recordId || null, oldValues || null, newValues || null],
    });
  } catch (error) {
    console.error('❌ Error logging audit action:', error);
  }
}

async function getAuditLog(tableName?: string, limit: number = 100) {
  try {
    let sql = 'SELECT * FROM finance_audit_log';
    let args: any[] = [];
    
    if (tableName) {
      sql += ' WHERE table_name = ?';
      args.push(tableName);
    }
    
    sql += ' ORDER BY created_at DESC LIMIT ?';
    args.push(limit);
    
    const result = await client.execute({ sql, args });
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching audit log:', error);
    return [];
  }
}

// ============================================================================
// SYNC MANAGEMENT
// ============================================================================

async function syncFinanceData() {
  try {
    console.log('🔄 Starting finance data synchronization...');
    
    // Get counts of unsynced records
    const tables = ['categories', 'transactions', 'savings_goals', 'savings_transactions', 'budgets', 'recurring_transactions', 'tags', 'transaction_tags', 'finance_audit_log'];
    let totalUnsynced = 0;
    
    for (const table of tables) {
      const result = await client.execute(`SELECT COUNT(*) as count FROM ${table} WHERE synced = 0`);
      const count = result.rows[0]?.count || 0;
      totalUnsynced += count;
      if (count > 0) {
        console.log(`  📊 ${table}: ${count} unsynced records`);
      }
    }
    
    if (totalUnsynced === 0) {
      console.log('✅ All finance data is already synced');
      return true;
    }
    
    // Attempt to sync
    await client.sync();
    console.log('✅ Sync completed successfully');
    
    // Mark all records as synced
    for (const table of tables) {
      await client.execute(`UPDATE ${table} SET synced = 1 WHERE synced = 0`);
    }
    
    console.log('✅ All records marked as synced');
    return true;
  } catch (error) {
    console.error('❌ Sync failed:', error);
    return false;
  }
}

async function getSyncStatus() {
  try {
    const tables = ['categories', 'transactions', 'savings_goals', 'savings_transactions', 'budgets', 'recurring_transactions', 'tags', 'transaction_tags', 'finance_audit_log'];
    const status: any = {};
    
    for (const table of tables) {
      const totalResult = await client.execute(`SELECT COUNT(*) as count FROM ${table}`);
      const unsyncedResult = await client.execute(`SELECT COUNT(*) as count FROM ${table} WHERE synced = 0`);
      
      status[table] = {
        total: totalResult.rows[0]?.count || 0,
        synced: (totalResult.rows[0]?.count || 0) - (unsyncedResult.rows[0]?.count || 0),
        unsynced: unsyncedResult.rows[0]?.count || 0
      };
    }
    
    return status;
  } catch (error) {
    console.error('❌ Error getting sync status:', error);
    return {};
  }
}

// ============================================================================
// DEMO DATA POPULATION
// ============================================================================

async function populateFinanceDemoData() {
  console.log('🎭 Populating finance demo data...');
  
  try {
    // Create default categories
    await createCategory('Salary', 'income', '#10B981', '💰');
    await createCategory('Freelance', 'income', '#3B82F6', '💼');
    await createCategory('Investment', 'income', '#8B5CF6', '📈');
    await createCategory('Grocery', 'expense', '#EF4444', '🛒');
    await createCategory('Transportation', 'expense', '#F59E0B', '🚗');
    await createCategory('Entertainment', 'expense', '#EC4899', '🎬');
    await createCategory('Utilities', 'expense', '#6B7280', '⚡');
    await createCategory('Healthcare', 'expense', '#10B981', '🏥');
    
    // Get category IDs
    const categories = await getCategories();
    const salary = categories.find((c: any) => c.name === 'Salary');
    const freelance = categories.find((c: any) => c.name === 'Freelance');
    const grocery = categories.find((c: any) => c.name === 'Grocery');
    const transport = categories.find((c: any) => c.name === 'Transportation');
    const entertainment = categories.find((c: any) => c.name === 'Entertainment');
    
    // Create sample transactions for the current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Income transactions
    if (salary) {
      await createTransaction(5000, 'income', salary.id, 'Monthly salary', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);
    }
    
    if (freelance) {
      await createTransaction(1200, 'income', freelance.id, 'Web development project', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`);
    }
    
    // Expense transactions
    if (grocery) {
      await createTransaction(350, 'expense', grocery.id, 'Weekly groceries', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-05`);
      await createTransaction(280, 'expense', grocery.id, 'Weekly groceries', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-12`);
      await createTransaction(320, 'expense', grocery.id, 'Weekly groceries', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-19`);
      await createTransaction(295, 'expense', grocery.id, 'Weekly groceries', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-26`);
    }
    
    if (transport) {
      await createTransaction(120, 'expense', transport.id, 'Gas and parking', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-08`);
      await createTransaction(85, 'expense', transport.id, 'Public transportation', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-22`);
    }
    
    if (entertainment) {
      await createTransaction(75, 'expense', entertainment.id, 'Movie night', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`);
      await createTransaction(45, 'expense', entertainment.id, 'Restaurant dinner', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-18`);
    }
    
    // Create sample savings goals
    await createSavingsGoal('Vacation Fund', 3000, '2025-12-31', 'Summer vacation to Europe', '#3B82F6', '✈️');
    await createSavingsGoal('Emergency Fund', 10000, '2025-06-30', '6 months of expenses', '#EF4444', '🆘');
    await createSavingsGoal('New Car', 25000, '2026-03-31', 'Down payment for electric vehicle', '#10B981', '🚗');
    await createSavingsGoal('Home Renovation', 15000, '2025-11-30', 'Kitchen and bathroom updates', '#8B5CF6', '🏠');
    
    // Get savings goal IDs
    const savingsGoals = await getSavingsGoals();
    const vacation = savingsGoals.find((g: any) => g.name === 'Vacation Fund');
    const emergency = savingsGoals.find((g: any) => g.name === 'Emergency Fund');
    const car = savingsGoals.find((g: any) => g.name === 'New Car');
    const renovation = savingsGoals.find((g: any) => g.name === 'Home Renovation');
    
    // Add some savings transactions
    if (vacation) {
      await addSavingsTransaction(vacation.id, 500, 'deposit', 'Monthly contribution', '2025-09-01');
      await addSavingsTransaction(vacation.id, 300, 'deposit', 'Bonus contribution', '2025-09-15');
    }
    
    if (emergency) {
      await addSavingsTransaction(emergency.id, 1000, 'deposit', 'Initial emergency fund', '2025-09-01');
      await addSavingsTransaction(emergency.id, 500, 'deposit', 'Monthly contribution', '2025-09-15');
    }
    
    if (car) {
      await addSavingsTransaction(car.id, 2000, 'deposit', 'Initial car fund', '2025-09-01');
      await addSavingsTransaction(car.id, 800, 'deposit', 'Monthly contribution', '2025-09-15');
    }
    
    if (renovation) {
      await addSavingsTransaction(renovation.id, 1500, 'deposit', 'Initial renovation fund', '2025-09-01');
      await addSavingsTransaction(renovation.id, 600, 'deposit', 'Monthly contribution', '2025-09-15');
    }
    
    // Create sample budgets
    if (grocery) {
      await createBudget(grocery.id, 500, 'monthly', '2025-09-01');
    }
    if (transport) {
      await createBudget(transport.id, 200, 'monthly', '2025-09-01');
    }
    if (entertainment) {
      await createBudget(entertainment.id, 150, 'monthly', '2025-09-01');
    }
    
    // Create sample recurring transactions
    if (salary) {
      await createRecurringTransaction('Monthly Salary', 5000, 'income', salary.id, 'monthly', '2025-10-01', 'Regular monthly salary');
    }
    if (grocery) {
      await createRecurringTransaction('Weekly Groceries', 125, 'expense', grocery.id, 'weekly', '2025-09-08', 'Weekly grocery shopping');
    }
    
    // Create sample tags
    await createTag('Work', '#3B82F6', 'Work-related expenses and income');
    await createTag('Personal', '#10B981', 'Personal expenses and activities');
    await createTag('Vacation', '#F59E0B', 'Vacation and travel expenses');
    await createTag('Emergency', '#EF4444', 'Emergency or unexpected expenses');
    
    // Add tags to some transactions
    const tags = await getTags();
    const workTag = tags.find((t: any) => t.name === 'Work');
    const personalTag = tags.find((t: any) => t.name === 'Personal');
    
    if (workTag && salary) {
      const salaryTransactions = await getTransactions({ categoryId: salary.id });
      if (salaryTransactions.length > 0) {
        await addTagsToTransaction(salaryTransactions[0].id, [workTag.id]);
      }
    }
    
    if (personalTag && grocery) {
      const groceryTransactions = await getTransactions({ categoryId: grocery.id });
      if (groceryTransactions.length > 0) {
        await addTagsToTransaction(groceryTransactions[0].id, [personalTag.id]);
      }
    }
    
    console.log('✅ Finance demo data populated successfully');
  } catch (error) {
    console.error('❌ Error populating finance demo data:', error);
  }
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================

async function main() {
  console.log('💰 Finance Management Application');
  console.log('================================\n');

  // Check if environment variables are set
  if (!process.env.TURSO_SYNC_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.log('⚠️  Environment variables not set. Please create a .env file with:');
    console.log('   TURSO_SYNC_URL=your_sync_url_here');
    console.log('   TURSO_AUTH_TOKEN=your_auth_token_here');
    return;
  }

  try {
    // Setup the database
    await setupFinanceDatabase();
    
    // Populate with demo data
    await populateFinanceDemoData();
    
    // Display system overview
    console.log('\n📊 Finance System Overview:');
    console.log('─'.repeat(50));
    
    const categories = await getCategories();
    const transactions = await getTransactions();
    
    console.log(`📂 Categories: ${categories.length}`);
    console.log(`💸 Transactions: ${transactions.length}`);
    
    // Show sync status
    console.log('\n🔄 Sync Status:');
    console.log('─'.repeat(50));
    const syncStatus = await getSyncStatus();
    for (const [table, status] of Object.entries(syncStatus)) {
      console.log(`${table}: ${status.synced}/${status.total} synced (${status.unsynced} pending)`);
    }
    
    // Generate and display financial summary
    console.log('\n📈 Financial Summary:');
    console.log('─'.repeat(50));
    const summary = await getFinancialSummary();
    
    if (summary) {
      console.log(`💰 Total Income: $${summary.overall.totalIncome.toFixed(2)}`);
      console.log(`💸 Total Expenses: $${summary.overall.totalExpense.toFixed(2)}`);
      console.log(`📊 Net Income: $${summary.overall.netIncome.toFixed(2)}`);
      console.log(`📝 Total Transactions: ${summary.overall.totalTransactions}`);
      
      console.log('\n🏷️  Top Categories:');
      summary.categories.slice(0, 5).forEach((category: any) => {
        const icon = category.icon || '💰';
        const amount = category.total_amount || 0;
        console.log(`  ${icon} ${category.name}: $${amount.toFixed(2)} (${category.transaction_count} transactions)`);
      });
    }
    
    // Attempt to sync
    console.log('\n🔄 Attempting to sync with Turso Cloud...');
    await syncFinanceData();
    
    console.log('\n🎉 Finance application demo completed successfully!');
    
  } catch (error) {
    console.error('❌ Finance application error:', error);
  }
}

// Run the application if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export {
  setupFinanceDatabase,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  createSavingsGoal,
  getSavingsGoals,
  updateSavingsGoal,
  deleteSavingsGoal,
  addSavingsTransaction,
  getSavingsTransactions,
  createBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  getBudgetVsActual,
  createRecurringTransaction,
  getRecurringTransactions,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  generateRecurringTransactions,
  createTag,
  getTags,
  updateTag,
  deleteTag,
  addTagsToTransaction,
  removeTagsFromTransaction,
  getTransactionTags,
  getFinancialSummary,
  logAuditAction,
  getAuditLog,
  syncFinanceData,
  getSyncStatus,
  populateFinanceDemoData
};

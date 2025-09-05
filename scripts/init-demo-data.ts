#!/usr/bin/env bun

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schemas from '../apps/frontend/src/lib/database/schemas';

const {
  categoriesSchema, 
  transactionsSchema, 
  budgetsSchema, 
  savingsGoalsSchema, 
  savingsTransactionsSchema, 
  recurringTransactionsSchema
} = schemas;

type TCategoryInsert = typeof schemas.categoriesSchema.$inferInsert;
type TTransactionInsert = typeof schemas.transactionsSchema.$inferInsert;
type TBudgetInsert = typeof schemas.budgetsSchema.$inferInsert;
type TSavingsGoalInsert = typeof schemas.savingsGoalsSchema.$inferInsert;
type TSavingsTransactionInsert = typeof schemas.savingsTransactionsSchema.$inferInsert;
type TRecurringTransactionInsert = typeof schemas.recurringTransactionsSchema.$inferInsert;

// Demo data arrays
const demoCategories: TCategoryInsert[] = [
  // Income categories
  { name: 'Salary', description: 'Primary employment income', type: 'income', color: '#10B981', icon: '💰', isActive: true, isDemo: true },
  { name: 'Freelance', description: 'Freelance and contract work', type: 'income', color: '#3B82F6', icon: '💼', isActive: true, isDemo: true },
  { name: 'Investment Returns', description: 'Dividends and investment gains', type: 'investment', color: '#8B5CF6', icon: '📈', isActive: true, isDemo: true },
  { name: 'Side Business', description: 'Small business income', type: 'income', color: '#F59E0B', icon: '🏪', isActive: true, isDemo: true },

  // Expense categories
  { name: 'Groceries', description: 'Food and household essentials', type: 'expense', color: '#EF4444', icon: '🛒', isActive: true, monthlyBudgetLimit: 500, isDemo: true },
  { name: 'Transportation', description: 'Car, public transport, gas', type: 'expense', color: '#F59E0B', icon: '🚗', isActive: true, monthlyBudgetLimit: 300, isDemo: true },
  { name: 'Utilities', description: 'Electricity, water, internet', type: 'expense', color: '#6B7280', icon: '⚡', isActive: true, monthlyBudgetLimit: 200, isDemo: true },
  { name: 'Entertainment', description: 'Movies, games, dining out', type: 'expense', color: '#8B5CF6', icon: '🎬', isActive: true, monthlyBudgetLimit: 250, isDemo: true },
  { name: 'Healthcare', description: 'Medical expenses and insurance', type: 'expense', color: '#EF4444', icon: '🏥', isActive: true, monthlyBudgetLimit: 150, isDemo: true },
  { name: 'Rent/Mortgage', description: 'Housing payments', type: 'expense', color: '#374151', icon: '🏠', isActive: true, monthlyBudgetLimit: 1500, isDemo: true },
  { name: 'Shopping', description: 'Clothing and personal items', type: 'expense', color: '#EC4899', icon: '🛍️', isActive: true, monthlyBudgetLimit: 200, isDemo: true }
];

function generateDemoTransactions(categories: any[]): TTransactionInsert[] {
  const transactions: TTransactionInsert[] = [];
  const today = new Date();
  
  // Generate transactions for the last 3 months
  for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
    const baseDate = new Date(today);
    baseDate.setMonth(baseDate.getMonth() - monthOffset);
    
    // Income transactions (2-3 per month)
    const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'investment');
    incomeCategories.forEach((category, index) => {
      if (index < 2) { // Only first 2 income categories per month
        const date = new Date(baseDate);
        date.setDate(Math.floor(Math.random() * 28) + 1);
        
        transactions.push({
          amount: category.name === 'Salary' ? 4500 + Math.random() * 500 : 800 + Math.random() * 1200,
          type: 'income',
          categoryId: category.id,
          date: date.toISOString().split('T')[0],
          description: category.name === 'Salary' ? 'Monthly salary deposit' : `${category.name} payment`,
          payee: category.name === 'Salary' ? 'Employer Inc.' : 'Various Clients',
          tags: ['recurring', 'verified'],
          isDemo: true
        });
      }
    });
    
    // Expense transactions (8-15 per month)
    const expenseCategories = categories.filter(c => c.type === 'expense');
    const transactionCount = 8 + Math.floor(Math.random() * 8);
    
    for (let i = 0; i < transactionCount; i++) {
      const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const date = new Date(baseDate);
      date.setDate(Math.floor(Math.random() * 28) + 1);
      
      let amount: number;
      let description: string;
      let payee: string;
      
      switch (category.name) {
        case 'Groceries':
          amount = 30 + Math.random() * 120;
          description = ['Weekly grocery shopping', 'Supermarket run', 'Fresh produce'][Math.floor(Math.random() * 3)];
          payee = ['Whole Foods', 'Kroger', 'Trader Joes'][Math.floor(Math.random() * 3)];
          break;
        case 'Transportation':
          amount = 15 + Math.random() * 80;
          description = ['Gas fill-up', 'Public transport', 'Uber ride', 'Car maintenance'][Math.floor(Math.random() * 4)];
          payee = ['Shell', 'Metro Transit', 'Uber', 'Auto Shop'][Math.floor(Math.random() * 4)];
          break;
        case 'Utilities':
          amount = 45 + Math.random() * 100;
          description = ['Electricity bill', 'Internet service', 'Water bill'][Math.floor(Math.random() * 3)];
          payee = ['Electric Co.', 'Internet Provider', 'Water Dept'][Math.floor(Math.random() * 3)];
          break;
        case 'Entertainment':
          amount = 12 + Math.random() * 150;
          description = ['Movie tickets', 'Dinner out', 'Streaming service', 'Concert tickets'][Math.floor(Math.random() * 4)];
          payee = ['Cinema', 'Restaurant', 'Netflix', 'TicketMaster'][Math.floor(Math.random() * 4)];
          break;
        case 'Rent/Mortgage':
          amount = 1450 + Math.random() * 100;
          description = 'Monthly housing payment';
          payee = 'Property Management';
          break;
        default:
          amount = 20 + Math.random() * 100;
          description = `${category.name} expense`;
          payee = 'Various';
      }
      
      transactions.push({
        amount: Math.round(amount * 100) / 100,
        type: 'expense',
        categoryId: category.id,
        date: date.toISOString().split('T')[0],
        description,
        payee,
        tags: category.name === 'Rent/Mortgage' ? ['recurring', 'essential'] : ['verified'],
        isDemo: true
      });
    }
  }
  
  return transactions;
}

function generateDemoBudgets(categories: any[]): TBudgetInsert[] {
  const expenseCategories = categories.filter(c => c.type === 'expense' && c.monthlyBudgetLimit);
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  return expenseCategories.map(category => ({
    categoryId: category.id,
    name: `${category.name} Monthly Budget`,
    description: `Monthly spending limit for ${category.name.toLowerCase()}`,
    amount: category.monthlyBudgetLimit,
    spent: Math.random() * category.monthlyBudgetLimit * 0.8, // 0-80% spent
    period: 'monthly' as const,
    startDate: startOfMonth.toISOString().split('T')[0],
    endDate: endOfMonth.toISOString().split('T')[0],
    isActive: true,
    alertThreshold: 0.8,
    rollover: Math.random() > 0.5,
    color: category.color,
    priority: category.monthlyBudgetLimit > 500 ? 'high' as const : 'medium' as const,
    autoRenew: true,
    resetDay: 1
  }));
}

function generateDemoSavingsGoals(): TSavingsGoalInsert[] {
  return [
    {
      name: 'Emergency Fund',
      description: '6 months of expenses for financial security',
      targetAmount: 15000,
      currentAmount: 8500,
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      priority: 'high',
      color: '#EF4444',
      icon: '🆘',
      isActive: true,
      monthlyTarget: 600,
      category: 'emergency'
    },
    {
      name: 'Vacation to Europe',
      description: 'Two week trip to Europe next summer',
      targetAmount: 5000,
      currentAmount: 1200,
      targetDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months from now
      priority: 'medium',
      color: '#8B5CF6',
      icon: '✈️',
      isActive: true,
      monthlyTarget: 300,
      category: 'vacation'
    },
    {
      name: 'New Laptop',
      description: 'MacBook Pro for development work',
      targetAmount: 2500,
      currentAmount: 800,
      targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 months from now
      priority: 'medium',
      color: '#10B981',
      icon: '💻',
      isActive: true,
      monthlyTarget: 425,
      category: 'equipment'
    }
  ];
}

function generateDemoRecurringTransactions(categories: any[]): TRecurringTransactionInsert[] {
  const recurringTransactions: TRecurringTransactionInsert[] = [];
  
  // Monthly salary
  const salaryCategory = categories.find(c => c.name === 'Salary');
  if (salaryCategory) {
    recurringTransactions.push({
      name: 'Monthly Salary',
      description: 'Regular monthly salary payment',
      categoryId: salaryCategory.id,
      amount: 4500,
      type: 'income',
      frequency: 'monthly',
      interval: 1,
      dayOfMonth: 15,
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months ago
      isActive: true,
      autoGenerate: true,
      payee: 'Employer Inc.',
      tags: ['salary', 'recurring'],
      generatedCount: 3
    });
  }
  
  // Monthly rent
  const rentCategory = categories.find(c => c.name === 'Rent/Mortgage');
  if (rentCategory) {
    recurringTransactions.push({
      name: 'Monthly Rent',
      description: 'Apartment rent payment',
      categoryId: rentCategory.id,
      amount: 1500,
      type: 'expense',
      frequency: 'monthly',
      interval: 1,
      dayOfMonth: 1,
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      autoGenerate: true,
      payee: 'Property Management Co.',
      tags: ['rent', 'recurring', 'essential'],
      generatedCount: 3
    });
  }
  
  return recurringTransactions;
}

async function clearTablesIfExist(db: any) {
  const tables = [
    { schema: savingsTransactionsSchema, name: 'savings_transactions' },
    { schema: transactionsSchema, name: 'transactions' },
    { schema: budgetsSchema, name: 'budgets' },
    { schema: recurringTransactionsSchema, name: 'recurring_transactions' },
    { schema: savingsGoalsSchema, name: 'savings_goals' },
    { schema: categoriesSchema, name: 'categories' }
  ];
  
  for (const table of tables) {
    try {
      await db.delete(table.schema);
      console.log(`✅ Cleared ${table.name}`);
    } catch (error: any) {
      if (error.message?.includes('no such table')) {
        console.log(`ℹ️ Table ${table.name} doesn't exist, skipping...`);
      } else {
        console.warn(`⚠️ Error clearing ${table.name}:`, error.message);
      }
    }
  }
}

function createDatabase() {
  // Create database connection
  const client = createClient({
    url: "file:./dev.db",
  });
  
  return drizzle(client);
}

async function createTablesIfNotExist(client: any) {
  console.log('🏗️ Creating database tables if they don\'t exist...');
  
  // Create all tables with IF NOT EXISTS
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
  
  console.log('✅ Database tables ready');
}

async function initializeDemoData() {
  console.log('🚀 Starting demo data initialization...');
  
  try {
    const db = createDatabase();
    const client = db.$client;
    
    // Create tables first
    await createTablesIfNotExist(client);
    
    // Clear existing demo data first
    console.log('🧹 Clearing existing demo data...');
    await clearTablesIfExist(db);
    
    // Insert categories
    console.log('📁 Creating demo categories...');
    const insertedCategories = await db.insert(categoriesSchema).values(demoCategories).returning();
    console.log(`✅ Created ${insertedCategories.length} categories`);
    
    // Insert transactions
    console.log('💰 Creating demo transactions...');
    const demoTransactionData = generateDemoTransactions(insertedCategories);
    const insertedTransactions = await db.insert(transactionsSchema).values(demoTransactionData).returning();
    console.log(`✅ Created ${insertedTransactions.length} transactions`);
    
    // Insert budgets
    console.log('📊 Creating demo budgets...');
    const demoBudgetData = generateDemoBudgets(insertedCategories);
    const insertedBudgets = await db.insert(budgetsSchema).values(demoBudgetData).returning();
    console.log(`✅ Created ${insertedBudgets.length} budgets`);
    
    // Insert savings goals
    console.log('🎯 Creating demo savings goals...');
    const demoSavingsGoalData = generateDemoSavingsGoals();
    const insertedSavingsGoals = await db.insert(savingsGoalsSchema).values(demoSavingsGoalData).returning();
    console.log(`✅ Created ${insertedSavingsGoals.length} savings goals`);
    
    // Insert recurring transactions
    console.log('🔄 Creating demo recurring transactions...');
    const demoRecurringData = generateDemoRecurringTransactions(insertedCategories);
    const insertedRecurring = await db.insert(recurringTransactionsSchema).values(demoRecurringData).returning();
    console.log(`✅ Created ${insertedRecurring.length} recurring transactions`);
    
    // Create some savings transactions
    console.log('🏦 Creating demo savings transactions...');
    const savingsTransactionData: TSavingsTransactionInsert[] = [];
    insertedSavingsGoals.forEach((goal, index) => {
      // Add 2-3 deposits per savings goal
      for (let i = 0; i < 3; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 30 + Math.random() * 20));
        
        savingsTransactionData.push({
          savingsGoalId: goal.id,
          amount: Math.round((goal.currentAmount / 3) * 100) / 100,
          type: 'deposit',
          date: date.toISOString().split('T')[0],
          description: `Monthly savings deposit - ${goal.name}`,
          reference: `DEP-${goal.id}-${i + 1}`
        });
      }
    });
    
    if (savingsTransactionData.length > 0) {
      const insertedSavingsTransactions = await db.insert(savingsTransactionsSchema).values(savingsTransactionData).returning();
      console.log(`✅ Created ${insertedSavingsTransactions.length} savings transactions`);
    }
    
    console.log('🎉 Demo data initialization completed successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   Categories: ${insertedCategories.length}`);
    console.log(`   Transactions: ${insertedTransactions.length}`);
    console.log(`   Budgets: ${insertedBudgets.length}`);
    console.log(`   Savings Goals: ${insertedSavingsGoals.length}`);
    console.log(`   Recurring Transactions: ${insertedRecurring.length}`);
    console.log(`   Savings Transactions: ${savingsTransactionData.length}`);
    console.log('');
    console.log('🚀 Your finance app is now ready with realistic demo data!');
    
  } catch (error) {
    console.error('❌ Error initializing demo data:', error);
    process.exit(1);
  }
}

// Run the initialization if this script is called directly
if (import.meta.main) {
  await initializeDemoData();
}

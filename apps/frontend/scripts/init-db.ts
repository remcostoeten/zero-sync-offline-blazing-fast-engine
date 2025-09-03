import { getDb } from '../src/lib/database/connection';
import { categoriesSchema, transactionsSchema } from '../src/lib/database/schemas';

async function initializeDatabase() {
  console.log('Initializing database with sample data...');
  
  const db = getDb();
  
  // Check if categories already exist
  const existingCategories = await db.select().from(categoriesSchema);
  if (existingCategories.length > 0) {
    console.log(`ℹ️ Database already has ${existingCategories.length} categories. Skipping initialization.`);
    return;
  }

  // Sample categories
  const sampleCategories = [
    {
      name: 'Groceries',
      description: 'Food and household essentials',
      type: 'expense' as const,
      color: '#10B981',
      icon: '🚼',
      isActive: true,
      monthlyBudgetLimit: 500
    },
    {
      name: 'Salary',
      description: 'Monthly salary income',
      type: 'income' as const,
      color: '#3B82F6',
      icon: '💰',
      isActive: true,
      monthlyBudgetLimit: null
    },
    {
      name: 'Transportation',
      description: 'Gas, parking, public transport',
      type: 'expense' as const,
      color: '#F59E0B',
      icon: '🚗',
      isActive: true,
      monthlyBudgetLimit: 200
    },
    {
      name: 'Emergency Fund',
      description: 'Emergency savings account',
      type: 'savings' as const,
      color: '#8B5CF6',
      icon: '🆘',
      isActive: true,
      monthlyBudgetLimit: null
    },
    {
      name: 'Credit Card',
      description: 'Credit card debt payments',
      type: 'debt' as const,
      color: '#EF4444',
      icon: '💳',
      isActive: true,
      monthlyBudgetLimit: null
    },
    {
      name: 'Entertainment',
      description: 'Movies, streaming, games, books',
      type: 'expense' as const,
      color: '#EC4899',
      icon: '🎬',
      isActive: true,
      monthlyBudgetLimit: 150
    },
    {
      name: 'Utilities',
      description: 'Electricity, water, gas, internet',
      type: 'expense' as const,
      color: '#6366F1',
      icon: '⚡',
      isActive: true,
      monthlyBudgetLimit: 300
    },
    {
      name: 'Healthcare',
      description: 'Medical expenses, insurance, pharmacy',
      type: 'expense' as const,
      color: '#DC2626',
      icon: '🏥',
      isActive: true,
      monthlyBudgetLimit: 250
    },
    {
      name: 'Freelance Work',
      description: 'Side project and freelance income',
      type: 'income' as const,
      color: '#059669',
      icon: '💻',
      isActive: true,
      monthlyBudgetLimit: null
    },
    {
      name: 'Vacation Fund',
      description: 'Saving for annual vacations',
      type: 'savings' as const,
      color: '#0891B2',
      icon: '✈️',
      isActive: true,
      monthlyBudgetLimit: null
    },
    {
      name: 'Stocks & ETFs',
      description: 'Long-term investment portfolio',
      type: 'investment' as const,
      color: '#7C3AED',
      icon: '📈',
      isActive: true,
      monthlyBudgetLimit: null
    },
    {
      name: 'Dining Out',
      description: 'Restaurants and food delivery',
      type: 'expense' as const,
      color: '#EA580C',
      icon: '🍽️',
      isActive: true,
      monthlyBudgetLimit: 200
    }
  ];

  try {
    // Insert sample categories
    const insertedCategories = await db
      .insert(categoriesSchema)
      .values(sampleCategories)
      .returning();

    console.log(`✅ Created ${insertedCategories.length} sample categories:`);
    insertedCategories.forEach(cat => {
      console.log(`  - ${cat.name} (${cat.type})`);
    });
    
    // Create sample transactions
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    
    // Find category IDs
    const salaryCategory = insertedCategories.find(c => c.name === 'Salary');
    const groceriesCategory = insertedCategories.find(c => c.name === 'Groceries');
    const transportCategory = insertedCategories.find(c => c.name === 'Transportation');
    const entertainmentCategory = insertedCategories.find(c => c.name === 'Entertainment');
    const freelanceCategory = insertedCategories.find(c => c.name === 'Freelance Work');
    const diningCategory = insertedCategories.find(c => c.name === 'Dining Out');
    
    if (salaryCategory && groceriesCategory && transportCategory && entertainmentCategory && freelanceCategory && diningCategory) {
      const sampleTransactions = [
        {
          amount: 3500.00,
          type: 'income' as const,
          categoryId: salaryCategory.id,
          date: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
          description: 'Monthly salary',
          payee: 'Acme Corp',
          reference: 'PAY-2024-001'
        },
        {
          amount: 850.00,
          type: 'income' as const,
          categoryId: freelanceCategory.id,
          date: formatDate(twoWeeksAgo),
          description: 'Website development project',
          payee: 'Client XYZ',
          reference: 'INV-2024-005'
        },
        {
          amount: 127.50,
          type: 'expense' as const,
          categoryId: groceriesCategory.id,
          date: formatDate(yesterday),
          description: 'Weekly grocery shopping',
          payee: 'Supermarket Plus',
          reference: 'TXN-789012'
        },
        {
          amount: 45.00,
          type: 'expense' as const,
          categoryId: transportCategory.id,
          date: formatDate(yesterday),
          description: 'Gas fill-up',
          payee: 'Shell Station',
          reference: null
        },
        {
          amount: 89.99,
          type: 'expense' as const,
          categoryId: groceriesCategory.id,
          date: formatDate(oneWeekAgo),
          description: 'Grocery shopping',
          payee: 'Whole Foods',
          reference: 'WF-234567'
        },
        {
          amount: 25.50,
          type: 'expense' as const,
          categoryId: transportCategory.id,
          date: formatDate(oneWeekAgo),
          description: 'Uber ride to airport',
          payee: 'Uber',
          reference: null
        },
        {
          amount: 15.99,
          type: 'expense' as const,
          categoryId: entertainmentCategory.id,
          date: formatDate(twoWeeksAgo),
          description: 'Netflix subscription',
          payee: 'Netflix',
          reference: 'NETFLIX-202401'
        },
        {
          amount: 67.85,
          type: 'expense' as const,
          categoryId: diningCategory.id,
          date: formatDate(twoWeeksAgo),
          description: 'Dinner with friends',
          payee: 'The Bistro',
          reference: null
        },
        {
          amount: 112.30,
          type: 'expense' as const,
          categoryId: groceriesCategory.id,
          date: formatDate(lastMonth),
          description: 'Monthly grocery haul',
          payee: 'Costco',
          reference: 'COSTCO-456789'
        }
      ];
      
      const insertedTransactions = await db
        .insert(transactionsSchema)
        .values(sampleTransactions)
        .returning();
        
      console.log(`✅ Created ${insertedTransactions.length} sample transactions`);
    }

  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

// Run the initialization
initializeDatabase()
  .then(() => {
    console.log('🎉 Database initialization complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  });

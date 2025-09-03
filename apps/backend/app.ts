import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { categoriesRoutes } from './modules/finance/features/categories/routes';
import { transactionsRoutes } from './modules/finance/features/transactions/routes';
import { savingsRoutes } from './modules/finance/features/savings/routes';
import { budgetsRouter } from './modules/finance/features/budgets';
import { recurringRouter } from './modules/finance/features/recurring';

const app = new Hono();

app.use('*', logger());

app.use('*', cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:4000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.get('/health', (c) => {
  return c.json({
    success: true,
    message: 'Hono Finance API is running',
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

app.route('/api/finance/categories', categoriesRoutes);
app.route('/api/finance/transactions', transactionsRoutes);
app.route('/api/finance/savings', savingsRoutes);
app.route('/api/finance/budgets', budgetsRouter);
app.route('/api/finance/recurring', recurringRouter);

app.get('/api/finance', (c) => {
  return c.json({
    success: true,
    message: 'Modular Finance API - Built with Hono.js & Drizzle ORM',
    version: '2.0.0',
    architecture: 'Feature-based modular design',
    database: 'Turso/LibSQL with offline sync',
    
    endpoints: {
      // ✅ IMPLEMENTED
      categories: {
        base: '/api/finance/categories',
        methods: {
          'GET /': 'List categories (filterable by type)',
          'GET /:id': 'Get single category',
          'POST /': 'Create new category',
          'PUT /:id': 'Update category',
          'DELETE /:id': 'Delete category'
        }
      },
      
      transactions: {
        base: '/api/finance/transactions',
        methods: {
          'GET /': 'List transactions (advanced filtering)',
          'GET /:id': 'Get single transaction with category',
          'GET /category/:categoryId': 'Get transactions by category',
          'GET /date-range/:start/:end': 'Get transactions by date range',
          'POST /': 'Create new transaction',
          'POST /bulk-import': 'Bulk import transactions (up to 100)',
          'PUT /:id': 'Update transaction',
          'DELETE /:id': 'Delete transaction'
        }
      },
      
      savings: {
        base: '/api/finance/savings',
        methods: {
          'GET /goals': 'List savings goals with progress tracking',
          'GET /goals/:id': 'Get single savings goal with progress',
          'GET /goals/:id/progress': 'Get detailed progress calculations',
          'POST /goals': 'Create new savings goal',
          'PUT /goals/:id': 'Update savings goal',
          'DELETE /goals/:id': 'Delete savings goal (if no transactions)',
          'GET /transactions': 'List savings transactions (filterable)',
          'GET /goals/:goalId/transactions': 'Get transactions for specific goal',
          'POST /transactions': 'Add savings transaction (deposit/withdrawal)',
          'POST /goals/:goalId/withdraw': 'Withdraw from savings with validation',
          'PUT /transactions/:id': 'Update savings transaction',
          'DELETE /transactions/:id': 'Delete savings transaction'
        }
      },
      
      // 🚧 TODO - REMAINING FEATURES
      
      budgets: {
        base: '/api/finance/budgets',
        methods: {
          'GET /': 'List budgets with utilization tracking (advanced filtering)',
          'GET /:id': 'Get single budget with category and utilization data',
          'GET /utilization/overview': 'Get budget utilization overview with alerts',
          'POST /': 'Create new budget with period validation',
          'POST /:id/reset': 'Reset budget period and optionally amount',
          'POST /bulk': 'Bulk create budgets',
          'PUT /:id': 'Update budget with conflict checking',
          'PUT /bulk': 'Bulk update budgets',
          'DELETE /:id': 'Delete budget',
          'DELETE /bulk': 'Bulk delete budgets',
          'PATCH /:id/toggle': 'Toggle budget active status'
        }
      },
      
      recurring: {
        base: '/api/finance/recurring',
        methods: {
          'GET /': 'List recurring transactions with next execution dates (advanced filtering)',
          'GET /stats': 'Get recurring transactions statistics and totals',
          'GET /due': 'Get recurring transactions due for generation',
          'GET /:id': 'Get single recurring transaction with schedule details',
          'GET /:id/schedule': 'Get schedule preview with upcoming dates',
          'POST /': 'Create new recurring transaction with frequency rules',
          'POST /generate': 'Generate transactions for all or specific recurring rules',
          'POST /:id/generate': 'Generate transactions for specific recurring transaction',
          'POST /bulk': 'Bulk create recurring transactions',
          'PUT /:id': 'Update recurring transaction and schedule',
          'PUT /bulk': 'Bulk update recurring transactions',
          'DELETE /:id': 'Delete recurring transaction (optionally with generated transactions)',
          'DELETE /bulk': 'Bulk delete recurring transactions',
          'PATCH /:id/toggle': 'Toggle recurring transaction active status',
          'PATCH /:id/schedule': 'Update recurring transaction schedule settings'
        }
      },
      
      debt: {
        base: '/api/finance/debt',
        status: '🚧 Coming Soon',
        planned: ['Debt tracking', 'Payment schedules', 'Interest calculations']
      },
      
      tags: {
        base: '/api/finance/tags',
        status: '🚧 Coming Soon',
        planned: ['Tag management', 'Transaction tagging', 'Filtering']
      },
      
      alerts: {
        base: '/api/finance/alerts',
        status: '🚧 Coming Soon',
        planned: ['Notifications', 'Budget alerts', 'Reminders']
      },
      
      currency: {
        base: '/api/finance/currency',
        status: '🚧 Coming Soon',
        planned: ['Exchange rates', 'Currency conversion', 'Multi-currency support']
      },
      
      goals: {
        base: '/api/finance/goals',
        status: '🚧 Coming Soon',
        planned: ['Financial goals', 'Progress tracking', 'Achievement system']
      },
      
      dashboard: {
        base: '/api/finance/dashboard',
        status: '🚧 Coming Soon',
        planned: ['Analytics', 'Summary data', 'Financial forecasting']
      },
      
      audit: {
        base: '/api/finance/audit',
        status: '🚧 Coming Soon',
        planned: ['Activity logs', 'Change tracking', 'User actions']
      },
      
      sync: {
        base: '/api/finance/sync',
        status: '🚧 Coming Soon',
        planned: ['Data synchronization', 'Offline support', 'Conflict resolution']
      }
    },
    
    system: {
      health: '/health',
      info: '/api/finance'
    },
    
    stats: {
      implemented: 5,
      total: 11,
      progress: '45%'
    },
    
    features: {
      '✅ Modular Architecture': 'Feature-based separation of concerns',
      '✅ Type Safety': 'End-to-end TypeScript with Drizzle ORM',
      '✅ Functional CRUD': 'Reusable database abstractions',
      '✅ Schema Helpers': 'DRY database schema definitions',
      '✅ Input Validation': 'Zod schemas for all endpoints',
      '✅ Error Handling': 'Comprehensive error management',
      '✅ Relationships': 'Complex joins and data enrichment',
      '✅ Bulk Operations': 'Batch processing support',
      '✅ Progress Tracking': 'Real-time savings goal calculations',
      '✅ Smart Withdrawals': 'Balance validation and protection',
      '✅ Budget Utilization': 'Real-time budget tracking with spending analysis',
      '✅ Budget Alerts': 'Smart notifications for budget thresholds',
      '✅ Period Management': 'Monthly/yearly budget cycles with reset functionality',
      '✅ Recurring Patterns': 'Complex frequency rules with date calculations',
      '✅ Schedule Engine': 'Automated transaction generation with duplicate prevention',
      '✅ Generation Control': 'Dry-run mode, force generation, and batch processing'
    },
    
    next: 'Implement Debt module with payment schedules and interest calculations'
  });
});

app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      message: `Route ${c.req.path} not found`
    }
  }, 404);
});

app.onError((err, c) => {
  console.error('API Error:', {
    message: err.message,
    stack: err.stack,
    url: c.req.url,
    method: c.req.method
  });

  return c.json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  }, 500);
});

export default app;

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  getSavingsGoals,
  getSavingsGoalById,
  getSavingsTransactions,
  calculateSavingsProgress,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  addSavingsTransaction,
  withdrawFromSavings,
  updateSavingsTransaction,
  deleteSavingsTransaction,
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  createSavingsTransactionSchema,
  getSavingsGoalsQuerySchema,
  getSavingsTransactionsQuerySchema
} from './api';
import { z } from 'zod';

const savingsRoutes = new Hono();

// SAVINGS GOALS ROUTES

savingsRoutes.get('/goals',
  zValidator('query', getSavingsGoalsQuerySchema),
  async (c) => {
    try {
      const filters = c.req.valid('query');
      const goals = await getSavingsGoals(filters);

      return c.json({
        success: true,
        data: goals,
        count: goals.length,
        filters
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get savings goals'
        }
      }, 500);
    }
  }
);

savingsRoutes.get('/goals/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: { message: 'Invalid savings goal ID' }
      }, 400);
    }

    const goal = await getSavingsGoalById(id);
    if (!goal) {
      return c.json({
        success: false,
        error: { message: 'Savings goal not found' }
      }, 404);
    }

    return c.json({
      success: true,
      data: goal
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get savings goal'
      }
    }, 500);
  }
});

savingsRoutes.get('/goals/:id/progress', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: { message: 'Invalid savings goal ID' }
      }, 400);
    }

    const progress = await calculateSavingsProgress(id);
    
    return c.json({
      success: true,
      data: progress
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to calculate savings progress'
      }
    }, 500);
  }
});

savingsRoutes.post('/goals',
  zValidator('json', createSavingsGoalSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const goal = await createSavingsGoal(data);

      return c.json({
        success: true,
        message: 'Savings goal created successfully',
        data: goal
      }, 201);
    } catch (error) {
      return c.json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create savings goal'
        }
      }, 500);
    }
  }
);

savingsRoutes.put('/goals/:id',
  zValidator('json', updateSavingsGoalSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          error: { message: 'Invalid savings goal ID' }
        }, 400);
      }

      const data = c.req.valid('json');
      const goal = await updateSavingsGoal(id, data);

      if (!goal) {
        return c.json({
          success: false,
          error: { message: 'Savings goal not found' }
        }, 404);
      }

      return c.json({
        success: true,
        message: 'Savings goal updated successfully',
        data: goal
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update savings goal'
        }
      }, 500);
    }
  }
);

savingsRoutes.delete('/goals/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: { message: 'Invalid savings goal ID' }
      }, 400);
    }

    const success = await deleteSavingsGoal(id);
    if (!success) {
      return c.json({
        success: false,
        error: { message: 'Savings goal not found' }
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Savings goal deleted successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete savings goal'
      }
    }, 400);
  }
});

// SAVINGS TRANSACTIONS ROUTES

savingsRoutes.get('/transactions',
  zValidator('query', getSavingsTransactionsQuerySchema),
  async (c) => {
    try {
      const filters = c.req.valid('query');
      const transactions = await getSavingsTransactions(filters);

      return c.json({
        success: true,
        data: transactions,
        count: transactions.length,
        filters
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get savings transactions'
        }
      }, 500);
    }
  }
);

savingsRoutes.get('/goals/:goalId/transactions', async (c) => {
  try {
    const goalId = parseInt(c.req.param('goalId'));
    if (isNaN(goalId)) {
      return c.json({
        success: false,
        error: { message: 'Invalid savings goal ID' }
      }, 400);
    }

    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const transactions = await getSavingsTransactions({ 
      goalId, 
      limit, 
      offset 
    });

    return c.json({
      success: true,
      data: transactions,
      count: transactions.length,
      goalId,
      pagination: { limit, offset }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get savings transactions for goal'
      }
    }, 500);
    }
  }
);

savingsRoutes.post('/transactions',
  zValidator('json', createSavingsTransactionSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const transaction = await addSavingsTransaction(data);

      return c.json({
        success: true,
        message: 'Savings transaction added successfully',
        data: transaction
      }, 201);
    } catch (error) {
      return c.json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to add savings transaction'
        }
      }, 500);
    }
  }
);

const withdrawSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  note: z.string().max(500, 'Note too long').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional()
});

savingsRoutes.post('/goals/:goalId/withdraw',
  zValidator('json', withdrawSchema),
  async (c) => {
    try {
      const goalId = parseInt(c.req.param('goalId'));
      if (isNaN(goalId)) {
        return c.json({
          success: false,
          error: { message: 'Invalid savings goal ID' }
        }, 400);
      }

      const { amount, note, date } = c.req.valid('json');
      const transaction = await withdrawFromSavings(goalId, amount, note, date);

      return c.json({
        success: true,
        message: `Successfully withdrew $${amount.toFixed(2)} from savings`,
        data: transaction
      }, 201);
    } catch (error) {
      return c.json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to withdraw from savings'
        }
      }, 400);
    }
  }
);

const updateSavingsTransactionSchema = createSavingsTransactionSchema.partial();

savingsRoutes.put('/transactions/:id',
  zValidator('json', updateSavingsTransactionSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          error: { message: 'Invalid savings transaction ID' }
        }, 400);
      }

      const data = c.req.valid('json');
      const transaction = await updateSavingsTransaction(id, data);

      if (!transaction) {
        return c.json({
          success: false,
          error: { message: 'Savings transaction not found' }
        }, 404);
      }

      return c.json({
        success: true,
        message: 'Savings transaction updated successfully',
        data: transaction
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update savings transaction'
        }
      }, 500);
    }
  }
);

savingsRoutes.delete('/transactions/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: { message: 'Invalid savings transaction ID' }
      }, 400);
    }

    const success = await deleteSavingsTransaction(id);
    if (!success) {
      return c.json({
        success: false,
        error: { message: 'Savings transaction not found' }
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Savings transaction deleted successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete savings transaction'
      }
    }, 500);
  }
});

export { savingsRoutes };

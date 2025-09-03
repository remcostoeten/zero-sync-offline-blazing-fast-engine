import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  getTransactions,
  getTransactionById,
  getTransactionsByCategory,
  getTransactionsByDateRange,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkImportTransactions,
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsQuerySchema,
  bulkImportTransactionSchema
} from './api';

const transactionsRoutes = new Hono();

transactionsRoutes.get('/',
  zValidator('query', getTransactionsQuerySchema),
  async (c) => {
    try {
      const filters = c.req.valid('query');
      const transactions = await getTransactions(filters);

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
          message: error instanceof Error ? error.message : 'Failed to get transactions'
        }
      }, 500);
    }
  }
);

transactionsRoutes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: { message: 'Invalid transaction ID' }
      }, 400);
    }

    const transaction = await getTransactionById(id);
    if (!transaction) {
      return c.json({
        success: false,
        error: { message: 'Transaction not found' }
      }, 404);
    }

    return c.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get transaction'
      }
    }, 500);
  }
});

transactionsRoutes.get('/category/:categoryId', async (c) => {
  try {
    const categoryId = parseInt(c.req.param('categoryId'));
    if (isNaN(categoryId)) {
      return c.json({
        success: false,
        error: { message: 'Invalid category ID' }
      }, 400);
    }

    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    const transactions = await getTransactionsByCategory(categoryId, limit, offset);

    return c.json({
      success: true,
      data: transactions,
      count: transactions.length,
      categoryId,
      pagination: { limit, offset }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get transactions by category'
      }
    }, 500);
  }
});

transactionsRoutes.get('/date-range/:startDate/:endDate', async (c) => {
  try {
    const startDate = c.req.param('startDate');
    const endDate = c.req.param('endDate');
    
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    const transactions = await getTransactionsByDateRange(startDate, endDate, limit, offset);

    return c.json({
      success: true,
      data: transactions,
      count: transactions.length,
      dateRange: { startDate, endDate },
      pagination: { limit, offset }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get transactions by date range'
      }
    }, 500);
  }
});

transactionsRoutes.post('/',
  zValidator('json', createTransactionSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const transaction = await createTransaction(data);

      return c.json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction
      }, 201);
    } catch (error) {
      return c.json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create transaction'
        }
      }, 500);
    }
  }
);

transactionsRoutes.post('/bulk-import',
  zValidator('json', bulkImportTransactionSchema),
  async (c) => {
    try {
      const { transactions } = c.req.valid('json');
      const result = await bulkImportTransactions(transactions);

      return c.json({
        success: true,
        message: `Successfully imported ${result.imported} transactions`,
        data: result
      }, 201);
    } catch (error) {
      return c.json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to bulk import transactions'
        }
      }, 500);
    }
  }
);

transactionsRoutes.put('/:id',
  zValidator('json', updateTransactionSchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          error: { message: 'Invalid transaction ID' }
        }, 400);
      }

      const data = c.req.valid('json');
      const transaction = await updateTransaction(id, data);

      if (!transaction) {
        return c.json({
          success: false,
          error: { message: 'Transaction not found' }
        }, 404);
      }

      return c.json({
        success: true,
        message: 'Transaction updated successfully',
        data: transaction
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update transaction'
        }
      }, 500);
    }
  }
);

transactionsRoutes.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: { message: 'Invalid transaction ID' }
      }, 400);
    }

    const success = await deleteTransaction(id);
    if (!success) {
      return c.json({
        success: false,
        error: { message: 'Transaction not found' }
      }, 404);
    }

    return c.json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete transaction'
      }
    }, 500);
  }
});

export { transactionsRoutes };

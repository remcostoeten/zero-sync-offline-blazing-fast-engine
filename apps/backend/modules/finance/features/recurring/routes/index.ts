import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  RecurringTransactionInsertSchema,
  RecurringTransactionUpdateSchema,
  RecurringTransactionFiltersSchema,
  GenerateTransactionsSchema,
  ScheduleAnalysisSchema,
  RecurringScheduleUpdateSchema,
  BulkRecurringCreateSchema,
  BulkRecurringUpdateSchema,
  BulkRecurringDeleteSchema
} from '../schemas';
import {
  getRecurringTransactions,
  getRecurringTransactionById,
  getSchedulePreview,
  getRecurringTransactionsDueForGeneration,
  getRecurringTransactionStats,
  createRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  toggleRecurringTransactionStatus,
  updateRecurringSchedule,
  generateTransactionsForRecurring,
  generateTransactionsForAll,
  bulkCreateRecurringTransactions,
  bulkUpdateRecurringTransactions,
  bulkDeleteRecurringTransactions
} from '../api';
import { z } from 'zod';

const recurringRouter = new Hono();

// GET /recurring - List all recurring transactions with filters
recurringRouter.get(
  '/',
  zValidator('query', RecurringTransactionFiltersSchema.optional()),
  async (c) => {
    try {
      const filters = c.req.valid('query') || {};
      const recurring = await getRecurringTransactions(filters);
      
      return c.json({
        success: true,
        data: recurring,
        count: recurring.length
      });
    } catch (error) {
      console.error('Error fetching recurring transactions:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch recurring transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// GET /recurring/stats - Get recurring transactions statistics
recurringRouter.get(
  '/stats',
  async (c) => {
    try {
      const stats = await getRecurringTransactionStats();
      
      return c.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching recurring transaction stats:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch recurring transaction stats',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// GET /recurring/due - Get recurring transactions due for generation
recurringRouter.get(
  '/due',
  zValidator('query', z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  }).optional()),
  async (c) => {
    try {
      const query = c.req.valid('query') || {};
      const date = query.date;
      const dueRecurring = await getRecurringTransactionsDueForGeneration(date);
      
      return c.json({
        success: true,
        data: dueRecurring,
        count: dueRecurring.length
      });
    } catch (error) {
      console.error('Error fetching due recurring transactions:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch due recurring transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// GET /recurring/:id - Get specific recurring transaction by ID
recurringRouter.get(
  '/:id',
  zValidator('param', z.object({ id: z.string().transform(Number) })),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const recurring = await getRecurringTransactionById(id);
      
      if (!recurring) {
        return c.json({
          success: false,
          error: 'Recurring transaction not found'
        }, 404);
      }
      
      return c.json({
        success: true,
        data: recurring
      });
    } catch (error) {
      console.error('Error fetching recurring transaction:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch recurring transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// GET /recurring/:id/schedule - Get schedule preview for recurring transaction
recurringRouter.get(
  '/:id/schedule',
  zValidator('param', z.object({ id: z.string().transform(Number) })),
  zValidator('query', ScheduleAnalysisSchema.omit({ recurringId: true }).optional()),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const query = c.req.valid('query') || {};
      
      const schedule = await getSchedulePreview(
        id,
        query.fromDate,
        query.toDate,
        query.maxDates
      );
      
      if (!schedule) {
        return c.json({
          success: false,
          error: 'Recurring transaction not found'
        }, 404);
      }
      
      return c.json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error('Error fetching schedule preview:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch schedule preview',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// POST /recurring - Create new recurring transaction
recurringRouter.post(
  '/',
  zValidator('json', RecurringTransactionInsertSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const recurring = await createRecurringTransaction(data);
      
      return c.json({
        success: true,
        data: recurring,
        message: 'Recurring transaction created successfully'
      }, 201);
    } catch (error) {
      console.error('Error creating recurring transaction:', error);
      return c.json({
        success: false,
        error: 'Failed to create recurring transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

// PUT /recurring/:id - Update existing recurring transaction
recurringRouter.put(
  '/:id',
  zValidator('param', z.object({ id: z.string().transform(Number) })),
  zValidator('json', RecurringTransactionUpdateSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const data = c.req.valid('json');
      
      const recurring = await updateRecurringTransaction({ id, ...data });
      
      return c.json({
        success: true,
        data: recurring,
        message: 'Recurring transaction updated successfully'
      });
    } catch (error) {
      console.error('Error updating recurring transaction:', error);
      return c.json({
        success: false,
        error: 'Failed to update recurring transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

// DELETE /recurring/:id - Delete recurring transaction
recurringRouter.delete(
  '/:id',
  zValidator('param', z.object({ id: z.string().transform(Number) })),
  zValidator('query', z.object({
    deleteGeneratedTransactions: z.string().transform(val => val === 'true').optional()
  }).optional()),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const query = c.req.valid('query') || {};
      const deleteGenerated = query.deleteGeneratedTransactions || false;
      
      const success = await deleteRecurringTransaction(id, deleteGenerated);
      
      if (!success) {
        return c.json({
          success: false,
          error: 'Recurring transaction not found'
        }, 404);
      }
      
      return c.json({
        success: true,
        message: 'Recurring transaction deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting recurring transaction:', error);
      return c.json({
        success: false,
        error: 'Failed to delete recurring transaction',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// PATCH /recurring/:id/toggle - Toggle recurring transaction active status
recurringRouter.patch(
  '/:id/toggle',
  zValidator('param', z.object({ id: z.string().transform(Number) })),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const recurring = await toggleRecurringTransactionStatus(id);
      
      return c.json({
        success: true,
        data: recurring,
        message: `Recurring transaction ${recurring.isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling recurring transaction status:', error);
      return c.json({
        success: false,
        error: 'Failed to toggle recurring transaction status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

// PATCH /recurring/:id/schedule - Update recurring transaction schedule
recurringRouter.patch(
  '/:id/schedule',
  zValidator('param', z.object({ id: z.string().transform(Number) })),
  zValidator('json', RecurringScheduleUpdateSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const updates = c.req.valid('json');
      
      const recurring = await updateRecurringSchedule(id, updates);
      
      return c.json({
        success: true,
        data: recurring,
        message: 'Recurring transaction schedule updated successfully'
      });
    } catch (error) {
      console.error('Error updating recurring transaction schedule:', error);
      return c.json({
        success: false,
        error: 'Failed to update recurring transaction schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

// POST /recurring/generate - Generate transactions for all or specific recurring transaction
recurringRouter.post(
  '/generate',
  zValidator('json', GenerateTransactionsSchema.optional()),
  async (c) => {
    try {
      const options = c.req.valid('json') || {};
      
      let results;
      if (options.recurringId) {
        // Generate for specific recurring transaction
        const result = await generateTransactionsForRecurring(options.recurringId, options);
        results = [result];
      } else {
        // Generate for all active recurring transactions
        results = await generateTransactionsForAll(options);
      }
      
      const totalGenerated = results.reduce((sum, r) => sum + r.generatedCount, 0);
      const totalSkipped = results.reduce((sum, r) => sum + r.skippedCount, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
      
      return c.json({
        success: true,
        data: results,
        summary: {
          totalRecurring: results.length,
          totalGenerated,
          totalSkipped,
          totalErrors
        },
        message: options.dryRun 
          ? `Dry run completed: Would generate ${totalGenerated} transaction(s)` 
          : `Generated ${totalGenerated} transaction(s) successfully`
      });
    } catch (error) {
      console.error('Error generating transactions:', error);
      return c.json({
        success: false,
        error: 'Failed to generate transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// POST /recurring/:id/generate - Generate transactions for specific recurring transaction
recurringRouter.post(
  '/:id/generate',
  zValidator('param', z.object({ id: z.string().transform(Number) })),
  zValidator('json', GenerateTransactionsSchema.omit({ recurringId: true }).optional()),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const options = c.req.valid('json') || {};
      
      const result = await generateTransactionsForRecurring(id, options);
      
      return c.json({
        success: true,
        data: result,
        message: options.dryRun 
          ? `Dry run completed: Would generate ${result.generatedCount} transaction(s)` 
          : `Generated ${result.generatedCount} transaction(s) successfully`
      });
    } catch (error) {
      console.error('Error generating transactions:', error);
      return c.json({
        success: false,
        error: 'Failed to generate transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// POST /recurring/bulk - Bulk create recurring transactions
recurringRouter.post(
  '/bulk',
  zValidator('json', BulkRecurringCreateSchema),
  async (c) => {
    try {
      const { recurring } = c.req.valid('json');
      const results = await bulkCreateRecurringTransactions(recurring);
      
      return c.json({
        success: true,
        data: results,
        message: `Successfully created ${results.length} recurring transaction(s)`,
        count: results.length
      }, 201);
    } catch (error) {
      console.error('Error bulk creating recurring transactions:', error);
      return c.json({
        success: false,
        error: 'Failed to bulk create recurring transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

// PUT /recurring/bulk - Bulk update recurring transactions
recurringRouter.put(
  '/bulk',
  zValidator('json', BulkRecurringUpdateSchema),
  async (c) => {
    try {
      const { updates } = c.req.valid('json');
      const results = await bulkUpdateRecurringTransactions(updates);
      
      return c.json({
        success: true,
        data: results,
        message: `Successfully updated ${results.length} recurring transaction(s)`,
        count: results.length
      });
    } catch (error) {
      console.error('Error bulk updating recurring transactions:', error);
      return c.json({
        success: false,
        error: 'Failed to bulk update recurring transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

// DELETE /recurring/bulk - Bulk delete recurring transactions
recurringRouter.delete(
  '/bulk',
  zValidator('json', BulkRecurringDeleteSchema),
  async (c) => {
    try {
      const { ids, deleteGeneratedTransactions } = c.req.valid('json');
      const results = await bulkDeleteRecurringTransactions(ids, deleteGeneratedTransactions);
      
      return c.json({
        success: true,
        data: results,
        message: `Deleted ${results.deleted.length} recurring transaction(s), failed ${results.failed.length}`
      });
    } catch (error) {
      console.error('Error bulk deleting recurring transactions:', error);
      return c.json({
        success: false,
        error: 'Failed to bulk delete recurring transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

export { recurringRouter };

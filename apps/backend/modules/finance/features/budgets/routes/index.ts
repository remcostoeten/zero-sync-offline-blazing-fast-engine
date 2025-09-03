import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  BudgetInsertSchema,
  BudgetUpdateSchema,
  BudgetFiltersSchema,
  BudgetUtilizationFiltersSchema,
  BudgetResetSchema
} from '../schemas';
import {
  getBudgets,
  getBudgetById,
  getBudgetUtilization,
  createBudget,
  updateBudget,
  deleteBudget,
  toggleBudgetStatus,
  resetBudget,
  bulkCreateBudgets,
  bulkUpdateBudgets,
  bulkDeleteBudgets
} from '../api';
import { z } from 'zod';

const budgetsRouter = new Hono();

// GET /budgets - List all budgets with filters
budgetsRouter.get(
  '/',
  zValidator('query', BudgetFiltersSchema.optional()),
  async (c) => {
    try {
      const filters = c.req.valid('query') || {};
      const budgets = await getBudgets(filters);
      
      return c.json({
        success: true,
        data: budgets,
        count: budgets.length
      });
    } catch (error) {
      console.error('Error fetching budgets:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch budgets',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// GET /budgets/:id - Get specific budget by ID
budgetsRouter.get(
  '/:id',
  zValidator('param', z.object({ id: z.string().transform(Number) })),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const budget = await getBudgetById(id);
      
      if (!budget) {
        return c.json({
          success: false,
          error: 'Budget not found'
        }, 404);
      }
      
      return c.json({
        success: true,
        data: budget
      });
    } catch (error) {
      console.error('Error fetching budget:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch budget',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// POST /budgets - Create new budget
budgetsRouter.post(
  '/',
  zValidator('json', BudgetInsertSchema),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const budget = await createBudget(data);
      
      return c.json({
        success: true,
        data: budget,
        message: 'Budget created successfully'
      }, 201);
    } catch (error) {
      console.error('Error creating budget:', error);
      return c.json({
        success: false,
        error: 'Failed to create budget',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

// PUT /budgets/:id - Update existing budget
budgetsRouter.put(
  '/:id',
  zValidator('param', z.object({ id: z.string().transform(Number) })),
  zValidator('json', BudgetUpdateSchema),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const data = c.req.valid('json');
      
      const budget = await updateBudget({ id, ...data });
      
      return c.json({
        success: true,
        data: budget,
        message: 'Budget updated successfully'
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      return c.json({
        success: false,
        error: 'Failed to update budget',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

// DELETE /budgets/:id - Delete budget
budgetsRouter.delete(
  '/:id',
  zValidator('param', z.object({ id: z.string().transform(Number) })),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const success = await deleteBudget(id);
      
      if (!success) {
        return c.json({
          success: false,
          error: 'Budget not found'
        }, 404);
      }
      
      return c.json({
        success: true,
        message: 'Budget deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting budget:', error);
      return c.json({
        success: false,
        error: 'Failed to delete budget',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// PATCH /budgets/:id/toggle - Toggle budget active status
budgetsRouter.patch(
  '/:id/toggle',
  zValidator('param', z.object({ id: z.string().transform(Number) })),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const budget = await toggleBudgetStatus(id);
      
      return c.json({
        success: true,
        data: budget,
        message: `Budget ${budget.isActive ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('Error toggling budget status:', error);
      return c.json({
        success: false,
        error: 'Failed to toggle budget status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

// POST /budgets/:id/reset - Reset budget period and optionally amount
budgetsRouter.post(
  '/:id/reset',
  zValidator('param', z.object({ id: z.string().transform(Number) })),
  zValidator('json', BudgetResetSchema.optional()),
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const options = c.req.valid('json') || {};
      
      const budget = await resetBudget(id, options);
      
      return c.json({
        success: true,
        data: budget,
        message: 'Budget reset successfully'
      });
    } catch (error) {
      console.error('Error resetting budget:', error);
      return c.json({
        success: false,
        error: 'Failed to reset budget',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

// GET /budgets/utilization - Get budget utilization overview with alerts
budgetsRouter.get(
  '/utilization/overview',
  zValidator('query', BudgetUtilizationFiltersSchema.optional()),
  async (c) => {
    try {
      const filters = c.req.valid('query') || {};
      const utilization = await getBudgetUtilization(filters);
      
      return c.json({
        success: true,
        data: utilization
      });
    } catch (error) {
      console.error('Error fetching budget utilization:', error);
      return c.json({
        success: false,
        error: 'Failed to fetch budget utilization',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  }
);

// POST /budgets/bulk - Bulk create budgets
budgetsRouter.post(
  '/bulk',
  zValidator('json', z.object({
    budgets: z.array(BudgetInsertSchema)
  })),
  async (c) => {
    try {
      const { budgets } = c.req.valid('json');
      const results = await bulkCreateBudgets(budgets);
      
      return c.json({
        success: true,
        data: results,
        message: `Successfully created ${results.length} budget(s)`,
        count: results.length
      }, 201);
    } catch (error) {
      console.error('Error bulk creating budgets:', error);
      return c.json({
        success: false,
        error: 'Failed to bulk create budgets',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

// PUT /budgets/bulk - Bulk update budgets
budgetsRouter.put(
  '/bulk',
  zValidator('json', z.object({
    budgets: z.array(BudgetUpdateSchema.extend({ id: z.number() }))
  })),
  async (c) => {
    try {
      const { budgets } = c.req.valid('json');
      const results = await bulkUpdateBudgets(budgets);
      
      return c.json({
        success: true,
        data: results,
        message: `Successfully updated ${results.length} budget(s)`,
        count: results.length
      });
    } catch (error) {
      console.error('Error bulk updating budgets:', error);
      return c.json({
        success: false,
        error: 'Failed to bulk update budgets',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

// DELETE /budgets/bulk - Bulk delete budgets
budgetsRouter.delete(
  '/bulk',
  zValidator('json', z.object({
    ids: z.array(z.number())
  })),
  async (c) => {
    try {
      const { ids } = c.req.valid('json');
      const results = await bulkDeleteBudgets(ids);
      
      return c.json({
        success: true,
        data: results,
        message: `Deleted ${results.deleted.length} budget(s), failed ${results.failed.length}`
      });
    } catch (error) {
      console.error('Error bulk deleting budgets:', error);
      return c.json({
        success: false,
        error: 'Failed to bulk delete budgets',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 400);
    }
  }
);

export { budgetsRouter };

import { z } from 'zod';

const categoryTypeSchema = z.enum(['income', 'expense']);

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name too long'),
  type: categoryTypeSchema,
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),
  icon: z.string().max(10, 'Icon too long').optional()
});

const updateCategorySchema = createCategorySchema.partial();

const getCategoriesQuerySchema = z.object({
  type: categoryTypeSchema.optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export {
  createCategorySchema,
  updateCategorySchema,
  getCategoriesQuerySchema,
  categoryTypeSchema
};

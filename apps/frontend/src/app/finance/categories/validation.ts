import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be 100 characters or less')
    .refine(
      (name) => !/<script|javascript:|data:/i.test(name),
      'Invalid characters in name'
    ),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be either income or expense' })
  }),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color (e.g., #FF0000)')
    .optional()
    .default('#3B82F6'),
  icon: z.string()
    .max(10, 'Icon must be 10 characters or less')
    .optional()
    .default('💰'),
  isDemo: z.boolean()
    .optional()
    .default(false)
});

export const updateCategorySchema = z.object({
  id: z.number().int().positive('Category ID must be a positive integer'),
  name: z.string()
    .trim()
    .min(1, 'Category name is required')
    .max(100, 'Category name must be 100 characters or less')
    .refine(
      (name) => !/<script|javascript:|data:/i.test(name),
      'Invalid characters in name'
    )
    .optional(),
  type: z.enum(['income', 'expense'], {
    errorMap: () => ({ message: 'Type must be either income or expense' })
  }).optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color (e.g., #FF0000)')
    .optional(),
  icon: z.string()
    .max(10, 'Icon must be 10 characters or less')
    .optional(),
  isDemo: z.boolean().optional()
});

export const idSchema = z.number().int().positive('ID must be a positive integer');

export const categoryFiltersSchema = z.object({
  type: z.enum(['income', 'expense']).optional(),
  isDemo: z.boolean().optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().min(0).optional()
});

export const formDataToCategoryInput = (formData: FormData) => {
  return {
    name: formData.get('name') as string,
    type: formData.get('type') as 'income' | 'expense',
    color: formData.get('color') as string || undefined,
    icon: formData.get('icon') as string || undefined,
    isDemo: formData.get('isDemo') === 'true'
  };
};

export const formDataToUpdateInput = (formData: FormData) => {
  const id = parseInt(formData.get('id') as string, 10);
  
  return {
    id,
    name: formData.get('name') as string || undefined,
    type: formData.get('type') as 'income' | 'expense' || undefined,
    color: formData.get('color') as string || undefined,
    icon: formData.get('icon') as string || undefined,
    isDemo: formData.get('isDemo') ? formData.get('isDemo') === 'true' : undefined
  };
};

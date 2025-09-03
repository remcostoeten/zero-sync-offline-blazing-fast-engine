import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { 
  getCategories, 
  getCategoryById, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  createCategorySchema,
  updateCategorySchema,
  getCategoriesQuerySchema
} from './api';

const categoriesRoutes = new Hono();

categoriesRoutes.get('/', 
  zValidator('query', getCategoriesQuerySchema), 
  async (c) => {
    try {
      const { type, limit, offset } = c.req.valid('query');
      const categories = await getCategories({ type, limit, offset });
      
      return c.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to get categories'
        }
      }, 500);
    }
  }
);

categoriesRoutes.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: { message: 'Invalid category ID' }
      }, 400);
    }

    const category = await getCategoryById(id);
    if (!category) {
      return c.json({
        success: false,
        error: { message: 'Category not found' }
      }, 404);
    }

    return c.json({
      success: true,
      data: category
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to get category'
      }
    }, 500);
  }
});

categoriesRoutes.post('/',
  zValidator('json', createCategorySchema),
  async (c) => {
    try {
      const data = c.req.valid('json');
      const category = await createCategory(data);

      return c.json({
        success: true,
        message: 'Category created successfully',
        data: category
      }, 201);
    } catch (error) {
      return c.json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to create category'
        }
      }, 500);
    }
  }
);

categoriesRoutes.put('/:id',
  zValidator('json', updateCategorySchema),
  async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      if (isNaN(id)) {
        return c.json({
          success: false,
          error: { message: 'Invalid category ID' }
        }, 400);
      }

      const data = c.req.valid('json');
      const category = await updateCategory(id, data);

      if (!category) {
        return c.json({
          success: false,
          error: { message: 'Category not found' }
        }, 404);
      }

      return c.json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Failed to update category'
        }
      }, 500);
    }
  }
);

categoriesRoutes.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({
        success: false,
        error: { message: 'Invalid category ID' }
      }, 400);
    }

    const success = await deleteCategory(id);
    if (!success) {
      return c.json({
        success: false,
        error: { message: 'Category not found or has associated transactions' }
      }, 400);
    }

    return c.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to delete category'
      }
    }, 500);
  }
});

export { categoriesRoutes };

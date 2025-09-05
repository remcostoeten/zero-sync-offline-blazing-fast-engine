'use server';

import { revalidateTag } from 'next/cache';
import { ZodError } from 'zod';
import { createCategoriesRepository } from '@/lib/db/factories/create-categories-repository';
import { getDb } from '@/lib/database/connection';
import { 
  authorizeCategoryCreate, 
  authorizeCategoryUpdate, 
  authorizeCategoryDelete 
} from '@/lib/auth/authorize';
import { 
  createCategorySchema, 
  updateCategorySchema,
  formDataToCategoryInput,
  formDataToUpdateInput,
  idSchema
} from './validation';
import type { TCategory, TCategoryError } from '@/lib/types/categories';

export async function createCategoryAction(formData: FormData): Promise<TCategory> {
  try {
    await authorizeCategoryCreate();
    
    const input = formDataToCategoryInput(formData);
    const validatedData = createCategorySchema.parse(input);
    
    const db = getDb();
    const repository = createCategoriesRepository(db);
    const category = await repository.create(validatedData);
    
    revalidateTag('categories:list');
    revalidateTag('categories:type:' + category.type);
    
    return category;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Validation failed: ${error.errors[0]?.message || 'Invalid input'}`);
    }
    
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('A category with this name already exists');
      }
      throw error;
    }
    
    throw new Error('Failed to create category');
  }
}

export async function createCategory(input: unknown): Promise<TCategory> {
  try {
    await authorizeCategoryCreate();
    
    const validatedData = createCategorySchema.parse(input);
    
    const db = getDb();
    const repository = createCategoriesRepository(db);
    const category = await repository.create(validatedData);
    
    revalidateTag('categories:list');
    revalidateTag('categories:type:' + category.type);
    
    return category;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Validation failed: ${error.errors[0]?.message || 'Invalid input'}`);
    }
    
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('A category with this name already exists');
      }
      throw error;
    }
    
    throw new Error('Failed to create category');
  }
}

export async function updateCategoryAction(formData: FormData): Promise<TCategory> {
  try {
    await authorizeCategoryUpdate();
    
    const input = formDataToUpdateInput(formData);
    const validatedData = updateCategorySchema.parse(input);
    
    const { id, ...updateData } = validatedData;
    
    const db = getDb();
    const repository = createCategoriesRepository(db);
    const category = await repository.update(id, updateData);
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    revalidateTag('categories:list');
    revalidateTag('categories:type:' + category.type);
    revalidateTag('category:' + id);
    
    return category;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Validation failed: ${error.errors[0]?.message || 'Invalid input'}`);
    }
    
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('A category with this name already exists');
      }
      throw error;
    }
    
    throw new Error('Failed to update category');
  }
}

export async function updateCategory(id: number, input: unknown): Promise<TCategory> {
  try {
    await authorizeCategoryUpdate();
    
    const validatedData = updateCategorySchema.parse({ id, ...input });
    const { id: categoryId, ...updateData } = validatedData;
    
    const db = getDb();
    const repository = createCategoriesRepository(db);
    const category = await repository.update(categoryId, updateData);
    
    if (!category) {
      throw new Error('Category not found');
    }
    
    revalidateTag('categories:list');
    revalidateTag('categories:type:' + category.type);
    revalidateTag('category:' + categoryId);
    
    return category;
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Validation failed: ${error.errors[0]?.message || 'Invalid input'}`);
    }
    
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        throw new Error('A category with this name already exists');
      }
      throw error;
    }
    
    throw new Error('Failed to update category');
  }
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  try {
    await authorizeCategoryDelete();
    
    const id = parseInt(formData.get('id') as string, 10);
    const validatedId = idSchema.parse(id);
    
    const db = getDb();
    const repository = createCategoriesRepository(db);
    
    const existingCategory = await repository.read(validatedId);
    if (!existingCategory) {
      throw new Error('Category not found');
    }
    
    const deleted = await repository.destroy(validatedId);
    
    if (!deleted) {
      throw new Error('Failed to delete category. It may have associated transactions.');
    }
    
    revalidateTag('categories:list');
    revalidateTag('categories:type:' + existingCategory.type);
    revalidateTag('category:' + validatedId);
    
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Validation failed: ${error.errors[0]?.message || 'Invalid ID'}`);
    }
    
    if (error instanceof Error) {
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        throw new Error('Cannot delete category with associated transactions');
      }
      throw error;
    }
    
    throw new Error('Failed to delete category');
  }
}

export async function deleteCategory(id: number): Promise<void> {
  try {
    await authorizeCategoryDelete();
    
    const validatedId = idSchema.parse(id);
    
    const db = getDb();
    const repository = createCategoriesRepository(db);
    
    const existingCategory = await repository.read(validatedId);
    if (!existingCategory) {
      throw new Error('Category not found');
    }
    
    const deleted = await repository.destroy(validatedId);
    
    if (!deleted) {
      throw new Error('Failed to delete category. It may have associated transactions.');
    }
    
    revalidateTag('categories:list');
    revalidateTag('categories:type:' + existingCategory.type);
    revalidateTag('category:' + validatedId);
    
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(`Validation failed: ${error.errors[0]?.message || 'Invalid ID'}`);
    }
    
    if (error instanceof Error) {
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        throw new Error('Cannot delete category with associated transactions');
      }
      throw error;
    }
    
    throw new Error('Failed to delete category');
  }
}

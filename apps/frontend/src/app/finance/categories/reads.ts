import 'server-only';

import { unstable_cache } from 'next/cache';
import { createCategoriesRepository } from '@/lib/db/factories/create-categories-repository';
import { getDb } from '@/lib/database/connection';
import { authorizeCategoryRead } from '@/lib/auth/authorize';
import { categoryFiltersSchema, idSchema } from './validation';
import type { TCategory, TCategoryFilters } from '@/lib/types/categories';

export async function readCategory(id: number): Promise<TCategory | null> {
  await authorizeCategoryRead();
  
  const validatedId = idSchema.parse(id);
  
  return unstable_cache(
    async () => {
      const db = getDb();
      const repository = createCategoriesRepository(db);
      return await repository.read(validatedId);
    },
    [`category:${validatedId}`],
    {
      tags: [`category:${validatedId}`, 'categories:list'],
      revalidate: 3600,
    }
  )();
}

export async function listCategories(filters?: TCategoryFilters): Promise<TCategory[]> {
  await authorizeCategoryRead();
  
  const validatedFilters = filters ? categoryFiltersSchema.parse(filters) : {};
  
  const cacheKey = [
    'categories:list',
    validatedFilters.type && `type:${validatedFilters.type}`,
    validatedFilters.isDemo !== undefined && `demo:${validatedFilters.isDemo}`,
    validatedFilters.limit && `limit:${validatedFilters.limit}`,
    validatedFilters.offset && `offset:${validatedFilters.offset}`
  ].filter(Boolean) as string[];
  
  const cacheTags = [
    'categories:list',
    validatedFilters.type && `categories:type:${validatedFilters.type}`
  ].filter(Boolean) as string[];
  
  return unstable_cache(
    async () => {
      const db = getDb();
      const repository = createCategoriesRepository(db);
      return await repository.list(validatedFilters);
    },
    cacheKey,
    {
      tags: cacheTags,
      revalidate: 1800,
    }
  )();
}

export async function listCategoriesByType(type: 'income' | 'expense'): Promise<TCategory[]> {
  return listCategories({ type, isDemo: false });
}

export async function listActiveCategories(): Promise<TCategory[]> {
  return listCategories({ isDemo: false });
}

export async function getCategoriesCount(filters?: Omit<TCategoryFilters, 'limit' | 'offset'>): Promise<number> {
  await authorizeCategoryRead();
  
  const categories = await listCategories(filters);
  return categories.length;
}

export async function getCategoryExists(name: string): Promise<boolean> {
  await authorizeCategoryRead();
  
  const categories = await listCategories();
  return categories.some(category => 
    category.name.toLowerCase() === name.toLowerCase()
  );
}

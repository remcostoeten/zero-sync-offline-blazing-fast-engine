'use server';

import { getDb } from '@/lib/database/connection';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';

// Types for CRUD operations
export type CrudResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type CrudListResult<T> = {
  success: boolean;
  data?: T[];
  error?: string;
  count?: number;
};

// Frontend CRUD factory with server actions
export function createCrudActions<
  TTable extends Record<string, any>,
  TInsert,
  TSelect
>(
  table: TTable,
  insertSchema: z.ZodSchema<TInsert>,
  updateSchema: z.ZodSchema<Partial<TInsert>>,
  revalidationPath?: string
) {
  
  // Create action
  const create = async (data: unknown): Promise<CrudResult<TSelect>> => {
    try {
      const validatedData = insertSchema.parse(data);
      const db = getDb();
      
      const result = await db
        .insert(table)
        .values(validatedData)
        .returning();
        
      if (revalidationPath) {
        revalidatePath(revalidationPath);
        revalidateTag(revalidationPath);
      }
      
      return {
        success: true,
        data: result[0] as TSelect
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create record'
      };
    }
  };

  // Read all action
  const findMany = async (filters?: any): Promise<CrudListResult<TSelect>> => {
    try {
      const db = getDb();
      let query = db.select().from(table);
      
      // Apply filters if provided
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      if (filters?.offset) {
        query = query.offset(filters.offset);
      }
      
      const results = await query;
      
      return {
        success: true,
        data: results as TSelect[],
        count: results.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch records'
      };
    }
  };

  // Read one action
  const findById = async (id: number): Promise<CrudResult<TSelect>> => {
    try {
      const db = getDb();
      
      const result = await db
        .select()
        .from(table)
        .where(eq(table.id, id))
        .limit(1);
        
      if (result.length === 0) {
        return {
          success: false,
          error: 'Record not found'
        };
      }
      
      return {
        success: true,
        data: result[0] as TSelect
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch record'
      };
    }
  };

  // Update action
  const update = async (id: number, data: unknown): Promise<CrudResult<TSelect>> => {
    try {
      const validatedData = updateSchema.parse(data);
      const db = getDb();
      
      const result = await db
        .update(table)
        .set(validatedData)
        .where(eq(table.id, id))
        .returning();
        
      if (result.length === 0) {
        return {
          success: false,
          error: 'Record not found'
        };
      }
      
      if (revalidationPath) {
        revalidatePath(revalidationPath);
        revalidateTag(revalidationPath);
      }
      
      return {
        success: true,
        data: result[0] as TSelect
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update record'
      };
    }
  };

  // Delete action
  const remove = async (id: number): Promise<CrudResult<boolean>> => {
    try {
      const db = getDb();
      
      const result = await db
        .delete(table)
        .where(eq(table.id, id))
        .returning();
        
      if (result.length === 0) {
        return {
          success: false,
          error: 'Record not found'
        };
      }
      
      if (revalidationPath) {
        revalidatePath(revalidationPath);
        revalidateTag(revalidationPath);
      }
      
      return {
        success: true,
        data: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete record'
      };
    }
  };

  return {
    create,
    findMany,
    findById,
    update,
    remove
  };
}

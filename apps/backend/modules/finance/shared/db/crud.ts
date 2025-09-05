import { eq, and, isNull, isNotNull, desc, asc } from 'drizzle-orm';
import { SQLiteTable } from 'drizzle-orm/sqlite-core';
import { createDb } from './index';

type TQueryFilters = {
  limit?: number;
  offset?: number;
  orderBy?: 'asc' | 'desc';
  orderField?: string;
  where?: Record<string, any>;
  includeDeleted?: boolean;
};

type TCrudOperations<TSchema extends SQLiteTable, TInsert, TSelect> = {
  create: (data: TInsert) => Promise<TSelect>;
  read: (id: number) => Promise<TSelect | null>;
  findById: (id: number) => Promise<TSelect | null>;
  readMany: (filters?: TQueryFilters) => Promise<TSelect[]>;
  update: (id: number, data: Partial<TInsert>) => Promise<TSelect | null>;
  destroy: (id: number) => Promise<boolean>;
  delete: (id: number) => Promise<boolean>;
  softDelete?: (id: number) => Promise<boolean>;
  restore?: (id: number) => Promise<boolean>;
};

function createCrudFactory<TSchema extends SQLiteTable, TInsert, TSelect>(
  schema: TSchema
): () => TCrudOperations<TSchema, TInsert, TSelect> {
  return function crudFactory() {
    const db = createDb();

    async function create(data: TInsert): Promise<TSelect> {
      const insertData = {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await db.insert(schema).values(insertData).returning();
      return result[0] as TSelect;
    }

    async function read(id: number): Promise<TSelect | null> {
      const result = await db
        .select()
        .from(schema)
        .where(eq(schema['id' as keyof TSchema] as any, id))
        .limit(1);
      
      return result[0] as TSelect || null;
    }

    async function readMany(filters: TQueryFilters = {}): Promise<TSelect[]> {
      let query = db.select().from(schema) as any;

      if (filters.where) {
        const conditions = Object.entries(filters.where).map(([key, value]) => {
          const column = schema[key as keyof typeof schema] as any;
          return eq(column, value);
        });
        
        if (conditions.length === 1) {
          query = query.where(conditions[0]);
        } else if (conditions.length > 1) {
          query = query.where(and(...conditions));
        }
      }

      if (!filters.includeDeleted && 'deletedAt' in schema) {
        query = query.where(isNull((schema as any).deletedAt));
      }

      if (filters.orderBy && filters.orderField) {
        const orderColumn = schema[filters.orderField as keyof typeof schema] as any;
        if (orderColumn) {
          query = query.orderBy(
            filters.orderBy === 'desc' ? desc(orderColumn) : asc(orderColumn)
          );
        }
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.offset(filters.offset);
      }

      return query;
    }

    async function update(id: number, data: Partial<TInsert>): Promise<TSelect | null> {
      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      const result = await db
        .update(schema)
        .set(updateData)
        .where(eq(schema['id' as keyof TSchema] as any, id))
        .returning();

      return result[0] as TSelect || null;
    }

    async function destroy(id: number): Promise<boolean> {
      const result = await db
        .delete(schema)
        .where(eq(schema['id' as keyof TSchema] as any, id));

      return Array.isArray(result) ? result.length > 0 : result.rowsAffected > 0;
    }

    async function softDelete(id: number): Promise<boolean> {
      if (!('deletedAt' in schema)) {
        throw new Error('Soft delete not supported for this schema');
      }

      const result = await db
        .update(schema)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema['id' as keyof TSchema] as any, id));

      return Array.isArray(result) ? result.length > 0 : result.rowsAffected > 0;
    }

    async function restore(id: number): Promise<boolean> {
      if (!('deletedAt' in schema)) {
        throw new Error('Restore not supported for this schema');
      }

      const result = await db
        .update(schema)
        .set({ deletedAt: null, updatedAt: new Date() })
        .where(eq(schema['id' as keyof TSchema] as any, id));

      return Array.isArray(result) ? result.length > 0 : result.rowsAffected > 0;
    }

    // Alias methods for compatibility
    const findById = read;
    const deleteRecord = destroy;

    const operations: TCrudOperations<TSchema, TInsert, TSelect> = {
      create,
      read,
      findById,
      readMany,
      update,
      destroy,
      delete: deleteRecord,
    };

    if ('deletedAt' in schema) {
      operations.softDelete = softDelete;
      operations.restore = restore;
    }

    return operations;
  };
}

export { createCrudFactory };
export type { TCrudOperations, TQueryFilters };

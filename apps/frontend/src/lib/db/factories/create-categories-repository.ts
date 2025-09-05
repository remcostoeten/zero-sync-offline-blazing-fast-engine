import { eq, and, asc, desc } from 'drizzle-orm';
import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import { categoriesSchema } from '@/lib/db/schema/categories';
import type { 
  TCategory, 
  TCreateCategoryInput, 
  TUpdateCategoryInput, 
  TCategoryFilters 
} from '@/lib/types/categories';

type TCategoriesRepository = {
  create: (input: TCreateCategoryInput) => Promise<TCategory>;
  read: (id: number) => Promise<TCategory | null>;
  update: (id: number, input: Partial<TUpdateCategoryInput>) => Promise<TCategory | null>;
  destroy: (id: number) => Promise<boolean>;
  list: (filters?: TCategoryFilters) => Promise<TCategory[]>;
};

export function createCategoriesRepository(db: LibSQLDatabase<any>): TCategoriesRepository {
  async function create(input: TCreateCategoryInput): Promise<TCategory> {
    const insertData = {
      ...input,
      color: input.color || '#3B82F6',
      icon: input.icon || '💰',
      isDemo: input.isDemo || false,
      synced: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db
      .insert(categoriesSchema)
      .values(insertData)
      .returning();

    return result[0] as TCategory;
  }

  async function read(id: number): Promise<TCategory | null> {
    const result = await db
      .select()
      .from(categoriesSchema)
      .where(eq(categoriesSchema.id, id))
      .limit(1);

    return result[0] as TCategory || null;
  }

  async function update(id: number, input: Partial<TUpdateCategoryInput>): Promise<TCategory | null> {
    const updateData = {
      ...input,
      updatedAt: new Date(),
      synced: false,
    };

    const result = await db
      .update(categoriesSchema)
      .set(updateData)
      .where(eq(categoriesSchema.id, id))
      .returning();

    return result[0] as TCategory || null;
  }

  async function destroy(id: number): Promise<boolean> {
    const result = await db
      .delete(categoriesSchema)
      .where(eq(categoriesSchema.id, id));

    return result.rowsAffected > 0;
  }

  async function list(filters: TCategoryFilters = {}): Promise<TCategory[]> {
    let query = db.select().from(categoriesSchema);

    const conditions = [];

    if (filters.type) {
      conditions.push(eq(categoriesSchema.type, filters.type));
    }

    if (filters.isDemo !== undefined) {
      conditions.push(eq(categoriesSchema.isDemo, filters.isDemo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(asc(categoriesSchema.name));

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.offset(filters.offset);
    }

    const result = await query;
    return result as TCategory[];
  }

  return {
    create,
    read,
    update,
    destroy,
    list,
  };
}

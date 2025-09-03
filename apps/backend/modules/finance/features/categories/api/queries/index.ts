import { createCrudFactory } from '../../../../shared';
import { categoriesSchema, TCategory, TCategoryInsert, TCategorySelect } from '../../../../shared/schemas';

const categoryCrud = createCrudFactory<typeof categoriesSchema, TCategoryInsert, TCategorySelect>(categoriesSchema)();

async function getCategories(filters?: { type?: 'income' | 'expense'; limit?: number; offset?: number }) {
  const queryFilters = {
    where: filters?.type ? { type: filters.type } : undefined,
    limit: filters?.limit,
    offset: filters?.offset,
    orderBy: 'asc' as const,
    orderField: 'name'
  };

  return categoryCrud.readMany(queryFilters);
}

async function getCategoryById(id: number) {
  return categoryCrud.read(id);
}

export { getCategories, getCategoryById };

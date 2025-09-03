import { createCrudFactory } from '../../../../shared';
import { categoriesSchema, TCategoryInsert, TCategorySelect } from '../../../../shared/schemas';

const categoryCrud = createCrudFactory<typeof categoriesSchema, TCategoryInsert, TCategorySelect>(categoriesSchema)();

async function createCategory(data: TCategoryInsert) {
  const categoryData = {
    ...data,
    color: data.color || '#3B82F6',
    icon: data.icon || '💰',
    synced: false
  };

  return categoryCrud.create(categoryData);
}

async function updateCategory(id: number, data: Partial<TCategoryInsert>) {
  return categoryCrud.update(id, data);
}

async function deleteCategory(id: number) {
  return categoryCrud.destroy(id);
}

export { createCategory, updateCategory, deleteCategory };

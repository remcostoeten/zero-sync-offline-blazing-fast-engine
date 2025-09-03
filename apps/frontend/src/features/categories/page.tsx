import { Suspense } from 'react';
import { getCategories } from './actions';
import { CategoryList } from './components/category-list';
import { CategoryForm } from './components/category-form';
import { Button } from '@/components/ui/button';

export default async function CategoriesPage() {
  const categoriesResult = await getCategories();

  if (!categoriesResult.success) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-red-600">
          Error loading categories: {categoriesResult.error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage your transaction categories
          </p>
        </div>
        <Button>Add Category</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CategoryForm />
        </div>
        <div className="lg:col-span-2">
          <Suspense fallback={<div>Loading categories...</div>}>
            <CategoryList categories={categoriesResult.data || []} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

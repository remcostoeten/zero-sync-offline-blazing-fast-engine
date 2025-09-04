import { getCategories } from '@/features/categories/actions';
import { CategoryList } from '@/features/categories/components/CategoryList';

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="container mx-auto py-8 px-4">
      <CategoryList initialCategories={categories} />
    </div>
  );
}

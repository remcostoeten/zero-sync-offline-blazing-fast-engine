import { getBudgets } from '@/features/budgets/actions';
import { BudgetList } from '@/features/budgets/components/BudgetList';

export default async function BudgetsPage() {
  const budgets = await getBudgets();

  return (
    <div className="container mx-auto py-8 px-4">
      <BudgetList initialBudgets={budgets} />
    </div>
  );
}

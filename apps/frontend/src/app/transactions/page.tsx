import { getTransactions } from '@/features/transactions/actions';
import { TransactionList } from '@/features/transactions/components/TransactionList';

export default async function TransactionsPage() {
  const transactions = await getTransactions({ limit: 100 });

  return (
    <div className="container mx-auto py-8 px-4">
      <TransactionList initialTransactions={transactions} />
    </div>
  );
}

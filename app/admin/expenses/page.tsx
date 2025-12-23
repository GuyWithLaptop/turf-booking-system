import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import ExpensesList from '@/components/ExpensesList';

export default async function ExpensesPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <ExpensesList />;
}

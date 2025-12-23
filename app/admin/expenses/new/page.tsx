import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AddExpense from '@/components/AddExpense';

export default async function NewExpensePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return <AddExpense />;
}

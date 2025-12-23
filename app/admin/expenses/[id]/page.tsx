import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import UpdateExpense from '@/components/UpdateExpense';

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const { id } = await params;
  return <UpdateExpense expenseId={id} />;
}

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BudgetsClient } from './BudgetsClient';

export default async function BudgetsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <BudgetsClient />;
}

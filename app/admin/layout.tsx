import DashboardShell from '@/components/dashboard/DashboardShell';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardShell userRole={session.role}>
      {children}
    </DashboardShell>
  );
}

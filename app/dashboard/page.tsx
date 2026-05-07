import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import DashboardLayout from '@/components/DashboardLayout';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) redirect('/');

  const payload = await verifyToken(token);
  if (!payload) redirect('/');

  return <DashboardLayout />;
}

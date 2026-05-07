import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import Header from '@/components/Header';
import OrderForm from '@/components/OrderForm';
import KitchenMonitor from '@/components/KitchenMonitor';

export default async function DashboardPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) redirect('/');

  const payload = await verifyToken(token);
  if (!payload) redirect('/');

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-zinc-950">
      <Header />

      <div className="mt-16 flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Linkes Panel: Bestellformular */}
        <div className="lg:w-[430px] xl:w-[490px] flex-shrink-0 border-r border-zinc-800 overflow-y-auto">
          <OrderForm />
        </div>

        {/* Rechtes Panel: Küchenmonitor */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <KitchenMonitor />
        </div>
      </div>
    </div>
  );
}

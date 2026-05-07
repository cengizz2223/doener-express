import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import LoginForm from '@/components/LoginForm';

export default async function LoginPage() {
  // Wenn bereits eingeloggt → direkt zum Dashboard
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (token) {
    const payload = await verifyToken(token);
    if (payload) redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <LoginForm />
    </main>
  );
}

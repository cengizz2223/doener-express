import { NextResponse } from 'next/server';
import { createToken, getCredentials } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body as { username: string; password: string };

    const credentials = getCredentials();

    if (username !== credentials.username || password !== credentials.password) {
      return NextResponse.json(
        { error: 'Ungültiger Benutzername oder Passwort.' },
        { status: 401 }
      );
    }

    const token = await createToken(username);

    const response = NextResponse.json({ success: true });
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 Stunden
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Serverfehler.' }, { status: 500 });
  }
}

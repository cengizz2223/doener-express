import { NextResponse } from 'next/server';
import { resetStore } from '@/lib/store';

// Dieser Endpunkt wird täglich um 03:30 Uhr (MEZ) automatisch aufgerufen.
// Er kann auch manuell über /api/reset aufgerufen werden.
export async function GET(request: Request) {
  // Sicherheit: Nur Vercel Cron oder manueller Aufruf mit Secret erlaubt
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Im Produktionsmodus nur mit gültigem Secret oder vom Cron-System aufgerufen
  if (
    process.env.NODE_ENV === 'production' &&
    cronSecret &&
    authHeader !== `Bearer ${cronSecret}`
  ) {
    return NextResponse.json({ error: 'Nicht autorisiert.' }, { status: 401 });
  }

  await resetStore();

  const now = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' });
  return NextResponse.json({
    success: true,
    message: `Tagesreset durchgeführt um ${now}`,
  });
}

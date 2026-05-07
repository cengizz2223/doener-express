import { NextResponse } from 'next/server';
import { removeEmployee } from '@/lib/store';

export async function DELETE(
  _request: Request,
  { params }: { params: { name: string } }
) {
  const removed = removeEmployee(decodeURIComponent(params.name));
  if (!removed) {
    return NextResponse.json({ error: 'Mitarbeiter nicht gefunden.' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

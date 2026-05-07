import { NextResponse } from 'next/server';
import { getAllEmployees, addEmployee } from '@/lib/store';

export async function GET() {
  return NextResponse.json(getAllEmployees());
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json() as { name: string };
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name erforderlich.' }, { status: 400 });
    }
    const emp = addEmployee(name);
    if (!emp) {
      return NextResponse.json({ error: 'Mitarbeiter existiert bereits.' }, { status: 409 });
    }
    return NextResponse.json(emp, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }
}

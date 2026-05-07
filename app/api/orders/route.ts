import { NextResponse } from 'next/server';
import { getAllOrders, createOrder, getStats } from '@/lib/store';
import { CreateOrderDto } from '@/types';

export async function GET() {
  const orders = getAllOrders();
  const stats = getStats();
  return NextResponse.json({ orders, stats });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderDto;

    if (!body.items?.length || body.items.every((i) => i.quantity <= 0)) {
      return NextResponse.json(
        { error: 'Mindestens ein Produkt muss ausgewählt sein.' },
        { status: 400 }
      );
    }

    const order = createOrder(body);
    return NextResponse.json(order, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }
}

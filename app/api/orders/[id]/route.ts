import { NextResponse } from 'next/server';
import { updateOrder } from '@/lib/store';
import { UpdateOrderDto } from '@/types';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await request.json()) as UpdateOrderDto;
    const order = updateOrder(params.id, body);

    if (!order) {
      return NextResponse.json(
        { error: 'Bestellung nicht gefunden.' },
        { status: 404 }
      );
    }

    return NextResponse.json(order);
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }
}

// app/api/cancelbooking/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { bookingId } = await req.json();
  
  if (!bookingId) {
    return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELED' },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[CANCEL ERROR]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

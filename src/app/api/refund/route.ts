// app/api/refund/route.ts
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const { bookingId } = await req.json();

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || !booking.stripeSessionId) {
    return NextResponse.json({ error: 'Booking not found or not paid' }, { status: 404 });
  }

  try {
    // Retrieve session to get payment_intent
    const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
    const paymentIntent = session.payment_intent;

    if (!paymentIntent || typeof paymentIntent !== 'string') {
      return NextResponse.json({ error: 'Invalid payment intent' }, { status: 400 });
    }

    // Refund the full amount
    await stripe.refunds.create({
      payment_intent: paymentIntent,
    });

    // Update DB
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'REFUNDED' },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Refund failed:', err.message);
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 });
  }
}

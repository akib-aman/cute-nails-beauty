// app/api/stripe/confirm/route.ts
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil", // Use a specific API version for consistency
});

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { sessionId } = await req.json();

  // 1) Fetch the session securely with your secret key
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  // 2) Only accept it if Stripe says it was paid
  if (session.payment_status !== 'paid') {
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }

  // 3) Use metadata (or the sessionId you saved earlier) to find the booking
  const bookingId = session.metadata?.booking_id;
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'PAID' },
  });

  return new Response(JSON.stringify({ ok: true }));
}

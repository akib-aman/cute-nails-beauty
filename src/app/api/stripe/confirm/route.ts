import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { updateEventSummary } from "@/lib/google-calendar";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
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

  // 3) Find booking using metadata
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    return new Response(JSON.stringify({ ok: false, error: "Missing booking_id in metadata" }), { status: 400 });
  }

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'PAID', stripeSessionId: session.id },
  });

  // 4) Update calendar title if eventId is available
  if (booking.eventId) {
    try {
      await updateEventSummary(booking.eventId, `[PREPAID] ${booking.name}`);
    } catch (err) {
      console.error("Failed to update calendar summary:", err);
      // Optionally: notify admin or log elsewhere
    }
  }

  return new Response(JSON.stringify({ ok: true }));
}

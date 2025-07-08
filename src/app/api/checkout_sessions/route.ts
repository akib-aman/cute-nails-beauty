import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ensure your STRIPE_SECRET_KEY is correctly set in your environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil", // Use a specific API version for consistency
});

export async function POST(req: Request) {
  try {
    // Destructure `customerEmail` directly from the request body
    const { treatments, total, customerEmail, bookingId } = await req.json();
    const headersList = req.headers;
    const origin = headersList.get('origin') ?? '';

    // Use the explicit customerEmail, providing a fallback if needed
    const emailToUse = customerEmail || ''; 

    // Log the email to verify it's being received correctly on the server
    console.log('Email received in POST for Stripe session:', emailToUse);

    const line_items = treatments.map((t: any) => {
      let name = "";
      if (t.parent) {
        name = t.parent + " - "+ t.name;
      } else {
        name = t.name;
      }

      // Ensure price is parsed correctly, handling potential non-numeric input safely
      const price = typeof t.price === 'string'
          ? parseFloat(t.price.replace(/[^\d.]/g, '')) // remove £ or other chars
          : typeof t.price === 'number'
          ? t.price
          : 0;

      return {
        price_data: {
          currency: 'gbp',
          product_data: { name },
          unit_amount: Math.round(price * 100), // Stripe expects amount in pence/cents
        },
        quantity: 1,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?canceled=true`,
      customer_email: customerEmail,
      metadata: { email: customerEmail, booking_id: bookingId }
    });

    // Log the session ID and metadata to confirm what Stripe received
    console.log('Stripe session created:', {
      id: session.id,
      metadataEmail: session.metadata?.email,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Error creating Stripe session:', err); // Log the full error
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json({ message: 'Error: Missing session_id parameter in URL.' }, { status: 400 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.metadata?.email;

    if (!email) {
      return NextResponse.json({ message: 'Error: Email not found in Stripe session metadata. It might have been empty during creation.' }, { status: 400 });
    }

    const appointment = await prisma.booking.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }, // Order by creation date to get the most recent
    });

    if (!appointment) {
      return NextResponse.json({ message: 'No appointment found for this email address in the database.' }, { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error: any) {
    console.error('Stripe session retrieval or Prisma error in GET:', error);
    return NextResponse.json({ message: `Server error during session retrieval or database lookup: ${error.message}` }, { status: 500 });
  }
}

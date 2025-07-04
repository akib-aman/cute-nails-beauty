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

    console.log('Extracted treatments:', treatments);
    console.log('Extracted total:', total);
    console.log('Extracted customerEmail (from body):', customerEmail);
    console.log('Extracted origin:', origin);

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
      const price = typeof t.price === 'string' ? parseFloat(t.price.replace('£', '')) : 0;

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
    // Return a more informative error for missing session ID
    return NextResponse.json({ message: 'Error: Missing session_id parameter in URL.' }, { status: 400 });
  }

  try {
    // Retrieve the Stripe checkout session using the provided ID
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Safely access the email from the session metadata
    const email = session.metadata?.email;

    // Log the email retrieved from metadata for debugging
    console.log('Email retrieved from Stripe session metadata:', email);

    if (!email) {
      // Return a specific message if email is not found in metadata
      return NextResponse.json({ message: 'Error: Email not found in Stripe session metadata. It might have been empty during creation.' }, { status: 400 });
    }

    // Get the most recent appointment by email from your database
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

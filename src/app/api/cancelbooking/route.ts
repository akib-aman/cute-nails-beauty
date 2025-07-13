// app/api/cancelbooking/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { updateEventSummary } from "@/lib/google-calendar";
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

    let refunded = false;

    // If booking was paid with Stripe
    if (booking.stripeSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
        const paymentIntent = session.payment_intent;

        if (!paymentIntent || typeof paymentIntent !== 'string') {
          return NextResponse.json({ error: 'Invalid payment intent' }, { status: 400 });
        }

        await stripe.refunds.create({ payment_intent: paymentIntent });

        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'REFUNDED' },
        });

        refunded = true;
      } catch (err: any) {
        console.error('[REFUND ERROR]', err);
        return NextResponse.json({ error: 'Refund failed' }, { status: 500 });
      }
    } else {
      // If no Stripe session (unpaid booking), just cancel it
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELED' },
      });
    }

    // ✅ Update Google Calendar
    if (booking.eventId) {
      try {
        const label = refunded ? '[REFUNDED]' : '[CANCELED]';
        await updateEventSummary(booking.eventId, `${label} ${booking.name}`);
      } catch (err) {
        console.error("Failed to update calendar summary:", err);
      }
    }

    // ✅ Send confirmation email
    if (booking.email) {
      try {
        const subject = refunded
          ? 'Your appointment has been cancelled and refunded'
          : 'Your appointment has been cancelled';

        const html = `
          <div style="font-family: Arial, sans-serif; color: #333; padding: 16px; max-width: 600px; margin: auto;">
            <h2 style="color: #cf5888;">Hi ${booking.name},</h2>
            <p>Your appointment with <strong>Cute Edinburgh</strong> has been successfully cancelled.</p>

            ${
              refunded
                ? `<p>A full refund has been issued and should appear in your account within <strong>5 to 10 business days</strong>.</p>`
                : ''
            }

            <p>If you have any questions or concerns, please contact us directly at 
              <a href="tel:+447956044691" style="color: #cf5888; text-decoration: none;">+44 7956 044 691</a>.
            </p>

            <p style="margin-bottom: 0;">Warm wishes,</p>
            <p style="margin-top: 4px;">Cute Edinburgh</p>

            <hr style="margin: 24px 0;" />
          </div>
        `;

        await transporter.sendMail({
          from: `"Cute Nails & Beauty" <${process.env.SMTP_USER}>`,
          to: booking.email,
          subject,
          html,
        });
      } catch (emailErr) {
        console.error('Failed to send cancellation email:', emailErr);
      }
    }


    return NextResponse.json({ success: true, refunded });
  } catch (err) {
    console.error('[CANCEL ERROR]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

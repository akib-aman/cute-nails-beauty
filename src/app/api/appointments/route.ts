// app/api/appointments/route.ts

import { NextResponse } from 'next/server';
import { parseISO, addMinutes, isBefore } from 'date-fns';
import { PrismaClient } from '@prisma/client';
import { insertEventToCalendar } from "@/lib/google-calendar"
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

interface BookingPayload {
  name: string;
  email: string;
  phonenumber: string;
  date: string; // ISO from frontend
  treatments: { name: string; price: number; parent?: string }[];
  total: number;
}

// ─────────────────────────────────────────────────────────────────
// Helper: parse a treatment name → duration in minutes
// (reuse your existing logic; assumes TreatmentSections is unchanged)
// ─────────────────────────────────────────────────────────────────
const parseDuration = (treatmentName: string): number => {
  const { TreatmentSections } = require('@/app/api/data');

  for (const section of TreatmentSections) {
    for (const treat of section.treatments) {
      // Match top-level treatment
      if (treat.name === treatmentName) {
        const mins = extractMinutes(treat.time);
        return mins ?? 20;
      }

      // Match child treatments
      if (treat.children) {
        for (const child of treat.children) {
          if (child.name === treatmentName) {
            const mins = extractMinutes(child.name); // name contains "– 30 mins"
            return mins ?? 20;
          }
        }
      }
    }
  }

  return 20; // fallback
};

const extractMinutes = (text: string | undefined): number | null => {
  if (!text) return null;
  const match = text.match(/(\d+)\s*(min|mins)/i);
  return match ? parseInt(match[1], 10) : null;
};

// ─────────────────────────────────────────────────────────────────
// NodeMailer setup (same as before; make sure your env vars exist)
// ─────────────────────────────────────────────────────────────────
let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = (to: string, subject: string, html: string) => {
  return transporter.sendMail({
    from: process.env.BUSINESS_EMAIL!,
    to,
    subject,
    html,
  });
};

// ─────────────────────────────────────────────────────────────────
// Utility: format Date → ICS string (YYYYMMDDTHHMMSSZ)
// ─────────────────────────────────────────────────────────────────
const pad = (n: number) => (n < 10 ? '0' + n : n);
const formatDateForICS = (d: Date) => {
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
};

// ─────────────────────────────────────────────────────────────────
// Build HTML email for client (includes an ICS download link)
// ─────────────────────────────────────────────────────────────────
const createClientEmailBody = (
  name: string,
  start: Date,
  end: Date,
  treatments: { name: string; price: number; parent?: string }[],
  total: number,
  bookingid: string
) => {
  const eventStart = formatDateForICS(start);
  const eventEnd = formatDateForICS(end);
  const treatmentList = treatments
    .map((t) =>
      `<li style="margin-bottom: 4px;">${t.parent ? `<strong>${t.parent}</strong> – ` : ''}${t.name} – £${t.price.toFixed(2)}</li>`
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; color: #333; padding: 16px; max-width: 600px; margin: auto;">
      <h2 style="color: #cf5888;">Hi ${name},</h2>
      <p>Thanks for booking with <strong>Cute Edinburgh</strong>! Here are your appointment details:</p>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Date & Time:</td>
          <td style="padding: 8px;">${start.toLocaleString()} – ${end.toLocaleTimeString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; vertical-align: top;">Treatments:</td>
          <td style="padding: 8px;">
            <ul style="padding-left: 20px; margin: 0;">
              ${treatmentList}
            </ul>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Total:</td>
          <td style="padding: 8px;"><strong>£${total.toFixed(2)}</strong></td>
        </tr>
      </table>

      <p>We can’t wait to see you!</p>
      <p style="margin-bottom: 0;">Warm wishes,</p>
      <p style="margin-top: 4px;">Cute Edinburgh</p>
      <p style="margin-top: 32px; font-size: 14px; color: #666;">
        If you need to cancel or request a refund, please call us directly on 
        <a href="tel:+447956044691" style="color: #cf5888; text-decoration: none;">+44 7956 044 691</a>.
      </p>

      <hr style="margin: 24px 0;" />

      <!-- Hidden VCALENDAR for auto-detection -->
      <div style="display: none; white-space: pre;">
  BEGIN:VCALENDAR
  VERSION:2.0
  BEGIN:VEVENT
  UID:${start.getTime()}@cutesalon.com
  DTSTAMP:${eventStart}
  DTSTART:${eventStart}
  DTEND:${eventEnd}
  SUMMARY:Cute Salon Appointment
  DESCRIPTION:Your appointment at Cute Salon
  END:VEVENT
  END:VCALENDAR
      </div>
    </div>
  `;
};

// ─────────────────────────────────────────────────────────────────
// Build HTML email for manager
// ─────────────────────────────────────────────────────────────────
const createManagerEmailBody = (
  name: string,
  email: string,
  phonenumber: string,
  start: Date,
  end: Date,
  treatments: { name: string; price: number; parent?: string }[],
  total: number,
  bookingid: string
) => {
  const eventStart = formatDateForICS(start);
  const eventEnd = formatDateForICS(end);
  const treatmentList = treatments
    .map((t) =>
      `<li style="margin-bottom: 4px;">${t.parent ? `<strong>${t.parent}</strong> – ` : ''}${t.name} – £${t.price.toFixed(2)}</li>`
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; color: #222; padding: 16px; max-width: 600px; margin: auto;">
      <h2 style="color: #cf5888;">New Booking Received</h2>

      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px; font-weight: bold;">Client:</td>
          <td style="padding: 8px;">${name} (<a href="mailto:${email}" style="color: #0066cc;">${email}</a>)</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Phone:</td>
          <td style="padding: 8px;">${phonenumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Date & Time:</td>
          <td style="padding: 8px;">${start.toLocaleString()} – ${end.toLocaleTimeString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; vertical-align: top;">Treatments:</td>
          <td style="padding: 8px;">
            <ul style="padding-left: 20px; margin: 0;">
              ${treatmentList}
            </ul>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold;">Total:</td>
          <td style="padding: 8px;"><strong>£${total.toFixed(2)}</strong></td>
        </tr>
      </table>

      <p style="margin-top: 24px;">
        <a href="https://cute-nails-beauty.vercel.app/cancel-booking?booking_id=${bookingid}"
          style="background-color: #dc2626; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px;">
          Cancel Appointment
        </a>
      </p>

      <hr style="margin: 24px 0;" />

      <!-- Hidden VCALENDAR block for email parsers -->
      <div style="display: none; white-space: pre;">
BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${start.getTime()}@cute.edinburgh.com
DTSTAMP:${eventStart}
DTSTART:${eventStart}
DTEND:${eventEnd}
SUMMARY:Appointment with ${name}
DESCRIPTION:Booked Treatments:\\n${treatments.map((t) => t.name).join(', ')}
END:VEVENT
END:VCALENDAR
      </div>
    </div>
  `;
};

// ─────────────────────────────────────────────────────────────────
// POST handler: create a new booking
// ─────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    // 1) Clean up old bookings whose end < now
    await prisma.booking.deleteMany({
      where: { end: { lt: new Date() } },
    });

    const { name, email, phonenumber, date, treatments, total } =
      (await req.json()) as BookingPayload;

    if (!name || !email || !date || !phonenumber || !Array.isArray(treatments)) {
      return NextResponse.json(
        { success: false, message: 'All fields required.' },
        { status: 400 }
      );
    }

    // 2) Compute total duration in minutes
    let totalDuration = 0;
    for (const t of treatments) {
      totalDuration += parseDuration(t.name);
    }

    const startDate = parseISO(date);
    const endDate = addMinutes(startDate, totalDuration);

    // 3) Enforce max 3 bookings per email in last 24hrs
    const now = new Date();
    const past24hrs = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentCount = await prisma.booking.count({
      where: {
        email: email,
        start: { gt: past24hrs },
      },
    });

    if (recentCount >= 3) {
      return NextResponse.json(
        {
          success: false,
          message:
            'You already have 3 bookings in the past 24 hours. Please contact us if you need more.',
        },
        { status: 403 }
      );
    }

    // 4) Check for time‐slot conflicts (overlap)
    const conflict = await prisma.booking.findFirst({
      where: {
        AND: [
          { start: { lt: endDate } },
          { end: { gt: startDate } },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        {
          success: false,
          message: 'This time slot is already taken. Please choose another.',
        },
        { status: 409 }
      );
    }

    // 6) Insert into calendar and capture the event ID
    const eventId = await insertEventToCalendar({
      summary: "[UNPAID] " + name,
      description: `Treatments: ${treatments.map(t => t.name).join(', ')}\nTotal: £${total}\nPhone: ${phonenumber}`,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
    });

    // 7) Create booking in DB
    const booking = await prisma.booking.create({
      data: {
        name,
        email,
        phonenumber,
        start: startDate,
        end: endDate,
        treatments,
        total,
        stripeSessionId: '',
        eventId,
        status: 'PENDING',
      },
    });

    // 8) Send confirmation emails
    await Promise.all([
      sendEmail(
        email,
        'Your Appointment Confirmation',
        createClientEmailBody(name, startDate, endDate, treatments, total, booking.id)
      ),
      sendEmail(
        process.env.MANAGER_EMAIL!,
        'New Appointment Booked',
        createManagerEmailBody(
          name,
          email,
          phonenumber,
          startDate,
          endDate,
          treatments,
          total,
          booking.id
        )
      ),
    ]);

    return NextResponse.json({ success: true, booking }); 
  } catch (err) {
    console.error('[POST /api/appointments] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// GET handler: return all upcoming bookings (start/end only)
// ─────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    /* -------------------- 1) single booking path -------------------- */
    if (id) {
      const booking = await prisma.booking.findUnique({ where: { id } });

      if (!booking) {
        return NextResponse.json(
          { message: "Booking not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(booking);   // ✅ send it back
    }

    /* -------------------- 2) existing “all bookings” logic ---------- */
    // (your current cleanup + findMany code)
    await prisma.booking.deleteMany({ where: { end: { lt: new Date() } } });

    await prisma.booking.deleteMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: new Date(Date.now() - 30 * 60 * 1_000) },
      },
    });

    const rows = await prisma.booking.findMany({
      select: { start: true, end: true },
      orderBy: { start: "asc" },
    });

    const result = rows.map((b) => ({
      start: b.start.toISOString(),
      end:   b.end.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/appointments] Error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

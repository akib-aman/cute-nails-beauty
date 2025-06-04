// app/api/appointments/route.ts

import { NextResponse } from 'next/server';
import { parseISO, addMinutes, isBefore } from 'date-fns';
import { PrismaClient } from '@prisma/client';
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
  total: number
) => {
  const eventStart = formatDateForICS(start);
  const eventEnd = formatDateForICS(end);
  const treatmentList = treatments
    .map((t) =>
      `<li>${t.parent ? `${t.parent} – ` : ''}${t.name} – £${t.price.toFixed(2)}</li>`
    )
    .join('');

  return `
    <h2>Hi ${name},</h2>
    <p>Thank you for booking with Cute! Here are your appointment details:</p>
    <ul>
      <li><strong>Date & Time:</strong> ${start.toLocaleString()} – ${end.toLocaleTimeString()}</li>
      <li><strong>Treatments:</strong></li>
      <ul>${treatmentList}</ul>
      <li><b>Total: </b>£${total}</li>
    </ul>
    <p>We look forward to seeing you!</p>
    <p>Cute Edinburgh</p>

    <hr/>

    <!-- ICS link for iOS/Mac to detect as a calendar invite -->
    <a href="data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:${start.getTime()}@cutesalon.com
DTSTAMP:${eventStart}
DTSTART:${eventStart}
DTEND:${eventEnd}
SUMMARY:Cute Salon Appointment
DESCRIPTION:Your appointment at Cute Salon
END:VEVENT
END:VCALENDAR"
      download="appointment.ics"
      style="display:none;">Download Calendar Invite</a>
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
  total: number
) => {
  const eventStart = formatDateForICS(start);
  const eventEnd = formatDateForICS(end);
  const treatmentList = treatments
    .map((t) =>
      `<li>${t.parent ? `${t.parent} – ` : ''}${t.name} – £${t.price.toFixed(2)}</li>`
    )
    .join('');

  return `
    <h2>New Booking Received</h2>
    <p><strong>Client:</strong> ${name} (${email})</p>
    <p><strong>Phone:</strong> ${phonenumber}</p>
    <p><strong>Date & Time:</strong> ${start.toLocaleString()} – ${end.toLocaleTimeString()}</p>
    <p><strong>Treatments:</strong></p>
    <ul>${treatmentList}</ul>
    <ul><b>Total: </b>£${total}</ul>
    <hr/>
    <pre>
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
    </pre>
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

    // 5) Create booking in DB
    await prisma.booking.create({
      data: {
        name,
        email,
        phonenumber,
        start: startDate,
        end: endDate,
        treatments: treatments, // Prisma auto‐serializes array → JSON
        total,
      },
    });

    // 6) Send confirmation emails
    await Promise.all([
      sendEmail(
        email,
        'Your Appointment Confirmation',
        createClientEmailBody(name, startDate, endDate, treatments, total)
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
          total
        )
      ),
    ]);

    return NextResponse.json({ success: true });
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
export async function GET() {
  try {
    // 1) Clean up old bookings whose end < now
    await prisma.booking.deleteMany({
      where: { end: { lt: new Date() } },
    });

    // 2) Fetch all future bookings
    const rows = await prisma.booking.findMany({
      select: { start: true, end: true },
      orderBy: { start: 'asc' },
    });

    // Convert Date → ISO string
    const result = rows.map((b) => ({
      start: b.start.toISOString(),
      end: b.end.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error('[GET /api/appointments] Error:', err);
    return NextResponse.json([], { status: 500 });
  }
}

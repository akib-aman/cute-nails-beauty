// app/api/appointments/route.ts
import { NextResponse } from 'next/server';
import { parseISO, addMinutes, isBefore, isAfter } from 'date-fns';

interface Booking {
  name: string;
  email: string;
  start: string;       // ISO string
  end: string;         // ISO string
  treatments: { name: string; price: number }[];
  total: number;
}

// In-memory booking store
const bookings: Booking[] = [];

/**
 * Helper: parse a treatment name/time combo to minutes.
 * If treatment has no explicit time, default to 15 minutes.
 */
const parseDuration = (treatmentName: string): number => {
  // We need to look up the `"time"` value for this treatmentName in data.tsx
  // data.tsx exports TreatmentSections. We can import that here.
  // But since this file lives under /app/api, using direct import might need a relative path.
  // Simpler: require the data file.
  const { TreatmentSections } = require('@/app/api/data');

  // Search for the treatmentName across all sections
  for (const section of TreatmentSections) {
    for (const treat of section.treatments) {
      // If treat.name matches exactly, and has a `time` field:
      if (treat.name === treatmentName && treat.time) {
        // treat.time might be like "30 mins" or "1 hr" etc.
        const parts = treat.time.match(/(\d+)(?:\s*hr)?(?:\s*(\d+)\s*min)?/);
        if (parts) {
          let total = 0;
          if (parts[1]) {
            // Check if there's "hr" in the string
            if (treat.time.includes('hr')) {
              total += parseInt(parts[1], 10) * 60;
            } else {
              // It's probably minutes
              total += parseInt(parts[1], 10);
            }
          }
          if (parts[2]) {
            total += parseInt(parts[2], 10);
          }
          return total;
        }
      }
      // If treat has children, each child name includes time in name, so skip here.
      if (treat.children) {
        // Find child by exact name
        for (const child of treat.children) {
          if (child.name === treatmentName) {
            // child.name is like "File & Polish - 20 mins" or "Little Princess Minx - 30 mins"
            const childParts = child.name.match(/(\d+)\s*min/);
            if (childParts) {
              return parseInt(childParts[1], 10);
            }
          }
        }
      }
    }
  }
  // If we didn’t find a match, default to 15 minutes
  return 30;
};

/**
 * POST handler: add a new booking
 */
export async function POST(req: Request) {
  try {
    const { name, email, date, treatments, total } = await req.json();

    if (!name || !email || !date || !Array.isArray(treatments)) {
      return NextResponse.json({ success: false, message: 'All fields required.' }, { status: 400 });
    }

    // Compute total duration in minutes:
    let totalDuration = 0;
    for (const t of treatments) {
      totalDuration += parseDuration(t.name);
    }

    // Construct start and end as ISO strings
    const startDate = parseISO(date as string);
    const endDate = addMinutes(startDate, totalDuration);

    // Check booking limit per email (max 3):
    const now = new Date();
    const past24hrs = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const existingByEmail = bookings.filter(
      (b) => b.email === email && parseISO(b.start) > past24hrs
    );

    // Check for time-slot conflicts:
    for (const b of bookings) {
      const existingStart = parseISO(b.start);
      const existingEnd = parseISO(b.end);
      // Conflict if (newStart < existingEnd) AND (existingStart < newEnd)
      if (
        isBefore(startDate, existingEnd) &&
        isBefore(existingStart, endDate)
      ) {
        return NextResponse.json({
          success: false,
          message: 'This time slot is already taken. Please choose another.',
        }, { status: 409 });
      }
    }

    // Save booking
    bookings.push({
      name,
      email,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      treatments,
      total,
    });

    // Send emails (client + manager)
    await Promise.all([
      sendEmail(
        email,
        'Your Appointment Confirmation',
        createClientEmailBody(name, startDate, endDate, treatments, total)
      ),
      sendEmail(
        process.env.MANAGER_EMAIL!,
        'New Appointment Booked',
        createManagerEmailBody(name, email, startDate, endDate, treatments, total)
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

/**
 * GET handler: return all bookings (with start/end)
 */
export async function GET() {
  // Return an array of { start, end }
  const result = bookings.map((b) => ({
    start: b.start,
    end: b.end,
  }));
  return NextResponse.json(result);
}

/**
 * Fake email sender: you’ll need a real SMTP or service like SendGrid.
 * For Netlify, configure the SMTP in environment variables and use e.g. Nodemailer.
 * Below is a skeleton using nodemailer.
 */
import nodemailer from 'nodemailer';

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

/**
 * Create a simple HTML email for the client.
 * Include start/end times in `VEVENT` format so iOS Mail can detect it as a calendar invite.
 */
const createClientEmailBody = (
  name: string,
  start: Date,
  end: Date,
  treatments: { name: string; price: number }[],
  total: number,
) => {
  const eventStart = formatDateForICS(start);
  const eventEnd = formatDateForICS(end);
  const treatmentList = treatments.map((t) => `<li>${t.name} – £${t.price.toFixed(2)}</li>`).join('');

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

    <!-- Include iCal attachment as a pseudo-link for iOS to detect -->
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

/**
 * Create a plain HTML email for the manager.
 * iOS Mail will auto-detect the “BEGIN:VEVENT...” content.
 */
const createManagerEmailBody = (
  name: string,
  email: string,
  start: Date,
  end: Date,
  treatments: { name: string; price: number }[],
  total: number
) => {
  const eventStart = formatDateForICS(start);
  const eventEnd = formatDateForICS(end);
  const treatmentList = treatments.map((t) => `<li>${t.name} – £${t.price.toFixed(2)}</li>`).join('');

  return `
    <h2>New Booking Received</h2>
    <p><strong>Client:</strong> ${name} (${email})</p>
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

/**
 * Format Date object into ICS-compatible string: YYYYMMDDTHHMMSSZ
 */
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

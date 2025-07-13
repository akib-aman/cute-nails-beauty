import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const calendar = google.calendar('v3');

const auth = new JWT({
  email: process.env.GCAL_CLIENT_EMAIL,
  key: process.env.GCAL_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/calendar'],
});

const calendarId = process.env.GCAL_CALENDAR_ID!;

export const insertEventToCalendar = async ({
  summary,
  description,
  startTime,
  endTime,
}: {
  summary: string;
  description: string;
  startTime: string; // ISO string
  endTime: string;
}) => {
  await auth.authorize();

  const event = {
    summary,
    description,
    start: { dateTime: startTime, timeZone: 'Europe/London' },
    end: { dateTime: endTime, timeZone: 'Europe/London' },
  };

  try {
    const res = await calendar.events.insert({
      auth,
      calendarId,
      requestBody: event,
    });

    return res.data.id ?? null; // ✅ Return the Google Calendar Event ID
  } catch (err) {
    console.error('Failed to insert event:', err);
    throw err;
  }
};

export const updateEventSummary = async (
  eventId: string,
  newSummary: string,
  retries = 3
) => {
  await auth.authorize();

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      await calendar.events.patch({
        auth,
        calendarId,
        eventId,
        requestBody: { summary: newSummary },
      });
      return; // ✅ Success
    } catch (err: any) {
      const isRateLimit = err?.code === 403 && err?.errors?.[0]?.reason === 'rateLimitExceeded';
      if (isRateLimit && attempt < retries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.warn(`Rate limit hit. Retrying in ${waitTime / 1000}s...`);
        await new Promise((res) => setTimeout(res, waitTime));
        continue;
      }

      console.error(`Failed to update event summary for ${eventId}:`, err);
      throw err;
    }
  }
};

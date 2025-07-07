import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

const calendar = google.calendar('v3');

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
  // 1) build the JWT client
  const auth = new JWT({
    email:  process.env.GCAL_CLIENT_EMAIL,
    key:    process.env.GCAL_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  // 2) use the real calendarId, not "primary" for service accounts
  const calendarId = 'your‑calendar‑id@group.calendar.google.com';

  // 3) authorise and insert
  await auth.authorize();

  const event = {
    summary,
    description,
    start: { dateTime: startTime, timeZone: 'Europe/London' },
    end:   { dateTime: endTime,   timeZone: 'Europe/London' },
  };

  try {
    return await calendar.events.insert({
      auth,
      calendarId,
      requestBody: event,
    });
  } catch (err) {
    console.error('Failed to insert event:', err);
    throw err;
  }
};

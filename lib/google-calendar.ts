import { google } from "googleapis";
import type { calendar_v3 } from "googleapis";

/**
 * Google Calendar integration utilities
 * Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI in .env
 */

interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

function getGoogleCalendarConfig(): GoogleCalendarConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Google Calendar credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env"
    );
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Create OAuth2 client for Google Calendar
 */
export function createGoogleCalendarClient(accessToken: string) {
  const config = getGoogleCalendarConfig();
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );

  oauth2Client.setCredentials({ access_token: accessToken });
  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * Get authorization URL for Google Calendar OAuth
 */
export function getGoogleCalendarAuthUrl(): string {
  const config = getGoogleCalendarConfig();
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );

  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
}> {
  const config = getGoogleCalendarConfig();
  const oauth2Client = new google.auth.OAuth2(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );

  const { tokens } = await oauth2Client.getToken(code);
  return {
    access_token: tokens.access_token || "",
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
  };
}

/**
 * Sync event to Google Calendar
 */
export async function syncEventToGoogleCalendar(
  accessToken: string,
  event: {
    title: string;
    description?: string;
    start: Date;
    end?: Date;
    location?: string;
  }
): Promise<calendar_v3.Schema$Event> {
  const calendar = createGoogleCalendarClient(accessToken);

  const googleEvent: calendar_v3.Schema$Event = {
    summary: event.title,
    description: event.description,
    start: {
      dateTime: event.start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: (event.end || event.start).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    location: event.location,
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: googleEvent,
  });

  return response.data;
}

/**
 * Update event in Google Calendar
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  event: {
    title?: string;
    description?: string;
    start?: Date;
    end?: Date;
    location?: string;
  }
): Promise<calendar_v3.Schema$Event> {
  const calendar = createGoogleCalendarClient(accessToken);

  // First, get the existing event
  const existingEvent = await calendar.events.get({
    calendarId: "primary",
    eventId: eventId,
  });

  const updatedEvent: calendar_v3.Schema$Event = {
    ...existingEvent.data,
    summary: event.title || existingEvent.data.summary,
    description: event.description ?? existingEvent.data.description,
    location: event.location ?? existingEvent.data.location,
  };

  if (event.start) {
    updatedEvent.start = {
      dateTime: event.start.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  if (event.end) {
    updatedEvent.end = {
      dateTime: event.end.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  const response = await calendar.events.update({
    calendarId: "primary",
    eventId: eventId,
    requestBody: updatedEvent,
  });

  return response.data;
}

/**
 * Delete event from Google Calendar
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const calendar = createGoogleCalendarClient(accessToken);

  await calendar.events.delete({
    calendarId: "primary",
    eventId: eventId,
  });
}

/**
 * List events from Google Calendar
 */
export async function listGoogleCalendarEvents(
  accessToken: string,
  timeMin?: Date,
  timeMax?: Date
): Promise<calendar_v3.Schema$Event[]> {
  const calendar = createGoogleCalendarClient(accessToken);

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin: timeMin?.toISOString(),
    timeMax: timeMax?.toISOString(),
    maxResults: 2500,
    singleEvents: true,
    orderBy: "startTime",
  });

  return response.data.items || [];
}


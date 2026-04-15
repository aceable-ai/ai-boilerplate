import { google } from 'googleapis';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { googleConnections } from '@/db/schema';
import type { GoogleConnection } from '@/db/schema';
import { v4 as uuidv4 } from 'uuid';

// ── OAuth client ───────────────────────────────────────────────────────────────

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env['GOOGLE_CLIENT_ID'],
    process.env['GOOGLE_CLIENT_SECRET'],
    `${process.env['NEXT_PUBLIC_APP_URL']}/api/google/callback`
  );
}

export function getAuthorizationUrl(state: string) {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent', // force refresh token every time
    scope: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
}

// ── Authenticated client from stored connection ────────────────────────────────

export function getAuthenticatedClient(connection: GoogleConnection) {
  const client = createOAuth2Client();
  client.setCredentials({
    access_token: connection.accessToken,
    refresh_token: connection.refreshToken ?? null,
    expiry_date: connection.tokenExpiry?.getTime() ?? null,
  });

  // Persist refreshed tokens back to DB automatically
  client.on('tokens', (tokens) => {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (tokens.access_token) updates['accessToken'] = tokens.access_token;
    if (tokens.expiry_date) updates['tokenExpiry'] = new Date(tokens.expiry_date);

    void db
      .update(googleConnections)
      .set(updates)
      .where(eq(googleConnections.id, connection.id));
  });

  return client;
}

// ── Google user info ───────────────────────────────────────────────────────────

export async function getGoogleUserEmail(
  auth: ReturnType<typeof createOAuth2Client>
): Promise<string | null> {
  const oauth2 = google.oauth2({ version: 'v2', auth });
  const { data } = await oauth2.userinfo.get();
  return data.email ?? null;
}

// ── Drive changes watch ────────────────────────────────────────────────────────

/**
 * Gets the current position in the changes feed.
 * Must be called before registering a watch so we only see changes from now on.
 */
export async function getDriveStartPageToken(
  auth: ReturnType<typeof createOAuth2Client>
): Promise<string> {
  const drive = google.drive({ version: 'v3', auth });
  const { data } = await drive.changes.getStartPageToken();
  if (!data.startPageToken) throw new Error('Could not get Drive start page token');
  return data.startPageToken;
}

/**
 * Registers a push notification channel on the Drive changes feed.
 * Google will POST to webhookUrl whenever something in Drive changes.
 * The channel expires in at most 7 days.
 */
export async function registerDriveWatch(
  auth: ReturnType<typeof createOAuth2Client>,
  pageToken: string,
  webhookUrl: string
): Promise<{ channelId: string; resourceId: string; expiry: Date }> {
  const drive = google.drive({ version: 'v3', auth });
  const channelId = uuidv4();
  const expiryMs = Date.now() + 6 * 24 * 60 * 60 * 1000; // 6 days (renew before 7-day limit)

  const { data } = await drive.changes.watch({
    pageToken,
    requestBody: {
      id: channelId,
      type: 'web_hook',
      address: webhookUrl,
      expiration: expiryMs.toString(),
      token: process.env['WEBHOOK_SECRET'] ?? '', // extra verification header
    },
  });

  if (!data.resourceId) throw new Error('Drive watch registration failed — no resourceId returned');

  return {
    channelId,
    resourceId: data.resourceId,
    expiry: new Date(expiryMs),
  };
}

/**
 * Stops an active Drive watch channel.
 */
export async function stopDriveWatch(
  auth: ReturnType<typeof createOAuth2Client>,
  channelId: string,
  resourceId: string
) {
  const drive = google.drive({ version: 'v3', auth });
  await drive.channels.stop({
    requestBody: { id: channelId, resourceId },
  });
}

// ── Drive change listing ───────────────────────────────────────────────────────

export interface DriveChange {
  fileId: string;
  fileName: string;
  mimeType: string;
  parentFolderIds: string[];
  createdTime: Date;
  removed: boolean;
}

/**
 * Fetches all changes since the stored pageToken.
 * Returns the new pageToken (must be saved back to DB) and the list of changes.
 */
export async function getDriveChanges(
  auth: ReturnType<typeof createOAuth2Client>,
  pageToken: string
): Promise<{ newPageToken: string; changes: DriveChange[] }> {
  const drive = google.drive({ version: 'v3', auth });
  const changes: DriveChange[] = [];
  let currentToken = pageToken;

  // Paginate through all changes
  for (;;) {
    const { data } = await drive.changes.list({
      pageToken: currentToken,
      fields: 'nextPageToken,newStartPageToken,changes(removed,fileId,file(id,name,mimeType,parents,createdTime))',
      includeRemoved: false,
      spaces: 'drive',
    });

    for (const change of data.changes ?? []) {
      if (change.removed || !change.file) continue;
      const file = change.file;
      changes.push({
        fileId: change.fileId ?? file.id ?? '',
        fileName: file.name ?? '',
        mimeType: file.mimeType ?? '',
        parentFolderIds: file.parents ?? [],
        createdTime: file.createdTime ? new Date(file.createdTime) : new Date(),
        removed: false,
      });
    }

    if (data.newStartPageToken) {
      // Last page — this is the new token to store
      return { newPageToken: data.newStartPageToken, changes };
    }

    if (!data.nextPageToken) break;
    currentToken = data.nextPageToken;
  }

  return { newPageToken: currentToken, changes };
}

/**
 * Downloads the plain-text content of a Drive file.
 * Works for .txt and .vtt files. For Google Docs, exports as plain text.
 */
export async function readDriveFileContent(
  auth: ReturnType<typeof createOAuth2Client>,
  fileId: string,
  mimeType: string
): Promise<string> {
  const drive = google.drive({ version: 'v3', auth });

  if (mimeType === 'application/vnd.google-apps.document') {
    // Google Doc — export as plain text
    const { data } = await drive.files.export(
      { fileId, mimeType: 'text/plain' },
      { responseType: 'text' }
    );
    return String(data);
  }

  // Regular file (.txt, .vtt, etc.) — download directly
  const { data } = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'text' }
  );
  return data as string;
}

// ── Calendar event lookup ──────────────────────────────────────────────────────

export interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  end: Date;
  attendeeEmails: string[];
}

/**
 * Searches primary calendar for events within the given time window.
 * Used to find the meeting event that corresponds to a transcript file.
 */
export async function findCalendarEventsNear(
  auth: ReturnType<typeof createOAuth2Client>,
  aroundTime: Date,
  windowHours = 4
): Promise<CalendarEvent[]> {
  const calendar = google.calendar({ version: 'v3', auth });
  const timeMin = new Date(aroundTime.getTime() - windowHours * 60 * 60 * 1000);
  const timeMax = new Date(aroundTime.getTime() + windowHours * 60 * 60 * 1000);

  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    fields: 'items(id,summary,start,end,attendees)',
  });

  return (data.items ?? [])
    .filter((e) => e.start?.dateTime && e.end?.dateTime)
    .map((e) => ({
      id: e.id ?? '',
      summary: e.summary ?? 'Untitled Meeting',
      start: new Date(e.start!.dateTime!),
      end: new Date(e.end!.dateTime!),
      attendeeEmails: (e.attendees ?? [])
        .map((a) => a.email ?? '')
        .filter(Boolean),
    }));
}

/**
 * Picks the best matching calendar event for a transcript file.
 * Tries title matching first, then falls back to the event closest in time.
 */
export function matchEventToFile(
  events: CalendarEvent[],
  fileName: string,
  fileCreatedAt: Date
): CalendarEvent | null {
  if (events.length === 0) return null;

  // Strip common transcript prefixes/suffixes from filename
  const normalizedFileName = fileName
    .replace(/\.(txt|vtt|docx?)$/i, '')
    .replace(/^(transcript|recording|meet|google meet)[:\s-]*/i, '')
    .trim()
    .toLowerCase();

  // Try to find a title match
  const titleMatch = events.find((e) =>
    e.summary.toLowerCase().includes(normalizedFileName) ||
    normalizedFileName.includes(e.summary.toLowerCase())
  );
  if (titleMatch) return titleMatch;

  // Fall back to the event whose start time is closest to the file creation time
  return events.reduce((best, e) => {
    const bestDiff = Math.abs(best.start.getTime() - fileCreatedAt.getTime());
    const thisDiff = Math.abs(e.start.getTime() - fileCreatedAt.getTime());
    return thisDiff < bestDiff ? e : best;
  });
}

// ── Transcript file detection ──────────────────────────────────────────────────

const TRANSCRIPT_MIME_TYPES = new Set([
  'text/plain',
  'text/vtt',
  'application/vnd.google-apps.document',
]);

const TRANSCRIPT_EXTENSIONS = /\.(txt|vtt|docx?)$/i;
const TRANSCRIPT_NAME_HINTS = /transcript|recording|meet/i;

/**
 * Returns true if a Drive file looks like a meeting transcript.
 */
export function isTranscriptFile(fileName: string, mimeType: string): boolean {
  if (!TRANSCRIPT_MIME_TYPES.has(mimeType) && !TRANSCRIPT_EXTENSIONS.test(fileName)) {
    return false;
  }
  // Require some name hint unless it's a .vtt file (always a caption/transcript)
  if (fileName.endsWith('.vtt')) return true;
  return TRANSCRIPT_NAME_HINTS.test(fileName) || TRANSCRIPT_EXTENSIONS.test(fileName);
}

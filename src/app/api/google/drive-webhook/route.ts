/**
 * Receives push notifications from Google Drive.
 *
 * Google sends a POST with these headers (empty body):
 *   X-Goog-Channel-ID     — our channelId (stored in DB)
 *   X-Goog-Resource-State — 'sync' | 'add' | 'update' | 'remove' | 'change'
 *   X-Goog-Channel-Token  — our WEBHOOK_SECRET (for verification)
 *
 * On a 'change' notification:
 *   1. Look up the connection by channelId
 *   2. Fetch Drive changes since stored pageToken
 *   3. Filter for new transcript files in the watched folder
 *   4. For each: read content, find calendar event, score the meeting
 *   5. Save new pageToken
 */
import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import {
  getAuthenticatedClient,
  getDriveChanges,
  getDriveStartPageToken,
  registerDriveWatch,
  stopDriveWatch,
  readDriveFileContent,
  findCalendarEventsNear,
  matchEventToFile,
  isTranscriptFile,
} from '@/lib/google';
import { db } from '@/lib/db';
import { googleConnections } from '@/db/schema';
import type { ScoreMeetingInput } from '@/lib/meeting-scorer';
import { scoreMeeting } from '@/lib/meeting-scorer';

// Renew the watch if it expires within this many hours
const LAZY_RENEWAL_THRESHOLD_HOURS = 36;


export async function POST(request: NextRequest) {
  // Always return 200 immediately — Google retries on non-2xx
  // Processing happens synchronously but we still acknowledge fast

  const channelId = request.headers.get('x-goog-channel-id');
  const resourceState = request.headers.get('x-goog-resource-state');
  const channelToken = request.headers.get('x-goog-channel-token');

  // Verify our secret token
  const expectedToken = process.env['WEBHOOK_SECRET'];
  if (expectedToken && channelToken !== expectedToken) {
    console.warn('[Drive webhook] Invalid channel token — ignoring');
    return new NextResponse(null, { status: 200 });
  }

  // 'sync' is a confirmation ping when the watch is registered — nothing to do
  if (resourceState === 'sync' || !channelId) {
    return new NextResponse(null, { status: 200 });
  }

  if (resourceState !== 'change') {
    return new NextResponse(null, { status: 200 });
  }

  try {
    // Find the connection this channel belongs to
    const [connection] = await db
      .select()
      .from(googleConnections)
      .where(eq(googleConnections.watchChannelId, channelId))
      .limit(1);

    if (!connection?.watchPageToken || !connection.watchedFolderId) {
      console.warn('[Drive webhook] No matching connection for channelId:', channelId);
      return new NextResponse(null, { status: 200 });
    }

    const authClient = getAuthenticatedClient(connection);

    // ── Lazy renewal safety net ─────────────────────────────────────────────
    // If the watch is expiring soon, renew it now while we have the auth client.
    // This runs in the background so it doesn't delay the response.
    if (connection.watchExpiry) {
      const hoursUntilExpiry =
        (connection.watchExpiry.getTime() - Date.now()) / (60 * 60 * 1000);

      if (hoursUntilExpiry < LAZY_RENEWAL_THRESHOLD_HOURS) {
        renewWatchInBackground(authClient, connection).catch((err: unknown) =>
          console.error('[Drive webhook] Background watch renewal failed:', err)
        );
      }
    }

    // Fetch changes since the last stored position
    const { newPageToken, changes } = await getDriveChanges(authClient, connection.watchPageToken);

    // Save the new page token immediately so we don't reprocess on next notification
    await db
      .update(googleConnections)
      .set({ watchPageToken: newPageToken, updatedAt: new Date() })
      .where(eq(googleConnections.id, connection.id));

    // Filter: only new files in the watched folder that look like transcripts
    const transcripts = changes.filter(
      (c) =>
        c.parentFolderIds.includes(connection.watchedFolderId!) &&
        isTranscriptFile(c.fileName, c.mimeType)
    );

    if (transcripts.length === 0) {
      return new NextResponse(null, { status: 200 });
    }

    // Process each transcript
    for (const file of transcripts) {
      try {
        await processTranscript({
          authClient,
          connection,
          fileId: file.fileId,
          fileName: file.fileName,
          mimeType: file.mimeType,
          fileCreatedAt: file.createdTime,
        });
      } catch (err) {
        console.error('[Drive webhook] Failed to process transcript:', file.fileName, err);
        // Continue to next file — don't let one failure block others
      }
    }
  } catch (err) {
    console.error('[Drive webhook] Unexpected error:', err);
  }

  return new NextResponse(null, { status: 200 });
}

interface ProcessTranscriptArgs {
  authClient: ReturnType<typeof getAuthenticatedClient>;
  connection: typeof googleConnections.$inferSelect;
  fileId: string;
  fileName: string;
  mimeType: string;
  fileCreatedAt: Date;
}

async function processTranscript({
  authClient,
  connection,
  fileId,
  fileName,
  mimeType,
  fileCreatedAt,
}: ProcessTranscriptArgs) {
  console.log('[Drive webhook] Processing transcript:', fileName);

  // Read the transcript text
  const transcript = await readDriveFileContent(authClient, fileId, mimeType);

  if (!transcript || transcript.trim().length < 50) {
    console.warn('[Drive webhook] Transcript too short, skipping:', fileName);
    return;
  }

  // Find the matching calendar event for scheduled start/end times
  const events = await findCalendarEventsNear(authClient, fileCreatedAt).catch(() => []);
  const event = matchEventToFile(events, fileName, fileCreatedAt);

  // Derive scheduled times: use calendar event if found, else estimate from file time
  const scheduledStart = event?.start ?? new Date(fileCreatedAt.getTime() - 60 * 60 * 1000);
  const scheduledEnd = event?.end ?? fileCreatedAt;

  // Build participant emails from calendar attendees
  const participantEmails =
    event && event.attendeeEmails.length > 0
      ? event.attendeeEmails.join(', ')
      : undefined;

  const meetingTitle = event?.summary ?? fileName.replace(/\.(txt|vtt|docx?)$/i, '');

  const input: ScoreMeetingInput = {
    userId: connection.userId,
    title: meetingTitle,
    scheduledStart,
    scheduledEnd,
    transcript,
    source: 'drive',
  };
  if (event?.id) input.googleCalendarEventId = event.id;
  if (participantEmails) input.participantEmails = participantEmails;

  const { overallScore, letterGrade } = await scoreMeeting(input);

  console.log(
    `[Drive webhook] Scored "${meetingTitle}": ${overallScore.toFixed(1)}/10 (${letterGrade})`
  );
}

async function renewWatchInBackground(
  authClient: Awaited<ReturnType<typeof getAuthenticatedClient>>,
  connection: typeof googleConnections.$inferSelect
) {
  if (connection.watchChannelId && connection.watchResourceId) {
    await stopDriveWatch(authClient, connection.watchChannelId, connection.watchResourceId).catch(
      () => {}
    );
  }

  const pageToken = await getDriveStartPageToken(authClient);
  const webhookUrl = `${process.env['NEXT_PUBLIC_APP_URL']}/api/google/drive-webhook`;
  const { channelId, resourceId, expiry } = await registerDriveWatch(authClient, pageToken, webhookUrl);

  await db
    .update(googleConnections)
    .set({
      watchChannelId: channelId,
      watchResourceId: resourceId,
      watchPageToken: pageToken,
      watchExpiry: expiry,
      updatedAt: new Date(),
    })
    .where(eq(googleConnections.id, connection.id));

  console.log(`[Drive webhook] Auto-renewed watch for userId=${connection.userId}, expires=${expiry.toISOString()}`);
}

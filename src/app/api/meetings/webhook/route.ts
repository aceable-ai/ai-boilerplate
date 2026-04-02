/**
 * Webhook endpoint for automated meeting scoring.
 * Called by Google Apps Script when a new transcript is saved to Google Drive.
 *
 * Required header: Authorization: Bearer <WEBHOOK_SECRET>
 *
 * Payload:
 * {
 *   title?: string,
 *   scheduledStart: string (ISO 8601),
 *   scheduledEnd: string (ISO 8601),
 *   transcript: string,
 *   participantEmails?: string (comma-separated),
 *   googleCalendarEventId?: string
 * }
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { scoreMeeting } from '@/lib/meeting-scorer';
import type { ScoreMeetingInput } from '@/lib/meeting-scorer';
import { apiSuccess, apiUnauthorized, apiError, withErrorHandling } from '@/lib/ai-response';

const WEBHOOK_USER_ID = 'webhook-service';

const requestSchema = z.object({
  title: z.string().optional(),
  googleCalendarEventId: z.string().optional(),
  scheduledStart: z.string().min(1),
  scheduledEnd: z.string().min(1),
  transcript: z.string().min(50, 'Transcript must be at least 50 characters'),
  participantEmails: z.string().optional(),
});

async function handlePOST(request: NextRequest) {
  const webhookSecret = process.env['WEBHOOK_SECRET'];
  if (!webhookSecret) {
    return apiError('Webhook not configured', 503);
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
    return apiUnauthorized('Invalid webhook secret');
  }

  const body = requestSchema.parse(await request.json());

  const scheduledStart = new Date(body.scheduledStart);
  const scheduledEnd = new Date(body.scheduledEnd);

  const input: ScoreMeetingInput = {
    userId: WEBHOOK_USER_ID,
    scheduledStart,
    scheduledEnd,
    transcript: body.transcript,
    source: 'webhook',
  };
  if (body.title) input.title = body.title;
  if (body.googleCalendarEventId) input.googleCalendarEventId = body.googleCalendarEventId;
  if (body.participantEmails) input.participantEmails = body.participantEmails;

  const { meeting, scores, overallScore, letterGrade } = await scoreMeeting(input);

  return apiSuccess({
    id: meeting.id,
    overallScore,
    letterGrade,
    scores: {
      agenda: scores.agenda.score,
      timing: scores.timing.score,
      decisions: scores.decisions.score,
      actionItems: scores.actionItems.score,
    },
  });
}

export const POST = withErrorHandling(handlePOST);

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { scoreMeeting } from '@/lib/meeting-scorer';
import type { ScoreMeetingInput } from '@/lib/meeting-scorer';
import { apiSuccess, withErrorHandling } from '@/lib/ai-response';

const requestSchema = z.object({
  title: z.string().optional(),
  scheduledStart: z.string().min(1, 'Scheduled start is required'),
  scheduledEnd: z.string().min(1, 'Scheduled end is required'),
  transcript: z.string().min(50, 'Transcript must be at least 50 characters'),
  participantEmails: z.string().optional(),
});

async function handlePOST(request: NextRequest) {
  const body = requestSchema.parse(await request.json());

  const input: ScoreMeetingInput = {
    userId: 'system',
    scheduledStart: new Date(body.scheduledStart),
    scheduledEnd: new Date(body.scheduledEnd),
    transcript: body.transcript,
    source: 'manual',
  };
  if (body.title) input.title = body.title;
  if (body.participantEmails) input.participantEmails = body.participantEmails;

  const { meeting, scores, overallScore, letterGrade } = await scoreMeeting(input);

  return apiSuccess({
    id: meeting.id,
    scores,
    overallScore,
    letterGrade,
    title: body.title,
    scheduledStart: body.scheduledStart,
    scheduledEnd: body.scheduledEnd,
    createdAt: meeting.createdAt,
  });
}

export const POST = withErrorHandling(handlePOST);

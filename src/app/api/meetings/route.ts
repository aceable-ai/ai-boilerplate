import { NextRequest } from 'next/server';
import { desc } from 'drizzle-orm';
import { apiSuccess, withErrorHandling } from '@/lib/ai-response';
import { db } from '@/lib/db';
import { meetings } from '@/db/schema';

async function handleGET(_request: NextRequest) {
  const rows = await db
    .select({
      id: meetings.id,
      title: meetings.title,
      meetingType: meetings.meetingType,
      submitterName: meetings.submitterName,
      scheduledStart: meetings.scheduledStart,
      scheduledEnd: meetings.scheduledEnd,
      source: meetings.source,
      overallScore: meetings.overallScore,
      letterGrade: meetings.letterGrade,
      agendaScore: meetings.agendaScore,
      agendaFeedback: meetings.agendaFeedback,
      timingScore: meetings.timingScore,
      timingFeedback: meetings.timingFeedback,
      decisionsScore: meetings.decisionsScore,
      decisionsFeedback: meetings.decisionsFeedback,
      actionItemsScore: meetings.actionItemsScore,
      actionItemsFeedback: meetings.actionItemsFeedback,
      coachingFeedback: meetings.coachingFeedback,
      excluded: meetings.excluded,
      createdAt: meetings.createdAt,
    })
    .from(meetings)
    .orderBy(desc(meetings.createdAt))
    .limit(200);

  return apiSuccess(rows);
}

export const GET = withErrorHandling(handleGET);

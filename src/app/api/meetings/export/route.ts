import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { meetings } from '@/db/schema';

// Returns all meetings as CSV — suitable for import into Google Sheets or Excel
export async function GET() {
  const rows = await db
    .select({
      id: meetings.id,
      title: meetings.title,
      submitterName: meetings.submitterName,
      scheduledStart: meetings.scheduledStart,
      scheduledEnd: meetings.scheduledEnd,
      overallScore: meetings.overallScore,
      letterGrade: meetings.letterGrade,
      agendaScore: meetings.agendaScore,
      timingScore: meetings.timingScore,
      decisionsScore: meetings.decisionsScore,
      actionItemsScore: meetings.actionItemsScore,
      agendaFeedback: meetings.agendaFeedback,
      timingFeedback: meetings.timingFeedback,
      decisionsFeedback: meetings.decisionsFeedback,
      actionItemsFeedback: meetings.actionItemsFeedback,
      coachingFeedback: meetings.coachingFeedback,
      source: meetings.source,
      createdAt: meetings.createdAt,
    })
    .from(meetings)
    .orderBy(desc(meetings.createdAt));

  const headers = [
    'ID',
    'Title',
    'Submitted By',
    'Scheduled Start',
    'Scheduled End',
    'Overall Score',
    'Grade',
    'Agenda Score',
    'Timing Score',
    'Decisions Score',
    'Action Items Score',
    'Agenda Feedback',
    'Timing Feedback',
    'Decisions Feedback',
    'Action Items Feedback',
    'Coaching Feedback',
    'Source',
    'Created At',
  ];

  function csvCell(value: string | number | boolean | Date | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = value instanceof Date ? value.toISOString() : String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  const csvRows = rows.map((r) =>
    [
      r.id,
      r.title,
      r.submitterName,
      r.scheduledStart.toISOString(),
      r.scheduledEnd.toISOString(),
      r.overallScore?.toFixed(2),
      r.letterGrade,
      r.agendaScore?.toFixed(2),
      r.timingScore?.toFixed(2),
      r.decisionsScore?.toFixed(2),
      r.actionItemsScore?.toFixed(2),
      r.agendaFeedback,
      r.timingFeedback,
      r.decisionsFeedback,
      r.actionItemsFeedback,
      r.coachingFeedback,
      r.source,
      r.createdAt.toISOString(),
    ]
      .map(csvCell)
      .join(',')
  );

  const csv = [headers.join(','), ...csvRows].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="meeting-scores-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

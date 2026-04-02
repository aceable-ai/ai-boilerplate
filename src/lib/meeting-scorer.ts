import { z } from 'zod';
import { generateTypedObject } from '@/lib/ai';
import { db } from '@/lib/db';
import { meetings } from '@/db/schema';
import { Resend } from 'resend';

const resend = new Resend(process.env['RESEND_API_KEY']);

export const scoringResultSchema = z.object({
  agenda: z.object({
    score: z.number().min(0).max(10),
    feedback: z.string(),
  }),
  timing: z.object({
    score: z.number().min(0).max(10),
    feedback: z.string(),
  }),
  decisions: z.object({
    score: z.number().min(0).max(10),
    feedback: z.string(),
  }),
  actionItems: z.object({
    score: z.number().min(0).max(10),
    feedback: z.string(),
  }),
  coachingFeedback: z.string(),
});

export type ScoringResult = z.infer<typeof scoringResultSchema>;

export function getLetterGrade(score: number): string {
  if (score >= 9.7) return 'A+';
  if (score >= 9.3) return 'A';
  if (score >= 9.0) return 'A-';
  if (score >= 8.7) return 'B+';
  if (score >= 8.3) return 'B';
  if (score >= 8.0) return 'B-';
  if (score >= 7.7) return 'C+';
  if (score >= 7.3) return 'C';
  if (score >= 7.0) return 'C-';
  if (score >= 6.0) return 'D';
  return 'F';
}

const SCORING_SYSTEM_PROMPT = `You are an expert meeting effectiveness coach for an education technology company. Analyze meeting transcripts objectively and return specific, evidence-based scores and feedback.

COMPANY VALUES (reference by name in coaching feedback):
1. Help Others Succeed — Enable teammates and students to reach goals; help one another grow.
2. Be Authentic — Transparent; do what you say; express priorities through action.
3. Create Delight — Exceed expectations; positivity and empathy; small actions matter.
4. Seek to Understand — Understand before being understood; listen deeply; synthesize ideas from all teammates regardless of title.
5. Exhibit Grit — Challenges, not problems; creative solutions; persist.
6. Pursue Growth — Curious, innovative, comfortable with discomfort; grow personally, professionally, and as a company.
7. Get Shit Done — Bias towards relentless, impactful action; good decision today beats great decision tomorrow; fail fast.

COMPANY FOCUS: This company strongly prioritizes using AI tools and automation to maximize efficiency and eliminate manual work. In coaching feedback, actively suggest specific AI tools, automations, or workflows that would improve meeting effectiveness, follow-up execution, or decision tracking.

SCORING RUBRIC:

1. Agenda Present (0–10):
   - 9–10: Explicit, structured agenda shared at the start with clear topics
   - 7–8: Agenda present but loosely structured or only partially shared
   - 5–6: General purpose stated but no formal agenda items listed
   - 3–4: Implicit direction but nothing explicitly stated
   - 0–2: No agenda whatsoever

2. Started & Ended On Time (0–10):
   - Look for timestamp cues in the transcript to determine actual start/end.
   - Start scoring: on time or within 2 min = full credit; 3–5 min late = moderate penalty; 5+ min late = significant penalty.
   - End scoring: on time or within 5 min = full credit; 5–10 min over = moderate penalty; 10+ min over = significant penalty.
   - Average start and end scores. If actual times cannot be determined from the transcript, note it and score conservatively (5/10).

3. Impactful Decisions Made (0–10):
   - 9–10: Multiple concrete, meaningful decisions with clear outcomes
   - 7–8: Solid decisions but some lack clarity or impact
   - 5–6: Some decisions but mostly directional or low-stakes
   - 3–4: Many discussions but nothing truly decided
   - 0–2: Pure information sharing; zero decisions or resolutions

4. Action Items & Follow-Up Plan (0–10):
   - 9–10: Every action item has a named owner AND specific deadline; next steps clear
   - 7–8: Most action items have owners and deadlines; follow-up plan present
   - 5–6: Action items exist but some lack owners or deadlines
   - 3–4: Loose mentions of tasks; no accountability structure
   - 0–2: No action items or follow-up discussed

COACHING FEEDBACK GUIDELINES:
- Write 3–5 paragraphs of direct, specific coaching
- Reference concrete moments from the transcript (quote or paraphrase specific lines)
- Connect patterns to the company's values by name
- Suggest 1–2 specific AI tools or automations that would help (e.g., Notion AI for action item capture, Zapier for follow-up reminders, Fireflies for automated summaries)
- End with 2–3 clear, prioritized recommendations for the next meeting
- Tone: direct and constructive — like a trusted coach who embodies "Get Shit Done"`;

function formatDateTime(d: Date): string {
  return d.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export interface ScoreMeetingInput {
  userId?: string;
  submitterName?: string;
  title?: string;
  googleCalendarEventId?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  transcript: string;
  participantEmails?: string;
  source?: string;
}

export async function scoreMeeting(input: ScoreMeetingInput) {
  const {
    submitterName,
    title,
    googleCalendarEventId,
    scheduledStart,
    scheduledEnd,
    transcript,
    participantEmails,
    source = 'manual',
  } = input;

  const scheduledDuration = Math.round(
    (scheduledEnd.getTime() - scheduledStart.getTime()) / 60000
  );

  const prompt = `Analyze this meeting transcript and score it according to the criteria.

SCHEDULED TIMES:
- Scheduled Start: ${formatDateTime(scheduledStart)}
- Scheduled End: ${formatDateTime(scheduledEnd)}
- Scheduled Duration: ${scheduledDuration} minutes

MEETING TRANSCRIPT:
---
${transcript}
---

Score each criterion 0–10 and provide specific, evidence-based feedback quoting or paraphrasing the transcript. Then provide comprehensive coaching feedback.`;

  const result = await generateTypedObject(scoringResultSchema, prompt, SCORING_SYSTEM_PROMPT);

  // Compute weighted score server-side (never trust AI math)
  const overallScore =
    result.agenda.score * 0.1 +
    result.timing.score * 0.1 +
    result.decisions.score * 0.4 +
    result.actionItems.score * 0.4;

  const letterGrade = getLetterGrade(overallScore);

  const inserted = await db
    .insert(meetings)
    .values({
      submitterName: submitterName ?? null,
      title: title ?? null,
      googleCalendarEventId: googleCalendarEventId ?? null,
      scheduledStart,
      scheduledEnd,
      transcript,
      participantEmails: participantEmails ?? null,
      source,
      agendaScore: result.agenda.score,
      agendaFeedback: result.agenda.feedback,
      timingScore: result.timing.score,
      timingFeedback: result.timing.feedback,
      decisionsScore: result.decisions.score,
      decisionsFeedback: result.decisions.feedback,
      actionItemsScore: result.actionItems.score,
      actionItemsFeedback: result.actionItems.feedback,
      overallScore,
      letterGrade,
      coachingFeedback: result.coachingFeedback,
    })
    .returning();

  const meeting = inserted[0]!;

  // Send email notifications if participants provided
  if (participantEmails && process.env['RESEND_API_KEY'] && process.env['EMAIL_FROM']) {
    const recipients = participantEmails
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);

    if (recipients.length > 0) {
      await sendMeetingScoreEmail({
        recipients,
        meetingTitle: title ?? 'Your Meeting',
        scheduledStart,
        overallScore,
        letterGrade,
        agendaScore: result.agenda.score,
        agendaFeedback: result.agenda.feedback,
        timingScore: result.timing.score,
        timingFeedback: result.timing.feedback,
        decisionsScore: result.decisions.score,
        decisionsFeedback: result.decisions.feedback,
        actionItemsScore: result.actionItems.score,
        actionItemsFeedback: result.actionItems.feedback,
        coachingFeedback: result.coachingFeedback,
      }).catch((err: unknown) => {
        console.error('Failed to send meeting score email:', err);
      });
    }
  }

  return { meeting, scores: result, overallScore, letterGrade };
}

interface EmailPayload {
  recipients: string[];
  meetingTitle: string;
  scheduledStart: Date;
  overallScore: number;
  letterGrade: string;
  agendaScore: number;
  agendaFeedback: string;
  timingScore: number;
  timingFeedback: string;
  decisionsScore: number;
  decisionsFeedback: string;
  actionItemsScore: number;
  actionItemsFeedback: string;
  coachingFeedback: string;
}

function scoreBar(score: number): string {
  const filled = Math.round(score);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#16a34a';
  if (grade.startsWith('B')) return '#2563eb';
  if (grade.startsWith('C')) return '#d97706';
  return '#dc2626';
}

async function sendMeetingScoreEmail(payload: EmailPayload) {
  const {
    recipients,
    meetingTitle,
    scheduledStart,
    overallScore,
    letterGrade,
    agendaScore,
    agendaFeedback,
    timingScore,
    timingFeedback,
    decisionsScore,
    decisionsFeedback,
    actionItemsScore,
    actionItemsFeedback,
    coachingFeedback,
  } = payload;

  const dateStr = scheduledStart.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const color = gradeColor(letterGrade);

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:24px;">
  <div style="max-width:600px;margin:0 auto;">

    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Meeting Score</div>
      <div style="font-size:22px;font-weight:700;color:#111827;margin-bottom:4px;">${meetingTitle}</div>
      <div style="font-size:14px;color:#6b7280;margin-bottom:24px;">${dateStr}</div>

      <div style="display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:48px;font-weight:800;color:${color};line-height:1;">${overallScore.toFixed(1)}</div>
          <div style="font-size:14px;color:#9ca3af;">out of 10</div>
        </div>
        <div style="font-size:52px;font-weight:800;color:${color};border:2px solid ${color};border-radius:12px;padding:8px 20px;line-height:1;">${letterGrade}</div>
      </div>
    </div>

    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:24px;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:16px;">Scorecard</div>

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <div style="font-size:13px;font-weight:600;color:#374151;">Agenda Present</div>
            <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">Weight: 10%</div>
            <div style="font-family:monospace;font-size:12px;color:#6b7280;">${scoreBar(agendaScore)}</div>
            <div style="font-size:12px;color:#4b5563;margin-top:6px;">${agendaFeedback}</div>
          </td>
          <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap;vertical-align:top;">
            <span style="font-size:20px;font-weight:700;color:${agendaScore >= 8 ? '#16a34a' : agendaScore >= 6 ? '#d97706' : '#dc2626'};">${agendaScore.toFixed(1)}</span>
            <span style="font-size:12px;color:#9ca3af;">/10</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <div style="font-size:13px;font-weight:600;color:#374151;">Started &amp; Ended On Time</div>
            <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">Weight: 10%</div>
            <div style="font-family:monospace;font-size:12px;color:#6b7280;">${scoreBar(timingScore)}</div>
            <div style="font-size:12px;color:#4b5563;margin-top:6px;">${timingFeedback}</div>
          </td>
          <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap;vertical-align:top;">
            <span style="font-size:20px;font-weight:700;color:${timingScore >= 8 ? '#16a34a' : timingScore >= 6 ? '#d97706' : '#dc2626'};">${timingScore.toFixed(1)}</span>
            <span style="font-size:12px;color:#9ca3af;">/10</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
            <div style="font-size:13px;font-weight:600;color:#374151;">Impactful Decisions Made</div>
            <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">Weight: 40%</div>
            <div style="font-family:monospace;font-size:12px;color:#6b7280;">${scoreBar(decisionsScore)}</div>
            <div style="font-size:12px;color:#4b5563;margin-top:6px;">${decisionsFeedback}</div>
          </td>
          <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap;vertical-align:top;">
            <span style="font-size:20px;font-weight:700;color:${decisionsScore >= 8 ? '#16a34a' : decisionsScore >= 6 ? '#d97706' : '#dc2626'};">${decisionsScore.toFixed(1)}</span>
            <span style="font-size:12px;color:#9ca3af;">/10</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;">
            <div style="font-size:13px;font-weight:600;color:#374151;">Action Items &amp; Follow-Up</div>
            <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">Weight: 40%</div>
            <div style="font-family:monospace;font-size:12px;color:#6b7280;">${scoreBar(actionItemsScore)}</div>
            <div style="font-size:12px;color:#4b5563;margin-top:6px;">${actionItemsFeedback}</div>
          </td>
          <td style="padding:10px 0 10px 16px;text-align:right;white-space:nowrap;vertical-align:top;">
            <span style="font-size:20px;font-weight:700;color:${actionItemsScore >= 8 ? '#16a34a' : actionItemsScore >= 6 ? '#d97706' : '#dc2626'};">${actionItemsScore.toFixed(1)}</span>
            <span style="font-size:12px;color:#9ca3af;">/10</span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:24px;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">Coaching Feedback</div>
      <div style="font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${coachingFeedback}</div>
    </div>

    <div style="text-align:center;font-size:12px;color:#9ca3af;padding:16px 0;">
      Powered by Ace Debrief
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: process.env['EMAIL_FROM']!,
    to: recipients,
    subject: `Meeting Score: ${meetingTitle} — ${letterGrade} (${overallScore.toFixed(1)}/10)`,
    html,
  });
}

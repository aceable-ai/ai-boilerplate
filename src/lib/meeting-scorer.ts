import { z } from 'zod';
import { generateTypedObject } from '@/lib/ai';
import { db } from '@/lib/db';
import { meetings } from '@/db/schema';
import { Resend } from 'resend';

function getResend() { return new Resend(process.env['RESEND_API_KEY'] ?? ''); }

export const scoringResultSchema = z.object({
  meetingType: z.string(),
  agenda: z.object({
    score: z.number().min(1).max(10),
    feedback: z.string(),
  }),
  timing: z.object({
    score: z.number().min(1).max(10),
    feedback: z.string(),
  }),
  decisions: z.object({
    score: z.number().min(1).max(40),
    feedback: z.string(),
  }),
  actionItems: z.object({
    score: z.number().min(1).max(40),
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

MEETING TYPE CLASSIFICATION:
First, classify the meeting. The default is "strategic/decision-making" (e.g., L10s, CBRs, quarterly reviews). Other types: brainstorm, status update, 1:1, kickoff, retrospective. Return the type in the meetingType field. Apply the full strategic standard unless the content clearly indicates otherwise.

SCORING RUBRIC:

1. Agenda Present (1–10, weight 10%):
   - 9–10: Clear agenda with distinct topics shared in advance or stated explicitly at the start
   - 6–8: General purpose or goal stated, but individual topics not enumerated
   - 3–5: Agenda implied by context but never explicitly stated
   - 1–2: No agenda, stated purpose, or framing of any kind
   Note: Do not infer an agenda retroactively from the meeting's content.

2. Started & Ended On Time (1–10, weight 10%):
   - 9–10: Started within 2 min of scheduled time AND ended at or before scheduled end
   - 6–8: Started 3–5 min late OR ran 1–10 min over (not both)
   - 3–5: Started 5+ min late AND/OR ran 10+ min over
   - 1–2: Started significantly late AND ran substantially over scheduled time
   Note: If scheduled times are unavailable, skip this criterion (score 5) and note it. Do not penalize for ending early.

3. Impactful Decisions Made (1–40, weight 40%):
   Step 1 — Identify candidate decisions using strong indicator language:
   "We decided to…", "We're moving forward with…", "The plan is…", "We've agreed to…", "We're committing to…", "The decision is…"
   Disqualify weak language: "We should think about…", "Maybe…", "TBD", "Let's revisit…", discussions that end without resolution.

   Step 2 — Evaluate each decision on four signals:
   - Finality: Is it a resolved commitment, or still open?
   - Scope: Does it affect resources, customers, timelines, budget, headcount, or strategy? (broader = higher weight)
   - Specificity: Is it concrete enough to act on without clarification? (named owners, dates, dollar amounts = high specificity)
   - Reversal cost: Would undoing this require meaningful effort? (contracts, external comms, resource allocation = high cost)

   Step 3 — Apply meeting type calibration:
   - Strategic/decision-making: full standard; missing decisions is a significant gap
   - Brainstorm: score on directional clarity or prioritized options, not final decisions
   - Status update / 1:1: score on whether next steps or commitments were surfaced
   - Kickoff / retrospective: score on key agreements (scope, ownership, process changes)

   Scoring tiers:
   - 36–40: Multiple decisions with strong finality, meaningful scope, and clear specificity
   - 26–35: At least one clear decision with finality; scope may be narrow or specificity partial
   - 14–25: Direction emerged but decisions deferred, qualified, or only process/scheduling decisions made
   - 5–13: No clear decisions; meeting was exploratory or informational with no commitments
   - 1–4: No decisions of any kind; discussion unfocused or entirely unresolved

4. Action Items & Follow-Up Plan (1–40, weight 40%):
   Each action item has three components — score on how completely each is captured:
   - Owner: named individual or specific team responsible
   - Task: specific, described action (not vague "follow up on that")
   - Deadline: explicit date, timeframe, or milestone

   Follow-up plan signals: next meeting scheduled, async check-in planned, stated review point, explicit owner for follow-through.
   Note: Score on content, not format. "Taylor's going to handle the deck by Friday" is a valid action item.

   Scoring tiers:
   - 36–40: All action items have named owners, specific tasks, and deadlines; explicit follow-up plan stated
   - 26–35: Most action items have owners and tasks; deadlines inconsistent; follow-up plan present but vague
   - 14–25: Some action items identified but owners missing or tasks vague; no follow-up plan
   - 5–13: Action items mentioned but not assigned or defined; no follow-up structure
   - 1–4: No action items; meeting ended without next steps

FINAL SCORE: Sum all four raw scores (agenda + timing + decisions + actionItems, max 100), then divide by 10 to get the final score out of 10.

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

First classify the meeting type, then score each criterion (agenda 1–10, timing 1–10, decisions 1–40, actionItems 1–40). Provide specific, evidence-based feedback quoting or paraphrasing the transcript. Then provide comprehensive coaching feedback.`;

  console.log('[scoreMeeting] calling OpenAI...');
  const result = await generateTypedObject(scoringResultSchema, prompt, SCORING_SYSTEM_PROMPT);
  console.log('[scoreMeeting] OpenAI done, inserting into DB...');

  // Compute weighted score server-side (never trust AI math)
  // Raw scores: agenda/timing out of 10, decisions/actionItems out of 40 → total out of 100 → divide by 10
  const overallScore =
    (result.agenda.score + result.timing.score + result.decisions.score + result.actionItems.score) / 10;

  const letterGrade = getLetterGrade(overallScore);

  const inserted = await db
    .insert(meetings)
    .values({
      submitterName: submitterName ?? null,
      title: title ?? null,
      googleCalendarEventId: googleCalendarEventId ?? null,
      meetingType: result.meetingType,
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

function scoreBar(score: number, max: number): string {
  const filled = Math.round((score / max) * 10);
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
            <div style="font-family:monospace;font-size:12px;color:#6b7280;">${scoreBar(agendaScore, 10)}</div>
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
            <div style="font-family:monospace;font-size:12px;color:#6b7280;">${scoreBar(timingScore, 10)}</div>
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
            <div style="font-family:monospace;font-size:12px;color:#6b7280;">${scoreBar(decisionsScore, 40)}</div>
            <div style="font-size:12px;color:#4b5563;margin-top:6px;">${decisionsFeedback}</div>
          </td>
          <td style="padding:10px 0 10px 16px;border-bottom:1px solid #f3f4f6;text-align:right;white-space:nowrap;vertical-align:top;">
            <span style="font-size:20px;font-weight:700;color:${decisionsScore >= 32 ? '#16a34a' : decisionsScore >= 24 ? '#d97706' : '#dc2626'};">${decisionsScore.toFixed(0)}</span>
            <span style="font-size:12px;color:#9ca3af;">/40</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;">
            <div style="font-size:13px;font-weight:600;color:#374151;">Action Items &amp; Follow-Up</div>
            <div style="font-size:11px;color:#9ca3af;margin-bottom:4px;">Weight: 40%</div>
            <div style="font-family:monospace;font-size:12px;color:#6b7280;">${scoreBar(actionItemsScore, 40)}</div>
            <div style="font-size:12px;color:#4b5563;margin-top:6px;">${actionItemsFeedback}</div>
          </td>
          <td style="padding:10px 0 10px 16px;text-align:right;white-space:nowrap;vertical-align:top;">
            <span style="font-size:20px;font-weight:700;color:${actionItemsScore >= 32 ? '#16a34a' : actionItemsScore >= 24 ? '#d97706' : '#dc2626'};">${actionItemsScore.toFixed(0)}</span>
            <span style="font-size:12px;color:#9ca3af;">/40</span>
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

  await getResend().emails.send({
    from: process.env['EMAIL_FROM']!,
    to: recipients,
    subject: `Meeting Score: ${meetingTitle} — ${letterGrade} (${overallScore.toFixed(1)}/10)`,
    html,
  });
}

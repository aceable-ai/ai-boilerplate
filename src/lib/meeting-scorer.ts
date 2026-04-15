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
    score: z.number().min(1).max(10),
    feedback: z.string(),
  }),
  actionItems: z.object({
    score: z.number().min(1).max(10),
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

   STRUCTURED MEETING FORMATS — automatically score 10/10 for agenda if the meeting title or transcript clearly indicates one of these formats, as they have a fixed, well-known agenda by design:
   - L10 / Level 10 (EOS): segue, scorecard, rocks, headlines, to-do review, IDS issues, conclude
   - Quarterly Review / QBR: fixed quarterly business review structure
   - Sprint Review / Sprint Retrospective: fixed Scrum ceremony structure
   - Standup / Daily Scrum: fixed three-question format

   For all other meetings, credit requires explicit agenda language in the transcript. Strong signals (9–10): "Today's agenda is…", "We'll cover…", "First we'll discuss… then…", "Agenda item 1…", numbered or bulleted topics read aloud at the start. Moderate signals (6–8): "The goal of today's meeting is…", "We're here to talk about X and Y", stated meeting purpose with 2+ topics. Weak signals (3–5): topic implied by meeting title only, no explicit framing in transcript.

2. Started & Ended On Time (1–10, weight 10%):
   - 9–10: Started within 2 min of scheduled time AND ended at or before scheduled end
   - 6–8: Started 3–5 min late OR ran 1–10 min over (not both)
   - 3–5: Started 5+ min late AND/OR ran 10+ min over
   - 1–2: Started significantly late AND ran substantially over scheduled time
   Note: If scheduled times are unavailable, skip this criterion (score 5) and note it. Do not penalize for ending early.

3. Impactful Decisions Made (1–10, weight 40%):
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

   L10 / EOS MEETINGS: Use IDS-aware scoring. Each issue that goes through Identify → Discuss → Solve and reaches a clear resolution counts as a decision. "Solve" outcomes with named owners and next steps = strong decisions. Issues "moved to parking lot" or left as "to discuss offline" = not decisions. A well-run L10 that solves 3–5 issues cleanly should score 8–10.

   Scoring tiers (1–10):
   - 9–10: Multiple decisions with strong finality, meaningful scope, and clear specificity
   - 7–8: At least one clear decision with finality; scope may be narrow or specificity partial
   - 4–6: Direction emerged but decisions deferred, qualified, or only process/scheduling decisions made
   - 2–3: No clear decisions; meeting was exploratory or informational with no commitments
   - 1: No decisions of any kind; discussion unfocused or entirely unresolved

4. Action Items (1–10, weight 40%):
   Each action item has three components — score on how completely each is captured:
   - Owner: named individual or specific team responsible
   - Task: specific, described action (not vague "follow up on that")
   - Deadline: explicit date, timeframe, or milestone

   Note: Score on content, not format. "Taylor's going to handle the deck by Friday" is a valid action item.

   L10 / EOS MEETINGS: To-dos created during the meeting are explicit action items — treat each one as well-formed if it has an owner and task (L10s implicitly assume a 7-day deadline). A meeting that creates 5+ clear to-dos with owners should score 8–10.

   Scoring tiers (1–10):
   - 9–10: All action items have named owners, specific tasks, and deadlines
   - 7–8: Most have owners and tasks; deadlines inconsistent
   - 4–6: Some action items identified but owners missing or tasks vague
   - 2–3: Action items mentioned but not assigned or defined
   - 1: No action items at all

FINAL SCORE: All four criteria scored 1–10. Weights: agenda 10%, timing 10%, decisions 40%, action items 40%. Overall = (agenda × 0.1) + (timing × 0.1) + (decisions × 0.4) + (actionItems × 0.4).

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

  const result = await generateTypedObject(scoringResultSchema, prompt, SCORING_SYSTEM_PROMPT);

  // Compute weighted score server-side (never trust AI math)
  // All criteria scored 1–10. Weights: agenda 10%, timing 10%, decisions 40%, actionItems 40%
  const overallScore =
    (result.agenda.score * 0.1) +
    (result.timing.score * 0.1) +
    (result.decisions.score * 0.4) +
    (result.actionItems.score * 0.4);

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
  if (grade.startsWith('A')) return '#229A76';
  if (grade.startsWith('B')) return '#12BDCD';
  if (grade.startsWith('C')) return '#D98D00';
  return '#D42F42';
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
<body style="font-family:'Museo Sans','Gill Sans MT','Trebuchet MS',Arial,sans-serif;background:#F0F4F6;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F6;padding:32px 16px;">
    <tr><td>
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">

        <!-- Header -->
        <tr>
          <td style="background:#12BDCD;border-radius:12px 12px 0 0;padding:24px 32px;">
            <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Ace Debrief</div>
            <div style="font-size:20px;font-weight:700;color:#ffffff;">Meeting Score Report</div>
          </td>
        </tr>

        <!-- Meeting title + overall score -->
        <tr>
          <td style="background:#ffffff;padding:32px;">
            <div style="font-size:22px;font-weight:700;color:#21333F;margin-bottom:4px;">${meetingTitle}</div>
            <div style="font-size:14px;color:#526D7F;margin-bottom:28px;">${dateStr}</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:bottom;">
                  <div style="font-size:56px;font-weight:900;color:${color};line-height:1;">${overallScore.toFixed(1)}</div>
                  <div style="font-size:13px;color:#93A7B4;margin-top:2px;">out of 10</div>
                </td>
                <td style="text-align:right;vertical-align:middle;">
                  <div style="font-size:52px;font-weight:900;color:${color};border:3px solid ${color};border-radius:12px;padding:8px 24px;line-height:1;display:inline-block;">${letterGrade}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="background:#ffffff;padding:0 32px;"><div style="height:1px;background:#ECECEC;"></div></td></tr>

        <!-- Scorecard -->
        <tr>
          <td style="background:#ffffff;padding:24px 32px 32px;">
            <div style="font-size:11px;font-weight:700;color:#93A7B4;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:24px;">Scorecard</div>

            <!-- Agenda -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
              <tr>
                <td>
                  <div style="font-size:14px;font-weight:700;color:#21333F;">Agenda Present</div>
                  <div style="font-size:11px;color:#93A7B4;margin-bottom:6px;">Weight: 10%</div>
                  <div style="font-family:monospace;font-size:13px;color:#12BDCD;">${scoreBar(agendaScore, 10)}</div>
                  <div style="font-size:13px;color:#526D7F;margin-top:8px;line-height:1.6;">${agendaFeedback}</div>
                </td>
                <td style="text-align:right;vertical-align:top;padding-left:16px;white-space:nowrap;">
                  <span style="font-size:22px;font-weight:700;color:${agendaScore >= 8 ? '#229A76' : agendaScore >= 6 ? '#D98D00' : '#D42F42'};">${agendaScore.toFixed(1)}</span>
                  <span style="font-size:12px;color:#93A7B4;">/10</span>
                </td>
              </tr>
            </table>
            <div style="height:1px;background:#F0F4F6;margin:20px 0;"></div>

            <!-- Timing -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
              <tr>
                <td>
                  <div style="font-size:14px;font-weight:700;color:#21333F;">Started &amp; Ended On Time</div>
                  <div style="font-size:11px;color:#93A7B4;margin-bottom:6px;">Weight: 10%</div>
                  <div style="font-family:monospace;font-size:13px;color:#12BDCD;">${scoreBar(timingScore, 10)}</div>
                  <div style="font-size:13px;color:#526D7F;margin-top:8px;line-height:1.6;">${timingFeedback}</div>
                </td>
                <td style="text-align:right;vertical-align:top;padding-left:16px;white-space:nowrap;">
                  <span style="font-size:22px;font-weight:700;color:${timingScore >= 8 ? '#229A76' : timingScore >= 6 ? '#D98D00' : '#D42F42'};">${timingScore.toFixed(1)}</span>
                  <span style="font-size:12px;color:#93A7B4;">/10</span>
                </td>
              </tr>
            </table>
            <div style="height:1px;background:#F0F4F6;margin:20px 0;"></div>

            <!-- Decisions -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
              <tr>
                <td>
                  <div style="font-size:14px;font-weight:700;color:#21333F;">Impactful Decisions Made</div>
                  <div style="font-size:11px;color:#93A7B4;margin-bottom:6px;">Weight: 40%</div>
                  <div style="font-family:monospace;font-size:13px;color:#12BDCD;">${scoreBar(decisionsScore, 10)}</div>
                  <div style="font-size:13px;color:#526D7F;margin-top:8px;line-height:1.6;">${decisionsFeedback}</div>
                </td>
                <td style="text-align:right;vertical-align:top;padding-left:16px;white-space:nowrap;">
                  <span style="font-size:22px;font-weight:700;color:${decisionsScore >= 8 ? '#229A76' : decisionsScore >= 6 ? '#D98D00' : '#D42F42'};">${decisionsScore.toFixed(1)}</span>
                  <span style="font-size:12px;color:#93A7B4;">/10</span>
                </td>
              </tr>
            </table>
            <div style="height:1px;background:#F0F4F6;margin:20px 0;"></div>

            <!-- Action Items -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <div style="font-size:14px;font-weight:700;color:#21333F;">Action Items</div>
                  <div style="font-size:11px;color:#93A7B4;margin-bottom:6px;">Weight: 40%</div>
                  <div style="font-family:monospace;font-size:13px;color:#12BDCD;">${scoreBar(actionItemsScore, 10)}</div>
                  <div style="font-size:13px;color:#526D7F;margin-top:8px;line-height:1.6;">${actionItemsFeedback}</div>
                </td>
                <td style="text-align:right;vertical-align:top;padding-left:16px;white-space:nowrap;">
                  <span style="font-size:22px;font-weight:700;color:${actionItemsScore >= 8 ? '#229A76' : actionItemsScore >= 6 ? '#D98D00' : '#D42F42'};">${actionItemsScore.toFixed(1)}</span>
                  <span style="font-size:12px;color:#93A7B4;">/10</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Coaching Feedback -->
        <tr>
          <td style="background:#21333F;padding:32px;border-radius:0 0 12px 12px;">
            <div style="font-size:11px;font-weight:700;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:16px;">Coaching Feedback</div>
            <div style="font-size:14px;color:rgba(255,255,255,0.88);line-height:1.8;white-space:pre-wrap;">${coachingFeedback}</div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="text-align:center;padding:20px 0;">
            <div style="font-size:12px;color:#93A7B4;">Powered by <span style="color:#12BDCD;font-weight:700;">Ace Debrief</span></div>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await getResend().emails.send({
    from: process.env['EMAIL_FROM']!,
    to: recipients,
    subject: `Meeting Score: ${meetingTitle} — ${letterGrade} (${overallScore.toFixed(1)}/10)`,
    html,
  });
}

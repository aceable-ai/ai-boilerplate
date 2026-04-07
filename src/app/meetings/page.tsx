'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Download, ChevronDown, ChevronUp, Zap, EyeOff, Eye } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

interface CriterionScore {
  score: number;
  feedback: string;
}

interface ScoringResult {
  id: string;
  meetingType?: string;
  scores: {
    agenda: CriterionScore;
    timing: CriterionScore;
    decisions: CriterionScore;
    actionItems: CriterionScore;
  };
  overallScore: number;
  letterGrade: string;
  coachingFeedback: string;
  title?: string;
  scheduledStart: string;
  scheduledEnd: string;
  createdAt: string;
}

interface PastMeeting {
  id: string;
  title: string | null;
  meetingType: string | null;
  submitterName: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  overallScore: number | null;
  letterGrade: string | null;
  agendaScore: number | null;
  agendaFeedback: string | null;
  timingScore: number | null;
  timingFeedback: string | null;
  decisionsScore: number | null;
  decisionsFeedback: string | null;
  actionItemsScore: number | null;
  actionItemsFeedback: string | null;
  coachingFeedback: string | null;
  excluded: boolean;
  source: string;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function scoreColor(score: number) {
  if (score >= 8) return 'text-brand-green';
  if (score >= 6) return 'text-brand-yellow';
  return 'text-brand-red';
}

function scoreBgColor(score: number) {
  if (score >= 8) return 'bg-brand-green';
  if (score >= 6) return 'bg-brand-yellow';
  return 'bg-brand-red';
}

function gradeColor(grade: string) {
  if (grade.startsWith('A')) return 'bg-brand-green';
  if (grade.startsWith('B')) return 'bg-brand-blue';
  if (grade.startsWith('C')) return 'bg-brand-yellow';
  return 'bg-brand-red';
}

function gradeStyle(grade: string) {
  if (grade.startsWith('A')) return 'text-brand-green bg-brand-green-light border-brand-green';
  if (grade.startsWith('B')) return 'text-brand-blue bg-blue-50 border-brand-blue';
  if (grade.startsWith('C')) return 'text-brand-yellow bg-brand-yellow-light border-brand-yellow';
  return 'text-brand-red bg-brand-red-light border-brand-red';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface CategoryResultProps {
  label: string;
  score: number;
  maxScore: number;
  feedback: string;
}

function CategoryResult({ label, score, maxScore, feedback }: CategoryResultProps) {
  const normalizedScore = (score / maxScore) * 10;
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-baseline justify-between mb-3">
        <span className="text-sm font-bold text-gray-900 uppercase tracking-wide">{label}</span>
        <span className={`text-2xl font-extrabold ${scoreColor(normalizedScore)}`}>
          {normalizedScore.toFixed(1)}
          <span className="text-sm font-semibold text-gray-400">/10</span>
        </span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{feedback}</p>
    </div>
  );
}

interface ExpandableMeetingRowProps {
  meeting: PastMeeting;
  onToggleExcluded: (id: string, excluded: boolean) => void;
}

function ExpandableMeetingRow({ meeting, onToggleExcluded }: ExpandableMeetingRowProps) {
  const [expanded, setExpanded] = useState(false);
  const score = meeting.overallScore ?? 0;
  const grade = meeting.letterGrade ?? '—';

  function handleToggleExcluded(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !meeting.excluded;
    fetch(`/api/meetings/${meeting.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ excluded: next }),
    }).then(() => onToggleExcluded(meeting.id, next)).catch(() => undefined);
  }

  return (
    <div className={`border-b border-gray-100 last:border-0 ${meeting.excluded ? 'opacity-40' : ''}`}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {meeting.title ?? 'Untitled Meeting'}
          </div>
          <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
            <span>{formatDate(meeting.scheduledStart)}</span>
            {meeting.meetingType && (
              <>
                <span>·</span>
                <span>{meeting.meetingType}</span>
              </>
            )}
            {meeting.submitterName && (
              <>
                <span>·</span>
                <span>{meeting.submitterName}</span>
              </>
            )}
            {meeting.source === 'webhook' && (
              <>
                <span>·</span>
                <span className="flex items-center gap-0.5 text-blue-500">
                  <Zap className="h-3 w-3" /> auto
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 ml-4 shrink-0">
          {meeting.overallScore !== null && (
            <span className={`text-sm font-semibold ${scoreColor(score)}`}>
              {score.toFixed(1)}/10
            </span>
          )}
          {meeting.letterGrade && (
            <span className={`text-xs font-bold border rounded px-2 py-0.5 ${gradeStyle(grade)}`}>
              {grade}
            </span>
          )}
          <button
            onClick={handleToggleExcluded}
            title={meeting.excluded ? 'Include in stats' : 'Exclude from stats'}
            className="text-gray-300 hover:text-gray-500 transition-colors"
          >
            {meeting.excluded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { label: 'Agenda', weight: '10%', score: meeting.agendaScore, max: 10, feedback: meeting.agendaFeedback },
              { label: 'On Time', weight: '10%', score: meeting.timingScore, max: 10, feedback: meeting.timingFeedback },
              { label: 'Decisions', weight: '40%', score: meeting.decisionsScore, max: 10, feedback: meeting.decisionsFeedback },
              { label: 'Action Items', weight: '40%', score: meeting.actionItemsScore, max: 10, feedback: meeting.actionItemsFeedback },
            ].map(({ label, weight, score: s, max, feedback }) =>
              s !== null ? (
                <div key={label} className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-600">{label}</span>
                    <span className={`text-sm font-bold ${scoreColor(s)}`}>{s.toFixed(1)}/10</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full mb-2">
                    <div className={`h-1.5 rounded-full ${scoreBgColor(s)}`} style={{ width: `${(s / max) * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{feedback}</p>
                  <p className="text-xs text-gray-400 mt-1">{weight} weight</p>
                </div>
              ) : null
            )}
          </div>

          {meeting.coachingFeedback && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-4 w-4 text-brand-teal" />
                <span className="text-xs font-semibold text-gray-700">Coaching Feedback</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{meeting.coachingFeedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

type Tab = 'score' | 'history';

export default function MeetingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('score');

  // Form state
  const [title, setTitle] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [transcript, setTranscript] = useState('');
  const [participantEmails, setParticipantEmails] = useState('');

  // Result state
  const [isScoring, setIsScoring] = useState(false);
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // History
  const [pastMeetings, setPastMeetings] = useState<PastMeeting[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = useCallback(() => {
    setLoadingHistory(true);
    fetch('/api/meetings')
      .then((r) => r.json())
      .then((data: { success: boolean; data: PastMeeting[] }) => {
        if (data.success) setPastMeetings(data.data);
      })
      .catch((_e: unknown) => undefined)
      .finally(() => setLoadingHistory(false));
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setError(null);
    setIsScoring(true);
    setResult(null);

    try {
      const res = await fetch('/api/meetings/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || undefined,
          scheduledStart,
          scheduledEnd,
          transcript,
          participantEmails: participantEmails || undefined,
        }),
      });

      const data = await res.json() as { success: boolean; error?: string; data?: ScoringResult };

      if (!data.success) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setResult(data.data ?? null);
      fetchHistory();
    } catch {
      setError('Failed to score meeting. Please try again.');
    } finally {
      setIsScoring(false);
    }
  }

  function handleToggleExcluded(id: string, excluded: boolean) {
    setPastMeetings((prev) =>
      prev.map((m) => (m.id === id ? { ...m, excluded } : m))
    );
  }

  function handleNewMeeting() {
    setResult(null);
    setTitle('');
    setScheduledStart('');
    setScheduledEnd('');
    setTranscript('');
    setParticipantEmails('');
    setError(null);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Meeting Scorer</h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-powered effectiveness scoring based on agenda, decisions, timing, and follow-through.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/meetings/export"
          className="flex items-center gap-1.5 text-sm text-brand-teal border border-brand-teal-mid rounded-full px-4 py-2 hover:bg-brand-teal-light transition-colors font-semibold"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {(['score', 'history'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? 'border-brand-pink text-brand-pink'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'score' ? 'Score a Meeting' : `History (${pastMeetings.length})`}
          </button>
        ))}
      </div>

      {/* Score Tab */}
      {activeTab === 'score' && (
        <>
          {!result ? (
            <form onSubmit={(e) => { void handleSubmit(e); }} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Meeting Title <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Weekly Product Sync"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
                />
              </div>

              {/* Scheduled times */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Scheduled Start</label>
                  <input
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Scheduled End</label>
                  <input
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
                  />
                </div>
              </div>

              {/* Google Calendar note */}
              <div className="rounded-lg bg-brand-teal-light border border-brand-teal-mid px-4 py-3 text-sm text-brand-teal">
                <strong>Coming soon:</strong> Connect Google Calendar to auto-populate start/end times from your calendar events.
              </div>

              {/* Transcript */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Meeting Transcript</label>
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  required
                  rows={14}
                  placeholder="Paste your full meeting transcript here..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink resize-none font-mono"
                />
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {transcript.length.toLocaleString()} characters
                </div>
              </div>

              {/* Participant emails */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Participant Emails <span className="text-gray-400 font-normal">(optional — score will be emailed to these addresses)</span>
                </label>
                <input
                  type="text"
                  value={participantEmails}
                  onChange={(e) => setParticipantEmails(e.target.value)}
                  placeholder="alice@company.com, bob@company.com"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-brand-red-light border border-brand-red px-4 py-3 text-sm text-brand-red">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isScoring || !scheduledStart || !scheduledEnd || !transcript.trim()}
                className="w-full bg-brand-pink text-white rounded-full py-3 text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isScoring ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing transcript...
                  </span>
                ) : (
                  'Score Meeting'
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Overall score — centered */}
              <div className="bg-white rounded-2xl border border-gray-200 px-6 py-8 text-center">
                {result.title && (
                  <div className="text-sm font-medium text-gray-500 mb-1">{result.title}</div>
                )}
                {result.meetingType && (
                  <div className="text-xs text-blue-600 bg-blue-50 border border-blue-100 rounded-full px-3 py-0.5 inline-block mb-3">{result.meetingType}</div>
                )}
                <div className={`text-7xl font-extrabold leading-none ${scoreColor(result.overallScore)}`}>
                  {result.overallScore.toFixed(1)}
                  <span className="text-3xl font-semibold text-gray-400">/10</span>
                </div>
                <div className="mt-4">
                  <span className={`inline-block text-white text-sm font-bold rounded-full px-5 py-1.5 ${gradeColor(result.letterGrade)}`}>
                    Grade: {result.letterGrade}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-3">{formatDate(result.scheduledStart)}</div>
              </div>

              {/* Criteria breakdown */}
              <div className="space-y-3">
                <CategoryResult
                  label="Agenda Present"
                  score={result.scores.agenda.score}
                  maxScore={10}
                  feedback={result.scores.agenda.feedback}
                />
                <CategoryResult
                  label="Impactful Decisions Made"
                  score={result.scores.decisions.score}
                  maxScore={10}
                  feedback={result.scores.decisions.feedback}
                />
                <CategoryResult
                  label="Started & Ended On Time"
                  score={result.scores.timing.score}
                  maxScore={10}
                  feedback={result.scores.timing.feedback}
                />
                <CategoryResult
                  label="Action Items"
                  score={result.scores.actionItems.score}
                  maxScore={10}
                  feedback={result.scores.actionItems.feedback}
                />
              </div>

              {/* Coaching feedback */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-brand-teal" />
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Coaching Feedback</h2>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {result.coachingFeedback}
                </p>
              </div>

              <button
                onClick={handleNewMeeting}
                className="w-full border-2 border-brand-pink text-brand-pink rounded-full py-3 text-sm font-bold hover:bg-brand-pink-light transition-colors"
              >
                Score Another Meeting
              </button>
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          {loadingHistory ? (
            <div className="text-center py-16 text-sm text-gray-400">Loading meetings...</div>
          ) : pastMeetings.length === 0 ? (
            <div className="text-center py-16 text-sm text-gray-400">
              No meetings scored yet. Score your first meeting to see it here.
            </div>
          ) : (
            <>
              {/* Summary stats — only included meetings */}
              {(() => {
                const statsBase = pastMeetings.filter((m) => !m.excluded);
                return statsBase.length >= 2 ? (
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                      { label: 'Avg Score', value: (statsBase.reduce((s, m) => s + (m.overallScore ?? 0), 0) / statsBase.length).toFixed(1) },
                      { label: 'Avg Agenda', value: (statsBase.reduce((s, m) => s + (m.agendaScore ?? 0), 0) / statsBase.length).toFixed(1) },
                      { label: 'Avg Decisions', value: (statsBase.reduce((s, m) => s + (m.decisionsScore ?? 0), 0) / statsBase.length).toFixed(1) },
                      { label: 'Avg Action Items', value: (statsBase.reduce((s, m) => s + (m.actionItemsScore ?? 0), 0) / statsBase.length).toFixed(1) },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                        <div className="text-xs text-gray-400 mb-1">{label}</div>
                        <div className="text-xl font-bold text-gray-900">
                          {value}<span className="text-xs font-normal text-gray-400">/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Meeting list */}
              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {pastMeetings.map((m) => (
                  <ExpandableMeetingRow key={m.id} meeting={m} onToggleExcluded={handleToggleExcluded} />
                ))}
              </div>

              <div className="flex justify-end mt-4">
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                <a
                  href="/api/meetings/export"
                  className="flex items-center gap-1.5 text-sm text-brand-teal border border-brand-teal-mid rounded-full px-4 py-2 hover:bg-brand-teal-light transition-colors font-semibold"
                >
                  <Download className="h-4 w-4" />
                  Export all as CSV
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

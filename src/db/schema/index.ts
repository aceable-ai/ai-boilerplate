import { pgTable, uuid, text, timestamp, doublePrecision } from 'drizzle-orm/pg-core';

export const meetings = pgTable('meetings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().default('system'),
  submitterName: text('submitter_name'),

  title: text('title'),
  googleCalendarEventId: text('google_calendar_event_id'),
  scheduledStart: timestamp('scheduled_start', { withTimezone: true }).notNull(),
  scheduledEnd: timestamp('scheduled_end', { withTimezone: true }).notNull(),
  transcript: text('transcript').notNull(),
  participantEmails: text('participant_emails'),
  source: text('source').notNull().default('manual'), // 'manual' | 'drive'

  agendaScore: doublePrecision('agenda_score'),
  agendaFeedback: text('agenda_feedback'),
  timingScore: doublePrecision('timing_score'),
  timingFeedback: text('timing_feedback'),
  decisionsScore: doublePrecision('decisions_score'),
  decisionsFeedback: text('decisions_feedback'),
  actionItemsScore: doublePrecision('action_items_score'),
  actionItemsFeedback: text('action_items_feedback'),

  overallScore: doublePrecision('overall_score'),
  letterGrade: text('letter_grade'),
  coachingFeedback: text('coaching_feedback'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;

export const googleConnections = pgTable('google_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull().unique().default('system'),
  googleEmail: text('google_email'),

  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  tokenExpiry: timestamp('token_expiry', { withTimezone: true }),

  watchedFolderId: text('watched_folder_id'),
  watchChannelId: text('watch_channel_id'),
  watchResourceId: text('watch_resource_id'),
  watchPageToken: text('watch_page_token'),
  watchExpiry: timestamp('watch_expiry', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type GoogleConnection = typeof googleConnections.$inferSelect;

/**
 * POST /api/cron/renew-drive-watches
 *
 * Renews all Drive watches that are expiring within 48 hours.
 * Should be called daily by a scheduler (Railway Cron Service).
 *
 * Protected by Authorization: Bearer <CRON_SECRET>
 *
 * Railway cron setup:
 *   Service type: Cron Job
 *   Schedule:     0 10 * * *   (runs daily at 10:00 UTC)
 *   Command:      curl -s -X POST $APP_URL/api/cron/renew-drive-watches \
 *                      -H "Authorization: Bearer $CRON_SECRET"
 */
import { NextRequest } from 'next/server';
import { lte, and, isNotNull, eq } from 'drizzle-orm';
import { getDriveStartPageToken, getAuthenticatedClient, registerDriveWatch, stopDriveWatch } from '@/lib/google';
import { db } from '@/lib/db';
import { googleConnections } from '@/db/schema';
import { apiSuccess, apiUnauthorized, apiError, withErrorHandling } from '@/lib/ai-response';

const RENEW_THRESHOLD_HOURS = 48;

async function handlePOST(request: NextRequest) {
  const cronSecret = process.env['CRON_SECRET'];
  if (!cronSecret) return apiError('CRON_SECRET not configured', 503);

  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return apiUnauthorized('Invalid cron secret');
  }

  const thresholdTime = new Date(Date.now() + RENEW_THRESHOLD_HOURS * 60 * 60 * 1000);

  // Find all connections with an active watch expiring within the threshold
  const expiringConnections = await db
    .select()
    .from(googleConnections)
    .where(
      and(
        isNotNull(googleConnections.watchChannelId),
        lte(googleConnections.watchExpiry, thresholdTime)
      )
    );

  if (expiringConnections.length === 0) {
    return apiSuccess({ renewed: 0, message: 'No watches expiring soon.' });
  }

  const results: Array<{ userId: string; status: string; error?: string }> = [];

  for (const connection of expiringConnections) {
    try {
      const authClient = getAuthenticatedClient(connection);

      // Stop the old watch first (ignore errors — it may already be expired)
      if (connection.watchChannelId && connection.watchResourceId) {
        await stopDriveWatch(authClient, connection.watchChannelId, connection.watchResourceId).catch(
          () => {}
        );
      }

      // Get a fresh page token from the current position in the changes feed
      const pageToken = await getDriveStartPageToken(authClient);

      const webhookUrl = `${process.env['NEXT_PUBLIC_APP_URL']}/api/google/drive-webhook`;
      const { channelId, resourceId, expiry } = await registerDriveWatch(
        authClient,
        pageToken,
        webhookUrl
      );

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

      results.push({ userId: connection.userId, status: 'renewed' });
      console.log(`[Cron] Renewed Drive watch for userId=${connection.userId}, expires=${expiry.toISOString()}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ userId: connection.userId, status: 'failed', error: message });
      console.error(`[Cron] Failed to renew watch for userId=${connection.userId}:`, err);
    }
  }

  return apiSuccess({
    renewed: results.filter((r) => r.status === 'renewed').length,
    failed: results.filter((r) => r.status === 'failed').length,
    results,
  });
}

export const POST = withErrorHandling(handlePOST);

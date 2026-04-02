import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  getAuthenticatedClient,
  registerDriveWatch,
  stopDriveWatch,
  getDriveStartPageToken,
} from '@/lib/google';
import { db } from '@/lib/db';
import { googleConnections } from '@/db/schema';
import { apiSuccess, apiError, withErrorHandling } from '@/lib/ai-response';

const SYSTEM_USER = 'system';

const watchSchema = z.object({
  folderId: z.string().min(1, 'Folder ID is required'),
});

async function handlePOST(request: NextRequest) {
  const body = watchSchema.parse(await request.json());

  const connections = await db.select().from(googleConnections).limit(1);
  const connection = connections[0];

  if (!connection) {
    return apiError('Google account not connected. Connect it in Settings first.', 400);
  }

  const authClient = getAuthenticatedClient(connection);

  if (connection.watchChannelId && connection.watchResourceId) {
    await stopDriveWatch(authClient, connection.watchChannelId, connection.watchResourceId).catch(() => {});
  }

  const pageToken = await getDriveStartPageToken(authClient);
  const webhookUrl = `${process.env['NEXT_PUBLIC_APP_URL']}/api/google/drive-webhook`;
  const { channelId, resourceId, expiry } = await registerDriveWatch(authClient, pageToken, webhookUrl);

  await db.update(googleConnections).set({
    watchedFolderId: body.folderId,
    watchChannelId: channelId,
    watchResourceId: resourceId,
    watchPageToken: pageToken,
    watchExpiry: expiry,
    updatedAt: new Date(),
  });

  return apiSuccess({ watching: true, folderId: body.folderId, expiresAt: expiry.toISOString() });
}

async function handleGET(_request: NextRequest) {
  const connections = await db.select({
    googleEmail: googleConnections.googleEmail,
    watchedFolderId: googleConnections.watchedFolderId,
    watchChannelId: googleConnections.watchChannelId,
    watchExpiry: googleConnections.watchExpiry,
  }).from(googleConnections).limit(1);

  const connection = connections[0];
  if (!connection) return apiSuccess({ connected: false });

  const watchActive = !!connection.watchChannelId &&
    !!connection.watchExpiry &&
    connection.watchExpiry > new Date();

  return apiSuccess({
    connected: true,
    googleEmail: connection.googleEmail,
    watchedFolderId: connection.watchedFolderId,
    watchActive,
    watchExpiresAt: connection.watchExpiry?.toISOString() ?? null,
  });
}

// suppress unused import warning
void SYSTEM_USER;

export const POST = withErrorHandling(handlePOST);
export const GET = withErrorHandling(handleGET);

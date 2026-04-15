import { getAuthenticatedClient, stopDriveWatch } from '@/lib/google';
import { db } from '@/lib/db';
import { googleConnections } from '@/db/schema';
import { apiSuccess, withErrorHandling } from '@/lib/ai-response';

async function handleDELETE() {
  const connections = await db.select().from(googleConnections).limit(1);
  const connection = connections[0];

  if (connection) {
    if (connection.watchChannelId && connection.watchResourceId) {
      const authClient = getAuthenticatedClient(connection);
      await stopDriveWatch(authClient, connection.watchChannelId, connection.watchResourceId).catch((_e: unknown) => undefined);
    }
    await db.delete(googleConnections);
  }

  return apiSuccess({ disconnected: true });
}

export const DELETE = withErrorHandling(handleDELETE);

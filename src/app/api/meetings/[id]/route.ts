import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { apiSuccess, apiNotFound, withErrorHandling } from '@/lib/ai-response';
import { db } from '@/lib/db';
import { meetings } from '@/db/schema';

async function handlePATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json() as { excluded: boolean };

  const updated = await db
    .update(meetings)
    .set({ excluded: body.excluded })
    .where(eq(meetings.id, id))
    .returning({ id: meetings.id });

  if (!updated.length) return apiNotFound('Meeting');

  return apiSuccess({ id, excluded: body.excluded });
}

export const PATCH = withErrorHandling(handlePATCH);

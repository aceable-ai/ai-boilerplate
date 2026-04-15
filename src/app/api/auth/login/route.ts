import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE, SESSION_MAX_AGE, getExpectedToken } from '@/lib/simple-auth';

const bodySchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const body = bodySchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json({ success: false, error: 'Password required' }, { status: 400 });
  }

  const expected = getExpectedToken();
  const submitted = Buffer.from(`${body.data.password}:${process.env['APP_SECRET'] ?? 'ace-debrief-secret'}`).toString('base64');

  if (submitted !== expected) {
    return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return response;
}

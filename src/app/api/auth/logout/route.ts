import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/simple-auth';

export function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}

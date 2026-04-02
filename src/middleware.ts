import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/simple-auth';

// Routes that don't require login
const PUBLIC_PREFIXES = [
  '/login',
  '/api/auth/',
  '/api/google/drive-webhook',
  '/api/meetings/webhook',
  '/api/cron/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes through
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check session cookie
  const session = request.cookies.get(SESSION_COOKIE);
  if (!session?.value) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify the token value matches what the server expects.
  // We compute it here using the same logic as simple-auth.ts,
  // but using only Web-compatible APIs since middleware runs on the Edge.
  const password = process.env['APP_PASSWORD'] ?? '';
  const secret = process.env['APP_SECRET'] ?? 'ace-debrief-secret';
  const expected = btoa(`${password}:${secret}`);

  if (session.value !== expected) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

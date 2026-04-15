import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/google';

export function GET(_request: NextRequest) {
  const state = Buffer.from(JSON.stringify({ ts: Date.now() })).toString('base64url');
  const url = getAuthorizationUrl(state);
  return NextResponse.redirect(url);
}

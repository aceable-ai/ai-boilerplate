import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForTokens,
  createOAuth2Client,
  getGoogleUserEmail,
  getDriveStartPageToken,
} from '@/lib/google';
import { db } from '@/lib/db';
import { googleConnections } from '@/db/schema';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? '';

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/settings?error=google_auth_failed`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    if (!tokens.access_token) {
      return NextResponse.redirect(`${appUrl}/settings?error=no_access_token`);
    }

    const client = createOAuth2Client();
    client.setCredentials(tokens);
    const googleEmail = await getGoogleUserEmail(client);
    const pageToken = await getDriveStartPageToken(client);

    // Store as the single global Google connection
    await db
      .insert(googleConnections)
      .values({
        userId: 'system',
        googleEmail,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        watchPageToken: pageToken,
      })
      .onConflictDoUpdate({
        target: googleConnections.userId,
        set: {
          googleEmail,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? null,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          watchPageToken: pageToken,
          watchChannelId: null,
          watchResourceId: null,
          watchExpiry: null,
          updatedAt: new Date(),
        },
      });

    return NextResponse.redirect(`${appUrl}/settings?connected=true`);
  } catch (err) {
    console.error('[Google OAuth callback error]', err);
    return NextResponse.redirect(`${appUrl}/settings?error=oauth_failed`);
  }
}

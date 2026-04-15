export const SESSION_COOKIE = 'ace_debrief_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Returns the expected session token value.
 * Computed from APP_PASSWORD + APP_SECRET so the actual password
 * is never stored directly in the cookie.
 */
export function getExpectedToken(): string {
  const password = process.env['APP_PASSWORD'] ?? '';
  const secret = process.env['APP_SECRET'] ?? 'ace-debrief-secret';
  return Buffer.from(`${password}:${secret}`).toString('base64');
}

export function isValidToken(token: string): boolean {
  return token === getExpectedToken();
}

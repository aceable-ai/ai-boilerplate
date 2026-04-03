import type { NextConfig } from 'next';
import path from 'path';

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Note: no `preload` — that submits to the browser preload list and is very hard to undo.
  // Note: no CSP — the default Next.js + Clerk setup requires third-party origins; add a
  //       tailored CSP per-project once you know your full domain surface.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains',
  },
];

const nextConfig: NextConfig = {
  // Prevent Next.js from inferring a parent directory as workspace root
  // when this project lives inside a monorepo or nested git structure.
  outputFileTracingRoot: path.join(__dirname),

  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;

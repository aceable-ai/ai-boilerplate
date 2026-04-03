import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: !!process.env['DATABASE_URL'],
      OPENAI_API_KEY: !!process.env['OPENAI_API_KEY'],
      NODE_ENV: process.env.NODE_ENV,
    },
  });
}

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const databaseUrl = process.env['DATABASE_URL'] ?? '';

if (!databaseUrl) {
  console.warn('DATABASE_URL environment variable is not set. Database operations will fail at runtime.');
}

const sql = neon(databaseUrl || 'postgresql://placeholder:placeholder@localhost/placeholder');

export const db = drizzle(sql);

export default db;

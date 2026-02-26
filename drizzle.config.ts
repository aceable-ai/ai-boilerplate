import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Load environment variables from .env.development.local
config({ path: '.env.development.local' });

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
});
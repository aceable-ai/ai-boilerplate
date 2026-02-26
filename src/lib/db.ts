import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

// During build time, DATABASE_URL might not be available
// We'll create a placeholder connection that will fail at runtime if used without proper env
const databaseUrl = process.env['DATABASE_URL'] ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

if (!process.env['DATABASE_URL'] && process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
  console.warn('DATABASE_URL environment variable is not set. Database operations will fail at runtime.');
}

// Configure WebSocket for Node.js environment
// This is required for neon-serverless to work with transactions
neonConfig.webSocketConstructor = ws;

// Create connection pool
const pool = new Pool({ connectionString: databaseUrl });

// Create Drizzle instance with serverless adapter (supports transactions)
export const db = drizzle({ client: pool });

// Export the pool for advanced use cases
export { pool };

export default db;
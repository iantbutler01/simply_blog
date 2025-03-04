import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure pool with recommended settings for Neon
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Use single connection for serverless
  connectionTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized: true // Required for Neon's SSL
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema });
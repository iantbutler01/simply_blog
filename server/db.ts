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

// Add error handling for database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

// Handle idle connection termination gracefully
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit process, just log the error
  // The pool will automatically create new connections as needed
});

// Test database connection
pool.connect().then(() => {
  console.log('Successfully connected to PostgreSQL database');
}).catch((err) => {
  console.error('Failed to connect to PostgreSQL database:', err);
  // Don't exit process, let the application continue
  // The pool will retry connections automatically
});

export const db = drizzle({ client: pool, schema });
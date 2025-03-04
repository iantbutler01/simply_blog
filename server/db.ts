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
  max: 5, // Further reduce max connections
  idleTimeoutMillis: 0, // Disable idle timeout as Neon handles this
  connectionTimeoutMillis: 5000, // Give more time for initial connection
  keepAlive: true, // Enable TCP keepalive
  ssl: {
    rejectUnauthorized: true // Required for Neon's SSL
  }
});

// Add reconnection logic with exponential backoff
let retries = 5;
const connectWithRetry = async () => {
  while (retries) {
    try {
      await pool.connect();
      console.log('Successfully connected to PostgreSQL database');
      retries = 5; // Reset retries on successful connection
      return;
    } catch (err) {
      retries--;
      console.error(`Database connection attempt failed. ${retries} retries left:`, err);
      if (!retries) {
        console.error('Max retries reached. Continuing with reduced functionality.');
        break;
      }
      // Exponential backoff between retries
      const delay = Math.min(1000 * (5 - retries), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Handle connection errors and lost connections
pool.on('error', async (err) => {
  console.error('Unexpected error on database connection:', err);
  if (err.message.includes('Connection terminated') || err.code === '57P01') {
    console.log('Connection lost. Attempting to reconnect...');
    retries = 5; // Reset retries for new reconnection attempt
    await connectWithRetry();
  }
});

// Initial connection
connectWithRetry().catch(console.error);

export const db = drizzle({ client: pool, schema });
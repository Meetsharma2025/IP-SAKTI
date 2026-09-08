import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzlePg, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Smart database connection:
// - Vercel/serverless: uses @neondatabase/serverless (HTTP, no persistent connection)
// - Local dev: uses pg Pool (persistent TCP connection)
// Both are lazy-initialized — no crash at build time.

const globalForDb = globalThis as typeof globalThis & {
  __ipSaktiDb?: NodePgDatabase;
  __ipSaktiPool?: Pool;
};

function isServerless(): boolean {
  return !!(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function isLocalhost(url: string): boolean {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

function getDb(): NodePgDatabase {
  if (globalForDb.__ipSaktiDb) return globalForDb.__ipSaktiDb;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL environment variable is required. " +
      "Set it in Vercel project settings or .env file."
    );
  }

  let instance: NodePgDatabase;

  if (isServerless() && !isLocalhost(url)) {
    // Vercel serverless — use Neon HTTP driver (no TCP connection needed)
    const client = neon(url);
    instance = drizzleNeon(client) as unknown as NodePgDatabase;
  } else {
    // Local dev or non-serverless — use pg Pool
    if (!globalForDb.__ipSaktiPool) {
      globalForDb.__ipSaktiPool = new Pool({
        connectionString: url,
        ssl: isLocalhost(url) ? false : { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
    }
    instance = drizzlePg(globalForDb.__ipSaktiPool);
  }

  globalForDb.__ipSaktiDb = instance;
  return instance;
}

// Lazy proxy — db is only created when actually accessed at runtime
export const db: NodePgDatabase = new Proxy({} as NodePgDatabase, {
  get(_, prop: string | symbol) {
    const d = getDb();
    const val = (d as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(d) : val;
  },
});

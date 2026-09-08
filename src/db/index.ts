import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Simple, reliable database connection that works everywhere:
// - Local dev (no SSL)
// - Vercel + Neon (SSL)
// - Vercel + Supabase (SSL)
// Lazy-initialized — no crash at build time.

const globalForDb = globalThis as typeof globalThis & {
  __db?: NodePgDatabase;
  __pool?: Pool;
};

function createDb(): NodePgDatabase {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");

  if (!globalForDb.__pool) {
    globalForDb.__pool = new Pool({
      connectionString: url,
      ssl: isLocal ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 20000,
      connectionTimeoutMillis: 10000,
    });
  }

  if (!globalForDb.__db) {
    globalForDb.__db = drizzle(globalForDb.__pool);
  }

  return globalForDb.__db;
}

// Lazy proxy — only connects when first accessed at runtime
export const db: NodePgDatabase = new Proxy({} as NodePgDatabase, {
  get(_, prop: string | symbol) {
    const d = createDb();
    const val = (d as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(d) : val;
  },
});

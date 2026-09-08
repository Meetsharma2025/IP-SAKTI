import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Lazy initialization — pool and db created on first use, not at import time.
// This prevents build-time crashes on Vercel when DATABASE_URL isn't available
// during static page generation.

const globalForDb = globalThis as typeof globalThis & {
  __ipSaktiPool?: Pool;
  __ipSaktiDb?: NodePgDatabase;
};

function createPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL environment variable is required. " +
        "Set it in your Vercel project settings or .env file."
    );
  }

  const isLocalhost =
    databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

  return new Pool({
    connectionString: databaseUrl,
    ssl: isLocalhost ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

function getPool(): Pool {
  if (!globalForDb.__ipSaktiPool) {
    globalForDb.__ipSaktiPool = createPool();
  }
  return globalForDb.__ipSaktiPool;
}

function getDb(): NodePgDatabase {
  if (!globalForDb.__ipSaktiDb) {
    globalForDb.__ipSaktiDb = drizzle(getPool());
  }
  return globalForDb.__ipSaktiDb;
}

// Lazy proxies — accessing any property triggers creation
export const pool: Pool = new Proxy({} as Pool, {
  get(_, prop: string | symbol) {
    const p = getPool();
    const val = (p as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(p) : val;
  },
});

export const db: NodePgDatabase = new Proxy({} as NodePgDatabase, {
  get(_, prop: string | symbol) {
    const d = getDb();
    const val = (d as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === "function" ? val.bind(d) : val;
  },
});

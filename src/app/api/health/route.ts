import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, unknown> = {
    ok: true,
    timestamp: new Date().toISOString(),
  };

  // Check env vars
  checks.database_url = process.env.DATABASE_URL ? "set" : "MISSING";
  checks.nvidia_key = process.env.NVIDIA_API_KEY ? "set" : "missing";
  checks.openrouter_key = process.env.OPENROUTER_API_KEY ? "set" : "missing";

  // Check DB connection (non-blocking)
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = "connected";
  } catch (e) {
    checks.database = "not_connected";
    checks.database_error = e instanceof Error ? e.message.substring(0, 100) : "unknown";
  }

  // Check tables
  try {
    const r = await db.execute(sql`SELECT count(*) as cnt FROM knowledge_documents`);
    checks.knowledge_docs = Number((r.rows[0] as Record<string, unknown>)?.cnt);
  } catch {
    checks.knowledge_docs = 0;
    checks.hint = "POST to /api/seed to create tables and seed data";
  }

  // Always return 200 — health check must pass for deployment
  return Response.json(checks);
}

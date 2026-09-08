import { NextRequest, NextResponse } from "next/server";
import { orchestrateQuery } from "@/lib/agents";
import { db } from "@/db";
import { conversations, messages, auditLog } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, jurisdiction = "india", sessionId, language = "en" } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Try DB operations but don't fail if DB isn't ready
    let dbReady = false;
    try {
      await db.execute(sql`SELECT 1`);
      dbReady = true;
    } catch (dbErr) {
      console.warn("DB not ready, continuing without persistence:", dbErr);
    }

    if (dbReady) {
      try {
        const sid = sessionId || `session_${Date.now()}`;
        let conversationId: number | null = null;

        if (sessionId) {
          const existing = await db.select().from(conversations)
            .where(eq(conversations.sessionId, sessionId)).limit(1);
          conversationId = existing.length > 0 ? existing[0].id : null;
        }

        if (!conversationId) {
          const ins = await db.insert(conversations)
            .values({ sessionId: sid, jurisdiction, language })
            .returning({ id: conversations.id });
          conversationId = ins[0].id;
        }

        await db.insert(messages).values({
          conversationId, role: "user", content: query.trim(),
        });
      } catch (e) {
        console.warn("DB write failed, continuing:", e);
      }
    }

    // Run AI — this is the core functionality
    const result = await orchestrateQuery(query.trim(), jurisdiction, language);

    // Try to save response to DB
    if (dbReady) {
      try {
        await db.insert(auditLog).values({
          action: "chat_query",
          details: { query: query.trim().substring(0, 200), jurisdiction, language },
        });
      } catch { /* non-critical */ }
    }

    const uniqueCitations = [...new Set(result.agentResults.flatMap(a => a.citations))]
      .map(c => ({
        citation: c, title: c.split(";")[0].trim(),
        sourceUrl: null as string | null, relevance: "High", authorityLevel: "primary",
      }));

    return NextResponse.json({
      answer: result.answer,
      citations: uniqueCitations,
      confidence: result.overallConfidence,
      confidenceBreakdown: result.confidenceBreakdown,
      jurisdiction,
      disclaimer: "⚠️ This is informational guidance only, NOT legal advice.",
      suggestEscalation: result.suggestEscalation,
      escalationReason: result.escalationReason,
      reasoning: result.reasoning,
      model: "nemotron-3-ultra-multi-agent",
      retrievedDocs: result.docsRetrieved,
      agentTrace: result.agentResults.map(a => ({
        name: a.agentName, confidence: a.confidence, uncertainties: a.uncertainties,
      })),
      uncertainties: result.uncertainties,
      contradictions: result.contradictions,
    });
  } catch (error) {
    console.error("Chat error:", error);
    // Return a helpful error with details
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      error: "An error occurred processing your query.",
      details: errMsg.substring(0, 200),
      hint: errMsg.includes("DATABASE_URL") ? "DATABASE_URL env var is missing or invalid"
        : errMsg.includes("NVIDIA") || errMsg.includes("OPENROUTER") ? "AI API key is missing — set NVIDIA_API_KEY or OPENROUTER_API_KEY"
        : errMsg.includes("relation") || errMsg.includes("does not exist") ? "Database tables not created yet — visit /api/seed first"
        : "Check Vercel function logs for details",
    }, { status: 500 });
  }
}

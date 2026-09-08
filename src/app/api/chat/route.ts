import { NextRequest, NextResponse } from "next/server";
import { orchestrateQuery } from "@/lib/agents";
import { db } from "@/db";
import { conversations, messages, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, jurisdiction = "india", sessionId, language = "en" } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const sid = sessionId || `session_${Date.now()}`;

    let conversationId: number;
    if (sessionId) {
      const existing = await db.select().from(conversations)
        .where(eq(conversations.sessionId, sessionId)).limit(1);
      if (existing.length > 0) {
        conversationId = existing[0].id;
      } else {
        const ins = await db.insert(conversations)
          .values({ sessionId: sid, jurisdiction, language })
          .returning({ id: conversations.id });
        conversationId = ins[0].id;
      }
    } else {
      const ins = await db.insert(conversations)
        .values({ sessionId: sid, jurisdiction, language })
        .returning({ id: conversations.id });
      conversationId = ins[0].id;
    }

    await db.insert(messages).values({ conversationId, role: "user", content: query.trim() });
    await db.insert(auditLog).values({
      sessionId: sid, action: "chat_query",
      details: { query: query.trim(), jurisdiction, language },
    });

    const result = await orchestrateQuery(query.trim(), jurisdiction, language);

    await db.insert(messages).values({
      conversationId, role: "assistant", content: result.answer,
      confidence: result.overallConfidence,
      agentTrace: {
        agents: result.agentResults.map(a => ({
          name: a.agentName, confidence: a.confidence,
          uncertainties: a.uncertainties, requiresEscalation: a.requiresEscalation,
        })),
        confidenceBreakdown: result.confidenceBreakdown,
        uncertainties: result.uncertainties,
      },
    });

    const uniqueCitations = [...new Set(result.agentResults.flatMap(a => a.citations))]
      .map(c => ({ citation: c, title: c.split(";")[0].trim(), sourceUrl: null as string | null, relevance: "High", authorityLevel: "primary" }));

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
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 });
  }
}

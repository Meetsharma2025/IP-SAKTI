import { NextRequest, NextResponse } from "next/server";
import { callNemotron } from "@/lib/nemotron";
import { semanticSearch } from "@/lib/semantic-search";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formulation, ingredients, therapeuticUse } = body;

    if (!formulation && !ingredients) {
      return NextResponse.json({ error: "Formulation or ingredients required" }, { status: 400 });
    }

    // Log for audit
    await db.insert(auditLog).values({
      action: "tkdl_search",
      details: { formulation, ingredients, therapeuticUse },
    });

    // Search knowledge base for related TK
    const searchQuery = `traditional knowledge prior art ${formulation} ${ingredients} ${therapeuticUse} ayurvedic formulation classical text charaka sushruta`;
    const docs = await semanticSearch(searchQuery, "india", 8);

    const context = docs.map(d =>
      `[${d.citation}] ${d.title}\n${d.content.substring(0, 500)}`
    ).join("\n\n---\n\n");

    try {
      const response = await callNemotron([
        {
          role: "system",
          content: `You are a TKDL/Prior-Art Analyzer for Ayurvedic innovations. Given a formulation description, analyze it against known traditional knowledge.

OUTPUT ONLY VALID JSON with this structure:
{
  "analysis": "Detailed analysis text explaining the prior-art assessment",
  "priorArtRisk": "high|medium|low|unknown",
  "recommendations": ["action1", "action2", ...],
  "relevantSources": ["source1", "source2", ...]
}

RULES:
- "high" risk = formulation appears to be well-documented traditional knowledge in classical texts
- "medium" risk = formulation shares significant overlap with known TK but has some novel aspects
- "low" risk = formulation appears to have genuine novelty beyond documented TK
- "unknown" = insufficient information to assess
- Never claim to have searched the actual TKDL database (restricted access)
- Cite specific classical texts (Charaka Samhita, Sushruta Samhita, etc.) where relevant
- Be honest about limitations of this analysis`
        },
        {
          role: "user",
          content: `FORMULATION: ${formulation}
INGREDIENTS: ${ingredients}
THERAPEUTIC USE: ${therapeuticUse}

KNOWLEDGE BASE CONTEXT:
${context || "No specific matching documents found."}

Analyze the prior-art risk for this formulation.`
        }
      ], { temperature: 0.2, maxTokens: 1500, reasoning: true });

      const cleaned = response.content.replace(/```json\n?|\n?```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return NextResponse.json({
        ...parsed,
        reasoning: response.reasoning || undefined,
      });
    } catch {
      // Fallback: basic analysis from documents
      const hasClassicalRef = docs.some(d =>
        d.tags?.includes("classical") || d.tags?.includes("charaka") ||
        d.tags?.includes("sushruta") || d.tags?.includes("first_schedule")
      );
      const hasTKDLRef = docs.some(d =>
        d.tags?.includes("tkdl") || d.tags?.includes("traditional_knowledge")
      );

      return NextResponse.json({
        analysis: `Based on available knowledge base documents:\n\n${
          docs.length > 0
            ? docs.map(d => `• **${d.title}**: ${d.content.substring(0, 200)}...\n  📎 ${d.citation}`).join("\n\n")
            : "No directly relevant documents found. Manual verification recommended."
        }\n\n⚠️ AI analysis unavailable. Showing retrieved source documents for manual review.`,
        priorArtRisk: hasClassicalRef ? "high" : hasTKDLRef ? "medium" : "unknown",
        recommendations: [
          "Consult a patent attorney experienced in Ayurvedic/pharmaceutical patents",
          "Request formal TKDL search through the Indian Patent Office during examination",
          "Search published prior art databases (Google Patents, Espacenet, PubMed)",
          "Check Ayurvedic Pharmacopoeia of India for monographs on your ingredients",
          "Review First Schedule texts for similar formulations",
        ],
        relevantSources: docs.map(d => d.citation),
      });
    }
  } catch (error) {
    console.error("TKDL search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

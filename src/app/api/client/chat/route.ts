import { NextRequest, NextResponse } from "next/server";
import { orchestrateQuery } from "@/lib/agents";
import { db } from "@/db";
import { organizations, clientProducts, clientIPAssets, clientDocuments, clientCompliance, auditLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cosineSim, generateLocalEmbedding } from "@/lib/embeddings";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, jurisdiction = "india", orgId, language = "en" } = body;

    if (!query || !orgId) {
      return NextResponse.json({ error: "query and orgId required" }, { status: 400 });
    }

    // Fetch organization context
    const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    // Fetch products, IP assets, compliance
    const products = await db.select().from(clientProducts).where(eq(clientProducts.orgId, orgId));
    const ipAssets = await db.select().from(clientIPAssets).where(eq(clientIPAssets.orgId, orgId));
    const compliance = await db.select().from(clientCompliance).where(eq(clientCompliance.orgId, orgId));

    // Search client's private documents for context
    const clientDocs = await db.select().from(clientDocuments).where(eq(clientDocuments.orgId, orgId));
    const queryEmb = generateLocalEmbedding(query);
    const relevantClientDocs = clientDocs
      .filter(d => d.embedding)
      .map(d => ({
        ...d,
        similarity: cosineSim(queryEmb, d.embedding as number[]),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    // Build client context string
    const clientContext = [
      `ORGANIZATION: ${org.name} (${org.orgType})`,
      `Target Markets: ${JSON.stringify(org.targetMarkets || ["india"])}`,
      products.length > 0 ? `PRODUCTS (${products.length}): ${products.map(p => `${p.name} [${p.category || "unclassified"}]`).join(", ")}` : "",
      ipAssets.length > 0 ? `IP PORTFOLIO (${ipAssets.length}): ${ipAssets.map(a => `${a.ipType}: ${a.title} (${a.status})`).join("; ")}` : "",
      compliance.length > 0 ? `COMPLIANCE ITEMS: ${compliance.filter(c => c.status !== "completed").map(c => `${c.requirementType}: ${c.status}`).join("; ")}` : "",
      relevantClientDocs.length > 0 ? `RELEVANT CLIENT DOCUMENTS:\n${relevantClientDocs.map(d => `- ${d.title}: ${d.content.substring(0, 200)}...`).join("\n")}` : "",
    ].filter(Boolean).join("\n");

    // Audit
    await db.insert(auditLog).values({
      sessionId: `org_${orgId}`,
      action: "client_chat",
      details: { orgId, orgName: org.name, query: query.substring(0, 200) },
    });

    // Run orchestrated query with client context prepended
    const enrichedQuery = `[CLIENT CONTEXT: ${org.name} (${org.orgType}), markets: ${JSON.stringify(org.targetMarkets || ["india"])}]\n\n${clientContext}\n\nUSER QUESTION: ${query}`;

    const result = await orchestrateQuery(enrichedQuery, jurisdiction, language);

    const uniqueCitations = [...new Set(result.agentResults.flatMap(a => a.citations))]
      .map(c => ({ citation: c, title: c.split(";")[0].trim(), sourceUrl: null as string | null, relevance: "High" }));

    return NextResponse.json({
      answer: result.answer,
      citations: uniqueCitations,
      confidence: result.overallConfidence,
      confidenceBreakdown: result.confidenceBreakdown,
      jurisdiction,
      suggestEscalation: result.suggestEscalation,
      escalationReason: result.escalationReason,
      reasoning: result.reasoning,
      model: "nemotron-3-ultra-client-aware",
      retrievedDocs: result.docsRetrieved,
      agentTrace: result.agentResults.map(a => ({
        name: a.agentName, confidence: a.confidence, uncertainties: a.uncertainties,
      })),
      uncertainties: result.uncertainties,
      contradictions: result.contradictions,
      clientContext: {
        orgName: org.name, orgType: org.orgType,
        productsCount: products.length, ipAssetsCount: ipAssets.length,
        pendingCompliance: compliance.filter(c => c.status === "pending").length,
        clientDocsUsed: relevantClientDocs.length,
      },
    });
  } catch (error) {
    console.error("Client chat error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

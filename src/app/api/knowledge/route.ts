import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeDocuments } from "@/db/schema";
import { ilike, eq, or, and, sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const jurisdiction = searchParams.get("jurisdiction") || "";
    const ipType = searchParams.get("ipType") || "";
    const category = searchParams.get("category") || "";

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(knowledgeDocuments.title, `%${search}%`),
          ilike(knowledgeDocuments.content, `%${search}%`),
          ilike(knowledgeDocuments.tags, `%${search}%`)
        )
      );
    }

    if (jurisdiction) {
      conditions.push(eq(knowledgeDocuments.jurisdiction, jurisdiction));
    }

    if (ipType) {
      conditions.push(eq(knowledgeDocuments.ipType, ipType));
    }

    if (category) {
      conditions.push(eq(knowledgeDocuments.category, category));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select()
      .from(knowledgeDocuments)
      .where(whereClause)
      .limit(50);

    // Also get stats
    const stats = await db
      .select({
        jurisdiction: knowledgeDocuments.jurisdiction,
        ipType: knowledgeDocuments.ipType,
        count: sql<number>`count(*)`,
      })
      .from(knowledgeDocuments)
      .groupBy(knowledgeDocuments.jurisdiction, knowledgeDocuments.ipType);

    return NextResponse.json({ documents: results, stats });
  } catch (error) {
    console.error("Knowledge fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch knowledge" }, { status: 500 });
  }
}

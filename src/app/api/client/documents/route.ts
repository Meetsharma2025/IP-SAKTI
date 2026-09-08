import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clientDocuments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateLocalEmbedding } from "@/lib/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const orgId = Number(new URL(request.url).searchParams.get("orgId"));
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });
    const docs = await db.select({
      id: clientDocuments.id, orgId: clientDocuments.orgId,
      productId: clientDocuments.productId, title: clientDocuments.title,
      docType: clientDocuments.docType, tags: clientDocuments.tags,
      createdAt: clientDocuments.createdAt,
    }).from(clientDocuments).where(eq(clientDocuments.orgId, orgId));
    return NextResponse.json({ documents: docs });
  } catch (error) {
    console.error("Client docs error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, productId, title, docType, content, tags } = body;
    if (!orgId || !title || !docType || !content) {
      return NextResponse.json({ error: "orgId, title, docType, content required" }, { status: 400 });
    }
    // Generate embedding for private document
    const embedding = generateLocalEmbedding(`${title} ${tags || ""} ${content}`);
    const [doc] = await db.insert(clientDocuments).values({
      orgId, productId: productId || null, title, docType, content,
      tags: tags || null, embedding,
    }).returning({ id: clientDocuments.id, title: clientDocuments.title });
    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error("Client doc upload error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clientIPAssets } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const orgId = Number(new URL(request.url).searchParams.get("orgId"));
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });
    const assets = await db.select().from(clientIPAssets).where(eq(clientIPAssets.orgId, orgId));
    return NextResponse.json({ ipAssets: assets });
  } catch (error) {
    console.error("IP assets error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, productId, ipType, status, title, applicationNumber, registrationNumber, filingDate, grantDate, expiryDate, jurisdiction, notes } = body;
    if (!orgId || !ipType || !status || !title) {
      return NextResponse.json({ error: "orgId, ipType, status, title required" }, { status: 400 });
    }
    const [asset] = await db.insert(clientIPAssets).values({
      orgId, productId: productId || null, ipType, status, title,
      applicationNumber: applicationNumber || null,
      registrationNumber: registrationNumber || null,
      filingDate: filingDate || null, grantDate: grantDate || null,
      expiryDate: expiryDate || null, jurisdiction: jurisdiction || "india",
      notes: notes || null,
    }).returning();
    return NextResponse.json({ ipAsset: asset });
  } catch (error) {
    console.error("IP asset create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

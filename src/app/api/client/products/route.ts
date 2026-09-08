import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clientProducts, clientIPAssets, clientCompliance } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const orgId = Number(new URL(request.url).searchParams.get("orgId"));
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

    const products = await db.select().from(clientProducts).where(eq(clientProducts.orgId, orgId));

    // Get IP assets and compliance for each product
    const enriched = await Promise.all(products.map(async (p) => {
      const ipAssets = await db.select().from(clientIPAssets)
        .where(and(eq(clientIPAssets.orgId, orgId), eq(clientIPAssets.productId, p.id)));
      const compliance = await db.select().from(clientCompliance)
        .where(and(eq(clientCompliance.orgId, orgId), eq(clientCompliance.productId, p.id)));
      return { ...p, ipAssets, compliance };
    }));

    return NextResponse.json({ products: enriched });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, name, description, category, ingredients, therapeuticClaims, targetMarkets } = body;

    if (!orgId || !name) return NextResponse.json({ error: "orgId, name required" }, { status: 400 });

    const [product] = await db.insert(clientProducts).values({
      orgId, name,
      description: description || null,
      category: category || null,
      ingredients: ingredients || null,
      therapeuticClaims: therapeuticClaims || null,
      targetMarkets: targetMarkets || null,
    }).returning();

    // Auto-generate compliance requirements based on category
    const complianceItems = [];
    if (category === "classical" || category === "proprietary" || category === "new_drug") {
      complianceItems.push({ type: "manufacturing_license", desc: "D&C Act Manufacturing License (Rule 158-B)" });
      complianceItems.push({ type: "gmp_cert", desc: "GMP Compliance Certificate (Schedule T)" });
    }
    if (category === "nutraceutical") {
      complianceItems.push({ type: "fssai_license", desc: "FSSAI License for Ayurveda-Aahar" });
    }
    complianceItems.push({ type: "abs_clearance", desc: "ABS Compliance — NBA/SBB clearance if using Indian biological resources" });

    for (const item of complianceItems) {
      await db.insert(clientCompliance).values({
        orgId, productId: product.id,
        requirementType: item.type, description: item.desc, status: "pending",
      });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

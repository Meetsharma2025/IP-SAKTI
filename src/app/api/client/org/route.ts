import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizations, orgMembers } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET: Fetch organization by slug
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const slug = new URL(request.url).searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

    const org = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
    if (org.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const members = await db.select().from(orgMembers).where(eq(orgMembers.orgId, org[0].id));

    return NextResponse.json({ organization: org[0], members });
  } catch (error) {
    console.error("Org fetch error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// POST: Create organization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, orgType, description, contactEmail, contactPhone, targetMarkets, ownerName, ownerEmail } = body;

    if (!name || !orgType || !ownerName || !ownerEmail) {
      return NextResponse.json({ error: "name, orgType, ownerName, ownerEmail required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 80) + "-" + Date.now().toString(36);

    const [org] = await db.insert(organizations).values({
      name, slug, orgType,
      description: description || null,
      contactEmail: contactEmail || null,
      contactPhone: contactPhone || null,
      targetMarkets: targetMarkets || ["india"],
    }).returning();

    await db.insert(orgMembers).values({
      orgId: org.id, name: ownerName, email: ownerEmail, role: "owner",
    });

    return NextResponse.json({ organization: org, slug: org.slug });
  } catch (error) {
    console.error("Org create error:", error);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeDocuments, verificationLog } from "@/db/schema";
import { sql } from "drizzle-orm";
import { verifyAllSources } from "@/lib/source-verifier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// GET: Return current corpus stats and verification status
export async function GET() {
  try {
    const stats = await db.select({
      total: sql<number>`count(*)`,
      currentVersions: sql<number>`count(*) filter (where is_current_version = true)`,
      primarySources: sql<number>`count(*) filter (where authority_level = 'primary')`,
      secondarySources: sql<number>`count(*) filter (where authority_level = 'secondary')`,
      tertiarySources: sql<number>`count(*) filter (where authority_level = 'tertiary')`,
      indiaCount: sql<number>`count(*) filter (where jurisdiction = 'india')`,
      intlCount: sql<number>`count(*) filter (where jurisdiction = 'international')`,
      verified: sql<number>`count(*) filter (where verification_status = 'verified')`,
      unverified: sql<number>`count(*) filter (where verification_status = 'unverified' OR verification_status IS NULL)`,
      unreachable: sql<number>`count(*) filter (where verification_status = 'unreachable')`,
      withUrl: sql<number>`count(*) filter (where source_url IS NOT NULL AND source_url != '')`,
      lastVerified: sql<string>`max(last_verified_at)`,
    }).from(knowledgeDocuments);

    const recentVerifications = await db.select({
      id: verificationLog.id,
      documentId: verificationLog.documentId,
      sourceUrl: verificationLog.sourceUrl,
      httpStatus: verificationLog.httpStatus,
      reachable: verificationLog.reachable,
      contentChanged: verificationLog.contentChanged,
      verifiedAt: verificationLog.verifiedAt,
      note: verificationLog.note,
    }).from(verificationLog)
      .orderBy(sql`verified_at DESC`)
      .limit(20);

    const s = stats[0];

    return NextResponse.json({
      corpus: {
        totalDocuments: Number(s.total),
        currentVersions: Number(s.currentVersions),
        primarySources: Number(s.primarySources),
        secondarySources: Number(s.secondarySources),
        tertiarySources: Number(s.tertiarySources),
        indiaDocuments: Number(s.indiaCount),
        internationalDocuments: Number(s.intlCount),
        withSourceUrl: Number(s.withUrl),
      },
      verification: {
        verified: Number(s.verified),
        unverified: Number(s.unverified),
        unreachable: Number(s.unreachable),
        lastVerifiedAt: s.lastVerified || null,
      },
      recentVerifications: recentVerifications,
      officialSources: [
        { name: "IP India", url: "https://ipindia.gov.in", coverage: "Patents, TM, Designs, GI" },
        { name: "National Biodiversity Authority", url: "https://nbaindia.org", coverage: "ABS, BD Act" },
        { name: "CDSCO", url: "https://cdsco.gov.in", coverage: "Drug regulation" },
        { name: "FSSAI", url: "https://fssai.gov.in", coverage: "Food/Nutraceutical" },
        { name: "TKDL", url: "https://tkdl.res.in", coverage: "Traditional Knowledge" },
        { name: "WIPO", url: "https://www.wipo.int", coverage: "International IP" },
        { name: "WTO", url: "https://www.wto.org", coverage: "TRIPS" },
        { name: "CBD", url: "https://www.cbd.int", coverage: "Nagoya Protocol" },
      ],
    });
  } catch (error) {
    console.error("Verification stats error:", error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}

// POST: Trigger actual source verification
export async function POST() {
  try {
    const result = await verifyAllSources();
    return NextResponse.json({
      message: "Source verification complete",
      ...result,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

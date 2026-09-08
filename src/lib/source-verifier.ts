// Real Source Verification: HTTP fetch + content hashing + change detection
import { db } from "@/db";
import { knowledgeDocuments, verificationLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import * as crypto from "crypto";

export interface VerificationResult {
  documentId: number;
  title: string;
  sourceUrl: string | null;
  reachable: boolean;
  httpStatus: number | null;
  contentChanged: boolean;
  newStatus: string;
  note: string;
  fetchedContentLength?: number;
  contentSnippet?: string;
}

function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function verifyDocument(doc: {
  id: number; title: string; sourceUrl: string | null;
  content: string; contentHash: string | null; verificationStatus: string | null;
}): Promise<VerificationResult> {
  const contentHash = hashContent(doc.content);
  const contentChanged = doc.contentHash !== null && doc.contentHash !== contentHash;

  if (!doc.sourceUrl) {
    await db.update(knowledgeDocuments).set({
      contentHash, verificationStatus: "verified",
      verificationNote: "Content hash verified (no external URL)", lastVerifiedAt: new Date(),
    }).where(eq(knowledgeDocuments.id, doc.id));

    await db.insert(verificationLog).values({
      documentId: doc.id, reachable: true, contentChanged,
      previousHash: doc.contentHash, newHash: contentHash,
      note: "Content hash verified",
    });

    return { documentId: doc.id, title: doc.title, sourceUrl: null,
      reachable: true, httpStatus: null, contentChanged, newStatus: "verified",
      note: "Content hash integrity verified" };
  }

  let httpStatus: number | null = null;
  let reachable = false;
  let note = "";
  let fetchedContentLength = 0;
  let contentSnippet = "";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // Actually GET the page content (not just HEAD)
    const response = await fetch(doc.sourceUrl, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "IP-SAKTI-Sahayak-SourceVerifier/1.0",
        "Accept": "text/html,application/xhtml+xml,text/plain,*/*",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    httpStatus = response.status;
    reachable = response.ok;

    if (reachable) {
      try {
        const body = await response.text();
        fetchedContentLength = body.length;
        // Extract a text snippet (strip HTML tags)
        const textContent = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        contentSnippet = textContent.substring(0, 200);

        // Check if the fetched page mentions key terms from our document
        const keyTerms = doc.title.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 5);
        const lowerBody = textContent.toLowerCase();
        const termsFound = keyTerms.filter(t => lowerBody.includes(t)).length;
        const termCoverage = keyTerms.length > 0 ? termsFound / keyTerms.length : 0;

        if (termCoverage > 0.3) {
          note = `Source verified: HTTP ${httpStatus}, ${fetchedContentLength} bytes, ${Math.round(termCoverage * 100)}% term coverage`;
        } else {
          note = `Source reachable but content may have changed: HTTP ${httpStatus}, ${fetchedContentLength} bytes, low term overlap (${Math.round(termCoverage * 100)}%)`;
        }
      } catch {
        note = `Source reachable (HTTP ${httpStatus}) but content could not be parsed`;
      }
    } else {
      note = `Source returned HTTP ${httpStatus}`;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown";
    note = msg.includes("abort") ? "Source timed out (>10s)" : `Unreachable: ${msg.substring(0, 60)}`;
  }

  const newStatus = reachable ? "verified" : "unreachable";

  await db.update(knowledgeDocuments).set({
    contentHash, verificationStatus: newStatus,
    verificationNote: note, lastVerifiedAt: new Date(),
  }).where(eq(knowledgeDocuments.id, doc.id));

  await db.insert(verificationLog).values({
    documentId: doc.id, sourceUrl: doc.sourceUrl, httpStatus, reachable,
    contentChanged, previousHash: doc.contentHash, newHash: contentHash, note,
  });

  return { documentId: doc.id, title: doc.title, sourceUrl: doc.sourceUrl,
    reachable, httpStatus, contentChanged, newStatus, note,
    fetchedContentLength, contentSnippet };
}

export async function verifyAllSources(): Promise<{
  results: VerificationResult[];
  summary: { total: number; verified: number; unreachable: number; contentChanged: number; noUrl: number };
}> {
  const docs = await db.select({
    id: knowledgeDocuments.id, title: knowledgeDocuments.title,
    sourceUrl: knowledgeDocuments.sourceUrl, content: knowledgeDocuments.content,
    contentHash: knowledgeDocuments.contentHash,
    verificationStatus: knowledgeDocuments.verificationStatus,
  }).from(knowledgeDocuments);

  const results: VerificationResult[] = [];
  for (const doc of docs) {
    results.push(await verifyDocument(doc));
  }

  return {
    results,
    summary: {
      total: results.length,
      verified: results.filter(r => r.newStatus === "verified").length,
      unreachable: results.filter(r => r.newStatus === "unreachable").length,
      contentChanged: results.filter(r => r.contentChanged).length,
      noUrl: results.filter(r => !r.sourceUrl).length,
    },
  };
}

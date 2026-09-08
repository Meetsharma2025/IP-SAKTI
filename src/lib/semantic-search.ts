// Hybrid Semantic Search — Vector + Keyword + Graph + Reranking
// FIXED: Jurisdiction-strict, keyword-dominant scoring
import { db } from "@/db";
import { knowledgeDocuments, knowledgeRelations } from "@/db/schema";
import { eq, or, inArray } from "drizzle-orm";
import { cosineSim, generateLocalEmbedding } from "./embeddings";

export interface SemanticResult {
  id: number; title: string; category: string; jurisdiction: string;
  ipType: string; content: string; citation: string;
  sourceUrl: string | null; tags: string | null;
  authorityLevel: string; version: string | null;
  effectiveDate: string | null; isCurrentVersion: boolean;
  keywordScore: number; vectorScore: number; graphScore: number;
  rerankerScore: number; authorityBonus: number; finalScore: number;
}

function tokenize(text: string): string[] {
  const stops = new Set(["i","me","my","we","our","you","your","he","she","it","they","a","an","the","is","am","are","was","were","be","been","have","has","had","do","does","did","will","would","should","can","could","may","might","shall","must","and","or","but","if","than","that","this","these","those","in","on","at","to","for","of","with","by","from","about","into","through","during","before","after","not","no","so","very","just","also","how","what","when","where","why","which","who","want","need","know","get","like","make","tell","please","help","give","take","use","used","using","क्या","के","का","में","है","और","से","यह","एक","पर","कि","हो","कर"]);
  // Preserve legal references
  const preserved: string[] = [];
  const refs = text.match(/\d+\([a-z]\)|\bsection\s+\d+/gi) || [];
  for (const r of refs) preserved.push(r.toLowerCase().replace(/[()]/g, "").replace(/\s+/g, ""));
  const words = text.toLowerCase().replace(/[^a-z0-9\s\u0900-\u097F]/g, " ").split(/\s+/)
    .filter(w => w.length > 2 && !stops.has(w));
  return [...new Set([...words, ...preserved])];
}

// Graph expansion
async function getGraphRelatedIds(docIds: number[]): Promise<Map<number, number>> {
  if (docIds.length === 0) return new Map();
  try {
    const rels = await db.select().from(knowledgeRelations)
      .where(or(inArray(knowledgeRelations.sourceDocId, docIds), inArray(knowledgeRelations.targetDocId, docIds)));
    const scores = new Map<number, number>();
    for (const r of rels) {
      const w = r.relationType === "supersedes" ? 10 : r.relationType === "amends" ? 8 :
        r.relationType === "conflicts_with" ? 9 : r.relationType === "implements" ? 7 :
        r.relationType === "complements" ? 6 : 4;
      if (docIds.includes(r.sourceDocId)) scores.set(r.targetDocId, (scores.get(r.targetDocId) || 0) + w);
      if (docIds.includes(r.targetDocId)) scores.set(r.sourceDocId, (scores.get(r.sourceDocId) || 0) + w);
    }
    for (const id of docIds) scores.delete(id);
    return scores;
  } catch { return new Map(); }
}

// ===== MAIN SEARCH =====
export async function semanticSearch(
  query: string, jurisdiction: string = "india", limit: number = 10
): Promise<SemanticResult[]> {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) queryTokens.push("ayurveda", "patent", "ip");
  const queryEmb = generateLocalEmbedding(query);

  // STEP 1: Fetch ALL docs for the requested jurisdiction (max ~35 docs)
  // This is fast for 49 total docs and eliminates the jurisdiction mixing problem
  let allDocs: (typeof knowledgeDocuments.$inferSelect)[] = [];
  try {
    allDocs = jurisdiction === "both"
      ? await db.select().from(knowledgeDocuments)
      : await db.select().from(knowledgeDocuments).where(eq(knowledgeDocuments.jurisdiction, jurisdiction));
  } catch {
    allDocs = [];
  }

  if (allDocs.length === 0) {
    // Fallback: try all docs
    try { allDocs = await db.select().from(knowledgeDocuments); } catch { return []; }
  }

  // STEP 2: Score every document
  const scored: SemanticResult[] = allDocs.map(doc => {
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    const tagsLower = (doc.tags || "").toLowerCase();
    const tokensLower = (doc.searchTokens || "").toLowerCase();

    // --- Keyword score ---
    let keywordScore = 0;
    let matchedTerms = 0;
    for (const kw of queryTokens) {
      let matched = false;
      if (titleLower.includes(kw)) { keywordScore += 15; matched = true; }
      if (tagsLower.includes(kw)) { keywordScore += 10; matched = true; }
      if (tokensLower.includes(kw)) { keywordScore += 5; matched = true; }
      const m = contentLower.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "gi"));
      if (m) { keywordScore += Math.min(m.length * 2, 8); matched = true; }
      if (matched) matchedTerms++;
    }
    // Bonus for matching MORE query terms (coverage)
    keywordScore += matchedTerms * 8;

    // Legal phrase exact match in title = massive boost
    const legalPhrases = query.match(/\d+\([a-z]\)/gi) || [];
    for (const lp of legalPhrases) {
      if (titleLower.includes(lp.toLowerCase())) keywordScore += 120;
      else if (contentLower.includes(lp.toLowerCase())) keywordScore += 30;
    }

    // --- Vector score ---
    let vectorScore = 0;
    if (doc.embedding) {
      vectorScore = cosineSim(queryEmb, doc.embedding as number[]) * 100;
    }

    // --- Authority bonus ---
    const authorityBonus = doc.authorityLevel === "primary" ? 12 :
      doc.authorityLevel === "secondary" ? 6 : 0;
    const versionBonus = doc.isCurrentVersion ? 3 : -8;

    // --- Final score: keyword DOMINATES ---
    const finalScore = keywordScore + vectorScore * 0.1 + authorityBonus + versionBonus;

    return {
      id: doc.id, title: doc.title, category: doc.category,
      jurisdiction: doc.jurisdiction, ipType: doc.ipType,
      content: doc.content, citation: doc.citation,
      sourceUrl: doc.sourceUrl, tags: doc.tags,
      authorityLevel: doc.authorityLevel, version: doc.version,
      effectiveDate: doc.effectiveDate, isCurrentVersion: doc.isCurrentVersion,
      keywordScore, vectorScore, graphScore: 0, rerankerScore: 0,
      authorityBonus, finalScore,
    };
  });

  // Sort by score
  scored.sort((a, b) => b.finalScore - a.finalScore);
  const topCandidates = scored.slice(0, 15);

  // STEP 3: Knowledge graph expansion
  const topIds = topCandidates.map(d => d.id);
  const graphRelated = await getGraphRelatedIds(topIds);
  if (graphRelated.size > 0) {
    for (const doc of topCandidates) {
      const gs = graphRelated.get(doc.id);
      if (gs) { doc.graphScore = gs; doc.finalScore += gs; }
    }
    // Add graph-discovered docs not already in candidates
    const newIds = [...graphRelated.keys()].filter(id => !topIds.includes(id));
    if (newIds.length > 0) {
      try {
        const extraDocs = await db.select().from(knowledgeDocuments).where(inArray(knowledgeDocuments.id, newIds));
        for (const doc of extraDocs) {
          if (jurisdiction !== "both" && doc.jurisdiction !== jurisdiction) continue;
          const gs = graphRelated.get(doc.id) || 0;
          let vs = 0;
          if (doc.embedding) vs = cosineSim(queryEmb, doc.embedding as number[]) * 100;
          topCandidates.push({
            id: doc.id, title: doc.title, category: doc.category,
            jurisdiction: doc.jurisdiction, ipType: doc.ipType,
            content: doc.content, citation: doc.citation,
            sourceUrl: doc.sourceUrl, tags: doc.tags,
            authorityLevel: doc.authorityLevel, version: doc.version,
            effectiveDate: doc.effectiveDate, isCurrentVersion: doc.isCurrentVersion,
            keywordScore: 0, vectorScore: vs, graphScore: gs,
            rerankerScore: 0, authorityBonus: 0, finalScore: gs * 1.5 + vs * 0.1,
          });
        }
      } catch { /* ignore */ }
    }
  }

  topCandidates.sort((a, b) => b.finalScore - a.finalScore);
  return topCandidates.slice(0, limit);
}

// ===== EVIDENCE CONFIDENCE =====
export interface ConfidenceAnalysis {
  overall: number;
  components: {
    retrievalRelevance: number; sourceAuthority: number; citationCoverage: number;
    currentVersionStatus: number; evidenceAgreement: number; jurisdictionMatch: number;
  };
  shouldAbstain: boolean;
  abstentionReason?: string;
  contradictions: string[];
}

export function computeEvidenceConfidence(docs: SemanticResult[], jurisdiction: string): ConfidenceAnalysis {
  const contradictions: string[] = [];
  if (docs.length === 0) {
    return { overall: 0, components: { retrievalRelevance: 0, sourceAuthority: 0, citationCoverage: 0, currentVersionStatus: 0, evidenceAgreement: 0, jurisdictionMatch: 0 },
      shouldAbstain: true, abstentionReason: "No relevant source documents found.", contradictions: [] };
  }

  const avgFinal = docs.reduce((s, d) => s + d.finalScore, 0) / docs.length;
  const maxFinal = Math.max(...docs.map(d => d.finalScore));
  const retrievalRelevance = Math.min(Math.round((avgFinal / Math.max(maxFinal, 1)) * 60 + (docs.length > 3 ? 20 : docs.length * 5)), 95);

  const primaryCount = docs.filter(d => d.authorityLevel === "primary").length;
  const secondaryCount = docs.filter(d => d.authorityLevel === "secondary").length;
  const sourceAuthority = Math.min(Math.round((primaryCount * 20 + secondaryCount * 10) / Math.max(docs.length, 1) * 3.5), 100);

  const ipTypes = new Set(docs.map(d => d.ipType));
  const citationCoverage = Math.min(ipTypes.size * 20 + (docs.length > 5 ? 20 : 0), 100);

  const currentCount = docs.filter(d => d.isCurrentVersion).length;
  const currentVersionStatus = Math.round((currentCount / docs.length) * 100);

  const matchingJ = docs.filter(d => d.jurisdiction === jurisdiction).length;
  const jurisdictionMatch = Math.round((matchingJ / docs.length) * 100);
  if (matchingJ < docs.length * 0.5) contradictions.push("Some retrieved sources are from a different jurisdiction");

  // Contradiction detection
  const patentDocs = docs.filter(d => d.ipType === "patent");
  if (patentDocs.some(d => d.content.toLowerCase().includes("not patentable")) &&
      patentDocs.some(d => d.content.toLowerCase().includes("patentable") && !d.content.toLowerCase().includes("not patentable"))) {
    contradictions.push("Sources contain both patentability barriers AND options — depends on product classification");
  }
  const hasOldLaw = docs.some(d => { const y = parseInt(d.effectiveDate?.substring(0, 4) || "2024"); return y < 2020; });
  if (hasOldLaw && docs.some(d => d.content.toLowerCase().includes("2023 amendment") || d.content.toLowerCase().includes("2024 rules"))) {
    contradictions.push("Sources include both older and newer provisions — newer law may override");
  }

  const evidenceAgreement = Math.max(85 - contradictions.length * 15, 10);

  const overall = Math.round(
    retrievalRelevance * 0.25 + sourceAuthority * 0.20 + citationCoverage * 0.10 +
    currentVersionStatus * 0.15 + jurisdictionMatch * 0.15 + evidenceAgreement * 0.15
  );

  return {
    overall: Math.min(overall, 95),
    components: { retrievalRelevance, sourceAuthority, citationCoverage, currentVersionStatus, evidenceAgreement, jurisdictionMatch },
    shouldAbstain: overall < 20 || retrievalRelevance < 10,
    abstentionReason: overall < 20 ? "Insufficient evidence for a reliable answer." : undefined,
    contradictions,
  };
}

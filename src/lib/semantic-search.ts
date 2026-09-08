// Hybrid Semantic Search: Vector Embeddings + Keyword + Knowledge Graph + Reranking
import { db } from "@/db";
import { knowledgeDocuments, knowledgeRelations } from "@/db/schema";
import { eq, and, or, ilike, inArray } from "drizzle-orm";
import { vectorSearch, cosineSim, generateLocalEmbedding } from "./embeddings";

export interface SemanticResult {
  id: number;
  title: string;
  category: string;
  jurisdiction: string;
  ipType: string;
  content: string;
  citation: string;
  sourceUrl: string | null;
  tags: string | null;
  authorityLevel: string;
  version: string | null;
  effectiveDate: string | null;
  isCurrentVersion: boolean;
  keywordScore: number;
  vectorScore: number;
  graphScore: number;
  rerankerScore: number;
  authorityBonus: number;
  finalScore: number;
}

// ===== TOKENIZER =====
function tokenize(text: string): string[] {
  const stops = new Set([
    "i","me","my","we","our","you","your","he","she","it","they","a","an","the",
    "is","am","are","was","were","be","been","have","has","had","do","does","did",
    "will","would","should","can","could","may","might","shall","must","and","or",
    "but","if","than","that","this","these","those","in","on","at","to","for","of",
    "with","by","from","about","into","through","during","before","after","above",
    "below","not","no","nor","so","very","just","also","how","what","when","where",
    "why","which","who","whom","whose","want","need","know","get","like","make",
    "tell","please","help","give","take","use","used","using",
  ]);
  // Preserve legal references like "3(p)", "3(d)", "122-DAB"
  const preserved: string[] = [];
  const legalRefs = text.match(/\d+\([a-z]\)|\d+-[A-Z]+|section\s+\d+/gi) || [];
  for (const ref of legalRefs) {
    const clean = ref.toLowerCase().replace(/[()]/g, "").replace(/\s+/g, "_");
    preserved.push(clean); // e.g., "3p", "3d", "122-dab", "section_3"
  }

  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter(w => w.length > 2 && !stops.has(w));
  return [...new Set([...words, ...preserved])];
}

// ===== KNOWLEDGE GRAPH TRAVERSAL =====
async function getGraphRelatedDocIds(docIds: number[]): Promise<Map<number, number>> {
  if (docIds.length === 0) return new Map();
  try {
    const relations = await db.select().from(knowledgeRelations)
      .where(or(
        inArray(knowledgeRelations.sourceDocId, docIds),
        inArray(knowledgeRelations.targetDocId, docIds)
      ));

    const scores = new Map<number, number>();
    for (const rel of relations) {
      const weight = rel.relationType === "supersedes" ? 10 :
        rel.relationType === "amends" ? 8 : rel.relationType === "implements" ? 7 :
        rel.relationType === "conflicts_with" ? 9 :
        rel.relationType === "complements" ? 6 : rel.relationType === "references" ? 5 : 3;

      if (docIds.includes(rel.sourceDocId)) {
        scores.set(rel.targetDocId, (scores.get(rel.targetDocId) || 0) + weight);
      }
      if (docIds.includes(rel.targetDocId)) {
        scores.set(rel.sourceDocId, (scores.get(rel.sourceDocId) || 0) + weight);
      }
    }
    for (const id of docIds) scores.delete(id);
    return scores;
  } catch { return new Map(); }
}

// ===== LOCAL RERANKER (fast — no LLM call) =====
// Uses query-document term overlap scoring for fast reranking
function localRerank(
  queryTokens: string[],
  candidates: { id: number; title: string; content: string }[]
): Map<number, number> {
  const scores = new Map<number, number>();
  for (const c of candidates) {
    let s = 0;
    const docText = `${c.title} ${c.content}`.toLowerCase();
    for (const qt of queryTokens) {
      // Exact presence
      if (docText.includes(qt)) s += 10;
      // Title match bonus
      if (c.title.toLowerCase().includes(qt)) s += 15;
    }
    scores.set(c.id, Math.min(s, 100));
  }
  return scores;
}

// ===== MAIN HYBRID SEARCH =====
export async function semanticSearch(
  query: string,
  jurisdiction: string = "india",
  limit: number = 10
): Promise<SemanticResult[]> {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) queryTokens.push("ayurveda", "patent", "ip");

  // --- CHANNEL 1: Vector/Embedding search ---
  // Vector provides semantic similarity; keyword provides exact matching
  // Both channels merge; final scoring determines ranking
  let vectorResults: Map<number, number> = new Map();
  try {
    const vr = await vectorSearch(query, jurisdiction, 10);
    for (const r of vr) vectorResults.set(r.id, r.similarity * 100);
  } catch { /* vector search optional */ }

  // --- CHANNEL 2: Keyword ILIKE search ---
  // Use the FULL original query (with special chars) for title matching, plus tokens
  const originalQueryLower = query.toLowerCase();
  const searchTerms = queryTokens.slice(0, 8);
  const searchConditions = searchTerms.map(kw =>
    or(
      ilike(knowledgeDocuments.content, `%${kw}%`),
      ilike(knowledgeDocuments.title, `%${kw}%`),
      ilike(knowledgeDocuments.tags, `%${kw}%`),
      ilike(knowledgeDocuments.searchTokens, `%${kw}%`)
    )
  );
  // Also search for the raw query in title/content (catches "3(p)", "Section 3(d)" etc.)
  searchConditions.push(
    or(
      ilike(knowledgeDocuments.title, `%${originalQueryLower.substring(0, 100)}%`),
      ilike(knowledgeDocuments.content, `%${originalQueryLower.substring(0, 100)}%`)
    )
  );

  const jurisdictionCond = jurisdiction === "both" ? undefined
    : eq(knowledgeDocuments.jurisdiction, jurisdiction);

  let keywordDocs: typeof knowledgeDocuments.$inferSelect[] = [];
  try {
    const wc = jurisdictionCond ? and(or(...searchConditions), jurisdictionCond) : or(...searchConditions);
    keywordDocs = await db.select().from(knowledgeDocuments).where(wc ?? undefined).limit(40);
  } catch {
    keywordDocs = await db.select().from(knowledgeDocuments).limit(20);
  }

  if (keywordDocs.length === 0) {
    try {
      keywordDocs = await db.select().from(knowledgeDocuments).where(or(...searchConditions) ?? undefined).limit(15);
    } catch { /* empty */ }
  }

  // --- Merge all candidate IDs ---
  const allIds = new Set<number>([
    ...keywordDocs.map(d => d.id),
    ...vectorResults.keys(),
  ]);

  // Fetch any missing docs from vector results — filter by jurisdiction
  const missingIds = [...allIds].filter(id => !keywordDocs.find(d => d.id === id));
  let extraDocs: typeof knowledgeDocuments.$inferSelect[] = [];
  if (missingIds.length > 0) {
    try {
      const extraWhere = jurisdictionCond
        ? and(inArray(knowledgeDocuments.id, missingIds), jurisdictionCond)
        : inArray(knowledgeDocuments.id, missingIds);
      extraDocs = await db.select().from(knowledgeDocuments).where(extraWhere);
    } catch { /* ignore */ }
  }

  const allDocs = [...keywordDocs, ...extraDocs];
  const queryEmbedding = generateLocalEmbedding(query);

  // --- Score each candidate ---
  const scored: SemanticResult[] = allDocs.map(doc => {
    // Keyword score
    let keywordScore = 0;
    const titleLower = doc.title.toLowerCase();
    const contentLower = doc.content.toLowerCase();
    const tagsLower = (doc.tags || "").toLowerCase();

    for (const kw of queryTokens) {
      if (titleLower.includes(kw)) keywordScore += 12;
      if (tagsLower.includes(kw)) keywordScore += 8;
      const m = contentLower.match(new RegExp(kw, "gi"));
      if (m) keywordScore += Math.min(m.length * 2, 10);
    }

    // Phrase match bonus — raw query substring in title/content gets big boost
    if (titleLower.includes(originalQueryLower.substring(0, 40))) keywordScore += 50;
    else if (contentLower.includes(originalQueryLower.substring(0, 40))) keywordScore += 30;
    // Check for key legal phrases like "3(p)", "3(d)" in title
    const legalPhrases = query.match(/\d+\([a-z]\)/gi) || [];
    for (const lp of legalPhrases) {
      if (titleLower.includes(lp.toLowerCase())) keywordScore += 100; // massive boost
      else if (contentLower.includes(lp.toLowerCase())) keywordScore += 30;
    }
    // Multi-keyword coverage bonus: docs matching more query terms rank higher
    const matchedTermCount = queryTokens.filter(kw =>
      titleLower.includes(kw) || tagsLower.includes(kw) || contentLower.includes(kw)
    ).length;
    keywordScore += matchedTermCount * 5; // bonus per matched term

    // Vector score (embedding cosine similarity)
    let vectorScore = vectorResults.get(doc.id) || 0;
    if (vectorScore === 0 && doc.embedding) {
      vectorScore = cosineSim(queryEmbedding, doc.embedding as number[]) * 100;
    }

    // Authority bonus
    const authorityBonus = doc.authorityLevel === "primary" ? 15 :
      doc.authorityLevel === "secondary" ? 8 : 0;
    const versionBonus = doc.isCurrentVersion ? 5 : -10;
    const jurisdictionBonus = doc.jurisdiction === jurisdiction ? 10 : 0;

    // Weighted combination — keyword matching dominates for legal precision
    const finalScore = keywordScore + vectorScore * 0.15 +
      authorityBonus + versionBonus + jurisdictionBonus;

    return {
      id: doc.id, title: doc.title, category: doc.category,
      jurisdiction: doc.jurisdiction, ipType: doc.ipType,
      content: doc.content, citation: doc.citation,
      sourceUrl: doc.sourceUrl, tags: doc.tags,
      authorityLevel: doc.authorityLevel,
      version: doc.version, effectiveDate: doc.effectiveDate,
      isCurrentVersion: doc.isCurrentVersion,
      keywordScore, vectorScore, graphScore: 0, rerankerScore: 0,
      authorityBonus, finalScore,
    };
  });

  // Sort and take top candidates
  scored.sort((a, b) => b.finalScore - a.finalScore);
  const topCandidates = scored.slice(0, 15);

  // --- CHANNEL 3: Knowledge graph expansion ---
  const topIds = topCandidates.map(d => d.id);
  const graphRelated = await getGraphRelatedDocIds(topIds);
  if (graphRelated.size > 0) {
    const relatedIds = [...graphRelated.keys()];
    try {
      const relatedDocs = await db.select().from(knowledgeDocuments)
        .where(inArray(knowledgeDocuments.id, relatedIds));
      for (const doc of relatedDocs) {
        const existing = topCandidates.find(d => d.id === doc.id);
        const gScore = graphRelated.get(doc.id) || 0;
        if (existing) {
          existing.graphScore = gScore;
          existing.finalScore += gScore * 1.5;
        } else {
          let vs = 0;
          if (doc.embedding) vs = cosineSim(queryEmbedding, doc.embedding as number[]) * 100;
          topCandidates.push({
            id: doc.id, title: doc.title, category: doc.category,
            jurisdiction: doc.jurisdiction, ipType: doc.ipType,
            content: doc.content, citation: doc.citation,
            sourceUrl: doc.sourceUrl, tags: doc.tags,
            authorityLevel: doc.authorityLevel,
            version: doc.version, effectiveDate: doc.effectiveDate,
            isCurrentVersion: doc.isCurrentVersion,
            keywordScore: 0, vectorScore: vs, graphScore: gScore,
            rerankerScore: 0, authorityBonus: 0,
            finalScore: vs * 0.2 + gScore * 2,
          });
        }
      }
    } catch { /* ignore */ }
  }

  // --- CHANNEL 4: Local reranking (fast, no LLM call) ---
  topCandidates.sort((a, b) => b.finalScore - a.finalScore);
  const toRerank = topCandidates.slice(0, 10).map(d => ({
    id: d.id, title: d.title, content: d.content,
  }));
  const rerankerScores = localRerank(queryTokens, toRerank);
  for (const doc of topCandidates) {
    const rs = rerankerScores.get(doc.id);
    if (rs !== undefined) {
      doc.rerankerScore = rs;
      // Final: keyword-dominant scoring
      doc.finalScore = doc.keywordScore + doc.rerankerScore * 0.15 +
        doc.vectorScore * 0.10 + doc.graphScore * 0.10 +
        doc.authorityBonus + (doc.isCurrentVersion ? 5 : -5);
    }
  }

  topCandidates.sort((a, b) => b.finalScore - a.finalScore);
  return topCandidates.slice(0, limit);
}

// ===== EVIDENCE-BASED CONFIDENCE WITH CONTRADICTION DETECTION =====

export interface ConfidenceAnalysis {
  overall: number;
  components: {
    retrievalRelevance: number;
    sourceAuthority: number;
    citationCoverage: number;
    currentVersionStatus: number;
    evidenceAgreement: number;
    jurisdictionMatch: number;
  };
  shouldAbstain: boolean;
  abstentionReason?: string;
  contradictions: string[];
}

export function computeEvidenceConfidence(
  docs: SemanticResult[],
  jurisdiction: string
): ConfidenceAnalysis {
  const contradictions: string[] = [];

  if (docs.length === 0) {
    return {
      overall: 0,
      components: {
        retrievalRelevance: 0, sourceAuthority: 0, citationCoverage: 0,
        currentVersionStatus: 0, evidenceAgreement: 0, jurisdictionMatch: 0,
      },
      shouldAbstain: true,
      abstentionReason: "No relevant source documents found.",
      contradictions: [],
    };
  }

  // 1. Retrieval relevance (uses actual scoring)
  const avgFinal = docs.reduce((s, d) => s + d.finalScore, 0) / docs.length;
  const maxFinal = Math.max(...docs.map(d => d.finalScore));
  const retrievalRelevance = Math.min(Math.round(
    (avgFinal / Math.max(maxFinal, 1)) * 60 + (docs.length > 3 ? 20 : docs.length * 5)
  ), 95);

  // 2. Source authority
  const primaryCount = docs.filter(d => d.authorityLevel === "primary").length;
  const secondaryCount = docs.filter(d => d.authorityLevel === "secondary").length;
  const sourceAuthority = Math.min(
    Math.round((primaryCount * 20 + secondaryCount * 10) / Math.max(docs.length, 1) * 3.5),
    100
  );

  // 3. Citation coverage
  const ipTypes = new Set(docs.map(d => d.ipType));
  const citationCoverage = Math.min(ipTypes.size * 20 + (docs.length > 5 ? 20 : 0), 100);

  // 4. Current version status
  const currentCount = docs.filter(d => d.isCurrentVersion).length;
  const outdatedCount = docs.length - currentCount;
  const currentVersionStatus = Math.round((currentCount / docs.length) * 100);
  if (outdatedCount > 0) {
    contradictions.push(`${outdatedCount} source(s) may be outdated — check for amendments`);
  }

  // 5. Jurisdiction match
  const matchingJ = docs.filter(d => d.jurisdiction === jurisdiction).length;
  const mismatchJ = docs.length - matchingJ;
  const jurisdictionMatch = Math.round((matchingJ / docs.length) * 100);
  if (mismatchJ > matchingJ) {
    contradictions.push(`Most retrieved sources are from a different jurisdiction than requested`);
  }

  // 6. Evidence agreement — detect contradictions via IP type and jurisdiction conflicts
  // Check for documents that may give opposing guidance
  const patentDocs = docs.filter(d => d.ipType === "patent");
  const hasPatentBar = patentDocs.some(d => d.content.toLowerCase().includes("not patentable") || d.content.toLowerCase().includes("cannot be patented"));
  const hasPatentOption = patentDocs.some(d => d.content.toLowerCase().includes("patentable") && !d.content.toLowerCase().includes("not patentable"));
  if (hasPatentBar && hasPatentOption) {
    contradictions.push("Sources contain both patentability barriers AND patentability options — classification-dependent analysis required");
  }

  // Check for India vs International regime conflicts
  const indiaOnly = docs.filter(d => d.jurisdiction === "india");
  const intlOnly = docs.filter(d => d.jurisdiction === "international");
  if (indiaOnly.length > 0 && intlOnly.length > 0 && jurisdiction !== "both") {
    contradictions.push("Sources span both Indian and international jurisdictions — provisions may differ");
  }

  // Check for old vs new law conflicts
  const hasOldLaw = docs.some(d => {
    const year = parseInt(d.effectiveDate?.substring(0, 4) || "2024");
    return year < 2020;
  });
  const hasNewAmendment = docs.some(d =>
    d.content.toLowerCase().includes("2023 amendment") || d.content.toLowerCase().includes("2024 rules")
  );
  if (hasOldLaw && hasNewAmendment) {
    contradictions.push("Sources include both pre-amendment and post-amendment provisions — the newer law may override");
  }

  // Compute agreement score: start at 80, penalize for contradictions
  const evidenceAgreement = Math.max(80 - contradictions.length * 15, 10);

  // Weighted overall
  const overall = Math.round(
    retrievalRelevance * 0.25 +
    sourceAuthority * 0.20 +
    citationCoverage * 0.10 +
    currentVersionStatus * 0.15 +
    jurisdictionMatch * 0.15 +
    evidenceAgreement * 0.15
  );

  const shouldAbstain = overall < 25 || retrievalRelevance < 10;

  return {
    overall: Math.min(overall, 95),
    components: {
      retrievalRelevance, sourceAuthority, citationCoverage,
      currentVersionStatus, evidenceAgreement, jurisdictionMatch,
    },
    shouldAbstain,
    abstentionReason: shouldAbstain
      ? overall < 10
        ? "Insufficient evidence. Cannot provide a reliable answer."
        : "Low confidence in retrieved sources. Answer may be incomplete."
      : undefined,
    contradictions,
  };
}

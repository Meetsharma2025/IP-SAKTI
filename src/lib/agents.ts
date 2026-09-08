// Multi-Agent Orchestration — Optimized for NVIDIA Build API latency
// Uses fast local query analysis + single focused LLM call + optional merger
import { callNemotron } from "./nemotron";
import { semanticSearch, computeEvidenceConfidence, type SemanticResult, type ConfidenceAnalysis } from "./semantic-search";

export interface AgentResult {
  agentName: string;
  findings: string;
  citations: string[];
  confidence: number;
  uncertainties: string[];
  requiresEscalation: boolean;
}

export interface OrchestratorResult {
  answer: string;
  agentResults: AgentResult[];
  overallConfidence: number;
  confidenceBreakdown: ConfidenceAnalysis["components"] | null;
  uncertainties: string[];
  contradictions: string[];
  suggestEscalation: boolean;
  escalationReason?: string;
  reasoning?: string;
  docsRetrieved: number;
}

// ===== FAST LOCAL QUERY ANALYSIS (no LLM call) =====
function analyzeQueryLocal(query: string) {
  const lq = query.toLowerCase();
  const intent =
    lq.includes("patent") || lq.includes("section 3") ? "patent" :
    lq.includes("trademark") || lq.includes("brand") || lq.includes("mark") ? "trademark" :
    lq.includes("gi") || lq.includes("geographical") ? "gi" :
    lq.includes("abs") || lq.includes("biodiversity") || lq.includes("benefit sharing") || lq.includes("biological") ? "abs" :
    lq.includes("export") || lq.includes("fda") || lq.includes("eu ") || lq.includes("market") ? "export" :
    lq.includes("classify") || lq.includes("category") || lq.includes("type of") ? "classification" :
    lq.includes("tkdl") || lq.includes("prior art") || lq.includes("traditional knowledge") ? "tkdl" :
    lq.includes("drug") || lq.includes("cosmetic") || lq.includes("fssai") || lq.includes("gmp") || lq.includes("license") ? "regulatory" :
    "general";

  const needsABS = lq.includes("abs") || lq.includes("biolog") || lq.includes("benefit") || lq.includes("nba") || lq.includes("nagoya");
  const needsReg = lq.includes("drug") || lq.includes("regulat") || lq.includes("fssai") || lq.includes("license") || lq.includes("gmp") || lq.includes("export") || lq.includes("fda");

  return { intent, needsABS, needsReg };
}

// ===== BUILD SYSTEM PROMPT BASED ON INTENT =====
function buildSystemPrompt(intent: string, jurisdiction: string): string {
  const jLabel = jurisdiction === "india" ? "Indian law" : "International regimes";

  const base = `You are IP-SAKTI Sahayak, an expert AI assistant for Intellectual Property and regulatory guidance in Ayurveda. Jurisdiction: ${jLabel}.

CRITICAL RULES:
1. Cite specific statute/section/rule/treaty for EVERY legal claim
2. State "This is information only, NOT legal advice"
3. NEVER fabricate legal authority not in the provided sources
4. If sources are insufficient, clearly say "INSUFFICIENT EVIDENCE" for that aspect
5. Use graduated certainty: "likely", "may", "typically" — never absolute determinations
6. Include "Recommended Next Steps" at the end`;

  const focusMap: Record<string, string> = {
    patent: `\nFOCUS: Patent protection — patentability analysis (Section 3(p), 3(d), 3(e)), filing procedure, TKDL implications, inventive step assessment.`,
    trademark: `\nFOCUS: Trademark protection — registration, Nice Classification (Class 3/5), descriptive/generic term restrictions, Madrid Protocol for international.`,
    gi: `\nFOCUS: Geographical Indication — registration process, eligibility, region-specific protection.`,
    abs: `\nFOCUS: Access and Benefit Sharing — BD Act obligations, NBA/SBB requirements, 2023 Amendment exemptions, Nagoya Protocol, compliance steps. Use graduated language: REQUIRED/LIKELY REQUIRED/POSSIBLY REQUIRED/LIKELY EXEMPT.`,
    regulatory: `\nFOCUS: Drug/food/cosmetic regulation — D&C Act classification, manufacturing license, GMP, labelling, advertising (DMRA), FSSAI Ayurveda-Aahar.`,
    export: `\nFOCUS: Export market guidance — regulatory pathways in target markets (US FDA, EU, Japan, Australia, ASEAN), IP strategy for international markets.`,
    tkdl: `\nFOCUS: TKDL and prior art — traditional knowledge documentation, prior art search, defensive protection, biopiracy prevention.`,
    classification: `\nFOCUS: Product classification — classical vs proprietary vs new drug vs phytopharma vs nutraceutical vs cosmetic, regulatory implications of each.`,
    general: `\nFOCUS: Comprehensive IP and regulatory overview — cover patents, trademarks, ABS, regulatory classification as relevant.`,
  };

  return base + (focusMap[intent] || focusMap.general);
}

// ===== MAIN ORCHESTRATOR =====
export async function orchestrateQuery(
  query: string,
  jurisdiction: string,
  language: string = "en"
): Promise<OrchestratorResult> {
  // Step 1: Fast local query analysis
  const { intent, needsABS, needsReg } = analyzeQueryLocal(query);

  // Step 2: Semantic search with knowledge graph
  const docs = await semanticSearch(query, jurisdiction, 10);

  // Step 3: Evidence-based confidence
  const confidence = computeEvidenceConfidence(docs, jurisdiction);

  // Step 4: Safe abstention if no evidence
  if (docs.length === 0 || confidence.shouldAbstain) {
    return {
      answer: `⚠️ **INSUFFICIENT EVIDENCE**\n\nI cannot provide a reliable answer based on available sources.\n\n**Reason:** ${confidence.abstentionReason || "No relevant documents found."}\n\n**Recommended:**\n1. Consult a qualified IP attorney\n2. Visit official sources: ipindia.gov.in, nbaindia.org, cdsco.gov.in\n3. Contact CIPAM or a TISC for IP facilitation\n\n⚠️ This is informational guidance only, NOT legal advice.`,
      agentResults: [],
      overallConfidence: confidence.overall,
      confidenceBreakdown: confidence.components,
      uncertainties: [confidence.abstentionReason || "No sources"],
      contradictions: confidence.contradictions,
      suggestEscalation: true,
      escalationReason: confidence.abstentionReason,
      docsRetrieved: docs.length,
    };
  }

  // Step 5: Build context from retrieved documents
  const context = docs.slice(0, 8).map(d =>
    `[${d.citation}] (Authority: ${d.authorityLevel})\n${d.content.substring(0, 600)}`
  ).join("\n\n---\n\n");

  // Step 6: Single focused LLM call (instead of 3 separate agents)
  const systemPrompt = buildSystemPrompt(intent, jurisdiction);

  let langInstruction = "";
  if (language !== "en") {
    const map: Record<string, string> = { hi: "Hindi", ta: "Tamil", te: "Telugu", bn: "Bengali", mr: "Marathi" };
    langInstruction = `\n\nRESPOND IN ${map[language] || language}. Keep statute references in English.`;
  }

  const userPrompt = `RETRIEVED SOURCES:\n${context}\n\n${confidence.contradictions.length > 0 ? `DETECTED CONTRADICTIONS:\n${confidence.contradictions.join("\n")}\n\n` : ""}USER QUESTION: ${query}${langInstruction}

Provide a comprehensive, source-cited answer. Structure:
1. Direct answer
2. Relevant legal provisions with exact citations
3. ${needsABS ? "ABS compliance implications\n4. " : ""}${needsReg ? "Regulatory considerations\n" + (needsABS ? "5" : "4") + ". " : ""}Recommended next steps

${confidence.overall < 50 ? "⚠️ Evidence confidence is LOW. Acknowledge limitations clearly." : ""}`;

  const agentName = intent === "abs" ? "ABS Compliance Agent" :
    intent === "regulatory" || intent === "export" ? "Regulatory Agent" :
    intent === "classification" ? "Classification Agent" : "IP Protection Agent";

  let answer: string;
  let reasoning: string | undefined;
  let agentConfidence: number;

  try {
    const response = await callNemotron(
      [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      { temperature: 0.2, maxTokens: 3000, reasoning: true }
    );

    answer = response.content;
    reasoning = response.reasoning;

    // Calculate agent confidence from evidence
    const primaryCount = docs.filter(d => d.authorityLevel === "primary").length;
    const hasCitation = answer.includes("Section") || answer.includes("Article") || answer.includes("Rule");
    const hasInsufficient = answer.toLowerCase().includes("insufficient evidence");
    agentConfidence = Math.min(
      Math.round(confidence.overall * 0.6 + (hasCitation ? 15 : 0) + primaryCount * 5 - (hasInsufficient ? 20 : 0)),
      95
    );
  } catch {
    // Fallback: return documents directly
    answer = docs.slice(0, 6).map(d =>
      `**${d.title}**\n${d.content.substring(0, 300)}...\n📎 *${d.citation}*`
    ).join("\n\n---\n\n") + "\n\n⚠️ This is informational guidance only, NOT legal advice.";
    reasoning = undefined;
    agentConfidence = Math.min(confidence.overall - 10, 50);
  }

  const agentResult: AgentResult = {
    agentName,
    findings: answer,
    citations: docs.map(d => d.citation),
    confidence: agentConfidence,
    uncertainties: confidence.overall < 50 ? ["Evidence confidence below ideal threshold"] : [],
    requiresEscalation: agentConfidence < 35,
  };

  return {
    answer,
    agentResults: [agentResult],
    overallConfidence: confidence.overall,
    confidenceBreakdown: confidence.components,
    uncertainties: agentResult.uncertainties,
    contradictions: confidence.contradictions,
    suggestEscalation: agentResult.requiresEscalation || confidence.overall < 30,
    escalationReason: confidence.overall < 30 ? "Evidence confidence below safe threshold." : undefined,
    reasoning,
    docsRetrieved: docs.length,
  };
}

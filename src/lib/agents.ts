// Multi-Agent Orchestration — Fully multilingual responses
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

// Language display names and response instructions
const LANG_CONFIG: Record<string, { name: string; nativeName: string; instruction: string; disclaimer: string; insufficient: string; recommend: string }> = {
  en: {
    name: "English", nativeName: "English",
    instruction: "",
    disclaimer: "⚠️ This is informational guidance only, NOT legal advice.",
    insufficient: "⚠️ **INSUFFICIENT EVIDENCE**\n\nI cannot provide a reliable answer based on available sources.",
    recommend: "**Recommended:**\n1. Consult a qualified IP attorney\n2. Visit official sources: ipindia.gov.in, nbaindia.org\n3. Contact CIPAM or a TISC for IP facilitation",
  },
  hi: {
    name: "Hindi", nativeName: "हिन्दी",
    instruction: "\n\n🔴 अनिवार्य: आपका पूरा उत्तर हिन्दी में होना चाहिए। सभी शीर्षक, व्याख्या, सिफारिशें और निष्कर्ष हिन्दी में लिखें। केवल कानूनी धारा संख्या (जैसे Section 3(p), Article 27) अंग्रेजी में रखें। बाकी सब कुछ हिन्दी में।",
    disclaimer: "⚠️ यह केवल सूचनात्मक मार्गदर्शन है, कानूनी सलाह नहीं।",
    insufficient: "⚠️ **अपर्याप्त साक्ष्य**\n\nउपलब्ध स्रोतों के आधार पर विश्वसनीय उत्तर देना संभव नहीं है।",
    recommend: "**अनुशंसित:**\n1. एक योग्य IP वकील से परामर्श करें\n2. आधिकारिक स्रोत देखें: ipindia.gov.in, nbaindia.org\n3. CIPAM या TISC से संपर्क करें",
  },
  ta: {
    name: "Tamil", nativeName: "தமிழ்",
    instruction: "\n\n🔴 கட்டாயம்: உங்கள் முழு பதிலும் தமிழில் இருக்க வேண்டும். அனைத்து தலைப்புகள், விளக்கங்கள், பரிந்துரைகள் தமிழில் எழுதவும். சட்ட பிரிவு எண்கள் மட்டும் ஆங்கிலத்தில் வைக்கவும்.",
    disclaimer: "⚠️ இது தகவல் வழிகாட்டுதல் மட்டுமே, சட்ட ஆலோசனை அல்ல.",
    insufficient: "⚠️ **போதுமான ஆதாரம் இல்லை**\n\nகிடைக்கும் ஆதாரங்களின் அடிப்படையில் நம்பகமான பதில் அளிக்க முடியவில்லை.",
    recommend: "**பரிந்துரை:**\n1. தகுதியான IP வழக்கறிஞரை அணுகவும்\n2. அதிகாரப்பூர்வ ஆதாரங்களைப் பார்க்கவும்",
  },
  te: {
    name: "Telugu", nativeName: "తెలుగు",
    instruction: "\n\n🔴 తప్పనిసరి: మీ పూర్తి సమాధానం తెలుగులో ఉండాలి. అన్ని శీర్షికలు, వివరణలు, సిఫార్సులు తెలుగులో రాయండి. చట్ట విభాగ సంఖ్యలు మాత్రమే ఆంగ్లంలో ఉంచండి.",
    disclaimer: "⚠️ ఇది సమాచార మార్గదర్శకత్వం మాత్రమే, న్యాయ సలహా కాదు.",
    insufficient: "⚠️ **తగినంత సాక్ష్యం లేదు**\n\nఅందుబాటులో ఉన్న మూలాల ఆధారంగా నమ్మకమైన సమాధానం అందించడం సాధ్యం కాదు.",
    recommend: "**సిఫార్సు:**\n1. అర్హత కలిగిన IP న్యాయవాదిని సంప్రదించండి\n2. అధికారిక మూలాలను చూడండి",
  },
  bn: {
    name: "Bengali", nativeName: "বাংলা",
    instruction: "\n\n🔴 বাধ্যতামূলক: আপনার সম্পূর্ণ উত্তর বাংলায় হতে হবে। সমস্ত শিরোনাম, ব্যাখ্যা, সুপারিশ বাংলায় লিখুন। শুধুমাত্র আইনি ধারা নম্বর ইংরেজিতে রাখুন।",
    disclaimer: "⚠️ এটি শুধুমাত্র তথ্যমূলক নির্দেশিকা, আইনি পরামর্শ নয়।",
    insufficient: "⚠️ **অপর্যাপ্ত প্রমাণ**\n\nউপলব্ধ উৎসের ভিত্তিতে নির্ভরযোগ্য উত্তর দেওয়া সম্ভব নয়।",
    recommend: "**সুপারিশ:**\n1. একজন যোগ্য IP আইনজীবীর সাথে পরামর্শ করুন\n2. অফিসিয়াল সূত্র দেখুন",
  },
  mr: {
    name: "Marathi", nativeName: "मराठी",
    instruction: "\n\n🔴 अनिवार्य: तुमचे संपूर्ण उत्तर मराठीत असले पाहिजे. सर्व शीर्षके, स्पष्टीकरणे, शिफारसी मराठीत लिहा. फक्त कायदेशीर कलम क्रमांक इंग्रजीत ठेवा.",
    disclaimer: "⚠️ हे केवळ माहितीपूर्ण मार्गदर्शन आहे, कायदेशीर सल्ला नाही.",
    insufficient: "⚠️ **अपुरे पुरावे**\n\nउपलब्ध स्रोतांच्या आधारे विश्वसनीय उत्तर देणे शक्य नाही.",
    recommend: "**शिफारस:**\n1. पात्र IP वकिलाचा सल्ला घ्या\n2. अधिकृत स्रोत पहा",
  },
};

function getLangConfig(lang: string) {
  return LANG_CONFIG[lang] || LANG_CONFIG.en;
}

// ===== FAST LOCAL QUERY ANALYSIS =====
function analyzeQueryLocal(query: string) {
  const lq = query.toLowerCase();
  const intent =
    lq.includes("patent") || lq.includes("section 3") || lq.includes("पेटेंट") || lq.includes("आविष्कार") ? "patent" :
    lq.includes("trademark") || lq.includes("brand") || lq.includes("ट्रेडमार्क") || lq.includes("ब्रांड") ? "trademark" :
    lq.includes("gi") || lq.includes("geographical") || lq.includes("भौगोलिक") ? "gi" :
    lq.includes("abs") || lq.includes("biodiversity") || lq.includes("benefit sharing") || lq.includes("जैव विविधता") ? "abs" :
    lq.includes("export") || lq.includes("fda") || lq.includes("eu ") || lq.includes("निर्यात") ? "export" :
    lq.includes("classify") || lq.includes("category") || lq.includes("वर्गीकरण") ? "classification" :
    lq.includes("tkdl") || lq.includes("prior art") || lq.includes("पूर्व कला") || lq.includes("पारंपरिक ज्ञान") ? "tkdl" :
    lq.includes("drug") || lq.includes("cosmetic") || lq.includes("fssai") || lq.includes("दवा") || lq.includes("लाइसेंस") ? "regulatory" :
    "general";

  const needsABS = lq.includes("abs") || lq.includes("biolog") || lq.includes("benefit") || lq.includes("जैव") || lq.includes("लाभ");
  const needsReg = lq.includes("drug") || lq.includes("regulat") || lq.includes("fssai") || lq.includes("license") || lq.includes("export") || lq.includes("नियम") || lq.includes("लाइसेंस");

  return { intent, needsABS, needsReg };
}

// ===== SYSTEM PROMPT =====
function buildSystemPrompt(intent: string, jurisdiction: string, language: string): string {
  const lc = getLangConfig(language);
  const jLabel = jurisdiction === "india"
    ? (language === "hi" ? "भारतीय कानून" : "Indian law")
    : (language === "hi" ? "अंतर्राष्ट्रीय शासन" : "International regimes");

  const base = `You are IP-SAKTI Sahayak, an expert AI assistant for Intellectual Property and regulatory guidance in Ayurveda. Jurisdiction: ${jLabel}.

CRITICAL RULES:
1. Cite specific statute/section/rule/treaty for EVERY legal claim
2. End with: "${lc.disclaimer}"
3. NEVER fabricate legal authority not in the provided sources
4. If sources are insufficient, clearly say "${language === "en" ? "INSUFFICIENT EVIDENCE" : "अपर्याप्त साक्ष्य / INSUFFICIENT EVIDENCE"}"
5. Use graduated certainty language — never absolute determinations
6. Include recommended next steps at the end${lc.instruction}`;

  const focusMap: Record<string, string> = {
    patent: language === "hi"
      ? "\nफोकस: पेटेंट सुरक्षा — पेटेंटयोग्यता विश्लेषण (Section 3(p), 3(d), 3(e)), फाइलिंग प्रक्रिया, TKDL प्रभाव।"
      : "\nFOCUS: Patent protection — patentability analysis (Section 3(p), 3(d), 3(e)), filing procedure, TKDL implications.",
    trademark: language === "hi"
      ? "\nफोकस: ट्रेडमार्क सुरक्षा — पंजीकरण, Nice Classification, वर्णनात्मक/सामान्य शब्द प्रतिबंध।"
      : "\nFOCUS: Trademark protection — registration, Nice Classification, descriptive/generic restrictions.",
    abs: language === "hi"
      ? "\nफोकस: ABS अनुपालन — BD Act दायित्व, NBA/SBB आवश्यकताएं, 2023 संशोधन छूट, नागोया प्रोटोकॉल।"
      : "\nFOCUS: ABS compliance — BD Act obligations, NBA/SBB requirements, 2023 Amendment exemptions, Nagoya Protocol.",
    regulatory: language === "hi"
      ? "\nफोकस: नियामक अनुपालन — D&C Act वर्गीकरण, निर्माण लाइसेंस, GMP, लेबलिंग, विज्ञापन (DMRA), FSSAI।"
      : "\nFOCUS: Regulatory compliance — D&C Act classification, manufacturing license, GMP, labelling, advertising (DMRA), FSSAI.",
    export: language === "hi"
      ? "\nफोकस: निर्यात बाज़ार मार्गदर्शन — लक्ष्य बाज़ारों में नियामक मार्ग, IP रणनीति।"
      : "\nFOCUS: Export market guidance — regulatory pathways in target markets, IP strategy.",
    general: language === "hi"
      ? "\nफोकस: व्यापक IP और नियामक अवलोकन।"
      : "\nFOCUS: Comprehensive IP and regulatory overview.",
  };

  return base + (focusMap[intent] || focusMap.general);
}

// ===== MAIN ORCHESTRATOR =====
export async function orchestrateQuery(
  query: string,
  jurisdiction: string,
  language: string = "en"
): Promise<OrchestratorResult> {
  const lc = getLangConfig(language);
  const { intent, needsABS, needsReg } = analyzeQueryLocal(query);

  // Step 1: Semantic search
  const docs = await semanticSearch(query, jurisdiction, 10);
  const confidence = computeEvidenceConfidence(docs, jurisdiction);

  // Step 2: Safe abstention
  if (docs.length === 0 || confidence.shouldAbstain) {
    return {
      answer: `${lc.insufficient}\n\n**${language === "hi" ? "कारण" : "Reason"}:** ${confidence.abstentionReason || (language === "hi" ? "कोई प्रासंगिक दस्तावेज़ नहीं मिला।" : "No relevant documents found.")}\n\n${lc.recommend}\n\n${lc.disclaimer}`,
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

  // Step 3: Build context
  const context = docs.slice(0, 8).map(d =>
    `[${d.citation}] (Authority: ${d.authorityLevel})\n${d.content.substring(0, 600)}`
  ).join("\n\n---\n\n");

  // Step 4: Build prompt with STRONG language instruction
  const systemPrompt = buildSystemPrompt(intent, jurisdiction, language);

  const structureInstructions = language === "hi"
    ? `व्यापक, स्रोत-उद्धृत उत्तर प्रदान करें। संरचना:
1. सीधा उत्तर
2. प्रासंगिक कानूनी प्रावधान (सटीक उद्धरण के साथ)
3. ${needsABS ? "ABS अनुपालन निहितार्थ\n4. " : ""}${needsReg ? "नियामक विचार\n" + (needsABS ? "5" : "4") + ". " : ""}अनुशंसित अगले कदम`
    : `Provide a comprehensive, source-cited answer. Structure:
1. Direct answer
2. Relevant legal provisions with exact citations
3. ${needsABS ? "ABS compliance implications\n4. " : ""}${needsReg ? "Regulatory considerations\n" + (needsABS ? "5" : "4") + ". " : ""}Recommended next steps`;

  const userPrompt = `RETRIEVED SOURCES:\n${context}\n\n${confidence.contradictions.length > 0 ? `DETECTED CONTRADICTIONS:\n${confidence.contradictions.join("\n")}\n\n` : ""}USER QUESTION: ${query}

${structureInstructions}

${confidence.overall < 50 ? (language === "hi" ? "⚠️ साक्ष्य विश्वसनीयता कम है। सीमाओं को स्पष्ट रूप से स्वीकार करें।" : "⚠️ Evidence confidence is LOW. Acknowledge limitations clearly.") : ""}`;

  const agentName = intent === "abs" ? (language === "hi" ? "ABS अनुपालन एजेंट" : "ABS Compliance Agent") :
    intent === "regulatory" || intent === "export" ? (language === "hi" ? "नियामक एजेंट" : "Regulatory Agent") :
    intent === "classification" ? (language === "hi" ? "वर्गीकरण एजेंट" : "Classification Agent") :
    (language === "hi" ? "IP सुरक्षा एजेंट" : "IP Protection Agent");

  let answer: string;
  let reasoning: string | undefined;
  let agentConfidence: number;

  try {
    const response = await callNemotron(
      [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
      { temperature: 0.2, maxTokens: 1800, reasoning: false, timeoutMs: 20000 }
    );

    answer = response.content;
    reasoning = response.reasoning;

    const primaryCount = docs.filter(d => d.authorityLevel === "primary").length;
    const hasCitation = answer.includes("Section") || answer.includes("Article") || answer.includes("Rule") || answer.includes("धारा") || answer.includes("अनुच्छेद");
    const hasInsufficient = answer.toLowerCase().includes("insufficient") || answer.includes("अपर्याप्त");
    agentConfidence = Math.min(
      Math.round(confidence.overall * 0.6 + (hasCitation ? 15 : 0) + primaryCount * 5 - (hasInsufficient ? 20 : 0)),
      95
    );
  } catch {
    // Fallback: show retrieved documents with localized header
    const fallbackHeader = language === "hi"
      ? "**प्राप्त स्रोत दस्तावेज़ (AI विश्लेषण अनुपलब्ध):**\n\n"
      : language === "ta" ? "**பெறப்பட்ட மூல ஆவணங்கள் (AI பகுப்பாய்வு கிடைக்கவில்லை):**\n\n"
      : language === "te" ? "**పొందిన మూల డాక్యుమెంట్లు (AI విశ్లేషణ అందుబాటులో లేదు):**\n\n"
      : language === "bn" ? "**প্রাপ্ত উৎস নথি (AI বিশ্লেষণ অনুপলব্ধ):**\n\n"
      : language === "mr" ? "**प्राप्त स्रोत कागदपत्रे (AI विश्लेषण अनुपलब्ध):**\n\n"
      : "**Retrieved source documents (AI analysis unavailable):**\n\n";
    answer = fallbackHeader + docs.slice(0, 6).map(d =>
      `**${d.title}**\n${d.content.substring(0, 300)}...\n📎 *${d.citation}*`
    ).join("\n\n---\n\n") + `\n\n${lc.disclaimer}`;
    reasoning = undefined;
    agentConfidence = Math.min(confidence.overall - 10, 50);
  }

  const agentResult: AgentResult = {
    agentName,
    findings: answer,
    citations: docs.map(d => d.citation),
    confidence: agentConfidence,
    uncertainties: confidence.overall < 50
      ? [language === "hi" ? "साक्ष्य विश्वसनीयता आदर्श सीमा से नीचे" : "Evidence confidence below ideal threshold"]
      : [],
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
    escalationReason: confidence.overall < 30
      ? (language === "hi" ? "साक्ष्य विश्वसनीयता सुरक्षित सीमा से नीचे।" : "Evidence confidence below safe threshold.")
      : undefined,
    reasoning,
    docsRetrieved: docs.length,
  };
}

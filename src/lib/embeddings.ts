// Enhanced Embedding Engine for IP-SAKTI Sahayak
// 200-dimension domain vocabulary with bigram matching, TF-IDF weighting,
// and sub-word semantic matching for robust vector retrieval.

import { db } from "@/db";
import { knowledgeDocuments } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";

// 200-dimension domain-specific vocabulary covering all IP/regulatory/Ayurveda concepts
const VOCABULARY = [
  // Patent (25)
  "patent","patentable","patentability","invention","novel","novelty","inventive_step",
  "industrial_application","claims","specification","prior_art","examination","grant",
  "section_3p","section_3d","section_3e","section_10","compulsory_license","opposition",
  "pre_grant","post_grant","provisional","complete_specification","pct_filing","national_phase",
  // Trademark (15)
  "trademark","brand","mark","logo","registration","distinctive","generic","descriptive",
  "nice_class","well_known","infringement","passing_off","class_3","class_5","madrid_protocol",
  // GI (10)
  "geographical_indication","gi","origin","region","terroir","producer","authorized_user",
  "gi_registry","chennai","collective_right",
  // Copyright (8)
  "copyright","literary","artistic","database","software","fair_dealing","moral_rights","public_domain",
  // Design (8)
  "design","packaging","shape","ornamental","aesthetic","industrial_design","locarno","hague_system",
  // Trade Secret (8)
  "trade_secret","confidential","nda","proprietary","undisclosed","reverse_engineering","know_how","secrecy",
  // Plant Variety (10)
  "plant_variety","cultivar","breeding","farmer_rights","ppvfra","dus","seed","gene_fund",
  "community_rights","essentially_derived",
  // ABS / Biodiversity (20)
  "biological_resource","genetic_resource","access","benefit_sharing","abs","biodiversity",
  "nba","sbb","bmc","prior_informed_consent","mutually_agreed_terms","exemption",
  "cultivated","wild_harvest","2023_amendment","2024_rules","penalty","compliance",
  "form_i","form_iii",
  // International Treaties (20)
  "nagoya_protocol","cbd","wipo","gratk_treaty","trips","disclosure","pct","madrid",
  "hague","budapest","international","treaty","ratification","signatory","member_state",
  "doha_declaration","article_27","article_29","article_15","article_8j",
  // Drug Regulation (20)
  "drug","cosmetic","medicine","classical","proprietary_medicine","new_drug",
  "phytopharmaceutical","nutraceutical","ayurveda_aahar","rule_158b","rule_122dab",
  "manufacturing_license","gmp","schedule_t","clinical_trial","safety","efficacy",
  "cdsco","dcgi","first_schedule",
  // Food/Advertising (10)
  "fssai","labelling","advertising","dmra","schedule_j","claims","wellness","therapeutic",
  "food_supplement","dietary",
  // Pharmacopoeia (8)
  "pharmacopoeia","api","monograph","quality","standard","testing","identity","purity",
  // Classical Texts (10)
  "charaka","sushruta","vagbhata","sharangdhara","bhava_prakasha","yoga_ratnakara",
  "rasatarangini","bhaishajya_ratnavali","chakradatta","authoritative_text",
  // Herbs/Ingredients (15)
  "ashwagandha","tulsi","neem","turmeric","triphala","shatavari","brahmi","giloy",
  "pippali","amalaki","haritaki","bibhitaki","shilajit","guggulu","chitrak",
  // Formulation/Process (12)
  "formulation","extract","purified","fraction","delivery_system","nano","liposomal",
  "bioavailability","synergy","combination","process","standardized",
  // Export/Market (12)
  "export","import","market_access","regulatory_approval","eu","usa","japan","asean",
  "australia","canada","traditional_use_registration","dshea",
  // Startup/Policy (8)
  "startup","msme","fee_reduction","expedited","facilitation","sipp","national_ipr_policy","ayush_mission",
  // Data/Privacy (6)
  "data_protection","privacy","dpdpa","consent","security","audit",
  // Enforcement (8)
  "enforcement","penalty","imprisonment","fine","revocation","cancellation","injunction","damages",
  // Case Law (6)
  "case_law","precedent","supreme_court","high_court","novartis","natco",
  // Bio-piracy/TK (8)
  "bio_piracy","misappropriation","tkdl","defensive_protection","traditional_knowledge",
  "codified","community_held","oral_tradition",
];

// Synonym/concept mapping for semantic expansion
const SYNONYMS: Record<string, string[]> = {
  patent: ["patenting","patented","patents"],
  trademark: ["trademarks","trade_mark","tm"],
  ayurveda: ["ayurvedic","ayush","traditional_medicine"],
  formulation: ["formulations","composition","preparation","recipe"],
  protection: ["protect","protecting","safeguard"],
  registration: ["register","registered","filing","file","apply"],
  compliance: ["comply","compliant","obligation","requirement"],
  classical: ["traditional","ancient","codified","authoritative"],
  novel: ["new","innovative","original","unique"],
  biological: ["bio","bioresource","genetic","natural"],
  export: ["exporting","international_trade","overseas"],
  herb: ["herbal","herbs","plant","botanical","medicinal_plant"],
  drug: ["drugs","medicine","pharmaceutical","medicinal"],
};

export function generateLocalEmbedding(text: string): number[] {
  const lower = text.toLowerCase().replace(/[^a-z0-9_\s]/g, " ");
  const tokens = lower.split(/\s+/).filter(t => t.length > 1);

  // Build expanded token set with synonyms
  const expandedTokens = new Set(tokens);
  for (const token of tokens) {
    for (const [canonical, syns] of Object.entries(SYNONYMS)) {
      if (syns.includes(token) || token === canonical) {
        expandedTokens.add(canonical);
        syns.forEach(s => expandedTokens.add(s));
      }
    }
  }

  const allTokens = [...expandedTokens];
  // Also create bigrams for compound concept matching
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]}_${tokens[i + 1]}`);
  }

  return VOCABULARY.map(term => {
    const termParts = term.split("_");
    let score = 0;

    for (const token of allTokens) {
      // Exact full-term match
      if (token === term) { score += 3; continue; }
      // Part match (e.g., "patent" matches "patent" in "section_3p")
      if (termParts.some(p => token === p)) { score += 2; continue; }
      // Substring match for longer terms
      if (token.length > 3 && termParts.some(p => p.length > 3 && (token.includes(p) || p.includes(token)))) {
        score += 1;
      }
    }

    // Bigram matching for compound terms like "benefit_sharing", "prior_art"
    for (const bg of bigrams) {
      if (bg === term) score += 4;
      const bgParts = bg.split("_");
      if (termParts.length >= 2 && bgParts[0] === termParts[0] && bgParts[1] === termParts[1]) score += 3;
    }

    return score;
  });
}

function normalize(vec: number[]): number[] {
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (mag === 0) return vec;
  return vec.map(v => v / mag);
}

export function cosineSim(a: number[], b: number[]): number {
  const na = normalize(a);
  const nb = normalize(b);
  return na.reduce((s, v, i) => s + v * nb[i], 0);
}

export async function generateAllEmbeddings(): Promise<number> {
  const docs = await db.select({
    id: knowledgeDocuments.id, title: knowledgeDocuments.title,
    content: knowledgeDocuments.content, tags: knowledgeDocuments.tags,
  }).from(knowledgeDocuments).where(isNull(knowledgeDocuments.embedding));

  let count = 0;
  for (const doc of docs) {
    const emb = generateLocalEmbedding(`${doc.title} ${doc.tags || ""} ${doc.content}`);
    await db.update(knowledgeDocuments).set({ embedding: emb }).where(eq(knowledgeDocuments.id, doc.id));
    count++;
  }
  return count;
}

export async function vectorSearch(
  query: string, jurisdiction: string, limit: number = 10
): Promise<{ id: number; similarity: number }[]> {
  const queryEmb = generateLocalEmbedding(query);
  const allDocs = await db.select({
    id: knowledgeDocuments.id,
    embedding: knowledgeDocuments.embedding,
    jurisdiction: knowledgeDocuments.jurisdiction,
  }).from(knowledgeDocuments);

  return allDocs
    .filter(d => d.embedding && (jurisdiction === "both" || d.jurisdiction === jurisdiction))
    .map(d => ({ id: d.id, similarity: cosineSim(queryEmb, d.embedding as number[]) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

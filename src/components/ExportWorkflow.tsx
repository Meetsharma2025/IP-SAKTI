"use client";

import { useLanguage } from "./LanguageContext";
import dict from "@/lib/translations";

import { useState } from "react";
import { Globe, ArrowRight, CheckCircle, AlertTriangle, FileText, Shield, ExternalLink } from "lucide-react";

interface MarketInfo {
  country: string;
  flag: string;
  regulator: string;
  category: string;
  pathway: string;
  requirements: string[];
  ipStrategy: string[];
  challenges: string[];
  timeline: string;
  cost: string;
  officialUrl: string;
  absCompliance: string;
}

const markets: Record<string, MarketInfo> = {
  usa: {
    country: "United States", flag: "🇺🇸", regulator: "FDA",
    category: "Dietary Supplement (DSHEA)", pathway: "No pre-market approval; NDI notification if new ingredient",
    requirements: [
      "DSHEA 1994 compliance — classify as dietary supplement",
      "New Dietary Ingredient (NDI) notification if ingredient not marketed before Oct 15, 1994",
      "cGMP compliance (21 CFR Part 111)",
      "Structure/function claims only — NO disease treatment claims",
      "Supplement Facts label panel required",
      "FDA facility registration (FSMA requirement)",
      "Prior notice for imported food/supplements",
    ],
    ipStrategy: [
      "US patent filing via PCT national phase — no Section 3(p) equivalent, but TKDL agreement with USPTO",
      "Trademark via Madrid designation or direct USPTO filing",
      "Trade dress protection for distinctive packaging",
    ],
    challenges: ["NDI requirements for novel herbs", "Strict heavy metal/pesticide limits", "FTC advertising enforcement"],
    timeline: "3-6 months for market entry (no NDI); 6-12 months with NDI",
    cost: "$10,000-50,000 initial compliance", officialUrl: "https://www.fda.gov/food/dietary-supplements",
    absCompliance: "US does not have Nagoya Protocol ratification, but good practice to maintain provenance documentation",
  },
  eu: {
    country: "European Union", flag: "🇪🇺", regulator: "EMA / National Authorities",
    category: "Traditional Herbal Medicinal Product or Food Supplement", pathway: "Traditional Use Registration (TUR) or Food Supplement Directive",
    requirements: [
      "Traditional Use Registration: 30 years traditional use (15 in EU) — simplified registration",
      "Alternative: Food Supplement Directive 2002/46/EC — no therapeutic claims",
      "Full Marketing Authorization if neither pathway applies — very expensive",
      "EU GMP (Directive 2003/94/EC) mandatory",
      "European Pharmacopoeia monographs where available",
      "Heavy metals: Cd <1 ppm, Pb <5 ppm, Hg <0.1 ppm (very strict)",
      "EU ABS Regulation 511/2014 — due diligence for genetic resources",
    ],
    ipStrategy: [
      "European Patent via PCT-EP or direct EPO filing",
      "EU Trademark via Madrid or direct EUIPO filing",
      "Regulatory data exclusivity for clinical submissions",
    ],
    challenges: ["15-year EU use evidence difficult", "Multi-ingredient formulations face complex requirements", "Rasa Shastra preparations restricted"],
    timeline: "12-24 months for TUR; 3-6 months for food supplement",
    cost: "€50,000-200,000 for TUR; €10,000-30,000 for food supplement", officialUrl: "https://www.ema.europa.eu",
    absCompliance: "EU Regulation 511/2014 — mandatory due diligence declarations for users of genetic resources",
  },
  japan: {
    country: "Japan", flag: "🇯🇵", regulator: "MHLW / PMDA",
    category: "Foods with Function Claims or Health Food", pathway: "Notification-based (Foods with Function Claims) or FOSHU approval",
    requirements: [
      "Foods with Function Claims — notification to Consumer Affairs Agency; systematic review evidence sufficient",
      "FOSHU — full clinical evidence required but enables strong health claims",
      "Japanese Pharmacopoeia compliance where monographs exist",
      "Japanese GMP standards compliance",
      "Japanese-language labeling mandatory",
      "Import notification to MHLW quarantine",
    ],
    ipStrategy: [
      "Japanese patent via PCT-JP — JPO receptive to herbal composition patents",
      "Trademark via Madrid designation to JPO",
      "PPH agreement between Indian PO and JPO for faster examination",
    ],
    challenges: ["Language barrier", "Different quality standards", "Limited recognition of Ayurvedic system"],
    timeline: "6-12 months for Foods with Function Claims; 2-3 years for FOSHU",
    cost: "¥5-20 million for Foods with Function Claims", officialUrl: "https://www.mhlw.go.jp",
    absCompliance: "Japan has ABS guidelines implementing Nagoya Protocol — compliance documentation required",
  },
  australia: {
    country: "Australia", flag: "🇦🇺", regulator: "TGA",
    category: "Listed (AUST L) or Registered (AUST R) Medicine", pathway: "AUST L for low-risk complementary medicines",
    requirements: [
      "AUST L (Listed): self-assessed, permitted ingredients only, TGO 102 compliance",
      "AUST R (Registered): full evaluation with clinical evidence",
      "PIC/S GMP required — Schedule T may not be sufficient",
      "Heavy metals: As <5 ppm, Cd <0.3 ppm, Pb <10 ppm, Hg <0.5 ppm",
      "Australian sponsor entity required",
      "Batch testing and stability data",
    ],
    ipStrategy: [
      "Australian patent via PCT-AU — IP Australia examination",
      "Trademark via Madrid or direct IP Australia filing",
    ],
    challenges: ["PIC/S GMP compliance gap", "Limited permitted ingredient list", "Sponsor requirement"],
    timeline: "3-6 months for AUST L; 12-18 months for AUST R",
    cost: "AUD 20,000-100,000", officialUrl: "https://www.tga.gov.au",
    absCompliance: "Australia is Nagoya Protocol party — compliance required for biological resources",
  },
  canada: {
    country: "Canada", flag: "🇨🇦", regulator: "Health Canada",
    category: "Natural Health Product (NHP)", pathway: "Product License via NNHPD",
    requirements: [
      "Product License Application (PLA) to NNHPD",
      "Safety and efficacy evidence — traditional use evidence accepted for 50+ years of use",
      "Site license for manufacturing facility",
      "NHP GMP compliance (Part 3 of NHP Regulations)",
      "Bilingual labeling (English/French) mandatory",
      "NPN (Natural Product Number) must be displayed",
    ],
    ipStrategy: [
      "Canadian patent via PCT-CA — CIPO examination",
      "Trademark via Madrid or direct CIPO filing",
    ],
    challenges: ["Bilingual labeling", "Specific monograph requirements", "Product license processing time"],
    timeline: "6-18 months for NHP license",
    cost: "CAD 15,000-50,000", officialUrl: "https://www.canada.ca/en/health-canada",
    absCompliance: "Canada has implemented Nagoya Protocol provisions",
  },
  asean: {
    country: "ASEAN (Singapore, Thailand, Malaysia)", flag: "🌏", regulator: "HSA / Thai FDA / NPRA",
    category: "Traditional Medicine / Health Supplement", pathway: "Country-specific registration",
    requirements: [
      "Singapore HSA: Health supplement or traditional medicine registration",
      "Thailand FDA: Traditional medicine product registration, herbal supplement",
      "Malaysia NPRA: Traditional product registration with safety/quality data",
      "Common: GMP compliance, safety data, proper labeling in local language",
      "ASEAN TMHS harmonization ongoing but not yet fully implemented",
    ],
    ipStrategy: [
      "Trademarks via Madrid in key ASEAN countries",
      "Patents via PCT national phase in individual countries",
      "India-ASEAN FTA tariff advantages",
    ],
    challenges: ["Country-by-country registration", "Different quality standards", "Local language requirements"],
    timeline: "6-12 months per country",
    cost: "$5,000-30,000 per country", officialUrl: "https://asean.org",
    absCompliance: "Check individual country Nagoya Protocol implementation status",
  },
};

export default function ExportWorkflow() {
  const { language: lang } = useLanguage();
  const t = (k: string) => dict[k]?.[lang] || dict[k]?.en || k;
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const market = selectedMarket ? markets[selectedMarket] : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-earth-800">{ t("exportTitle") }</h1>
        <p className="text-earth-500 mt-2">{t("exportSubtitle")}</p>
      </div>

      {/* Market Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        {Object.entries(markets).map(([key, m]) => (
          <button key={key} onClick={() => setSelectedMarket(key)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedMarket === key
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-earth-200 hover:border-blue-300 hover:bg-blue-50/50"
            }`}>
            <div className="text-2xl mb-1">{m.flag}</div>
            <div className="font-semibold text-earth-800 text-sm">{m.country}</div>
            <div className="text-xs text-earth-500">{m.regulator}</div>
          </button>
        ))}
      </div>

      {/* Market Details */}
      {market && (
        <div className="animate-fade-in space-y-4">
          <div className="bg-gradient-to-br from-blue-50 to-earth-50 rounded-2xl border border-blue-200 p-6">
            <h2 className="text-2xl font-bold text-earth-800">{market.flag} {market.country}</h2>
            <p className="text-sm text-earth-600 mt-1">Regulator: <strong>{market.regulator}</strong></p>
            <p className="text-sm text-earth-600">Category: <strong>{market.category}</strong></p>
            <p className="text-sm text-earth-600">Pathway: {market.pathway}</p>
            <div className="flex gap-3 mt-3 text-xs">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">⏱ {market.timeline}</span>
              <span className="bg-earth-100 text-earth-700 px-3 py-1 rounded-full">💰 {market.cost}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-earth-200 p-6">
            <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-blue-600" /> Regulatory Requirements
            </h3>
            <ul className="space-y-2">
              {market.requirements.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-earth-600">
                  <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" /> {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl border border-earth-200 p-6">
            <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-saffron-600" /> IP Strategy
            </h3>
            <ul className="space-y-2">
              {market.ipStrategy.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-earth-600">
                  <ArrowRight className="w-4 h-4 text-saffron-500 mt-0.5 shrink-0" /> {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
            <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> Key Challenges
            </h3>
            <ul className="space-y-1">
              {market.challenges.map((c, i) => (
                <li key={i} className="text-sm text-amber-700">⚠️ {c}</li>
              ))}
            </ul>
          </div>

          <div className="bg-ayurveda-50 rounded-2xl border border-ayurveda-200 p-6">
            <h3 className="text-lg font-bold text-earth-800 mb-2">ABS Compliance for Export</h3>
            <p className="text-sm text-earth-600">{market.absCompliance}</p>
          </div>

          <div className="flex gap-3 justify-center">
            <a href={market.officialUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
              <ExternalLink className="w-4 h-4" /> Official Regulator Website
            </a>
            <a href="/chat" className="inline-flex items-center gap-2 px-5 py-2.5 bg-saffron-600 text-white rounded-xl text-sm font-medium hover:bg-saffron-700">
              Ask IP Assistant <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-xs text-earth-400">
        ⚠️ Export regulations change frequently. Verify current requirements with official sources before export.
      </div>
    </div>
  );
}

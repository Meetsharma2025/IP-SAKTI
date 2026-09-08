"use client";

import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "./LanguageContext";
import {
  Search,
  BookOpen,
  Filter,
  ExternalLink,
  FileText,
  Globe,
  Loader2,
} from "lucide-react";

interface KnowledgeDoc {
  id: number;
  title: string;
  category: string;
  jurisdiction: string;
  ipType: string;
  content: string;
  citation: string;
  sourceUrl: string | null;
  version: string | null;
  effectiveDate: string | null;
  tags: string | null;
}

const ipTypeLabels: Record<string, string> = {
  patent: "📋 Patent",
  trademark: "™️ Trademark",
  gi: "🌍 GI",
  copyright: "©️ Copyright",
  design: "🎨 Design",
  trade_secret: "🔒 Trade Secret",
  plant_variety: "🌿 Plant Variety",
  abs: "🧬 ABS",
  regulatory: "⚖️ Regulatory",
};

const categoryLabels: Record<string, string> = {
  statute: "📜 Statute",
  rule: "📑 Rule",
  treaty: "🤝 Treaty",
  case_law: "⚖️ Case Law",
  guidance: "📖 Guidance",
  pharmacopoeia: "💊 Pharmacopoeia",
};

export default function KnowledgeBaseView() {
  const { language: lang } = useLanguage();
  const isHi = lang === "hi";
  const t = (k: string) => {
    const d: Record<string, Record<string, string>> = {
      knowledgeBase: { en: "Knowledge Base", hi: "ज्ञान आधार", ta: "அறிவு தளம்", te: "జ్ఞాన భాండాగారం", bn: "জ্ঞান ভাণ্ডার", mr: "ज्ञान भांडार" },
      knowledgeSubtitle: { en: "Browse curated statutes, rules, treaties, and guidance for Ayurvedic IP", hi: "आयुर्वेदिक IP के लिए कानून, नियम, संधियाँ और मार्गदर्शन ब्राउज़ करें", ta: "சட்டங்கள், விதிகள், ஒப்பந்தங்கள் உலாவுங்கள்", te: "చట్టాలు, నిబంధనలు, ఒప్పందాలు బ్రౌజ్ చేయండి", bn: "আইন, নিয়ম, চুক্তি ব্রাউজ করুন", mr: "कायदे, नियम, करार ब्राउज करा" },
      searchKB: { en: "Search knowledge base...", hi: "ज्ञान आधार खोजें...", ta: "அறிவு தளத்தில் தேடுங்கள்...", te: "జ్ఞాన భాండాగారంలో వెతకండి...", bn: "জ্ঞান ভাণ্ডারে অনুসন্ধান...", mr: "ज्ञान भांडारात शोधा..." },
      noDocsFound: { en: "No documents found. Try different filters.", hi: "कोई दस्तावेज़ नहीं मिला। अलग फ़िल्टर आज़माएं।", ta: "ஆவணங்கள் கிடைக்கவில்லை.", te: "డాక్యుమెంట్లు కనుగొనబడలేదు.", bn: "নথি পাওয়া যায়নি।", mr: "कागदपत्रे सापडली नाहीत." },
      viewSource: { en: "View Source", hi: "स्रोत देखें", ta: "மூலத்தைக் காண்", te: "మూలం చూడండి", bn: "উৎস দেখুন", mr: "स्रोत पहा" },
    };
    return d[k]?.[lang] || d[k]?.en || k;
  };
  const [documents, setDocuments] = useState<KnowledgeDoc[]>([]);
  const [search, setSearch] = useState("");
  const [jurisdiction, setJurisdiction] = useState("");
  const [ipType, setIpType] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (jurisdiction) params.set("jurisdiction", jurisdiction);
      if (ipType) params.set("ipType", ipType);

      const response = await fetch(`/api/knowledge?${params.toString()}`);
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [search, jurisdiction, ipType]);

  useEffect(() => {
    const timer = setTimeout(fetchDocuments, 300);
    return () => clearTimeout(timer);
  }, [fetchDocuments]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-earth-800 flex items-center justify-center gap-2">
          <BookOpen className="w-8 h-8 text-saffron-600" />
          {t("knowledgeBase")}
        </h1>
        <p className="text-earth-500 mt-2">
          {t("knowledgeSubtitle")}
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-earth-200 p-4 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-earth-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchKB")}
              className="w-full pl-10 pr-4 py-2.5 border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              className="px-3 py-2.5 border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm bg-white"
            >
              <option value="">All Jurisdictions</option>
              <option value="india">🇮🇳 India</option>
              <option value="international">🌎 International</option>
            </select>
            <select
              value={ipType}
              onChange={(e) => setIpType(e.target.value)}
              className="px-3 py-2.5 border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm bg-white"
            >
              <option value="">All IP Types</option>
              <option value="patent">Patent</option>
              <option value="trademark">Trademark</option>
              <option value="gi">GI</option>
              <option value="copyright">Copyright</option>
              <option value="design">Design</option>
              <option value="trade_secret">Trade Secret</option>
              <option value="plant_variety">Plant Variety</option>
              <option value="abs">ABS</option>
              <option value="regulatory">Regulatory</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-saffron-500 animate-spin mx-auto mb-3" />
          <p className="text-earth-500 text-sm">Loading knowledge base...</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-earth-200">
          <Filter className="w-12 h-12 text-earth-300 mx-auto mb-3" />
          <p className="text-earth-500">{t('noDocsFound')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-earth-500">{documents.length} documents found</p>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-earth-200 hover:border-saffron-300 transition-all shadow-sm"
            >
              <div
                className="p-5 cursor-pointer"
                onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-earth-800 text-sm leading-snug">
                      {doc.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          doc.jurisdiction === "india"
                            ? "bg-saffron-100 text-saffron-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {doc.jurisdiction === "india" ? "🇮🇳 India" : "🌎 International"}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-earth-100 text-earth-600">
                        {ipTypeLabels[doc.ipType] || doc.ipType}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-earth-100 text-earth-600">
                        {categoryLabels[doc.category] || doc.category}
                      </span>
                      {doc.version && (
                        <span className="text-xs text-earth-400">v{doc.version}</span>
                      )}
                    </div>
                    <p className="text-xs text-earth-500 mt-1">📎 {doc.citation}</p>
                  </div>
                  <FileText className="w-5 h-5 text-earth-400 shrink-0" />
                </div>
              </div>

              {expandedId === doc.id && (
                <div className="px-5 pb-5 pt-0 border-t border-earth-100 animate-fade-in">
                  <div className="mt-4 text-sm text-earth-600 leading-relaxed whitespace-pre-line">
                    {doc.content}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {doc.tags?.split(",").map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs bg-saffron-50 text-saffron-600 px-2 py-0.5 rounded-full"
                      >
                        #{tag.trim()}
                      </span>
                    ))}
                  </div>
                  {doc.sourceUrl && (
                    <a
                      href={doc.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 text-xs text-saffron-600 hover:text-saffron-800 font-medium"
                    >
                      <Globe className="w-3 h-3" />
                      View Source
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Search, BookOpen, AlertTriangle, Loader2, Shield, CheckCircle,
  AlertCircle, ExternalLink, ArrowRight, Info, Brain,
} from "lucide-react";

interface TKDLResult {
  analysis: string;
  priorArtRisk: "high" | "medium" | "low" | "unknown";
  recommendations: string[];
  relevantSources: string[];
  reasoning?: string;
}

export default function TKDLSearch() {
  const [formulation, setFormulation] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [therapeuticUse, setTherapeuticUse] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TKDLResult | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  const handleSearch = async () => {
    if (!formulation.trim() && !ingredients.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const query = `TKDL prior art check for: ${formulation}. Ingredients: ${ingredients}. Therapeutic use: ${therapeuticUse}. Is this traditional knowledge? Is it documented in authoritative Ayurvedic texts? What is the prior art risk for patent filing?`;

      const response = await fetch("/api/tkdl-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formulation, ingredients, therapeuticUse, query }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const riskColors = {
    high: { bg: "bg-red-50 border-red-200", text: "text-red-700", badge: "bg-red-100 text-red-800", label: "High Prior-Art Risk" },
    medium: { bg: "bg-saffron-50 border-saffron-200", text: "text-saffron-700", badge: "bg-saffron-100 text-saffron-800", label: "Medium Prior-Art Risk" },
    low: { bg: "bg-ayurveda-50 border-ayurveda-200", text: "text-ayurveda-700", badge: "bg-ayurveda-100 text-ayurveda-800", label: "Low Prior-Art Risk" },
    unknown: { bg: "bg-earth-50 border-earth-200", text: "text-earth-700", badge: "bg-earth-100 text-earth-800", label: "Risk Unknown — Verify Manually" },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-earth-600 to-earth-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-earth-800">TKDL / Prior-Art Check</h1>
        <p className="text-earth-500 mt-2 max-w-lg mx-auto">
          Check if your formulation may overlap with documented traditional knowledge before pursuing patent protection
        </p>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
        <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div className="text-xs text-amber-800">
          <strong>Important:</strong> This tool does NOT search the actual TKDL database (which has restricted access under confidentiality agreements with patent offices). It analyzes your formulation against publicly known Ayurvedic traditional knowledge from authoritative texts to identify <em>potential</em> prior-art overlap. For definitive TKDL verification, the Indian Patent Office conducts formal TKDL searches during patent examination.
        </div>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm mb-6">
        <h2 className="text-lg font-bold text-earth-800 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-saffron-600" />
          Describe Your Formulation
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">
              Formulation Name *
            </label>
            <input type="text" value={formulation} onChange={e => setFormulation(e.target.value)}
              placeholder="e.g., Modified Triphala Churna, Ashwagandha Nanoformulation..."
              className="w-full px-4 py-3 border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">
              Key Ingredients *
            </label>
            <textarea value={ingredients} onChange={e => setIngredients(e.target.value)}
              placeholder="List main ingredients, e.g.: Withania somnifera (Ashwagandha) root extract, Piper longum (Pippali), Glycyrrhiza glabra (Yashtimadhu)..."
              rows={3} className="w-full px-4 py-3 border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm resize-none" />
          </div>

          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">
              Claimed Therapeutic Use / Indication
            </label>
            <input type="text" value={therapeuticUse} onChange={e => setTherapeuticUse(e.target.value)}
              placeholder="e.g., Immune modulation, anti-inflammatory, digestive health..."
              className="w-full px-4 py-3 border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm" />
          </div>

          <button onClick={handleSearch}
            disabled={loading || (!formulation.trim() && !ingredients.trim())}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-earth-600 to-earth-700 text-white rounded-xl hover:from-earth-700 hover:to-earth-800 disabled:opacity-50 transition-all shadow-md font-medium">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing against known TK sources...</>
            ) : (
              <><Search className="w-4 h-4" /> Check Prior Art / TK Overlap</>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="animate-fade-in space-y-4">
          {/* Risk Badge */}
          <div className={`rounded-2xl border p-6 ${riskColors[result.priorArtRisk].bg}`}>
            <div className="flex items-center gap-3 mb-3">
              {result.priorArtRisk === "high" ? <AlertCircle className="w-6 h-6 text-red-600" /> :
               result.priorArtRisk === "low" ? <CheckCircle className="w-6 h-6 text-ayurveda-600" /> :
               <AlertTriangle className="w-6 h-6 text-saffron-600" />}
              <span className={`text-lg font-bold ${riskColors[result.priorArtRisk].text}`}>
                {riskColors[result.priorArtRisk].label}
              </span>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${riskColors[result.priorArtRisk].badge}`}>
                {result.priorArtRisk.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Analysis */}
          <div className="bg-white rounded-2xl border border-earth-200 p-6">
            <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Prior-Art Analysis
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Nemotron 3 Ultra</span>
            </h3>
            <div className="text-sm text-earth-700 leading-relaxed whitespace-pre-line">
              {result.analysis}
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="bg-white rounded-2xl border border-earth-200 p-6">
              <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-3">
                <ArrowRight className="w-5 h-5 text-saffron-600" />
                Recommended Actions
              </h3>
              <ol className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-earth-600">
                    <span className="w-5 h-5 rounded-full bg-saffron-100 text-saffron-700 flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Relevant Sources */}
          {result.relevantSources.length > 0 && (
            <div className="bg-earth-50 rounded-2xl border border-earth-200 p-6">
              <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-earth-600" />
                Potentially Relevant TK Sources
              </h3>
              <ul className="space-y-1">
                {result.relevantSources.map((s, i) => (
                  <li key={i} className="text-sm text-earth-600 flex items-start gap-2">
                    <span>📎</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reasoning */}
          {result.reasoning && (
            <div className="mt-2">
              <button onClick={() => setShowReasoning(!showReasoning)}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                <Brain className="w-3 h-3" /> {showReasoning ? "Hide" : "Show"} AI Reasoning
              </button>
              {showReasoning && (
                <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800 max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {result.reasoning}
                </div>
              )}
            </div>
          )}

          {/* Official TKDL reference */}
          <div className="bg-saffron-50 rounded-2xl border border-saffron-200 p-6">
            <h3 className="font-bold text-earth-800 flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-saffron-600" />
              Official TKDL Resources
            </h3>
            <p className="text-sm text-earth-600 mb-3">
              For authoritative TKDL verification, the Indian Patent Office has formal access agreements with TKDL. These resources may help:
            </p>
            <div className="space-y-2">
              <a href="https://tkdl.res.in" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-saffron-700 hover:text-saffron-900 font-medium">
                <ExternalLink className="w-3.5 h-3.5" /> TKDL Official Portal (tkdl.res.in)
              </a>
              <a href="https://ipindia.gov.in" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-saffron-700 hover:text-saffron-900 font-medium">
                <ExternalLink className="w-3.5 h-3.5" /> IP India Portal (ipindia.gov.in)
              </a>
              <a href="https://www.ayush.gov.in" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-saffron-700 hover:text-saffron-900 font-medium">
                <ExternalLink className="w-3.5 h-3.5" /> Ministry of AYUSH (ayush.gov.in)
              </a>
            </div>
          </div>

          <div className="text-center">
            <a href="/chat" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-xl font-medium shadow-md">
              Ask IP Assistant for More Details <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      <div className="mt-6 text-center text-xs text-earth-400">
        ⚠️ This analysis is informational only. It does not replace formal TKDL search by the Patent Office.
      </div>
    </div>
  );
}

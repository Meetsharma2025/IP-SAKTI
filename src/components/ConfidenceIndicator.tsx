"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ConfidenceBreakdown {
  retrievalRelevance: number;
  sourceAuthority: number;
  citationCoverage: number;
  currentVersionStatus: number;
  evidenceAgreement: number;
  jurisdictionMatch: number;
}

interface ConfidenceIndicatorProps {
  score: number;
  breakdown?: ConfidenceBreakdown;
}

export default function ConfidenceIndicator({ score, breakdown }: ConfidenceIndicatorProps) {
  const [expanded, setExpanded] = useState(false);

  const getColor = () => {
    if (score >= 70) return { bg: "bg-ayurveda-500", text: "text-ayurveda-700", label: "Strong Evidence" };
    if (score >= 40) return { bg: "bg-saffron-500", text: "text-saffron-700", label: "Moderate Evidence" };
    if (score >= 20) return { bg: "bg-amber-500", text: "text-amber-700", label: "Limited Evidence" };
    return { bg: "bg-red-500", text: "text-red-700", label: "Insufficient" };
  };

  const { bg, text, label } = getColor();

  const breakdownLabels: Record<string, string> = {
    retrievalRelevance: "Retrieval Relevance",
    sourceAuthority: "Source Authority",
    citationCoverage: "Citation Coverage",
    currentVersionStatus: "Version Currency",
    evidenceAgreement: "Evidence Agreement",
    jurisdictionMatch: "Jurisdiction Match",
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="text-xs font-medium text-earth-500">Evidence:</div>
        <div className="flex items-center gap-1.5">
          <div className="w-20 h-2 bg-earth-200 rounded-full overflow-hidden">
            <div className={`h-full ${bg} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
          </div>
          <span className={`text-xs font-semibold ${text}`}>{score}%</span>
          <span className="text-xs text-earth-400">({label})</span>
        </div>
        {breakdown && (
          <button onClick={() => setExpanded(!expanded)} className="text-earth-400 hover:text-earth-600">
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>
      {expanded && breakdown && (
        <div className="mt-2 p-2 bg-earth-50 rounded-lg space-y-1 animate-fade-in">
          {Object.entries(breakdown).map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-earth-500 w-32 shrink-0">{breakdownLabels[key] || key}:</span>
              <div className="flex-1 h-1.5 bg-earth-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${
                  value >= 70 ? "bg-ayurveda-400" : value >= 40 ? "bg-saffron-400" : "bg-red-400"
                }`} style={{ width: `${value}%` }} />
              </div>
              <span className="text-xs text-earth-400 w-8 text-right">{value}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

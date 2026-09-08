"use client";

import { BookOpen, ExternalLink } from "lucide-react";

interface Citation {
  citation: string;
  title: string;
  sourceUrl: string | null;
  relevance: string;
}

interface CitationCardProps {
  citations: Citation[];
}

export default function CitationCard({ citations }: CitationCardProps) {
  if (!citations || citations.length === 0) return null;

  const getRelevanceColor = (relevance: string) => {
    switch (relevance) {
      case "High":
        return "bg-ayurveda-100 text-ayurveda-700 border-ayurveda-300";
      case "Medium":
        return "bg-saffron-100 text-saffron-700 border-saffron-300";
      default:
        return "bg-earth-100 text-earth-600 border-earth-300";
    }
  };

  return (
    <div className="mt-4 bg-white rounded-xl border border-earth-200 overflow-hidden">
      <div className="px-4 py-3 bg-earth-100 border-b border-earth-200 flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-earth-600" />
        <h4 className="text-sm font-semibold text-earth-700">
          Sources & Citations ({citations.length})
        </h4>
      </div>
      <div className="divide-y divide-earth-100">
        {citations.map((cite, idx) => (
          <div
            key={idx}
            className="px-4 py-3 hover:bg-saffron-50/50 transition-colors animate-slide-in"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-earth-800 truncate">
                  {cite.title}
                </p>
                <p className="text-xs text-earth-500 mt-0.5">
                  📎 {cite.citation}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${getRelevanceColor(
                    cite.relevance
                  )}`}
                >
                  {cite.relevance}
                </span>
                {cite.sourceUrl && (
                  <a
                    href={cite.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-saffron-500 hover:text-saffron-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

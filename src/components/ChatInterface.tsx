"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Loader2,
  AlertTriangle,
  UserCircle,
  Bot,
  Sparkles,
  ArrowUpRight,
  Brain,
  ChevronDown,
  ChevronUp,
  Database,
  Globe,
  Languages,
  ShieldAlert,
  Layers,
  AlertCircle,
} from "lucide-react";
import JurisdictionToggle from "./JurisdictionToggle";
import ConfidenceIndicator from "./ConfidenceIndicator";
import CitationCard from "./CitationCard";
import VoiceInput, { SpeakButton } from "./VoiceInput";

interface Citation {
  citation: string;
  title: string;
  sourceUrl: string | null;
  relevance: string;
}

interface AgentTrace {
  name: string;
  confidence: number;
  uncertainties: string[];
}

interface ConfidenceBreakdown {
  retrievalRelevance: number;
  sourceAuthority: number;
  citationCoverage: number;
  currentVersionStatus: number;
  evidenceAgreement: number;
  jurisdictionMatch: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  confidence?: number;
  confidenceBreakdown?: ConfidenceBreakdown;
  jurisdiction?: string;
  suggestEscalation?: boolean;
  escalationReason?: string;
  contradictions?: string[];
  reasoning?: string;
  model?: string;
  retrievedDocs?: number;
  agentTrace?: AgentTrace[];
  uncertainties?: string[];
}

const suggestedQuestions = [
  "Can I patent a classical Ayurvedic formulation like Triphala?",
  "What are the ABS requirements for using Ashwagandha commercially?",
  "How do I register a trademark for my Ayurvedic brand?",
  "What is the TKDL and how does it prevent bio-piracy?",
  "What is the difference between Section 3(p) and Section 3(d)?",
  "How can I file a patent internationally through PCT?",
  "What are FSSAI Ayurveda-Aahar regulations?",
  "What does the 2024 WIPO GRATK Treaty mean for Ayurveda?",
  "How do I export Ayurvedic products to the EU?",
  "What GI protection is available for medicinal plants?",
];

type Language = "en" | "hi" | "ta" | "te" | "bn" | "mr";
const languageOptions: { code: Language; name: string }[] = [
  { code: "en", name: "English" }, { code: "hi", name: "हिन्दी" },
  { code: "ta", name: "தமிழ்" }, { code: "te", name: "తెలుగు" },
  { code: "bn", name: "বাংলা" }, { code: "mr", name: "मराठी" },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [jurisdiction, setJurisdiction] = useState("india");
  const [language, setLanguage] = useState<Language>("en");
  const [expandedSection, setExpandedSection] = useState<Record<string, boolean>>({});
  const [sessionId] = useState(`chat_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleSection = (key: string) => {
    setExpandedSection(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sendMessage = async (query: string) => {
    if (!query.trim() || loading) return;
    const userMessage: Message = { role: "user", content: query.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), jurisdiction, sessionId, language }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, {
        role: "assistant",
        content: data.answer || data.error || "Unable to process your query.",
        citations: data.citations,
        confidence: data.confidence,
        confidenceBreakdown: data.confidenceBreakdown,
        jurisdiction: data.jurisdiction,
        suggestEscalation: data.suggestEscalation,
        escalationReason: data.escalationReason,
        reasoning: data.reasoning,
        model: data.model,
        retrievedDocs: data.retrievedDocs,
        agentTrace: data.agentTrace,
        uncertainties: data.uncertainties,
        contradictions: data.contradictions,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, an error occurred. Please try again.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      const t = line.trim();
      if (!t) return <br key={i} />;
      if (t.startsWith("### ")) return <h4 key={i} className="font-bold text-earth-800 mt-3 mb-1 text-sm">{t.slice(4)}</h4>;
      if (t.startsWith("## ")) return <h3 key={i} className="font-bold text-earth-800 mt-4 mb-1 text-base">{t.slice(3)}</h3>;
      if (t.startsWith("# ")) return <h3 key={i} className="font-bold text-earth-800 mt-4 mb-1 text-lg">{t.slice(2)}</h3>;
      if (t.startsWith("⚠️")) return <p key={i} className="text-xs text-saffron-700 bg-saffron-50 p-2 rounded-lg mt-2 font-medium">{t}</p>;
      if (t.startsWith("- ") || t.startsWith("• ")) return <li key={i} className="ml-4 text-sm leading-relaxed list-disc">{inlineFmt(t.slice(2))}</li>;
      if (/^\d+\.\s/.test(t)) return <li key={i} className="ml-4 text-sm leading-relaxed list-decimal">{inlineFmt(t.replace(/^\d+\.\s*/, ""))}</li>;
      if (t.startsWith("📎")) return <p key={i} className="text-xs text-earth-500 italic mt-1">{t}</p>;
      return <p key={i} className="text-sm leading-relaxed">{inlineFmt(t)}</p>;
    });
  };

  const inlineFmt = (text: string) => {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={j} className="text-saffron-700 font-semibold">{part.slice(2, -2)}</strong>
        : <span key={j}>{part}</span>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-earth-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-saffron-500" />
            IP Assistant
            <span className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
              Multi-Agent RAG
            </span>
          </h1>
          <p className="text-xs text-earth-500 mt-1">
            Nemotron 3 Ultra • Multi-agent orchestration • Hybrid retrieval • Citation-grounded
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <JurisdictionToggle value={jurisdiction} onChange={setJurisdiction} />
          <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-earth-200 p-1">
            <Languages className="w-4 h-4 text-earth-400 ml-2" />
            <select value={language} onChange={e => setLanguage(e.target.value as Language)}
              className="text-sm bg-transparent border-none focus:outline-none pr-2 py-1.5 text-earth-600">
              {languageOptions.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-saffron-50 border border-saffron-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-saffron-600 mt-0.5 shrink-0" />
        <p className="text-xs text-saffron-800">
          <strong>Legal Disclaimer:</strong> This tool provides informational guidance only, NOT legal advice. Answers are grounded in retrieved sources but may contain errors. Always consult a qualified IP attorney. Compliant with DPDPA 2023.
        </p>
      </div>

      {/* Jurisdiction + Architecture Indicator */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
          jurisdiction === "india" ? "bg-saffron-100 text-saffron-700 border border-saffron-300"
            : "bg-blue-100 text-blue-700 border border-blue-300"
        }`}>
          {jurisdiction === "india" ? "🇮🇳" : "🌎"} {jurisdiction === "india" ? "Indian Law" : "International Regimes"}
        </div>
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-purple-50 text-purple-600 border border-purple-200">
          <Layers className="w-3 h-3" /> Multi-Agent Pipeline
        </div>
      </div>

      {/* Chat */}
      <div className="bg-white rounded-2xl border border-earth-200 shadow-sm min-h-[400px] max-h-[600px] overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-saffron-500 to-ayurveda-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-earth-600 mb-2">IP-SAKTI Sahayak</h3>
            <p className="text-xs text-earth-400 mb-1 max-w-lg mx-auto">
              Multi-agent RAG pipeline: Query Analyzer → IP Agent + Regulatory Agent + ABS Agent → Evidence Merger → Citation Validator → Grounded Answer
            </p>
            <p className="text-xs text-earth-400 mb-6 max-w-lg mx-auto">
              Hybrid search (trigram + keyword) over version-tracked legal corpus. Safe abstention on insufficient evidence.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
              {suggestedQuestions.slice(0, 8).map((q, i) => (
                <button key={i} onClick={() => sendMessage(q)}
                  className="text-left text-xs p-3 bg-earth-50 hover:bg-saffron-50 border border-earth-200 hover:border-saffron-300 rounded-lg text-earth-600 hover:text-saffron-700 transition-colors">
                  <ArrowUpRight className="w-3 h-3 inline mr-1 opacity-50" />{q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-saffron-500 to-ayurveda-600 flex items-center justify-center shrink-0 shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-saffron-500 text-white rounded-2xl rounded-br-sm px-4 py-3"
                    : "bg-earth-50 rounded-2xl rounded-bl-sm px-4 py-3"
                }`}>
                  {msg.role === "user" ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <div className="prose-response text-earth-700">
                      {renderContent(msg.content)}

                      {/* Meta bar */}
                      <div className="mt-3 pt-3 border-t border-earth-200 flex flex-wrap items-center gap-2">
                        {msg.confidence !== undefined && <ConfidenceIndicator score={msg.confidence} breakdown={msg.confidenceBreakdown} />}
                        <SpeakButton text={msg.content} language={language} />
                        {msg.model && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full border border-purple-200 flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            {msg.model.includes("multi-agent") ? "Multi-Agent" : msg.model.includes("nemotron") ? "Nemotron" : msg.model}
                          </span>
                        )}
                        {msg.retrievedDocs !== undefined && (
                          <span className="text-xs bg-earth-100 text-earth-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Database className="w-3 h-3" /> {msg.retrievedDocs} sources
                          </span>
                        )}
                        {msg.jurisdiction && (
                          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            msg.jurisdiction === "india" ? "bg-saffron-100 text-saffron-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            <Globe className="w-3 h-3" />
                            {msg.jurisdiction === "india" ? "Indian Law" : "International"}
                          </span>
                        )}
                      </div>

                      {/* Contradictions */}
                      {msg.contradictions && msg.contradictions.length > 0 && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs font-medium text-red-700 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Contradictions Detected:
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {msg.contradictions.map((c, i) => (
                              <li key={i} className="text-xs text-red-600">⚠️ {c}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Uncertainties */}
                      {msg.uncertainties && msg.uncertainties.length > 0 && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                          <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Uncertainties Flagged:
                          </p>
                          <ul className="mt-1 space-y-0.5">
                            {msg.uncertainties.map((u, i) => (
                              <li key={i} className="text-xs text-amber-600">• {u}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Agent Trace */}
                      {msg.agentTrace && msg.agentTrace.length > 0 && (
                        <div className="mt-2">
                          <button onClick={() => toggleSection(`agents-${idx}`)}
                            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium">
                            <Layers className="w-3 h-3" />
                            {expandedSection[`agents-${idx}`] ? "Hide" : "Show"} Agent Details ({msg.agentTrace.length} agents)
                            {expandedSection[`agents-${idx}`] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {expandedSection[`agents-${idx}`] && (
                            <div className="mt-2 space-y-2 animate-fade-in">
                              {msg.agentTrace.map((agent, ai) => (
                                <div key={ai} className="p-2 bg-purple-50 border border-purple-200 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-purple-700">{agent.name}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      agent.confidence >= 70 ? "bg-ayurveda-100 text-ayurveda-700" :
                                      agent.confidence >= 40 ? "bg-saffron-100 text-saffron-700" :
                                      "bg-red-100 text-red-700"
                                    }`}>
                                      {agent.confidence}% confidence
                                    </span>
                                  </div>
                                  {agent.uncertainties.length > 0 && (
                                    <div className="mt-1">
                                      {agent.uncertainties.map((u, ui) => (
                                        <p key={ui} className="text-xs text-purple-600">⚠️ {u}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Reasoning */}
                      {msg.reasoning && (
                        <div className="mt-2">
                          <button onClick={() => toggleSection(`reasoning-${idx}`)}
                            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium">
                            <Brain className="w-3 h-3" />
                            {expandedSection[`reasoning-${idx}`] ? "Hide" : "Show"} AI Reasoning
                            {expandedSection[`reasoning-${idx}`] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {expandedSection[`reasoning-${idx}`] && (
                            <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800 max-h-48 overflow-y-auto animate-fade-in whitespace-pre-wrap">
                              {msg.reasoning}
                            </div>
                          )}
                        </div>
                      )}

                      {msg.citations && msg.citations.length > 0 && <CitationCard citations={msg.citations} />}

                      {msg.suggestEscalation && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-700 font-medium">
                            ⚠️ {msg.escalationReason || "Consider consulting an expert."}
                          </p>
                          <a href="/escalate" className="inline-flex items-center gap-1 mt-2 text-xs text-red-600 hover:text-red-800 font-medium">
                            Request Expert Consultation <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-earth-300 flex items-center justify-center shrink-0">
                    <UserCircle className="w-5 h-5 text-earth-600" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 items-start animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-saffron-500 to-ayurveda-600 flex items-center justify-center shadow-md animate-pulse-glow">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-earth-50 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-earth-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Multi-agent pipeline running...
                  </div>
                  <div className="mt-2 space-y-1 text-xs text-earth-400">
                    <div className="flex items-center gap-1"><Layers className="w-3 h-3" /> Query Analyzer → Hybrid Search → Specialized Agents → Evidence Merger</div>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-saffron-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <VoiceInput onTranscript={(t) => { setInput(t); sendMessage(t); }} disabled={loading} language={language} />
        <input type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage(input)}
          placeholder="Ask about IP, regulations, ABS compliance... or use voice 🎤"
          className="flex-1 px-4 py-3 bg-white border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm placeholder:text-earth-400"
          disabled={loading}
        />
        <button onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="px-5 py-3 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-xl hover:from-saffron-600 hover:to-saffron-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg">
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

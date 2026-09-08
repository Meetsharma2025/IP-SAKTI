"use client";

import { useState } from "react";
import {
  Leaf,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Info,
  FileText,
  Globe,
  Shield,
  Brain,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ABSResult {
  required: boolean;
  level: "high" | "medium" | "low" | "exempt";
  summary: string;
  steps: string[];
  applicableLaws: string[];
  forms: string[];
  exemptions: string[];
  internationalObligations: string[];
}

const absQuestions = [
  {
    id: "bio_resource",
    question: "Does your product or research use biological resources (plants, animals, microorganisms)?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "source_country",
    question: "Are these biological resources sourced from India?",
    options: [
      { value: "india", label: "Yes, from India" },
      { value: "foreign", label: "No, from outside India" },
      { value: "both", label: "Both Indian and foreign sources" },
    ],
  },
  {
    id: "resource_type",
    question: "How are the biological resources obtained?",
    options: [
      { value: "wild", label: "Wild-harvested from natural habitats" },
      { value: "cultivated", label: "Cultivated / farmed" },
      { value: "both", label: "Both wild-harvested and cultivated" },
      { value: "purchased", label: "Purchased from market/supplier" },
    ],
  },
  {
    id: "tk_usage",
    question: "Does your product use or rely on traditional knowledge (TK)?",
    options: [
      { value: "codified", label: "Yes, codified TK from authoritative texts" },
      { value: "community", label: "Yes, community-held/oral TK" },
      { value: "no", label: "No traditional knowledge involved" },
    ],
  },
  {
    id: "purpose",
    question: "What is the purpose of using these biological resources?",
    options: [
      { value: "commercial", label: "Commercial manufacturing/sale" },
      { value: "research", label: "Research / academic study" },
      { value: "ip_filing", label: "Filing for IP rights (patent, etc.)" },
      { value: "personal", label: "Personal / domestic use" },
    ],
  },
  {
    id: "entity_type",
    question: "What type of entity are you?",
    options: [
      { value: "indian_practitioner", label: "Registered AYUSH practitioner" },
      { value: "indian_company", label: "Indian company / startup" },
      { value: "foreign", label: "Foreign entity" },
      { value: "individual", label: "Indian individual" },
    ],
  },
];

function computeABSResult(answers: Record<string, string>): ABSResult {
  const bioResource = answers.bio_resource;
  const sourceCountry = answers.source_country;
  const resourceType = answers.resource_type;
  const tkUsage = answers.tk_usage;
  const purpose = answers.purpose;
  const entityType = answers.entity_type;

  // No biological resources
  if (bioResource === "no") {
    return {
      required: false,
      level: "exempt",
      summary: "ABS compliance is NOT required as your product does not use biological resources.",
      steps: [],
      applicableLaws: [],
      forms: [],
      exemptions: ["No biological resources used — ABS framework does not apply."],
      internationalObligations: [],
    };
  }

  // Foreign source only
  if (sourceCountry === "foreign") {
    return {
      required: false,
      level: "low",
      summary: "Indian ABS compliance is likely NOT required for resources sourced entirely outside India. However, you must comply with the ABS laws of the source country.",
      steps: [
        "Check ABS laws of the country from which biological resources are sourced",
        "Obtain Prior Informed Consent (PIC) from the source country if required",
        "Establish Mutually Agreed Terms (MAT) for benefit sharing",
        "Maintain documentation of resource provenance",
      ],
      applicableLaws: [
        "Convention on Biological Diversity, Article 15",
        "Nagoya Protocol, Articles 5-7",
        "Source country's national ABS legislation",
      ],
      forms: [],
      exemptions: ["Indian BD Act does not apply to resources sourced outside India"],
      internationalObligations: [
        "Comply with Nagoya Protocol requirements of source country",
        "EU Regulation 511/2014 if exporting to EU",
        "Check user-country compliance obligations",
      ],
    };
  }

  // AYUSH practitioner exemption
  if (entityType === "indian_practitioner" && tkUsage === "codified" && purpose !== "ip_filing") {
    return {
      required: false,
      level: "exempt",
      summary: "As a registered AYUSH practitioner using codified traditional knowledge, you are likely EXEMPT from ABS requirements under the 2023 BD Amendment.",
      steps: [
        "Ensure your AYUSH registration is current",
        "Verify your use is limited to codified TK from authoritative texts",
        "Maintain records of your practice and formulations",
      ],
      applicableLaws: [
        "Biological Diversity (Amendment) Act, 2023",
        "Biological Diversity Rules, 2024",
      ],
      forms: [],
      exemptions: [
        "Registered AYUSH practitioners using codified TK are exempted under 2023 Amendment",
        "Exemption applies for practice-related use, not for commercial manufacturing at industrial scale",
      ],
      internationalObligations: [],
    };
  }

  // Personal use
  if (purpose === "personal") {
    return {
      required: false,
      level: "exempt",
      summary: "Personal/domestic use of biological resources is generally exempt from ABS requirements.",
      steps: ["Ensure use is genuinely for personal/domestic purposes"],
      applicableLaws: ["Biological Diversity Act, 2002, Section 7 read with exemptions"],
      forms: [],
      exemptions: ["Personal/domestic use exemption under the BD Act"],
      internationalObligations: [],
    };
  }

  // Foreign entity — highest obligation
  if (entityType === "foreign") {
    return {
      required: true,
      level: "high",
      summary: "As a foreign entity accessing Indian biological resources, you need PRIOR APPROVAL from the National Biodiversity Authority (NBA) before any access or use.",
      steps: [
        "Apply to the National Biodiversity Authority (NBA) for prior approval under Section 3",
        "Submit Form I with complete details of biological resources to be accessed",
        "Specify purpose of access and expected outcomes",
        "Propose benefit-sharing terms (monetary and/or non-monetary)",
        "Wait for NBA approval before commencing any access or use",
        "If filing for IP rights, obtain separate approval under Section 6(1)",
        "Execute Benefit Sharing Agreement with NBA",
        "Maintain detailed records and submit periodic reports",
      ],
      applicableLaws: [
        "Biological Diversity Act, 2002, Section 3",
        "Biological Diversity Act, 2002, Section 6(1)",
        "Biological Diversity (Amendment) Act, 2023",
        "Biological Diversity Rules, 2024, Rules 14-17",
      ],
      forms: [
        "Form I — Application for access to biological resources",
        "Form III — Application for IP right based on biological resources",
      ],
      exemptions: [],
      internationalObligations: [
        "CBD Article 15 — Prior Informed Consent",
        "Nagoya Protocol Articles 5-7 — ABS obligations",
        "WIPO GRATK Treaty (2024) — Disclosure requirements in patent applications",
      ],
    };
  }

  // IP filing
  if (purpose === "ip_filing") {
    return {
      required: true,
      level: "high",
      summary: "Filing for IP rights based on Indian biological resources REQUIRES prior approval from the National Biodiversity Authority (NBA) under Section 6(1) of the BD Act.",
      steps: [
        "Apply to NBA for approval under Section 6(1) BEFORE filing any IP application",
        "Submit Form III with details of the biological resource and the IP right sought",
        "Provide details of how the biological resource was used in the invention",
        "Declare any associated traditional knowledge used",
        "Obtain NBA approval certificate",
        "Attach NBA approval to your IP application (patent, GI, etc.)",
        "Negotiate benefit-sharing terms as per BD Rules 2024",
      ],
      applicableLaws: [
        "Biological Diversity Act, 2002, Section 6(1)",
        "Biological Diversity (Amendment) Act, 2023",
        "Biological Diversity Rules, 2024",
        "Patents Act, 1970 (disclosure requirements)",
      ],
      forms: [
        "Form III — Application for prior approval for IP right",
        "Form I — If separate access approval is also needed",
      ],
      exemptions: [],
      internationalObligations: [
        "WIPO GRATK Treaty (2024) — Mandatory disclosure of genetic resource origin in patent applications",
        "Nagoya Protocol — Compliance requirements",
      ],
    };
  }

  // Indian entity, commercial use, cultivated resources
  if (resourceType === "cultivated" && tkUsage !== "community") {
    return {
      required: true,
      level: "medium",
      summary: "As an Indian entity using cultivated biological resources commercially, you need to file PRIOR INTIMATION with the State Biodiversity Board (SBB). The 2023 Amendment provides simplified procedures for cultivated resources.",
      steps: [
        "File prior intimation with the concerned State Biodiversity Board (SBB)",
        "Use the NBA/SBB digital portal for filing",
        "Submit self-declaration form for cultivated resources (simplified under 2024 Rules)",
        "Maintain records of resource sourcing (cultivation certificates, supplier details)",
        "Pay applicable benefit-sharing fees as per BD Rules 2024",
        "Renew intimation periodically as required",
      ],
      applicableLaws: [
        "Biological Diversity Act, 2002, Section 7",
        "Biological Diversity (Amendment) Act, 2023",
        "Biological Diversity Rules, 2024",
      ],
      forms: [
        "Prior Intimation Form to SBB",
        "Self-declaration for cultivated resources",
      ],
      exemptions: [
        "Simplified procedure for cultivated resources under 2023 Amendment",
        "Codified TK users may have reduced obligations",
      ],
      internationalObligations: [],
    };
  }

  // Default: Indian entity, commercial, wild resources
  return {
    required: true,
    level: "high",
    summary: "As an Indian entity using wild-harvested biological resources commercially, you must comply with ABS requirements including prior intimation to the State Biodiversity Board and benefit-sharing obligations.",
    steps: [
      "File prior intimation with the State Biodiversity Board (SBB) under Section 7",
      "Obtain any required collection permits for wild-harvested resources",
      "Document the exact biological resources and quantities accessed",
      "Declare any associated traditional knowledge used",
      "Establish benefit-sharing arrangement as per BD Rules 2024",
      "If community-held TK is involved, ensure Prior Informed Consent from the community",
      "If filing for IP rights, additionally obtain NBA approval under Section 6(1)",
      "Maintain detailed records for audit and compliance verification",
    ],
    applicableLaws: [
      "Biological Diversity Act, 2002, Sections 6, 7",
      "Biological Diversity (Amendment) Act, 2023",
      "Biological Diversity Rules, 2024, Rules 14-17",
      "Wildlife Protection Act, 1972 (if protected species involved)",
    ],
    forms: [
      "Prior Intimation Form to SBB",
      "Form I — Application for access (if applicable)",
      "Form III — If seeking IP rights",
    ],
    exemptions: [],
    internationalObligations: [
      "Nagoya Protocol compliance if exporting or collaborating internationally",
      "WIPO GRATK Treaty disclosure requirements for patent applications",
    ],
  };
}

export default function ABSComplianceChecker() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ABSResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const currentQuestion = absQuestions[step];
  const isComplete = step >= absQuestions.length;

  // Fetch AI analysis from Nemotron
  const fetchAIAnalysis = async (ans: Record<string, string>, res: ABSResult) => {
    setAiLoading(true);
    try {
      const response = await fetch("/api/abs-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: ans, preliminaryResult: res }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.analysis) setAiAnalysis(data.analysis);
        if (data.reasoning) setAiReasoning(data.reasoning);
      }
    } catch (err) {
      console.error("ABS AI analysis error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Short circuit for "no biological resources"
    if (currentQuestion.id === "bio_resource" && value === "no") {
      const res = computeABSResult(newAnswers);
      setResult(res);
      setStep(absQuestions.length);
      fetchAIAnalysis(newAnswers, res);
      return;
    }

    if (step < absQuestions.length - 1) {
      setStep(step + 1);
    } else {
      const res = computeABSResult(newAnswers);
      setResult(res);
      setStep(absQuestions.length);
      fetchAIAnalysis(newAnswers, res);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "high": return "from-red-500 to-red-600";
      case "medium": return "from-saffron-500 to-saffron-600";
      case "low": return "from-blue-500 to-blue-600";
      case "exempt": return "from-ayurveda-500 to-ayurveda-600";
      default: return "from-earth-500 to-earth-600";
    }
  };

  if (isComplete && result) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getLevelColor(result.level)} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
            {result.required ? (
              <AlertCircle className="w-8 h-8 text-white" />
            ) : (
              <CheckCircle className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-earth-800">ABS Compliance Assessment</h1>
          <div className={`inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getLevelColor(result.level)}`}>
            {result.required ? "Compliance Required" : "Likely Exempt"} — {result.level.charAt(0).toUpperCase() + result.level.slice(1)} Priority
          </div>
        </div>

        {/* Summary */}
        <div className={`rounded-2xl border p-6 mb-6 ${result.required ? "bg-red-50 border-red-200" : "bg-ayurveda-50 border-ayurveda-200"}`}>
          <p className="text-sm leading-relaxed font-medium">{result.summary}</p>
        </div>

        {/* Required Steps */}
        {result.steps.length > 0 && (
          <div className="bg-white rounded-2xl border border-earth-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-4">
              <ArrowRight className="w-5 h-5 text-saffron-600" />
              Steps to Follow
            </h3>
            <ol className="space-y-3">
              {result.steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-earth-600">
                  <span className="w-6 h-6 rounded-full bg-saffron-100 text-saffron-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Applicable Laws */}
        {result.applicableLaws.length > 0 && (
          <div className="bg-white rounded-2xl border border-earth-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-saffron-600" />
              Applicable Laws & Rules
            </h3>
            <ul className="space-y-2">
              {result.applicableLaws.map((law, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-earth-600">
                  <span className="text-saffron-500">📜</span> {law}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Required Forms */}
        {result.forms.length > 0 && (
          <div className="bg-saffron-50 rounded-2xl border border-saffron-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-saffron-600" />
              Required Forms
            </h3>
            <ul className="space-y-2">
              {result.forms.map((form, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-earth-700">
                  <span>📋</span> {form}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Exemptions */}
        {result.exemptions.length > 0 && (
          <div className="bg-ayurveda-50 rounded-2xl border border-ayurveda-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-ayurveda-600" />
              Applicable Exemptions
            </h3>
            <ul className="space-y-2">
              {result.exemptions.map((ex, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-earth-600">
                  <span>✅</span> {ex}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* International Obligations */}
        {result.internationalObligations.length > 0 && (
          <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-blue-600" />
              International Obligations
            </h3>
            <ul className="space-y-2">
              {result.internationalObligations.map((ob, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-earth-600">
                  <span>🌍</span> {ob}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Nemotron AI Analysis */}
        {(aiAnalysis || aiLoading) && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Expert ABS Analysis
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Nemotron 3 Ultra</span>
            </h3>
            {aiLoading && !aiAnalysis ? (
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating expert ABS analysis...
              </div>
            ) : aiAnalysis ? (
              <div className="text-sm text-earth-700 leading-relaxed whitespace-pre-line">
                {aiAnalysis}
              </div>
            ) : null}
            {aiReasoning && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <button
                  onClick={() => setShowReasoning(!showReasoning)}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-medium"
                >
                  <Brain className="w-3 h-3" />
                  {showReasoning ? "Hide" : "Show"} AI Reasoning
                  {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showReasoning && (
                  <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800 max-h-48 overflow-y-auto animate-fade-in whitespace-pre-wrap">
                    {aiReasoning}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => { setStep(0); setAnswers({}); setResult(null); setAiAnalysis(null); setAiReasoning(null); }}
            className="px-6 py-3 bg-earth-200 text-earth-700 rounded-xl hover:bg-earth-300 transition-colors font-medium"
          >
            Start Over
          </button>
          <a href="/chat" className="px-6 py-3 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-xl font-medium text-center">
            Ask IP Assistant
          </a>
        </div>

        <div className="mt-6 bg-saffron-50 border border-saffron-200 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-saffron-800">
            ⚠️ This assessment is for informational purposes only. Consult a qualified legal
            professional for specific ABS compliance advice.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ayurveda-500 to-ayurveda-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-earth-800">ABS Compliance Checker</h1>
        <p className="text-earth-500 mt-2">
          Determine your Access & Benefit Sharing obligations
        </p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-earth-500">Question {step + 1} of {absQuestions.length}</span>
        </div>
        <div className="w-full h-2 bg-earth-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-ayurveda-500 to-ayurveda-600 rounded-full transition-all" style={{ width: `${((step + 1) / absQuestions.length) * 100}%` }} />
        </div>
      </div>

      {/* Question */}
      {currentQuestion && (
        <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm animate-fade-in">
          <h2 className="text-lg font-bold text-earth-800 mb-4">{currentQuestion.question}</h2>
          <div className="space-y-2">
            {currentQuestion.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(opt.value)}
                className="w-full text-left p-4 rounded-xl border-2 border-earth-200 hover:border-ayurveda-400 hover:bg-ayurveda-50/50 text-earth-700 transition-all flex items-center gap-3"
              >
                <ChevronRight className="w-4 h-4 text-earth-400" />
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step > 0 && (
        <button
          onClick={() => setStep(step - 1)}
          className="mt-4 text-sm text-earth-500 hover:text-earth-700 transition-colors"
        >
          ← Go back
        </button>
      )}

      <div className="mt-6 flex items-start gap-2 text-xs text-earth-500">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <p>Based on the Biological Diversity Act, 2002 (as amended 2023) and the Biological Diversity Rules, 2024.</p>
      </div>
    </div>
  );
}

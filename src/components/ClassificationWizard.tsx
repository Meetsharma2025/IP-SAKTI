"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Leaf,
  FileText,
  Shield,
  ArrowRight,
  Loader2,
  Info,
  Brain,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { classificationQuestions } from "@/lib/classification";
import type { ClassificationResult } from "@/lib/classification";
import { useLanguage } from "./LanguageContext";
import dict from "@/lib/translations";

export default function ClassificationWizard() {
  const { language: lang } = useLanguage();
  const isHi = lang === "hi";
  const t = (k: string) => dict[k]?.[lang] || dict[k]?.en || k;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const totalSteps = classificationQuestions.length + 1; // +1 for product info step
  const isProductInfoStep = step === 0;
  const questionIdx = step - 1;
  const currentQuestion = !isProductInfoStep ? classificationQuestions[questionIdx] : null;
  const isComplete = step >= totalSteps;

  const handleAnswer = (value: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));
  };

  const canProceed = isProductInfoStep
    ? productName.trim().length > 0
    : currentQuestion
    ? !!answers[currentQuestion.id]
    : false;

  const handleSubmit = async () => {
    setLoading(true);
    setAiLoading(true);
    try {
      const response = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          productName,
          productDescription,
          language: lang,
        }),
      });
      const data = await response.json();
      setResult(data);
      if (data.aiAnalysis) {
        setAiAnalysis(data.aiAnalysis);
      }
      if (data.aiReasoning) {
        setAiReasoning(data.aiReasoning);
      }
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
      setAiLoading(false);
    }
  };

  const handleNext = () => {
    if (step === totalSteps - 1) {
      handleSubmit();
    }
    setStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 0));

  const getApplicabilityColor = (applicability: string) => {
    if (applicability.includes("NOT")) return "bg-red-50 border-red-200 text-red-700";
    if (applicability.includes("Highly")) return "bg-ayurveda-50 border-ayurveda-200 text-ayurveda-700";
    if (applicability.includes("Possible")) return "bg-saffron-50 border-saffron-200 text-saffron-700";
    return "bg-earth-50 border-earth-200 text-earth-700";
  };

  if (isComplete && result) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ayurveda-500 to-ayurveda-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-earth-800">{t("classificationComplete")}</h1>
          <p className="text-earth-500 mt-2">
            Product: <strong>{productName}</strong>
          </p>
        </div>

        {/* Category Card */}
        <div className="bg-gradient-to-br from-saffron-50 to-earth-50 rounded-2xl border border-saffron-200 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center shadow-md shrink-0">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-earth-800">{result.categoryLabel}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  result.classificationConfidence >= 70 ? "bg-ayurveda-100 text-ayurveda-700" :
                  result.classificationConfidence >= 50 ? "bg-saffron-100 text-saffron-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {result.classificationConfidence}% confidence
                </span>
              </div>
              <p className="text-sm text-earth-600 mt-1 leading-relaxed">{result.description}</p>
              {result.humanReviewRecommended && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 font-medium">
                  ⚠️ Human expert review recommended — classification involves areas of regulatory ambiguity.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Uncertainty Flags */}
        {result.uncertaintyFlags.length > 0 && (
          <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Uncertainties &amp; Caveats
            </h3>
            <ul className="space-y-2">
              {result.uncertaintyFlags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                  <span className="shrink-0">⚠️</span> {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Regulatory Requirements */}
        <div className="bg-white rounded-2xl border border-earth-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-saffron-600" />
            Regulatory Requirements
          </h3>
          <ul className="space-y-2">
            {result.regulatoryRequirements.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-earth-600">
                <CheckCircle className="w-4 h-4 text-ayurveda-500 mt-0.5 shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* IP Options */}
        <div className="bg-white rounded-2xl border border-earth-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-saffron-600" />
            IP Protection Options
          </h3>
          <div className="space-y-3">
            {result.ipOptions.map((option, i) => (
              <div
                key={i}
                className={`rounded-xl border p-4 ${getApplicabilityColor(
                  option.applicability
                )}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{option.type}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/80">
                    {option.applicability}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90">{option.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ABS Status */}
        <div className={`rounded-2xl border p-6 mb-6 ${
          result.absLevel === "required" ? "bg-red-50 border-red-200" :
          result.absLevel === "likely_required" ? "bg-saffron-50 border-saffron-200" :
          result.absLevel === "possibly_required" ? "bg-amber-50 border-amber-200" :
          "bg-ayurveda-50 border-ayurveda-200"
        }`}>
          <h3 className="text-lg font-bold flex items-center gap-2 mb-3">
            {result.absLevel === "required" || result.absLevel === "likely_required" ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : result.absLevel === "possibly_required" ? (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            ) : (
              <CheckCircle className="w-5 h-5 text-ayurveda-600" />
            )}
            <span>
              ABS Compliance: {
                result.absLevel === "required" ? "Required" :
                result.absLevel === "likely_required" ? "Likely Required" :
                result.absLevel === "possibly_required" ? "Possibly Required — Verify" :
                result.absLevel === "likely_exempt" ? "Likely Exempt" : "Exempt"
              }
            </span>
          </h3>
          <p className="text-sm leading-relaxed opacity-90">{result.absDetails}</p>
          {result.absLevel !== "exempt" && result.absLevel !== "likely_exempt" && (
            <a href="/abs" className="inline-block mt-2 text-xs font-medium text-saffron-700 hover:text-saffron-900">
              → Run detailed ABS compliance check
            </a>
          )}
        </div>

        {/* TKDL Relevance */}
        <div className="bg-earth-50 rounded-2xl border border-earth-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-3">
            <Info className="w-5 h-5 text-earth-600" />
            TKDL / Prior Art Relevance
          </h3>
          <p className="text-sm text-earth-600 leading-relaxed">{result.tkdlRelevance}</p>
        </div>

        {/* Key Statutes */}
        <div className="bg-white rounded-2xl border border-earth-200 p-6 mb-6">
          <h3 className="text-lg font-bold text-earth-800 mb-3">{ t("keyStatutes") }</h3>
          <div className="flex flex-wrap gap-2">
            {result.keyStatutes.map((statute, i) => (
              <span
                key={i}
                className="text-xs bg-saffron-50 text-saffron-700 border border-saffron-200 px-3 py-1.5 rounded-full"
              >
                📜 {statute}
              </span>
            ))}
          </div>
        </div>

        {/* Nemotron AI Analysis */}
        {(aiAnalysis || aiLoading) && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border border-purple-200 p-6 mb-6">
            <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-purple-600" />
              AI Expert Analysis
              <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Nemotron 3 Ultra</span>
            </h3>
            {aiLoading && !aiAnalysis ? (
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating expert analysis with Nemotron 3 Ultra...
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
                  {showReasoning ? "Hide" : "Show"} AI Reasoning Chain
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
            onClick={() => {
              setStep(0);
              setAnswers({});
              setResult(null);
              setProductName("");
              setProductDescription("");
              setAiAnalysis(null);
              setAiReasoning(null);
              setShowReasoning(false);
            }}
            className="px-6 py-3 bg-earth-200 text-earth-700 rounded-xl hover:bg-earth-300 transition-colors font-medium"
          >
            Start Over
          </button>
          <a
            href="/chat"
            className="px-6 py-3 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-xl hover:from-saffron-600 hover:to-saffron-700 transition-all shadow-md text-center font-medium flex items-center justify-center gap-2"
          >
            Ask IP Assistant
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="/abs"
            className="px-6 py-3 bg-ayurveda-600 text-white rounded-xl hover:bg-ayurveda-700 transition-colors text-center font-medium flex items-center justify-center gap-2"
          >
            <Leaf className="w-4 h-4" />
            Check ABS Compliance
          </a>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 bg-saffron-50 border border-saffron-200 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-saffron-800">
            ⚠️ This classification is for informational purposes only and does NOT
            constitute legal advice. Consult a qualified IP attorney for specific guidance.
          </p>
        </div>
      </div>
    );
  }

  if (isComplete && loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center animate-fade-in">
        <Loader2 className="w-12 h-12 text-saffron-500 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-earth-800">Analyzing your product...</h2>
        <p className="text-earth-500 mt-2">
          Determining classification, IP options, and regulatory requirements
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-earth-800">{t("productClassification")}</h1>
        <p className="text-earth-500 mt-2">
          Determine your product category, IP options, and regulatory requirements
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-earth-500">
            Step {step + 1} of {totalSteps}
          </span>
          <span className="text-xs text-earth-500">
            {Math.round(((step + 1) / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full h-2 bg-earth-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-saffron-500 to-ayurveda-500 rounded-full transition-all duration-500"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-2xl border border-earth-200 shadow-sm p-6 mb-6">
        {isProductInfoStep ? (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold text-earth-800 mb-4">
              {t("tellUsProduct")}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">
                  { t('productName') } *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Ashwagandha Capsules, Triphala Churna..."
                  className="w-full px-4 py-3 border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-saffron-400 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-earth-700 mb-1">
                  Brief Description (optional)
                </label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Describe your product, its ingredients, intended use..."
                  rows={3}
                  className="w-full px-4 py-3 border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-saffron-400 text-sm resize-none"
                />
              </div>
            </div>
          </div>
        ) : currentQuestion ? (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold text-earth-800 mb-1">
              {(isHi && currentQuestion.questionHi) ? currentQuestion.questionHi : currentQuestion.question}
            </h2>
            {currentQuestion.helpText && (
              <p className="text-xs text-earth-500 mb-4 flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                {currentQuestion.helpText}
              </p>
            )}
            <div className="space-y-2 mt-4">
              {currentQuestion.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleAnswer(opt.value)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    answers[currentQuestion.id] === opt.value
                      ? "border-saffron-500 bg-saffron-50 text-saffron-800"
                      : "border-earth-200 hover:border-saffron-300 hover:bg-saffron-50/50 text-earth-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        answers[currentQuestion.id] === opt.value
                          ? "border-saffron-500 bg-saffron-500"
                          : "border-earth-300"
                      }`}
                    >
                      {answers[currentQuestion.id] === opt.value && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{(isHi && opt.labelHi) ? opt.labelHi : opt.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={step === 0}
          className="flex items-center gap-1 px-4 py-2.5 text-sm font-medium text-earth-600 hover:text-earth-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex items-center gap-1 px-6 py-2.5 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-xl hover:from-saffron-600 hover:to-saffron-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md text-sm font-medium"
        >
          {step === totalSteps - 1 ? "Get Classification" : "Next"}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

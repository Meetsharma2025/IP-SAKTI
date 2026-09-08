"use client";

import Link from "next/link";
import {
  Shield,
  Search,
  BookOpen,
  Globe,
  Leaf,
  Scale,
  FileText,
  Users,
  ArrowRight,
  CheckCircle,
  MessageSquare,
  AlertTriangle,
  Layers,
  Languages,
  Brain,
  Cpu,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Nemotron 3 Ultra AI Engine",
    desc: "Powered by NVIDIA Nemotron 3 Ultra 550B for deep reasoning over retrieved legal documents. Step-by-step AI reasoning with full transparency.",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Search,
    title: "Source-Cited RAG Answers",
    desc: "Citation-grounded answers with hallucination-resistant retrieval and safe abstention. Every claim traces to source documents.",
    color: "from-saffron-500 to-saffron-600",
  },
  {
    icon: Layers,
    title: "Product Classification",
    desc: "Determine if your product is classical, proprietary, new drug, phytopharmaceutical, nutraceutical, or cosmetic — with distinct IP paths.",
    color: "from-ayurveda-500 to-ayurveda-600",
  },
  {
    icon: Globe,
    title: "Jurisdiction Toggle",
    desc: "Separate guidance for Indian law (Patents Act, BD Act, D&C Act) and international regimes (TRIPS, Nagoya, WIPO GRATK). Never conflated.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Leaf,
    title: "ABS Compliance Helper",
    desc: "Access & Benefit Sharing compliance checker under the Biological Diversity Act (2023 Amendment) and Nagoya Protocol.",
    color: "from-green-600 to-green-700",
  },
  {
    icon: BookOpen,
    title: "TKDL / Prior Art Pointer",
    desc: "Check if your formulation is documented traditional knowledge before pursuing patent protection. Defensive and offensive strategies.",
    color: "from-earth-500 to-earth-600",
  },
  {
    icon: Languages,
    title: "Multilingual Support",
    desc: "Access guidance in Hindi, Tamil, Telugu, Bengali, Marathi, and English — leveraging national language infrastructure.",
    color: "from-purple-500 to-purple-600",
  },
];

const ipTypes = [
  { icon: FileText, label: "Patents", desc: "Section 3(p), 3(d), 2024 Rules" },
  { icon: Globe, label: "GI", desc: "Geographical Indications" },
  { icon: Shield, label: "Trademarks", desc: "Brand Protection" },
  { icon: BookOpen, label: "Copyright", desc: "Original Works" },
  { icon: Layers, label: "Designs", desc: "Packaging & Product" },
  { icon: Leaf, label: "Plant Variety", desc: "PPVFRA Protection" },
  { icon: Scale, label: "Trade Secrets", desc: "Confidential Formulations" },
  { icon: Users, label: "ABS", desc: "Benefit Sharing" },
];

const workflow = [
  { step: "1", title: "What is my product?", desc: "Classify your Ayurvedic product into the correct regulatory category" },
  { step: "2", title: "What regulations apply?", desc: "Identify applicable drug, food, or cosmetic regulations" },
  { step: "3", title: "What IP protection is possible?", desc: "Explore patent, trademark, GI, design, and other IP options" },
  { step: "4", title: "What compliance do I need?", desc: "ABS obligations, advertising restrictions, labelling requirements" },
  { step: "5", title: "Which source proves it?", desc: "Get exact citations to statutes, rules, and treaties" },
];

export default function LandingContent() {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-earth-800 via-earth-900 to-earth-950 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-saffron-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-ayurveda-500 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-saffron-400 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-saffron-500/20 border border-saffron-500/30 rounded-full text-saffron-300 text-sm mb-6">
              <Shield className="w-4 h-4" />
              Designed for SIH PS #26045 • Ministry of AYUSH
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
              Navigate{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-saffron-400 to-saffron-300">
                Ayurveda IP
              </span>{" "}
              with Confidence
            </h1>
            <p className="mt-6 text-lg md:text-xl text-earth-300 leading-relaxed max-w-2xl mx-auto">
              Source-cited guidance across patents, trademarks, geographical indications,
              ABS compliance, and regulatory frameworks — for India and international
              regimes.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-sm">
              <Cpu className="w-4 h-4" />
              Powered by NVIDIA Nemotron 3 Ultra 550B via OpenRouter
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-saffron-600 hover:to-saffron-700 transition-all text-lg"
              >
                <MessageSquare className="w-5 h-5" />
                Ask IP Assistant
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/classify"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-lg"
              >
                <Layers className="w-5 h-5" />
                Classify Your Product
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative bottom curve */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 0C1440 0 1080 40 720 40C360 40 0 0 0 0L0 60Z" fill="#faf8f1" />
          </svg>
        </div>
      </section>

      {/* Disclaimer Banner */}
      <div className="bg-saffron-50 border-b border-saffron-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-saffron-600 shrink-0" />
          <p className="text-sm text-saffron-800">
            <strong>Important:</strong> This tool provides informational guidance only, NOT
            legal advice. Always consult a qualified IP attorney for specific legal advice.
          </p>
        </div>
      </div>

      {/* Decision Flow */}
      <section className="py-16 md:py-20 bg-earth-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-earth-800">
              Your IP Journey, <span className="text-saffron-600">Step by Step</span>
            </h2>
            <p className="mt-3 text-earth-500 text-lg max-w-2xl mx-auto">
              From product identification to source-verified IP guidance
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-start gap-4 md:gap-2 justify-center">
            {workflow.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 md:flex-col md:text-center flex-1">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                  {item.step}
                </div>
                <div className="md:mt-3">
                  <h3 className="font-semibold text-earth-800 text-sm md:text-base">
                    {item.title}
                  </h3>
                  <p className="text-xs md:text-sm text-earth-500 mt-1">{item.desc}</p>
                </div>
                {idx < workflow.length - 1 && (
                  <ArrowRight className="hidden md:block w-6 h-6 text-earth-300 absolute" style={{ display: 'none' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-earth-800">
              Comprehensive IP <span className="text-saffron-600">Intelligence</span>
            </h2>
            <p className="mt-3 text-earth-500 text-lg max-w-2xl mx-auto">
              Purpose-built for the AYUSH ecosystem
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-earth-200 p-6 hover:shadow-lg hover:border-saffron-300 transition-all group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-earth-800">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-earth-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* IP Types Coverage */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-earth-100 to-earth-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-earth-800">
              All IP Types <span className="text-saffron-600">Covered</span>
            </h2>
            <p className="mt-3 text-earth-500 text-lg">
              Comprehensive protection across every regime
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ipTypes.map((ip, idx) => {
              const Icon = ip.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-5 text-center hover:shadow-md transition-all border border-earth-200 hover:border-saffron-300"
                >
                  <Icon className="w-8 h-8 text-saffron-600 mx-auto" />
                  <h3 className="mt-2 font-semibold text-earth-800 text-sm">
                    {ip.label}
                  </h3>
                  <p className="mt-1 text-xs text-earth-500">{ip.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Jurisdiction Split */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-earth-800">
              Two Jurisdictions, <span className="text-saffron-600">Clearly Separated</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* India */}
            <div className="bg-gradient-to-br from-saffron-50 to-saffron-100 rounded-2xl p-8 border border-saffron-200">
              <div className="text-4xl mb-4">🇮🇳</div>
              <h3 className="text-2xl font-bold text-earth-800 mb-4">India</h3>
              <ul className="space-y-2">
                {[
                  "Patents Act (+ 2024 Rules)",
                  "GI Act, Trade Marks Act, Designs Act",
                  "Copyright Act",
                  "Plant Variety Protection (PPVFRA)",
                  "Biological Diversity Act (2023 Amendment, 2024 Rules)",
                  "Drugs & Cosmetics Act",
                  "DMRA (Advertising)",
                  "FSSAI Ayurveda-Aahar Regulations",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-earth-700">
                    <CheckCircle className="w-4 h-4 text-saffron-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {/* International */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
              <div className="text-4xl mb-4">🌎</div>
              <h3 className="text-2xl font-bold text-earth-800 mb-4">International</h3>
              <ul className="space-y-2">
                {[
                  "TRIPS Agreement",
                  "Convention on Biological Diversity",
                  "Nagoya Protocol on ABS",
                  "WIPO GRATK Treaty (2024)",
                  "PCT (Patent Cooperation Treaty)",
                  "Madrid System (Trademarks)",
                  "Hague System (Designs)",
                  "Budapest Treaty (Micro-organisms)",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-earth-700">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-earth-800 to-earth-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to protect your{" "}
            <span className="text-saffron-400">Ayurvedic innovation</span>?
          </h2>
          <p className="mt-4 text-earth-300 text-lg max-w-2xl mx-auto">
            Start with our product classification wizard or ask the IP assistant directly.
            Every answer is source-cited and jurisdiction-aware.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/classify"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <Layers className="w-5 h-5" />
              Classify Product
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
            >
              <MessageSquare className="w-5 h-5" />
              Ask IP Assistant
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

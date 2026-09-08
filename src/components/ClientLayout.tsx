"use client";

import { useState, useEffect, type ReactNode } from "react";
import Header from "./Header";
import { LanguageProvider, useLanguage } from "./LanguageContext";

function LayoutInner({ children }: { children: ReactNode }) {
  const { language, setLanguage } = useLanguage();
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (!seeded) {
      fetch("/api/seed", { method: "POST" })
        .then((r) => r.json())
        .then(() => setSeeded(true))
        .catch(() => setSeeded(true));
    }
  }, [seeded]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header language={language} onLanguageChange={setLanguage} />
      <main className="flex-1">{children}</main>
      <footer className="bg-earth-800 text-earth-300 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-saffron-400 font-bold text-lg mb-2">IP-SAKTI Sahayak</h3>
              <p className="text-sm text-earth-400">
                {language === "hi" ? "आयुर्वेद में बौद्धिक संपदा और नियामक मार्गदर्शन के लिए बहुभाषी AI सहायक।" :
                 "Multilingual AI assistant for Intellectual Property and regulatory guidance in Ayurveda."}
              </p>
              <p className="text-xs text-earth-500 mt-2">
                Designed for SIH PS #26045 &bull; Ministry of AYUSH
              </p>
            </div>
            <div>
              <h4 className="text-saffron-400 font-semibold mb-2">
                {language === "hi" ? "त्वरित लिंक" : "Quick Links"}
              </h4>
              <ul className="space-y-1 text-sm">
                <li><a href="/chat" className="hover:text-saffron-300 transition-colors">{language === "hi" ? "IP सहायक" : "IP Assistant"}</a></li>
                <li><a href="/classify" className="hover:text-saffron-300 transition-colors">{language === "hi" ? "उत्पाद वर्गीकरण" : "Product Classification"}</a></li>
                <li><a href="/knowledge" className="hover:text-saffron-300 transition-colors">{language === "hi" ? "ज्ञान आधार" : "Knowledge Base"}</a></li>
                <li><a href="/abs" className="hover:text-saffron-300 transition-colors">{language === "hi" ? "ABS अनुपालन" : "ABS Compliance"}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-saffron-400 font-semibold mb-2">
                {language === "hi" ? "महत्वपूर्ण सूचना" : "Important Notice"}
              </h4>
              <p className="text-xs text-earth-400 leading-relaxed">
                {language === "hi"
                  ? "⚠️ यह उपकरण केवल जानकारी प्रदान करता है, कानूनी सलाह नहीं। विशिष्ट कानूनी सलाह के लिए हमेशा एक योग्य IP वकील से परामर्श करें। DPDPA 2023 के अनुपालन में।"
                  : "⚠️ This tool provides information only, NOT legal advice. Always consult a qualified IP attorney for specific legal advice. Compliant with DPDPA 2023."}
              </p>
            </div>
          </div>
          <div className="border-t border-earth-700 mt-6 pt-4 text-center text-xs text-earth-500">
            © {new Date().getFullYear()} IP-SAKTI Sahayak — Built for Smart India Hackathon
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <LayoutInner>{children}</LayoutInner>
    </LanguageProvider>
  );
}

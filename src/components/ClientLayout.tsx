"use client";

import { useState, useEffect, type ReactNode } from "react";
import Header from "./Header";
import type { Language } from "@/lib/i18n";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    // Auto-seed knowledge base on first load
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
      {/* Footer */}
      <footer className="bg-earth-800 text-earth-300 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-saffron-400 font-bold text-lg mb-2">IP-SAKTI Sahayak</h3>
              <p className="text-sm text-earth-400">
                Multilingual AI assistant for Intellectual Property and regulatory
                guidance in Ayurveda.
              </p>
              <p className="text-xs text-earth-500 mt-2">
                Designed for SIH PS #26045 &bull; Ministry of AYUSH
              </p>
            </div>
            <div>
              <h4 className="text-saffron-400 font-semibold mb-2">Quick Links</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <a href="/chat" className="hover:text-saffron-300 transition-colors">
                    IP Assistant
                  </a>
                </li>
                <li>
                  <a href="/classify" className="hover:text-saffron-300 transition-colors">
                    Product Classification
                  </a>
                </li>
                <li>
                  <a href="/knowledge" className="hover:text-saffron-300 transition-colors">
                    Knowledge Base
                  </a>
                </li>
                <li>
                  <a href="/abs" className="hover:text-saffron-300 transition-colors">
                    ABS Compliance
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-saffron-400 font-semibold mb-2">Important Notice</h4>
              <p className="text-xs text-earth-400 leading-relaxed">
                ⚠️ This tool provides <strong>information only, NOT legal advice</strong>.
                Always consult a qualified IP attorney or registered patent agent for
                specific legal advice. Compliant with the Digital Personal Data
                Protection Act, 2023.
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

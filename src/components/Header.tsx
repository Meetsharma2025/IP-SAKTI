"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Globe, Shield } from "lucide-react";
import type { Language } from "@/lib/i18n";
import { languageNames } from "@/lib/i18n";

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function Header({ language, onLanguageChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/workspace", label: "Workspace" },
    { href: "/chat", label: "IP Assistant" },
    { href: "/classify", label: "Classify" },
    { href: "/tkdl", label: "TKDL" },
    { href: "/export", label: "Export" },
    { href: "/knowledge", label: "Knowledge" },
    { href: "/abs", label: "ABS" },
  ];

  return (
    <header className="bg-white/90 backdrop-blur-md shadow-sm border-b border-earth-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-saffron-500 to-ayurveda-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="text-lg font-bold text-earth-800 leading-tight">
                IP-SAKTI <span className="text-saffron-600">Sahayak</span>
              </div>
              <div className="text-xs text-earth-500 -mt-0.5">Ayurveda IP Guide</div>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 text-sm font-medium text-earth-600 hover:text-saffron-700 hover:bg-saffron-50 rounded-lg transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Language Selector & Mobile Menu Toggle */}
          <div className="flex items-center gap-2">
            {/* Language */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1 px-3 py-2 text-sm text-earth-600 hover:text-saffron-700 hover:bg-saffron-50 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">{languageNames[language]}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-earth-200 py-1 z-50">
                  {(Object.entries(languageNames) as [Language, string][]).map(
                    ([code, name]) => (
                      <button
                        key={code}
                        onClick={() => {
                          onLanguageChange(code);
                          setLangOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-saffron-50 transition-colors ${
                          language === code
                            ? "text-saffron-700 font-semibold bg-saffron-50"
                            : "text-earth-600"
                        }`}
                      >
                        {name}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 text-earth-600 hover:text-saffron-700 hover:bg-saffron-50 rounded-lg"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden py-3 border-t border-earth-200 animate-fade-in">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm font-medium text-earth-600 hover:text-saffron-700 hover:bg-saffron-50 rounded-lg"
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "IP-SAKTI Sahayak — Ayurveda IP & Regulatory Guide",
  description:
    "Multilingual, RAG-based AI assistant for Intellectual Property and regulatory guidance in Ayurveda across national and international regimes.",
  keywords: "Ayurveda, IP, Patent, Trademark, GI, ABS, TKDL, AYUSH, Regulatory",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-earth-50 text-earth-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}

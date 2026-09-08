"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  language?: string;
}

const speechLangMap: Record<string, string> = {
  en: "en-IN", hi: "hi-IN", ta: "ta-IN",
  te: "te-IN", bn: "bn-IN", mr: "mr-IN",
};

export default function VoiceInput({ onTranscript, disabled, language = "en" }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Only check support on client after mount
    const SR = typeof window !== "undefined"
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : undefined;
    setSupported(!!SR);
  }, []);

  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = speechLangMap[language] || "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, [language, onTranscript]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  // Don't render anything until we know if it's supported (prevents hydration mismatch)
  if (!supported) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={listening ? stopListening : startListening}
        disabled={disabled}
        className={`p-2.5 rounded-xl transition-all ${
          listening
            ? "bg-red-500 text-white shadow-lg animate-pulse"
            : "bg-earth-100 text-earth-500 hover:bg-saffron-100 hover:text-saffron-600"
        } disabled:opacity-50`}
        title={listening ? "Stop listening" : "Voice input"}
      >
        {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
      {listening && (
        <span className="text-xs text-red-600 flex items-center gap-1">
          <Loader2 className="w-3 h-3 animate-spin" /> Listening...
        </span>
      )}
    </div>
  );
}

// Text-to-Speech — uses useEffect to avoid hydration mismatch
export function SpeakButton({ text, language = "en" }: { text: string; language?: string }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && !!window.speechSynthesis);
  }, []);

  const speak = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const clean = text
      .replace(/\*\*/g, "")
      .replace(/#{1,3}\s/g, "")
      .replace(/📎[^\n]*/g, "")
      .replace(/⚠️[^\n]*/g, "");
    const utterance = new SpeechSynthesisUtterance(clean.substring(0, 3000));
    utterance.lang = speechLangMap[language] || "en-IN";
    utterance.rate = 0.9;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  // Don't render until client-side check completes (prevents hydration mismatch)
  if (!supported) return null;

  return (
    <button onClick={speak} className="text-earth-400 hover:text-saffron-600 transition-colors p-1"
      title={speaking ? "Stop" : "Read aloud"}>
      {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
    </button>
  );
}

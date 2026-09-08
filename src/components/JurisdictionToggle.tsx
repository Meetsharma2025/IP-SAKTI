"use client";

interface JurisdictionToggleProps {
  value: string;
  onChange: (value: string) => void;
}

export default function JurisdictionToggle({
  value,
  onChange,
}: JurisdictionToggleProps) {
  return (
    <div className="flex items-center bg-white rounded-xl shadow-sm border border-earth-200 p-1">
      <button
        onClick={() => onChange("india")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          value === "india"
            ? "bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-md"
            : "text-earth-500 hover:text-earth-700 hover:bg-earth-100"
        }`}
      >
        🇮🇳 India
      </button>
      <button
        onClick={() => onChange("international")}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          value === "international"
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
            : "text-earth-500 hover:text-earth-700 hover:bg-earth-100"
        }`}
      >
        🌎 International
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Users, Send, CheckCircle, Loader2, AlertTriangle } from "lucide-react";

export default function EscalationForm() {
  const [form, setForm] = useState({
    reason: "",
    userQuery: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason || !form.userQuery) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError("Failed to submit. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ayurveda-500 to-ayurveda-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-earth-800 mb-3">Request Submitted</h1>
        <p className="text-earth-500 mb-6">
          Your consultation request has been submitted successfully. A qualified IP
          facilitator will review your query and contact you.
        </p>
        <div className="bg-saffron-50 border border-saffron-200 rounded-xl p-4 text-sm text-saffron-800">
          <p>
            <strong>What happens next?</strong>
          </p>
          <ul className="mt-2 space-y-1 text-left">
            <li>• Your request is reviewed by an IP expert within 2-3 business days</li>
            <li>• You will receive a response via the contact information provided</li>
            <li>• Initial consultation is informational; formal legal engagement may follow</li>
          </ul>
        </div>
        <a
          href="/"
          className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-xl font-medium"
        >
          Return Home
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-earth-800">Request Expert Consultation</h1>
        <p className="text-earth-500 mt-2">
          Connect with a qualified IP facilitator for personalized guidance
        </p>
      </div>

      <div className="bg-saffron-50 border border-saffron-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-saffron-600 mt-0.5 shrink-0" />
        <p className="text-xs text-saffron-800">
          This service connects you with IP professionals. The AI assistant provides
          information only — for formal legal advice, expert consultation is recommended.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1">
            Your IP Question / Issue *
          </label>
          <textarea
            value={form.userQuery}
            onChange={(e) => setForm({ ...form, userQuery: e.target.value })}
            placeholder="Describe your IP question or the specific issue you need help with..."
            rows={4}
            required
            className="w-full px-4 py-3 border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1">
            Reason for Expert Consultation *
          </label>
          <select
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            required
            className="w-full px-4 py-3 border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm bg-white"
          >
            <option value="">Select a reason...</option>
            <option value="complex_case">Complex case requiring professional analysis</option>
            <option value="patent_filing">Need help with patent filing</option>
            <option value="trademark_registration">Trademark registration assistance</option>
            <option value="abs_compliance">ABS compliance guidance</option>
            <option value="international_filing">International IP filing</option>
            <option value="litigation">IP dispute / litigation</option>
            <option value="regulatory">Regulatory compliance questions</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-earth-700 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            placeholder="+91 XXXXX XXXXX"
            className="w-full px-4 py-3 border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !form.reason || !form.userQuery}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-xl hover:from-saffron-600 hover:to-saffron-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md font-medium"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Consultation Request
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-earth-400 text-center mt-4">
        Your data is handled in compliance with the Digital Personal Data Protection Act,
        2023.
      </p>
    </div>
  );
}

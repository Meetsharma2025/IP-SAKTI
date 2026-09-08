"use client";

import { useLanguage } from "./LanguageContext";
import dict from "@/lib/translations";

import { useState, useEffect, useCallback } from "react";
import {
  Building2, Plus, Users, Package, Shield, FileText, AlertTriangle,
  Loader2, ArrowRight, CheckCircle, Clock, AlertCircle, Send,
  Bot, Briefcase, Upload, Globe, Brain,
} from "lucide-react";

interface Organization {
  id: number; name: string; slug: string; orgType: string;
  description: string | null; contactEmail: string | null;
  targetMarkets: string[] | null;
}
interface Product {
  id: number; name: string; category: string | null; description: string | null;
  ipAssets: IPAsset[]; compliance: ComplianceItem[];
}
interface IPAsset {
  id: number; ipType: string; status: string; title: string;
  applicationNumber: string | null; jurisdiction: string | null;
}
interface ComplianceItem {
  id: number; requirementType: string; description: string;
  status: string; dueDate: string | null;
}
interface ClientDoc {
  id: number; title: string; docType: string; tags: string | null;
}

type View = "setup" | "dashboard" | "chat";

const orgTypes = [
  { value: "msme", label: "🏭 AYUSH MSME / Startup", desc: "Small/medium enterprise or startup in AYUSH sector" },
  { value: "cultivator", label: "🌿 Cultivator / TK Stakeholder", desc: "Medicinal plant cultivator or traditional knowledge holder" },
  { value: "researcher", label: "🧪 Researcher", desc: "Academic or industry researcher in Ayurveda/herbal science" },
  { value: "practitioner", label: "👨‍⚕️ AYUSH Practitioner", desc: "Registered Ayurveda/AYUSH practitioner" },
  { value: "facilitator", label: "🏛️ IP Facilitator", desc: "Patent agent, IP attorney, or IP facilitation centre" },
  { value: "institution", label: "🎓 Institution", desc: "University, research institute, or government body" },
];

export default function WorkspaceHub() {
  const { language: lang } = useLanguage();
  const t = (k: string) => dict[k]?.[lang] || dict[k]?.en || k;
  const [view, setView] = useState<View>("setup");
  const [org, setOrg] = useState<Organization | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [ipAssets, setIpAssets] = useState<IPAsset[]>([]);
  const [docs, setDocs] = useState<ClientDoc[]>([]);
  const [loading, setLoading] = useState(false);

  // Setup form
  const [setupForm, setSetupForm] = useState({
    name: "", orgType: "", description: "", ownerName: "", ownerEmail: "",
    contactEmail: "", targetMarkets: ["india"],
  });
  // Add product form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({ name: "", description: "", category: "", therapeuticClaims: "" });
  // Add IP asset form
  const [showAddIP, setShowAddIP] = useState(false);
  const [ipForm, setIpForm] = useState({ ipType: "trademark", status: "planned", title: "", jurisdiction: "india" });
  // Upload doc form
  const [showUploadDoc, setShowUploadDoc] = useState(false);
  const [docForm, setDocForm] = useState({ title: "", docType: "product_spec", content: "", tags: "" });
  // Chat
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const loadData = useCallback(async (orgId: number) => {
    try {
      const [prodRes, ipRes, docRes] = await Promise.all([
        fetch(`/api/client/products?orgId=${orgId}`).then(r => r.json()),
        fetch(`/api/client/ip-assets?orgId=${orgId}`).then(r => r.json()),
        fetch(`/api/client/documents?orgId=${orgId}`).then(r => r.json()),
      ]);
      setProducts(prodRes.products || []);
      setIpAssets(ipRes.ipAssets || []);
      setDocs(docRes.documents || []);
    } catch { /* ignore */ }
  }, []);

  const createOrg = async () => {
    if (!setupForm.name || !setupForm.orgType || !setupForm.ownerName || !setupForm.ownerEmail) return;
    setLoading(true);
    try {
      const res = await fetch("/api/client/org", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(setupForm),
      });
      const data = await res.json();
      if (data.organization) {
        setOrg(data.organization);
        setView("dashboard");
      }
    } catch { /* */ }
    setLoading(false);
  };

  const addProduct = async () => {
    if (!org || !productForm.name) return;
    await fetch("/api/client/products", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: org.id, ...productForm }),
    });
    setShowAddProduct(false);
    setProductForm({ name: "", description: "", category: "", therapeuticClaims: "" });
    loadData(org.id);
  };

  const addIPAsset = async () => {
    if (!org || !ipForm.title) return;
    await fetch("/api/client/ip-assets", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: org.id, ...ipForm }),
    });
    setShowAddIP(false);
    setIpForm({ ipType: "trademark", status: "planned", title: "", jurisdiction: "india" });
    loadData(org.id);
  };

  const uploadDoc = async () => {
    if (!org || !docForm.title || !docForm.content) return;
    await fetch("/api/client/documents", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: org.id, ...docForm }),
    });
    setShowUploadDoc(false);
    setDocForm({ title: "", docType: "product_spec", content: "", tags: "" });
    loadData(org.id);
  };

  const sendClientChat = async () => {
    if (!org || !chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/client/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg, orgId: org.id, jurisdiction: "india" }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.answer || data.error || "Error" }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Error occurred." }]);
    }
    setChatLoading(false);
  };

  const statusColor = (s: string) =>
    s === "completed" || s === "granted" ? "text-ayurveda-700 bg-ayurveda-50" :
    s === "pending" || s === "planned" ? "text-saffron-700 bg-saffron-50" :
    s === "overdue" || s === "expired" ? "text-red-700 bg-red-50" :
    "text-earth-600 bg-earth-50";

  // ===== SETUP VIEW =====
  if (view === "setup") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-saffron-500 to-ayurveda-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-earth-800">{ t("createWorkspace") }</h1>
          <p className="text-earth-500 mt-2">Set up your organization for personalized IP & regulatory guidance</p>
        </div>

        <div className="bg-white rounded-2xl border border-earth-200 p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1">Organization Name *</label>
            <input type="text" value={setupForm.name} onChange={e => setSetupForm({ ...setupForm, name: e.target.value })}
              placeholder="e.g., AyurHerb Pvt. Ltd." className="w-full px-4 py-3 border border-earth-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-400 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">Organization Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {orgTypes.map(t => (
                <button key={t.value} onClick={() => setSetupForm({ ...setupForm, orgType: t.value })}
                  className={`text-left p-3 rounded-xl border-2 transition-all text-sm ${
                    setupForm.orgType === t.value ? "border-saffron-500 bg-saffron-50" : "border-earth-200 hover:border-saffron-300"
                  }`}>
                  <div className="font-medium">{t.label}</div>
                  <div className="text-xs text-earth-500 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Your Name *</label>
              <input type="text" value={setupForm.ownerName} onChange={e => setSetupForm({ ...setupForm, ownerName: e.target.value })}
                className="w-full px-4 py-2.5 border border-earth-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400" />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1">Email *</label>
              <input type="email" value={setupForm.ownerEmail} onChange={e => setSetupForm({ ...setupForm, ownerEmail: e.target.value })}
                className="w-full px-4 py-2.5 border border-earth-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-saffron-400" />
            </div>
          </div>

          <button onClick={createOrg} disabled={loading || !setupForm.name || !setupForm.orgType || !setupForm.ownerName || !setupForm.ownerEmail}
            className="w-full py-3 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-xl font-medium disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Create Workspace
          </button>
        </div>
      </div>
    );
  }

  // ===== DASHBOARD VIEW =====
  if (view === "dashboard" && org) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-earth-800 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-saffron-500" />
              {org.name}
            </h1>
            <p className="text-sm text-earth-500">{orgTypes.find(t => t.value === org.orgType)?.label || org.orgType} Workspace</p>
          </div>
          <button onClick={() => setView("chat")}
            className="px-4 py-2 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-md">
            <Bot className="w-4 h-4" /> Ask AI (Personalized)
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Package, label: "Products", count: products.length, color: "text-saffron-600" },
            { icon: Shield, label: "IP Assets", count: ipAssets.length, color: "text-blue-600" },
            { icon: FileText, label: "Documents", count: docs.length, color: "text-earth-600" },
            { icon: AlertTriangle, label: "Pending", count: products.flatMap(p => p.compliance || []).filter(c => c.status === "pending").length, color: "text-amber-600" },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl border border-earth-200 p-4">
              <s.icon className={`w-5 h-5 ${s.color} mb-1`} />
              <div className="text-2xl font-bold text-earth-800">{s.count}</div>
              <div className="text-xs text-earth-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-2xl border border-earth-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-earth-800 flex items-center gap-2"><Package className="w-5 h-5 text-saffron-600" /> Products</h2>
            <button onClick={() => setShowAddProduct(true)} className="text-xs px-3 py-1.5 bg-saffron-50 text-saffron-700 rounded-lg hover:bg-saffron-100 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add Product
            </button>
          </div>
          {products.length === 0 ? <p className="text-sm text-earth-400">No products yet. Add your first product.</p> : (
            <div className="space-y-2">
              {products.map(p => (
                <div key={p.id} className="p-3 bg-earth-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm text-earth-800">{p.name}</span>
                      {p.category && <span className="ml-2 text-xs bg-saffron-100 text-saffron-700 px-2 py-0.5 rounded-full">{p.category}</span>}
                    </div>
                    <div className="flex gap-1">
                      {(p.ipAssets || []).length > 0 && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{p.ipAssets.length} IP</span>}
                      {(p.compliance || []).filter(c => c.status === "pending").length > 0 && (
                        <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">
                          {p.compliance.filter(c => c.status === "pending").length} pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showAddProduct && (
            <div className="mt-3 p-4 bg-saffron-50 rounded-xl border border-saffron-200 space-y-3 animate-fade-in">
              <input placeholder="Product name" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm" />
              <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm bg-white">
                <option value="">Select category</option>
                <option value="classical">Classical Ayurvedic Medicine</option>
                <option value="proprietary">Proprietary Medicine</option>
                <option value="new_drug">New Drug</option>
                <option value="phytopharma">Phytopharmaceutical</option>
                <option value="nutraceutical">Nutraceutical / Ayurveda-Aahar</option>
                <option value="cosmetic">Cosmetic</option>
              </select>
              <textarea placeholder="Description" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm resize-none" rows={2} />
              <div className="flex gap-2">
                <button onClick={addProduct} className="px-4 py-2 bg-saffron-600 text-white rounded-lg text-sm">Add</button>
                <button onClick={() => setShowAddProduct(false)} className="px-4 py-2 bg-earth-200 text-earth-700 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* IP Assets Section */}
        <div className="bg-white rounded-2xl border border-earth-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-earth-800 flex items-center gap-2"><Shield className="w-5 h-5 text-blue-600" /> IP Portfolio</h2>
            <button onClick={() => setShowAddIP(true)} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Add IP Asset
            </button>
          </div>
          {ipAssets.length === 0 ? <p className="text-sm text-earth-400">No IP assets tracked yet.</p> : (
            <div className="space-y-2">
              {ipAssets.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-earth-50 rounded-xl">
                  <div>
                    <span className="font-medium text-sm text-earth-800">{a.title}</span>
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{a.ipType}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(a.status)}`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
          {showAddIP && (
            <div className="mt-3 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3 animate-fade-in">
              <input placeholder="IP Asset title" value={ipForm.title} onChange={e => setIpForm({ ...ipForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={ipForm.ipType} onChange={e => setIpForm({ ...ipForm, ipType: e.target.value })}
                  className="px-3 py-2 border border-earth-300 rounded-lg text-sm bg-white">
                  <option value="patent">Patent</option><option value="trademark">Trademark</option>
                  <option value="design">Design</option><option value="gi">GI</option>
                  <option value="copyright">Copyright</option><option value="trade_secret">Trade Secret</option>
                </select>
                <select value={ipForm.status} onChange={e => setIpForm({ ...ipForm, status: e.target.value })}
                  className="px-3 py-2 border border-earth-300 rounded-lg text-sm bg-white">
                  <option value="planned">Planned</option><option value="filed">Filed</option>
                  <option value="pending">Pending</option><option value="granted">Granted</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={addIPAsset} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Add</button>
                <button onClick={() => setShowAddIP(false)} className="px-4 py-2 bg-earth-200 text-earth-700 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="bg-white rounded-2xl border border-earth-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-earth-800 flex items-center gap-2"><FileText className="w-5 h-5 text-earth-600" /> Documents</h2>
            <button onClick={() => setShowUploadDoc(true)} className="text-xs px-3 py-1.5 bg-earth-100 text-earth-700 rounded-lg hover:bg-earth-200 flex items-center gap-1">
              <Upload className="w-3 h-3" /> Upload Document
            </button>
          </div>
          {docs.length === 0 ? <p className="text-sm text-earth-400">No documents uploaded. Upload product specs, certificates, or research documents.</p> : (
            <div className="space-y-2">
              {docs.map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-earth-50 rounded-xl">
                  <span className="font-medium text-sm text-earth-800">{d.title}</span>
                  <span className="text-xs bg-earth-100 text-earth-600 px-2 py-0.5 rounded-full">{d.docType}</span>
                </div>
              ))}
            </div>
          )}
          {showUploadDoc && (
            <div className="mt-3 p-4 bg-earth-50 rounded-xl border border-earth-200 space-y-3 animate-fade-in">
              <input placeholder="Document title" value={docForm.title} onChange={e => setDocForm({ ...docForm, title: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm" />
              <select value={docForm.docType} onChange={e => setDocForm({ ...docForm, docType: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm bg-white">
                <option value="product_spec">Product Specification</option><option value="formulation">Formulation Details</option>
                <option value="certificate">Certificate/License</option><option value="research">Research Paper</option>
                <option value="patent_doc">Patent Document</option><option value="regulatory">Regulatory Filing</option>
              </select>
              <textarea placeholder="Paste document content..." value={docForm.content} onChange={e => setDocForm({ ...docForm, content: e.target.value })}
                className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm resize-none" rows={4} />
              <div className="flex gap-2">
                <button onClick={uploadDoc} className="px-4 py-2 bg-earth-700 text-white rounded-lg text-sm">Upload</button>
                <button onClick={() => setShowUploadDoc(false)} className="px-4 py-2 bg-earth-200 text-earth-700 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== CLIENT-AWARE CHAT VIEW =====
  if (view === "chat" && org) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-earth-800 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" /> Personalized IP Assistant
            </h1>
            <p className="text-xs text-earth-500">Context: {org.name} ({org.orgType}) • {products.length} products • {ipAssets.length} IP assets</p>
          </div>
          <button onClick={() => setView("dashboard")} className="text-sm text-earth-500 hover:text-earth-700">← Dashboard</button>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 mb-4 text-xs text-purple-700">
          <strong>Client-Aware Mode:</strong> AI has access to your organization profile, products, IP portfolio, and uploaded documents for personalized guidance.
        </div>

        <div className="bg-white rounded-2xl border border-earth-200 min-h-[350px] max-h-[500px] overflow-y-auto p-4 mb-4">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8 text-earth-400 text-sm">
              <Bot className="w-12 h-12 mx-auto mb-3 text-earth-300" />
              Ask a question — the AI knows your organization context.
            </div>
          ) : (
            <div className="space-y-3">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} gap-2`}>
                  {m.role === "assistant" && <Bot className="w-6 h-6 text-saffron-500 shrink-0 mt-1" />}
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                    m.role === "user" ? "bg-saffron-500 text-white rounded-br-sm" : "bg-earth-50 text-earth-700 rounded-bl-sm"
                  }`}>
                    {m.content.split("\n").map((line, j) => <p key={j} className="mb-1">{line}</p>)}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-earth-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Analyzing with your organization context...
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendClientChat()}
            placeholder="Ask about your products, IP strategy, compliance..."
            className="flex-1 px-4 py-3 border border-earth-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" disabled={chatLoading} />
          <button onClick={sendClientChat} disabled={chatLoading || !chatInput.trim()}
            className="px-5 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl disabled:opacity-50">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}

"use client";

import Link from "next/link";
import {
  Shield, Search, BookOpen, Globe, Leaf, Scale, FileText, Users,
  ArrowRight, CheckCircle, MessageSquare, AlertTriangle, Layers,
  Languages, Brain, Cpu,
} from "lucide-react";
import { useLanguage } from "./LanguageContext";

// Translation map for landing page
const T: Record<string, Record<string, string>> = {
  badge: { en: "Designed for SIH PS #26045 • Ministry of AYUSH", hi: "SIH PS #26045 के लिए डिज़ाइन • आयुष मंत्रालय", ta: "SIH PS #26045 க்காக வடிவமைக்கப்பட்டது • AYUSH அமைச்சகம்", te: "SIH PS #26045 కోసం రూపొందించబడింది • AYUSH మంత్రిత్వశాఖ", bn: "SIH PS #26045 এর জন্য ডিজাইন করা • AYUSH মন্ত্রণালয়", mr: "SIH PS #26045 साठी डिझाइन • AYUSH मंत्रालय" },
  heroTitle: { en: "Navigate Ayurveda IP with Confidence", hi: "आत्मविश्वास के साथ आयुर्वेद IP का मार्गदर्शन करें", ta: "நம்பிக்கையுடன் ஆயுர்வேத IP-ஐ வழிநடத்துங்கள்", te: "ఆత్మవిశ్వాసంతో ఆయుర్వేద IP ను నావిగేట్ చేయండి", bn: "আত্মবিশ্বাসের সাথে আয়ুর্বেদ IP নেভিগেট করুন", mr: "आत्मविश्वासाने आयुर्वेद IP नेव्हिगेट करा" },
  heroSub: { en: "Source-cited guidance across patents, trademarks, geographical indications, ABS compliance, and regulatory frameworks — for India and international regimes.", hi: "पेटेंट, ट्रेडमार्क, भौगोलिक संकेत, ABS अनुपालन और नियामक ढांचे पर स्रोत-उद्धृत मार्गदर्शन — भारत और अंतर्राष्ट्रीय शासनों के लिए।", ta: "காப்புரிமை, வர்த்தகக்குறி, GI, ABS இணக்கம் மற்றும் ஒழுங்குமுறை கட்டமைப்பு — இந்தியா மற்றும் சர்வதேச ஆட்சிமுறைகளுக்கு.", te: "పేటెంట్లు, ట్రేడ్‌మార్క్‌లు, GI, ABS సమ్మతి మరియు నియంత్రణ ఫ్రేమ్‌వర్క్‌ల అంతటా మూల-ఉదహరిత మార్గదర్శకత్వం.", bn: "পেটেন্ট, ট্রেডমার্ক, GI, ABS সম্মতি এবং নিয়ন্ত্রক কাঠামো জুড়ে উৎস-উদ্ধৃত নির্দেশিকা।", mr: "पेटंट, ट्रेडमार्क, GI, ABS अनुपालन आणि नियामक फ्रेमवर्कवर स्रोत-उद्धृत मार्गदर्शन." },
  askBtn: { en: "Ask IP Assistant", hi: "IP सहायक से पूछें", ta: "IP உதவியாளரிடம் கேளுங்கள்", te: "IP సహాయకుడిని అడగండి", bn: "IP সহায়ককে জিজ্ঞাসা করুন", mr: "IP सहाय्यकाला विचारा" },
  classifyBtn: { en: "Classify Your Product", hi: "अपने उत्पाद का वर्गीकरण करें", ta: "உங்கள் தயாரிப்பை வகைப்படுத்துங்கள்", te: "మీ ఉత్పత్తిని వర్గీకరించండి", bn: "আপনার পণ্য শ্রেণীবদ্ধ করুন", mr: "तुमच्या उत्पादनाचे वर्गीकरण करा" },
  disclaimer: { en: "This tool provides informational guidance only, NOT legal advice. Always consult a qualified IP attorney for specific legal advice.", hi: "यह उपकरण केवल सूचनात्मक मार्गदर्शन प्रदान करता है, कानूनी सलाह नहीं। विशिष्ट कानूनी सलाह के लिए हमेशा एक योग्य IP वकील से परामर्श करें।", ta: "இந்த கருவி தகவல் வழிகாட்டுதலை மட்டுமே வழங்குகிறது, சட்ட ஆலோசனை அல்ல.", te: "ఈ సాధనం సమాచార మార్గదర్శకత్వాన్ని మాత్రమే అందిస్తుంది, న్యాయ సలహా కాదు.", bn: "এই টুলটি শুধুমাত্র তথ্যমূলক নির্দেশিকা প্রদান করে, আইনি পরামর্শ নয়।", mr: "हे साधन केवळ माहितीपूर्ण मार्गदर्शन प्रदान करते, कायदेशीर सल्ला नाही." },
  flowTitle: { en: "Your IP Journey, Step by Step", hi: "आपकी IP यात्रा, कदम दर कदम", ta: "உங்கள் IP பயணம், படிப்படியாக", te: "మీ IP ప్రయాణం, అడుగు అడుగునా", bn: "আপনার IP যাত্রা, ধাপে ধাপে", mr: "तुमचा IP प्रवास, चरणबद्ध" },
  featTitle: { en: "Comprehensive IP Intelligence", hi: "व्यापक IP बुद्धिमत्ता", ta: "விரிவான IP நுண்ணறிவு", te: "సమగ్ర IP మేధస్సు", bn: "ব্যাপক IP বুদ্ধিমত্তা", mr: "सर्वसमावेशक IP बुद्धिमत्ता" },
  ipTitle: { en: "All IP Types Covered", hi: "सभी IP प्रकार शामिल", ta: "அனைத்து IP வகைகளும் உள்ளடக்கம்", te: "అన్ని IP రకాలు కవర్ చేయబడ్డాయి", bn: "সমস্ত IP প্রকার আচ্ছাদিত", mr: "सर्व IP प्रकार समाविष्ट" },
  jurTitle: { en: "Two Jurisdictions, Clearly Separated", hi: "दो क्षेत्राधिकार, स्पष्ट रूप से अलग", ta: "இரண்டு அதிகார வரம்புகள், தெளிவாக பிரிக்கப்பட்டவை", te: "రెండు అధికార పరిధులు, స్పష్టంగా వేరు చేయబడ్డాయి", bn: "দুটি এখতিয়ার, স্পষ্টভাবে পৃথক", mr: "दोन अधिकारक्षेत्रे, स्पष्टपणे वेगळी" },
  ctaTitle: { en: "Ready to protect your Ayurvedic innovation?", hi: "अपने आयुर्वेदिक नवाचार की रक्षा के लिए तैयार हैं?", ta: "உங்கள் ஆயுர்வேத புதுமையை பாதுகாக்க தயாரா?", te: "మీ ఆయుర్వేద ఆవిష్కరణను రక్షించడానికి సిద్ధంగా ఉన్నారా?", bn: "আপনার আয়ুর্বেদিক উদ্ভাবন রক্ষা করতে প্রস্তুত?", mr: "तुमच्या आयुर्वेदिक नवकल्पनेचे संरक्षण करण्यासाठी तयार आहात?" },
};

function t(key: string, lang: string): string {
  return T[key]?.[lang] || T[key]?.en || key;
}

const features = [
  { icon: Brain, title: { en: "Nemotron 3 Ultra AI Engine", hi: "Nemotron 3 Ultra AI इंजन" }, desc: { en: "Powered by NVIDIA Nemotron 3 Ultra 550B for deep reasoning over retrieved legal documents.", hi: "पुनर्प्राप्त कानूनी दस्तावेजों पर गहन तर्क के लिए NVIDIA Nemotron 3 Ultra 550B द्वारा संचालित।" }, color: "from-purple-500 to-purple-600" },
  { icon: Search, title: { en: "Source-Cited RAG Answers", hi: "स्रोत-उद्धृत RAG उत्तर" }, desc: { en: "Citation-grounded answers with hallucination-resistant retrieval and safe abstention.", hi: "मतिभ्रम-प्रतिरोधी पुनर्प्राप्ति और सुरक्षित परित्याग के साथ उद्धरण-आधारित उत्तर।" }, color: "from-saffron-500 to-saffron-600" },
  { icon: Layers, title: { en: "Product Classification", hi: "उत्पाद वर्गीकरण" }, desc: { en: "Determine if your product is classical, proprietary, new drug, phytopharmaceutical, nutraceutical, or cosmetic.", hi: "निर्धारित करें कि आपका उत्पाद शास्त्रीय, पेटेंट, नई दवा, फाइटोफार्मा, न्यूट्रास्यूटिकल या कॉस्मेटिक है।" }, color: "from-ayurveda-500 to-ayurveda-600" },
  { icon: Globe, title: { en: "Jurisdiction Toggle", hi: "क्षेत्राधिकार टॉगल" }, desc: { en: "Separate guidance for Indian law and international regimes. Never conflated.", hi: "भारतीय कानून और अंतर्राष्ट्रीय शासनों के लिए अलग मार्गदर्शन। कभी मिश्रित नहीं।" }, color: "from-blue-500 to-blue-600" },
  { icon: Leaf, title: { en: "ABS Compliance", hi: "ABS अनुपालन" }, desc: { en: "Access & Benefit Sharing compliance checker under the Biological Diversity Act and Nagoya Protocol.", hi: "जैव विविधता अधिनियम और नागोया प्रोटोकॉल के तहत ABS अनुपालन जाँच।" }, color: "from-green-600 to-green-700" },
  { icon: Languages, title: { en: "Multilingual Support", hi: "बहुभाषी समर्थन" }, desc: { en: "Access guidance in Hindi, Tamil, Telugu, Bengali, Marathi, and English.", hi: "हिंदी, तमिल, तेलुगु, बांग्ला, मराठी और अंग्रेजी में मार्गदर्शन प्राप्त करें।" }, color: "from-purple-500 to-purple-600" },
];

const workflow = [
  { step: "1", title: { en: "What is my product?", hi: "मेरा उत्पाद क्या है?" }, desc: { en: "Classify your Ayurvedic product", hi: "अपने आयुर्वेदिक उत्पाद का वर्गीकरण करें" } },
  { step: "2", title: { en: "What regulations apply?", hi: "कौन से नियम लागू होते हैं?" }, desc: { en: "Identify applicable regulations", hi: "लागू नियमों की पहचान करें" } },
  { step: "3", title: { en: "What IP protection?", hi: "कौन सी IP सुरक्षा?" }, desc: { en: "Explore IP options", hi: "IP विकल्पों का पता लगाएं" } },
  { step: "4", title: { en: "What compliance?", hi: "कौन सा अनुपालन?" }, desc: { en: "ABS, advertising, labelling", hi: "ABS, विज्ञापन, लेबलिंग" } },
  { step: "5", title: { en: "Which source proves it?", hi: "कौन सा स्रोत प्रमाणित करता है?" }, desc: { en: "Get exact citations", hi: "सटीक उद्धरण प्राप्त करें" } },
];

export default function LandingContent() {
  const { language: lang } = useLanguage();

  return (
    <div className="animate-fade-in">
      {/* Hero */}
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
              {t("badge", lang)}
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
              {t("heroTitle", lang)}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-earth-300 leading-relaxed max-w-2xl mx-auto">
              {t("heroSub", lang)}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-sm">
              <Cpu className="w-4 h-4" />
              Powered by NVIDIA Nemotron 3 Ultra 550B
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/chat" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-saffron-600 hover:to-saffron-700 transition-all text-lg">
                <MessageSquare className="w-5 h-5" />{t("askBtn", lang)}<ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/classify" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all text-lg">
                <Layers className="w-5 h-5" />{t("classifyBtn", lang)}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none"><path d="M0 60L1440 60L1440 0C1440 0 1080 40 720 40C360 40 0 0 0 0L0 60Z" fill="#faf8f1" /></svg>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-saffron-50 border-b border-saffron-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-saffron-600 shrink-0" />
          <p className="text-sm text-saffron-800"><strong>{lang === "hi" ? "महत्वपूर्ण:" : "Important:"}</strong> {t("disclaimer", lang)}</p>
        </div>
      </div>

      {/* Workflow */}
      <section className="py-16 md:py-20 bg-earth-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-earth-800">{t("flowTitle", lang)}</h2>
          </div>
          <div className="flex flex-col md:flex-row items-start gap-4 md:gap-2 justify-center">
            {workflow.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 md:flex-col md:text-center flex-1">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">{item.step}</div>
                <div className="md:mt-3">
                  <h3 className="font-semibold text-earth-800 text-sm md:text-base">{item.title[lang as keyof typeof item.title] || item.title.en}</h3>
                  <p className="text-xs md:text-sm text-earth-500 mt-1">{item.desc[lang as keyof typeof item.desc] || item.desc.en}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-earth-800">{t("featTitle", lang)}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="bg-white rounded-2xl border border-earth-200 p-6 hover:shadow-lg hover:border-saffron-300 transition-all group">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-md`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-earth-800">{f.title[lang as keyof typeof f.title] || f.title.en}</h3>
                  <p className="mt-2 text-sm text-earth-500 leading-relaxed">{f.desc[lang as keyof typeof f.desc] || f.desc.en}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* IP Types */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-earth-100 to-earth-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-earth-800">{t("ipTitle", lang)}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: FileText, label: lang === "hi" ? "पेटेंट" : "Patents", desc: "Section 3(p), 3(d)" },
              { icon: Globe, label: lang === "hi" ? "भौगोलिक संकेत" : "GI", desc: lang === "hi" ? "भौगोलिक संकेत" : "Geographical Indications" },
              { icon: Shield, label: lang === "hi" ? "ट्रेडमार्क" : "Trademarks", desc: lang === "hi" ? "ब्रांड सुरक्षा" : "Brand Protection" },
              { icon: BookOpen, label: lang === "hi" ? "कॉपीराइट" : "Copyright", desc: lang === "hi" ? "मौलिक कार्य" : "Original Works" },
              { icon: Layers, label: lang === "hi" ? "डिज़ाइन" : "Designs", desc: lang === "hi" ? "पैकेजिंग और उत्पाद" : "Packaging & Product" },
              { icon: Leaf, label: lang === "hi" ? "पौध किस्म" : "Plant Variety", desc: "PPVFRA" },
              { icon: Scale, label: lang === "hi" ? "व्यापार रहस्य" : "Trade Secrets", desc: lang === "hi" ? "गोपनीय फार्मूलेशन" : "Confidential Formulations" },
              { icon: Users, label: "ABS", desc: lang === "hi" ? "लाभ साझाकरण" : "Benefit Sharing" },
            ].map((ip, i) => {
              const Icon = ip.icon;
              return (
                <div key={i} className="bg-white rounded-xl p-5 text-center hover:shadow-md transition-all border border-earth-200 hover:border-saffron-300">
                  <Icon className="w-8 h-8 text-saffron-600 mx-auto" />
                  <h3 className="mt-2 font-semibold text-earth-800 text-sm">{ip.label}</h3>
                  <p className="mt-1 text-xs text-earth-500">{ip.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Jurisdictions */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-earth-800">{t("jurTitle", lang)}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-saffron-50 to-saffron-100 rounded-2xl p-8 border border-saffron-200">
              <div className="text-4xl mb-4">🇮🇳</div>
              <h3 className="text-2xl font-bold text-earth-800 mb-4">{lang === "hi" ? "भारत" : "India"}</h3>
              <ul className="space-y-2">
                {["Patents Act (+ 2024 Rules)","GI Act, Trade Marks Act, Designs Act","Copyright Act","Plant Variety Protection (PPVFRA)","Biological Diversity Act (2023 Amendment)","Drugs & Cosmetics Act","DMRA (Advertising)","FSSAI Ayurveda-Aahar"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-earth-700"><CheckCircle className="w-4 h-4 text-saffron-600 mt-0.5 shrink-0" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
              <div className="text-4xl mb-4">🌎</div>
              <h3 className="text-2xl font-bold text-earth-800 mb-4">{lang === "hi" ? "अंतर्राष्ट्रीय" : "International"}</h3>
              <ul className="space-y-2">
                {["TRIPS Agreement","Convention on Biological Diversity","Nagoya Protocol","WIPO GRATK Treaty (2024)","PCT (Patent Cooperation Treaty)","Madrid System (Trademarks)","Hague System (Designs)","Budapest Treaty"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-earth-700"><CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-earth-800 to-earth-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">{t("ctaTitle", lang)}</h2>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/classify" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-semibold rounded-xl shadow-lg transition-all">
              <Layers className="w-5 h-5" />{t("classifyBtn", lang)}
            </Link>
            <Link href="/chat" className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all">
              <MessageSquare className="w-5 h-5" />{t("askBtn", lang)}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

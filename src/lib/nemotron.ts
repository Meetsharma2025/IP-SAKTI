// Nemotron 3 Ultra client — NVIDIA Build API (primary) + OpenRouter (fallback)
// Primary: https://integrate.api.nvidia.com/v1 (direct NVIDIA, higher limits, reasoning_content)
// Fallback: https://openrouter.ai/api/v1 (if NVIDIA key unavailable)

const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NVIDIA = "nvidia/nemotron-3-ultra-550b-a55b";
const MODEL_OPENROUTER = "nvidia/nemotron-3-ultra-550b-a55b:free";

interface NemotronMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface NemotronOptions {
  temperature?: number;
  maxTokens?: number;
  reasoning?: boolean;
}

interface NemotronResponse {
  content: string;
  reasoning?: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: "nvidia" | "openrouter" | "fallback";
}

// Determine which API to use
function getProvider(): { url: string; key: string; model: string; provider: "nvidia" | "openrouter" } {
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (nvidiaKey) {
    return { url: NVIDIA_URL, key: nvidiaKey, model: MODEL_NVIDIA, provider: "nvidia" };
  }
  if (openrouterKey) {
    return { url: OPENROUTER_URL, key: openrouterKey, model: MODEL_OPENROUTER, provider: "openrouter" };
  }
  throw new Error("Neither NVIDIA_API_KEY nor OPENROUTER_API_KEY is set");
}

export async function callNemotron(
  messages: NemotronMessage[],
  options: NemotronOptions = {}
): Promise<NemotronResponse> {
  const {
    temperature = 0.3,
    maxTokens = 4096,
    reasoning = false,
  } = options;

  const { url, key, model, provider } = getProvider();

  // Build request body — different params for each provider
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  if (reasoning) {
    if (provider === "nvidia") {
      // NVIDIA Build API uses chat_template_kwargs for thinking
      body.chat_template_kwargs = { enable_thinking: true };
    } else {
      // OpenRouter uses reasoning parameter
      body.reasoning = { enabled: true };
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  if (provider === "openrouter") {
    headers["HTTP-Referer"] = "https://ip-sakti-sahayak.app";
    headers["X-Title"] = "IP-SAKTI Sahayak";
  }

  // Try primary provider
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`${provider} API error:`, response.status, errText);
      throw new Error(`${provider} API error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    if (!choice) throw new Error("No response from Nemotron");

    const msg = choice.message;

    // Extract reasoning — different field names per provider
    let reasoningText: string | undefined;
    if (provider === "nvidia" && msg?.reasoning_content) {
      reasoningText = String(msg.reasoning_content);
    } else if (provider === "openrouter" && msg?.reasoning_details) {
      reasoningText = Array.isArray(msg.reasoning_details)
        ? msg.reasoning_details.map((r: { content?: string }) => r.content || "").join("\n")
        : String(msg.reasoning_details);
    }

    return {
      content: msg?.content || "",
      reasoning: reasoningText,
      model: data.model || model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0,
      } : undefined,
      provider,
    };
  } catch (primaryError) {
    // If primary fails and we have a fallback, try it
    const fallbackKey = provider === "nvidia" ? process.env.OPENROUTER_API_KEY : process.env.NVIDIA_API_KEY;
    if (!fallbackKey) throw primaryError;

    console.warn(`${provider} failed, trying fallback...`);

    const fbUrl = provider === "nvidia" ? OPENROUTER_URL : NVIDIA_URL;
    const fbModel = provider === "nvidia" ? MODEL_OPENROUTER : MODEL_NVIDIA;
    const fbProvider = provider === "nvidia" ? "openrouter" : "nvidia";

    const fbBody: Record<string, unknown> = {
      model: fbModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (reasoning) {
      if (fbProvider === "nvidia") {
        fbBody.chat_template_kwargs = { enable_thinking: true };
      } else {
        fbBody.reasoning = { enabled: true };
      }
    }

    const fbHeaders: Record<string, string> = {
      Authorization: `Bearer ${fallbackKey}`,
      "Content-Type": "application/json",
    };

    try {
      const fbResponse = await fetch(fbUrl, {
        method: "POST",
        headers: fbHeaders,
        body: JSON.stringify(fbBody),
      });

      if (!fbResponse.ok) throw new Error(`Fallback ${fbProvider} also failed`);

      const fbData = await fbResponse.json();
      const fbChoice = fbData.choices?.[0];
      if (!fbChoice) throw new Error("No fallback response");

      const fbMsg = fbChoice.message;
      let fbReasoning: string | undefined;
      if (fbProvider === "nvidia" && fbMsg?.reasoning_content) {
        fbReasoning = String(fbMsg.reasoning_content);
      } else if (fbProvider === "openrouter" && fbMsg?.reasoning_details) {
        fbReasoning = Array.isArray(fbMsg.reasoning_details)
          ? fbMsg.reasoning_details.map((r: { content?: string }) => r.content || "").join("\n")
          : String(fbMsg.reasoning_details);
      }

      return {
        content: fbMsg?.content || "",
        reasoning: fbReasoning,
        model: fbData.model || fbModel,
        usage: fbData.usage ? {
          promptTokens: fbData.usage.prompt_tokens || 0,
          completionTokens: fbData.usage.completion_tokens || 0,
          totalTokens: fbData.usage.total_tokens || 0,
        } : undefined,
        provider: fbProvider,
      };
    } catch {
      // Both failed — rethrow original error
      throw primaryError;
    }
  }
}

// ========== SPECIALIZED PROMPTS ==========

const SYSTEM_PROMPT = `You are IP-SAKTI Sahayak, an expert AI assistant for Intellectual Property rights and regulatory guidance for Ayurveda, developed for India's Ministry of AYUSH.

RULES:
1. Cite specific statutes, sections, rules, treaty articles for every claim.
2. State "This is information only, NOT legal advice."
3. NEVER fabricate legal authority.
4. Keep India and International jurisdictions SEPARATE.
5. Consider product classification (classical, proprietary, new drug, phytopharma, nutraceutical, cosmetic).
6. Consider ABS obligations when biological resources are involved.
7. Format with clear headings, bullet points, bold citations.
8. If information is insufficient, say so clearly.`;

export async function generateClassificationAnalysis(
  productName: string,
  productDescription: string,
  classificationResult: string,
  answers: string,
  language: string = "en"
): Promise<NemotronResponse> {
  const langMap: Record<string, string> = {
    hi: "\n\n🔴 अनिवार्य: पूरा विश्लेषण हिन्दी में लिखें। केवल कानूनी धारा संख्या अंग्रेजी में रखें।",
    ta: "\n\n🔴 கட்டாயம்: முழு பகுப்பாய்வையும் தமிழில் எழுதவும்.",
    te: "\n\n🔴 తప్పనిసరి: పూర్తి విశ్లేషణ తెలుగులో రాయండి.",
    bn: "\n\n🔴 বাধ্যতামূলক: সম্পূর্ণ বিশ্লেষণ বাংলায় লিখুন।",
    mr: "\n\n🔴 अनिवार्य: संपूर्ण विश्लेषण मराठीत लिहा.",
  };
  const langInstr = langMap[language] || "";

  return callNemotron([
    { role: "system", content: SYSTEM_PROMPT + langInstr },
    {
      role: "user",
      content: `Analyze this Ayurvedic product classification:
PRODUCT: ${productName}
DESCRIPTION: ${productDescription}
ANSWERS: ${answers}
PRELIMINARY CLASSIFICATION: ${classificationResult}

Provide: 1) Confirm/refine classification 2) IP protection strategy 3) Regulatory steps 4) ABS requirements 5) TKDL check recommendations. Cite specific statutes.${langInstr}`,
    },
  ], { temperature: 0.2, maxTokens: 2500, reasoning: true });
}

export async function translateText(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<NemotronResponse> {
  const langMap: Record<string, string> = {
    hi: "Hindi (हिन्दी)", ta: "Tamil (தமிழ்)", te: "Telugu (తెలుగు)",
    bn: "Bengali (বাংলা)", mr: "Marathi (मराठी)", en: "English",
  };
  return callNemotron([
    {
      role: "system",
      content: `Translate from ${langMap[sourceLanguage] || sourceLanguage} into ${langMap[targetLanguage] || targetLanguage}. Keep statute references in English. Maintain formatting and meaning. Return only the translated text.`,
    },
    { role: "user", content: text },
  ], { temperature: 0.1, maxTokens: 3000 });
}

export async function generateABSAnalysis(
  answers: string,
  preliminaryResult: string,
  language: string = "en"
): Promise<NemotronResponse> {
  const langMap: Record<string, string> = {
    hi: "\n\n🔴 अनिवार्य: पूरा विश्लेषण हिन्दी में लिखें। केवल कानूनी धारा संख्या अंग्रेजी में रखें।",
    ta: "\n\n🔴 கட்டாயம்: முழு பகுப்பாய்வையும் தமிழில் எழுதவும்.",
    te: "\n\n🔴 తప్పనిసరి: పూర్తి విశ్లేషణ తెలుగులో రాయండి.",
    bn: "\n\n🔴 বাধ্যতামূলক: সম্পূর্ণ বিশ্লেষণ বাংলায় লিখুন।",
    mr: "\n\n🔴 अनिवार्य: संपूर्ण विश्लेषण मराठीत लिहा.",
  };
  const langInstr = langMap[language] || "";

  return callNemotron([
    { role: "system", content: SYSTEM_PROMPT + langInstr },
    {
      role: "user",
      content: `Analyze ABS compliance for Ayurvedic product:
RESPONSES: ${answers}
ASSESSMENT: ${preliminaryResult}

Provide: 1) Confirm/refine assessment 2) Specific BD Act sections 3) Compliance steps with forms 4) International obligations 5) 2023 Amendment changes 6) Non-compliance consequences. Cite specific sections.${langInstr}`,
    },
  ], { temperature: 0.2, maxTokens: 2500, reasoning: true });
}

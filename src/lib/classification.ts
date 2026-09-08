// Product Classification Engine for Ayurvedic Products

export interface ClassificationQuestion {
  id: string;
  question: string;
  questionHi?: string; // Hindi
  options: {
    value: string;
    label: string;
    labelHi?: string;
  }[];
  helpText?: string;
}

export interface ClassificationResult {
  category: string;
  categoryLabel: string;
  description: string;
  regulatoryRequirements: string[];
  ipOptions: { type: string; applicability: string; details: string }[];
  absRequired: boolean;
  absLevel: "required" | "likely_required" | "possibly_required" | "likely_exempt" | "exempt";
  absDetails: string;
  tkdlRelevance: string;
  keyStatutes: string[];
  classificationConfidence: number; // 0-100
  uncertaintyFlags: string[];
  humanReviewRecommended: boolean;
}

export const classificationQuestions: ClassificationQuestion[] = [
  {
    id: "source",
    question: "Is your formulation described in any authoritative Ayurvedic text listed in the First Schedule of the Drugs & Cosmetics Act?",
    questionHi: "क्या आपकी फार्मूलेशन ड्रग्स एंड कॉस्मेटिक्स अधिनियम की प्रथम अनुसूची में सूचीबद्ध किसी आधिकारिक आयुर्वेदिक ग्रंथ में वर्णित है?",
    options: [
      { value: "yes_classical", label: "Yes - exactly as described in classical text", labelHi: "हां - शास्त्रीय ग्रंथ में वर्णित अनुसार" },
      { value: "yes_modified", label: "Yes - but with modifications/additions", labelHi: "हां - लेकिन संशोधन/परिवर्धन के साथ" },
      { value: "no", label: "No - it is a new/original formulation", labelHi: "नहीं - यह एक नई/मौलिक फार्मूलेशन है" },
      { value: "unsure", label: "I'm not sure", labelHi: "मुझे निश्चित नहीं है" },
    ],
    helpText: "First Schedule texts include Charaka Samhita, Sushruta Samhita, Ashtanga Hridaya, Sharangdhara Samhita, Bhava Prakasha, and others.",
  },
  {
    id: "intended_use",
    question: "What is the primary intended use of your product?",
    questionHi: "आपके उत्पाद का प्राथमिक उद्देश्य क्या है?",
    options: [
      { value: "therapeutic", label: "Therapeutic - treatment/prevention of disease", labelHi: "चिकित्सीय - रोग का उपचार/रोकथाम" },
      { value: "wellness", label: "Wellness/health maintenance", labelHi: "स्वास्थ्य/कल्याण रखरखाव" },
      { value: "dietary", label: "Dietary supplement / nutritional", labelHi: "आहार पूरक / पोषण संबंधी" },
      { value: "cosmetic", label: "Cosmetic / beauty / skincare", labelHi: "सौंदर्य प्रसाधन / ब्यूटी / स्किनकेयर" },
    ],
  },
  {
    id: "ingredients",
    question: "What type of ingredients does your formulation primarily use?",
    questionHi: "आपकी फार्मूलेशन में मुख्य रूप से किस प्रकार की सामग्री का उपयोग होता है?",
    options: [
      { value: "whole_plant", label: "Whole plant/plant parts (herbs, roots, bark)", labelHi: "पूरा पौधा/पौधे के भाग (जड़ी-बूटियां, जड़ें, छाल)" },
      { value: "extract", label: "Standardized plant extracts", labelHi: "मानकीकृत पौधे के अर्क" },
      { value: "purified", label: "Purified plant fractions/phytochemicals", labelHi: "शुद्ध पौधा अंश/फाइटोकेमिकल्स" },
      { value: "mineral", label: "Minerals/metals (Rasa Shastra)", labelHi: "खनिज/धातु (रस शास्त्र)" },
      { value: "animal", label: "Animal-derived ingredients", labelHi: "पशु-व्युत्पन्न सामग्री" },
      { value: "mixed", label: "Combination of above", labelHi: "उपर्युक्त का संयोजन" },
    ],
  },
  {
    id: "novelty",
    question: "Does your product involve any novel aspect?",
    questionHi: "क्या आपके उत्पाद में कोई नवीन पहलू शामिल है?",
    options: [
      { value: "novel_combination", label: "Novel combination of known ingredients", labelHi: "ज्ञात सामग्रियों का नवीन संयोजन" },
      { value: "novel_process", label: "Novel processing/manufacturing method", labelHi: "नवीन प्रसंस्करण/निर्माण विधि" },
      { value: "novel_delivery", label: "Novel delivery system (nano, liposomal, etc.)", labelHi: "नवीन डिलीवरी सिस्टम (नैनो, लिपोसोमल, आदि)" },
      { value: "novel_indication", label: "New therapeutic indication for classical formulation", labelHi: "शास्त्रीय फार्मूलेशन के लिए नया चिकित्सीय संकेत" },
      { value: "no_novelty", label: "No novel aspects - traditional as-is", labelHi: "कोई नवीन पहलू नहीं - पारंपरिक यथावत" },
    ],
  },
  {
    id: "biological_resource",
    question: "Does your product use biological resources sourced from India?",
    questionHi: "क्या आपका उत्पाद भारत से प्राप्त जैविक संसाधनों का उपयोग करता है?",
    options: [
      { value: "wild", label: "Yes - wild-harvested biological resources", labelHi: "हां - जंगली जैविक संसाधन" },
      { value: "cultivated", label: "Yes - cultivated/farmed biological resources", labelHi: "हां - खेती/कृषि जैविक संसाधन" },
      { value: "both", label: "Both wild and cultivated", labelHi: "जंगली और कृषि दोनों" },
      { value: "no", label: "No - all resources from outside India", labelHi: "नहीं - सभी संसाधन भारत के बाहर से" },
      { value: "synthetic", label: "Synthetic/no biological resources", labelHi: "सिंथेटिक/कोई जैविक संसाधन नहीं" },
    ],
  },
  {
    id: "applicant_type",
    question: "Who is the applicant/entity?",
    questionHi: "आवेदक/संस्था कौन है?",
    options: [
      { value: "indian_individual", label: "Indian individual / practitioner", labelHi: "भारतीय व्यक्ति / चिकित्सक" },
      { value: "indian_startup", label: "Indian startup / MSME", labelHi: "भारतीय स्टार्टअप / एमएसएमई" },
      { value: "indian_company", label: "Indian company", labelHi: "भारतीय कंपनी" },
      { value: "foreign", label: "Foreign entity", labelHi: "विदेशी संस्था" },
      { value: "joint", label: "Joint Indian-foreign collaboration", labelHi: "संयुक्त भारतीय-विदेशी सहयोग" },
    ],
  },
];

export function classifyProduct(answers: Record<string, string>): ClassificationResult {
  const source = answers["source"];
  const intendedUse = answers["intended_use"];
  const ingredients = answers["ingredients"];
  const novelty = answers["novelty"];
  const bioResource = answers["biological_resource"];
  const applicantType = answers["applicant_type"];

  // Track uncertainties
  const uncertaintyFlags: string[] = [];
  let confidence = 85;

  if (source === "unsure") {
    uncertaintyFlags.push("Source text classification uncertain — human review recommended to determine if formulation is in First Schedule texts");
    confidence -= 25;
  }
  if (novelty === "novel_combination" || novelty === "novel_indication") {
    uncertaintyFlags.push("Novelty assessment requires expert evaluation — the boundary between TK and novel invention is legally complex");
    confidence -= 10;
  }
  if (intendedUse === "wellness") {
    uncertaintyFlags.push("Wellness/therapeutic boundary is regulatory grey area — classification may depend on specific marketing claims");
    confidence -= 10;
  }

  // Determine ABS level (not binary)
  let absRequired = false;
  let absLevel: ClassificationResult["absLevel"] = "exempt";

  if (bioResource === "wild" || bioResource === "both") {
    absRequired = true;
    absLevel = "required";
  } else if (bioResource === "cultivated" && applicantType === "foreign") {
    absRequired = true;
    absLevel = "required";
  } else if (bioResource === "cultivated") {
    absLevel = "likely_required";
    absRequired = true;
    uncertaintyFlags.push("ABS for cultivated resources: 2023 Amendment provides exemptions but commercial use still requires prior intimation");
  } else if (bioResource === "purchased") {
    absLevel = "possibly_required";
    uncertaintyFlags.push("ABS for purchased resources depends on supply chain provenance — verify with supplier");
  } else if (bioResource === "no" || bioResource === "synthetic") {
    absLevel = "exempt";
  }

  const humanReviewRecommended = confidence < 65 || uncertaintyFlags.length >= 2;

  // Classification logic
  if (intendedUse === "cosmetic") {
    return {
      category: "cosmetic",
      categoryLabel: "Ayurvedic Cosmetic",
      description: "Your product is classified as a cosmetic under the Drugs & Cosmetics Act. It will be regulated under the cosmetic provisions, not the drug provisions.",
      regulatoryRequirements: [
        "Manufacturing license under Drugs & Cosmetics Act (cosmetic provisions)",
        "Compliance with Bureau of Indian Standards (BIS) for cosmetics",
        "Labelling as per Drugs & Cosmetics Rules",
        "No therapeutic claims permitted",
        "Compliance with CDSCO cosmetic registration if imported",
      ],
      ipOptions: [
        { type: "Trademark", applicability: "Highly Recommended", details: "Register your brand name and logo. Class 3 of Nice Classification covers cosmetics." },
        { type: "Design", applicability: "Recommended", details: "Protect unique packaging/container designs." },
        { type: "Patent", applicability: "Possible", details: "Novel formulations, processing methods, or delivery systems may be patentable." },
        { type: "Trade Secret", applicability: "Recommended", details: "Keep proprietary formulation details confidential." },
        { type: "Copyright", applicability: "Applicable", details: "Protect original marketing materials, artwork, and labelling designs." },
      ],
      absRequired,
      absDetails: absRequired 
        ? "ABS compliance required under Biological Diversity Act. File prior intimation with State Biodiversity Board for commercial utilization."
        : "ABS compliance may not be required if using synthetic or non-Indian biological resources.",
      absLevel,
      classificationConfidence: confidence,
      uncertaintyFlags,
      humanReviewRecommended,
      tkdlRelevance: "Low - cosmetic formulations are typically not covered by TKDL. However, if based on traditional knowledge, check TKDL before filing patents.",
      keyStatutes: [
        "Drugs & Cosmetics Act, 1940 (Cosmetic provisions)",
        "Bureau of Indian Standards Act, 2016",
        "Trade Marks Act, 1999",
        "Designs Act, 2000",
      ],
    };
  }

  if (intendedUse === "dietary") {
    return {
      category: "nutraceutical",
      categoryLabel: "Ayurveda-Aahar / Nutraceutical",
      description: "Your product is classified as an Ayurveda-Aahar (Ayurvedic food/dietary supplement) regulated under FSSAI, not as a drug under D&C Act.",
      regulatoryRequirements: [
        "FSSAI license for manufacturing/sale",
        "Compliance with FSSAI Ayurveda Aahar Regulations, 2022",
        "FSSAI labelling requirements including 'Supplement Facts'",
        "No therapeutic/disease treatment claims - only wellness/nutritional claims",
        "GMP compliance as per FSSAI standards",
      ],
      ipOptions: [
        { type: "Trademark", applicability: "Highly Recommended", details: "Register your brand. Class 5 or Class 29/30 of Nice Classification." },
        { type: "Trade Secret", applicability: "Highly Recommended", details: "Protect proprietary formulation ratios and processing methods." },
        { type: "Patent", applicability: "Possible", details: "Novel processing methods or unique formulations may be patentable if they involve an inventive step beyond TK." },
        { type: "Design", applicability: "Recommended", details: "Protect unique packaging designs." },
        { type: "Copyright", applicability: "Applicable", details: "Protect original labels, marketing content, and databases." },
      ],
      absRequired,
      absDetails: absRequired 
        ? "ABS compliance required. For FSSAI products using Indian biological resources, file prior intimation with State Biodiversity Board."
        : "ABS compliance may not be required if using cultivated resources as an Indian entity (2023 Amendment exemption may apply).",
      absLevel,
      classificationConfidence: confidence,
      uncertaintyFlags,
      humanReviewRecommended,
      tkdlRelevance: "Medium - if your formulation has Ayurvedic origins, the underlying knowledge may be in TKDL. Patent claims should focus on novel aspects beyond traditional knowledge.",
      keyStatutes: [
        "Food Safety and Standards Act, 2006",
        "FSSAI Ayurveda Aahar Regulations, 2022",
        "Trade Marks Act, 1999",
        "Biological Diversity Act, 2002 (as amended 2023)",
      ],
    };
  }

  if (source === "yes_classical" && novelty === "no_novelty") {
    return {
      category: "classical",
      categoryLabel: "Classical / Generic Ayurvedic Medicine",
      description: "Your product is a classical Ayurvedic medicine as described in authoritative texts. It is well-established traditional knowledge.",
      regulatoryRequirements: [
        "Manufacturing license under D&C Act, Rule 158-B",
        "No clinical trials required (established safety/efficacy through traditional use)",
        "Compliance with Ayurvedic Pharmacopoeia of India standards",
        "GMP compliance as per Schedule T of D&C Rules",
        "Labelling as per D&C Rules",
      ],
      ipOptions: [
        { type: "Patent", applicability: "NOT Applicable", details: "Section 3(p) of Patents Act bars patenting of traditional knowledge. Classical formulations cannot be patented." },
        { type: "Trademark", applicability: "Highly Recommended", details: "While the formulation itself can't be protected, your brand name CAN be trademarked." },
        { type: "Trade Secret", applicability: "Limited", details: "Since the formulation is in public domain texts, trade secret protection is limited to proprietary processing parameters." },
        { type: "GI", applicability: "Possible", details: "If your manufacturing is tied to a specific geographic region with unique local practices, consider GI registration." },
        { type: "Design", applicability: "Recommended", details: "Protect distinctive packaging/product designs." },
        { type: "TKDL Defense", applicability: "Critical", details: "Use TKDL defensively to prevent others from patenting this formulation anywhere in the world." },
      ],
      absRequired,
      absDetails: absRequired
        ? "ABS compliance required under Biological Diversity Act. However, 2023 Amendment provides exemptions for registered AYUSH practitioners using codified traditional knowledge."
        : "Exemptions may apply under 2023 BD Amendment for codified traditional knowledge use.",
      absLevel,
      classificationConfidence: confidence,
      uncertaintyFlags,
      humanReviewRecommended,
      tkdlRelevance: "HIGH - This formulation is likely documented in TKDL. This protects it from being patented by others but also means you cannot patent it.",
      keyStatutes: [
        "Drugs & Cosmetics Act, 1940, Chapter IVA",
        "D&C Rules, Rule 158-B, First Schedule",
        "Patents Act, 1970, Section 3(p)",
        "TKDL Access Agreements",
        "Biological Diversity Act, 2002 (as amended 2023)",
      ],
    };
  }

  if (source === "yes_modified" || (source === "yes_classical" && novelty !== "no_novelty")) {
    return {
      category: "proprietary",
      categoryLabel: "Patent / Proprietary Ayurvedic Medicine",
      description: "Your product is a proprietary Ayurvedic medicine - based on Ayurvedic principles but with modifications that make it distinct from classical formulations.",
      regulatoryRequirements: [
        "Manufacturing license under D&C Act with additional documentation",
        "Formulation details and rationale for modification",
        "Safety data may be required depending on modifications",
        "GMP compliance as per Schedule T",
        "Labelling with full ingredient disclosure",
      ],
      ipOptions: [
        { type: "Patent", applicability: "Possible", details: "Novel modifications, new combinations, or improved processes may be patentable IF they demonstrate inventive step beyond known TK. Must overcome Section 3(p) and 3(d) bars." },
        { type: "Trademark", applicability: "Highly Recommended", details: "Register your proprietary brand name. This is often the most valuable IP for proprietary medicines." },
        { type: "Trade Secret", applicability: "Highly Recommended", details: "Protect specific ratios, processing parameters, and quality control methods." },
        { type: "Design", applicability: "Recommended", details: "Protect distinctive packaging and product designs." },
        { type: "Copyright", applicability: "Applicable", details: "Protect original research documentation, marketing materials." },
      ],
      absRequired,
      absDetails: absRequired
        ? "ABS compliance required. File prior intimation with SBB before commercial utilization. If applying for patent, NBA approval under Section 6/7 of BD Act is mandatory."
        : "If using cultivated resources as Indian entity, simplified compliance under 2023 Amendment.",
      absLevel,
      classificationConfidence: confidence,
      uncertaintyFlags,
      humanReviewRecommended,
      tkdlRelevance: "Medium-High - The base formulation may be in TKDL. Your patent claim must clearly demonstrate what is novel BEYOND the traditional knowledge base.",
      keyStatutes: [
        "Drugs & Cosmetics Act, 1940",
        "Patents Act, 1970, Sections 3(d), 3(p)",
        "Trade Marks Act, 1999",
        "Biological Diversity Act, 2002 (as amended 2023)",
      ],
    };
  }

  if (ingredients === "purified") {
    return {
      category: "phytopharma",
      categoryLabel: "Phytopharmaceutical",
      description: "Your product, using purified plant fractions/phytochemicals, may qualify as a phytopharmaceutical - a distinct regulatory category with good patent potential.",
      regulatoryRequirements: [
        "Regulated under D&C Act phytopharmaceutical provisions",
        "Clinical trials required (Phase I-III)",
        "Standardization and quality control data mandatory",
        "Stability studies required",
        "GMP compliance at pharmaceutical standards",
        "Approval from DCGI/CDSCO required",
      ],
      ipOptions: [
        { type: "Patent", applicability: "Highly Applicable", details: "Purified fractions with demonstrated efficacy have strong patent potential. The Section 3(p) bar is less likely to apply to purified fractions not found in traditional texts." },
        { type: "Trademark", applicability: "Highly Recommended", details: "Register brand name and product identifiers." },
        { type: "Trade Secret", applicability: "Highly Recommended", details: "Protect extraction/purification processes, analytical methods." },
        { type: "Data Exclusivity", applicability: "Applicable", details: "Clinical trial data submitted to CDSCO may attract data protection." },
      ],
      absRequired: true,
      absDetails: "ABS compliance is almost certainly required for phytopharmaceuticals as they involve intensive use of biological resources. NBA approval needed before IP filing.",
      absLevel,
      classificationConfidence: confidence,
      uncertaintyFlags,
      humanReviewRecommended,
      tkdlRelevance: "Low-Medium - Purified fractions are typically not in TKDL. However, if the source plant and its therapeutic use are documented TK, disclosure obligations apply.",
      keyStatutes: [
        "Drugs & Cosmetics Act, 1940 (Phytopharmaceutical provisions)",
        "D&C Rules, Schedule Y",
        "Patents Act, 1970",
        "Biological Diversity Act, 2002 (as amended 2023)",
      ],
    };
  }

  // Default: New Drug
  return {
    category: "new_drug",
    categoryLabel: "New / Non-Classical Ayurvedic Drug",
    description: "Your product appears to be a new or non-classical drug that requires clinical evidence of safety and efficacy. This category has the strongest patent potential but highest regulatory burden.",
    regulatoryRequirements: [
      "Approval as new drug under Rule 122-DAB of D&C Rules",
      "Clinical trials (Phase I-III) required",
      "Safety and efficacy data mandatory",
      "GMP compliance at highest standard",
      "Post-marketing surveillance may be required",
      "CDSCO/DCGI approval required",
    ],
    ipOptions: [
      { type: "Patent", applicability: "Highly Applicable", details: "New formulations with demonstrated novelty and inventive step have strong patent potential. Must still ensure the invention is not merely an aggregation of known TK." },
      { type: "Trademark", applicability: "Highly Recommended", details: "Register product brand name and company name." },
      { type: "Trade Secret", applicability: "Recommended", details: "Protect manufacturing processes and analytical methods." },
      { type: "Design", applicability: "Applicable", details: "Protect novel dosage form designs and packaging." },
      { type: "Data Exclusivity", applicability: "Applicable", details: "Clinical trial data may attract regulatory data protection." },
      { type: "Plant Variety", applicability: "Possible", details: "If you've developed a new cultivar of a medicinal plant for this drug, consider PPVFRA registration." },
    ],
    absRequired: true,
    absLevel,
    classificationConfidence: confidence,
    uncertaintyFlags,
    humanReviewRecommended,
    absDetails: "ABS compliance required. NBA approval mandatory under Section 7 before applying for any IP right based on Indian biological resources.",
    tkdlRelevance: "Medium - Check TKDL to ensure your innovation claims go beyond documented traditional knowledge. This strengthens your patent application.",
    keyStatutes: [
      "Drugs & Cosmetics Act, 1940, Rule 122-DAB",
      "Patents Act, 1970",
      "Biological Diversity Act, 2002 (as amended 2023)",
      "Trade Marks Act, 1999",
    ],
  };
}

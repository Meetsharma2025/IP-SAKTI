import { NextRequest, NextResponse } from "next/server";
import { classifyProduct } from "@/lib/classification";
import { generateClassificationAnalysis } from "@/lib/nemotron";
import { db } from "@/db";
import { productClassifications } from "@/db/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, productName, productDescription, sessionId, language = "en" } = body;

    if (!answers || typeof answers !== "object") {
      return NextResponse.json({ error: "Answers are required" }, { status: 400 });
    }

    const result = classifyProduct(answers);

    // Save classification to DB
    const sid = sessionId || `classify_${Date.now()}`;
    await db.insert(productClassifications).values({
      sessionId: sid,
      productName: productName || null,
      productDescription: productDescription || null,
      category: result.category,
      isFromAuthoritativeText: answers.source === "yes_classical",
      hasNovelModification: answers.novelty !== "no_novelty",
      containsBiologicalResource: answers.biological_resource !== "no" && answers.biological_resource !== "synthetic",
      intendedUse: answers.intended_use,
      classificationResult: result,
      ipRecommendations: result.ipOptions,
      absRequired: result.absRequired,
    });

    // Try to get Nemotron AI analysis
    let aiAnalysis: string | undefined;
    let aiReasoning: string | undefined;
    try {
      const nemotronResult = await generateClassificationAnalysis(
        productName || "Unnamed product",
        productDescription || "No description provided",
        JSON.stringify(result),
        JSON.stringify(answers),
        language
      );
      aiAnalysis = nemotronResult.content;
      aiReasoning = nemotronResult.reasoning || undefined;
    } catch (err) {
      console.error("Nemotron classification analysis error:", err);
      // Continue without AI analysis
    }

    return NextResponse.json({
      ...result,
      aiAnalysis,
      aiReasoning,
    });
  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json(
      { error: "An error occurred during classification" },
      { status: 500 }
    );
  }
}

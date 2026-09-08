import { NextRequest, NextResponse } from "next/server";
import { generateABSAnalysis } from "@/lib/nemotron";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers, preliminaryResult, language = "en" } = body;

    if (!answers || !preliminaryResult) {
      return NextResponse.json(
        { error: "Answers and preliminaryResult are required" },
        { status: 400 }
      );
    }

    const result = await generateABSAnalysis(
      JSON.stringify(answers),
      JSON.stringify(preliminaryResult),
      language
    );

    return NextResponse.json({
      analysis: result.content,
      reasoning: result.reasoning || undefined,
      model: result.model,
    });
  } catch (error) {
    console.error("ABS analysis error:", error);
    return NextResponse.json(
      { error: "ABS analysis failed" },
      { status: 500 }
    );
  }
}

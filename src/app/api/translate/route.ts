import { NextRequest, NextResponse } from "next/server";
import { translateText } from "@/lib/nemotron";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLanguage } = body;

    if (!text || !targetLanguage) {
      return NextResponse.json(
        { error: "Text and targetLanguage are required" },
        { status: 400 }
      );
    }

    if (targetLanguage === "en") {
      return NextResponse.json({ translated: text });
    }

    const result = await translateText(text, targetLanguage);
    return NextResponse.json({ translated: result.content });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}

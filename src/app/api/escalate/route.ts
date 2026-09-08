import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { escalationRequests } from "@/db/schema";

export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, reason, userQuery, contactEmail, contactPhone } = body;

    if (!reason || !userQuery) {
      return NextResponse.json(
        { error: "Reason and query are required" },
        { status: 400 }
      );
    }

    const result = await db
      .insert(escalationRequests)
      .values({
        sessionId: sessionId || `escalate_${Date.now()}`,
        reason,
        userQuery,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        status: "pending",
      })
      .returning({ id: escalationRequests.id });

    return NextResponse.json({
      success: true,
      id: result[0].id,
      message:
        "Your escalation request has been submitted. A qualified IP facilitator will review your query and contact you.",
    });
  } catch (error) {
    console.error("Escalation error:", error);
    return NextResponse.json(
      { error: "Failed to submit escalation" },
      { status: 500 }
    );
  }
}

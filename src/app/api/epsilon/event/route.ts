import { NextRequest, NextResponse } from "next/server";

// ─── Epsilon PeopleCloud – Per-Step Event Tracking ────────
//
// Fires on every user interaction (answer, selection, navigation)
// so we capture the full funnel — even for users who drop off
// before providing an email.
//
// Events are keyed by a client-generated sessionId (UUID).
// When the user later submits their email via /api/epsilon/submit,
// that route includes the same sessionId so Epsilon can tie
// anonymous events to a real contact record.

// Re-use the same OAuth token logic from the submit route
import { getAccessToken, getBaseUrl } from "../_shared";

interface EventPayload {
  sessionId: string;
  flowId: string;
  stepId: string;
  stepIndex: number;
  questionText: string;
  value: string;
  label: string;
  postalCode?: string;
  timestamp?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: EventPayload = await request.json();

    if (!payload.sessionId || !payload.stepId) {
      return NextResponse.json(
        { error: "sessionId and stepId are required" },
        { status: 400 },
      );
    }

    const ouid = process.env.EPSILON_OUID;
    if (!ouid) {
      console.warn(
        "[Epsilon] EPSILON_OUID not set — skipping event track (dev mode)",
      );
      return NextResponse.json({ success: true, mock: true });
    }

    const token = await getAccessToken();
    const baseUrl = getBaseUrl();

    // Push as an interaction/event record.
    // Field names should match your Epsilon schema — update as needed.
    const record: Record<string, string | number> = {
      session_id: payload.sessionId,
      flow_id: payload.flowId,
      step_id: payload.stepId,
      step_index: payload.stepIndex,
      question_text: payload.questionText,
      answer_value: payload.value,
      answer_label: payload.label,
      event_timestamp: payload.timestamp || new Date().toISOString(),
    };

    if (payload.postalCode) {
      record.postal_code = payload.postalCode;
    }

    const res = await fetch(`${baseUrl}/v2.0/people/records`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-OUID": ouid,
      },
      body: JSON.stringify({ records: [record] }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Epsilon] Event track error (${res.status}):`, text);
      // Don't fail the user's flow — just log the error
      return NextResponse.json({ success: false, detail: text }, { status: 202 });
    }

    const result = await res.json();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[Epsilon] Event track error:", error);
    // Never block the user flow on tracking failures
    return NextResponse.json({ success: false }, { status: 202 });
  }
}

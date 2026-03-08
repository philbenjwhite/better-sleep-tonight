import { NextRequest, NextResponse } from "next/server";

// ─── Epsilon PeopleCloud – Per-Step Event Tracking ────────
//
// Fires on every user interaction (answer, selection, navigation)
// so we capture the full funnel — even for users who drop off
// before providing an email.
//
// Each event upserts a single record keyed by CustomerKey (sessionId)
// into the Tempurpedic_Better_Sleep list, progressively filling in
// columns as the user moves through the flow.
//
// Strategy: POST to create the record on first step, then PUT to
// .../records/{CustomerKey} for all subsequent steps.

import {
  getAccessToken,
  EPSILON_RECORDS_URL,
  STEP_TO_EPSILON_FIELD,
} from "../_shared";

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

    // Map stepId to the Epsilon field name
    const epsilonField = STEP_TO_EPSILON_FIELD[payload.stepId];

    // Build the record — CustomerKey is the session ID for anonymous tracking
    const record: Record<string, string> = {
      CustomerKey: payload.sessionId,
    };

    if (epsilonField) {
      record[epsilonField] = payload.label;
    }

    const body = JSON.stringify(record);
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-OUID": ouid,
    };

    // First step (index 0) creates the record via POST,
    // all subsequent steps update via PUT .../records/{CustomerKey}
    const isFirstStep = payload.stepIndex === 0;
    const method = isFirstStep ? "POST" : "PUT";
    const url = isFirstStep
      ? EPSILON_RECORDS_URL
      : `${EPSILON_RECORDS_URL}/${encodeURIComponent(payload.sessionId)}`;

    console.log(`\n🟡 ━━━ EPSILON EVENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Step: ${payload.stepId} → ${epsilonField || "(unmapped)"}`);
    console.log(`   Value: ${payload.label}`);
    console.log(`   ${method} ${url}`);

    const res = await fetch(url, {
      method,
      headers,
      body,
    });

    const text = await res.text();

    if (!res.ok) {
      console.log(`   ❌ FAILED (${res.status}):`, text);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      // Don't fail the user's flow — just log the error
      return NextResponse.json({ success: false, detail: text }, { status: 202 });
    }

    const result = JSON.parse(text);
    console.log(`   ✅ OK (${res.status}):`, text.substring(0, 200));
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[Epsilon] Event track error:", error);
    // Never block the user flow on tracking failures
    return NextResponse.json({ success: false }, { status: 202 });
  }
}

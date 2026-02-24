import { NextRequest, NextResponse } from "next/server";
import { getAccessToken, getBaseUrl } from "../_shared";

// ─── Epsilon PeopleCloud – Single Record Management API ───
//
// This route accepts flow data from the frontend and pushes it to
// Epsilon's Single Record Management API for CRM / follow-up marketing.
//
// This is called at the END of the flow when the user provides their
// email. It includes the sessionId so Epsilon can tie previously
// tracked anonymous events to this contact record.
//
// Required env vars (see .env):
//   EPSILON_CLIENT_ID, EPSILON_CLIENT_SECRET,
//   EPSILON_API_USERNAME, EPSILON_API_PASSWORD,
//   EPSILON_OUID, EPSILON_REGION (US | EU)

// ── Types ──────────────────────────────────────────────────

interface FlowAnswer {
  stepId: string;
  questionText: string;
  value: string;
  label: string;
}

interface SubmitPayload {
  sessionId: string;
  email: string;
  postalCode?: string;
  flowId?: string;
  selectedStore?: {
    id: string;
    storeName: string;
    city: string;
  };
  answers?: FlowAnswer[];
}

// ── Build Epsilon record payload ───────────────────────────

function buildRecordPayload(payload: SubmitPayload) {
  // Map flow data to Epsilon record fields.
  // Field names will need to match your Epsilon schema — update as needed.
  const record: Record<string, string | undefined> = {
    session_id: payload.sessionId,
    email_address: payload.email,
    postal_code: payload.postalCode,
    flow_id: payload.flowId,
    store_id: payload.selectedStore?.id,
    store_name: payload.selectedStore?.storeName,
    store_city: payload.selectedStore?.city,
  };

  // Flatten flow answers into key-value pairs
  if (payload.answers) {
    for (const answer of payload.answers) {
      // Normalise stepId to a safe field name
      const key = `flow_${answer.stepId.replace(/[^a-zA-Z0-9]/g, "_")}`;
      record[key] = answer.value;
    }
  }

  // Remove undefined values
  return Object.fromEntries(
    Object.entries(record).filter(([, v]) => v !== undefined),
  );
}

// ── POST handler ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const payload: SubmitPayload = await request.json();

    if (!payload.email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    const ouid = process.env.EPSILON_OUID;
    if (!ouid) {
      // If credentials aren't configured yet, succeed silently in dev
      console.warn(
        "[Epsilon] EPSILON_OUID not set — skipping API call (dev mode)",
      );
      return NextResponse.json({ success: true, mock: true });
    }

    const token = await getAccessToken();
    const baseUrl = getBaseUrl();
    const record = buildRecordPayload(payload);

    const res = await fetch(`${baseUrl}/v2.0/people/records`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-OUID": ouid,
      },
      body: JSON.stringify({
        records: [record],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[Epsilon] API error (${res.status}):`, text);
      return NextResponse.json(
        { error: "Failed to submit to Epsilon", detail: text },
        { status: 502 },
      );
    }

    const result = await res.json();
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[Epsilon] Submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

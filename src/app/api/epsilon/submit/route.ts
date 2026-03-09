import { NextRequest, NextResponse } from "next/server";
import {
  getAccessToken,
  EPSILON_RECORDS_URL,
  STEP_TO_EPSILON_FIELD,
} from "../_shared";

// ─── Epsilon PeopleCloud – Final Email + Full Record ──────
//
// Called at the END of the flow when the user provides their email.
// Upserts the full record into the Tempurpedic_Better_Sleep list,
// keyed by CustomerKey (email address), with all flow answers.
//
// Required env vars (see .env):
//   EPSILON_CLIENT_ID, EPSILON_CLIENT_SECRET,
//   EPSILON_API_USERNAME, EPSILON_API_PASSWORD,
//   EPSILON_OUID

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
  // CustomerKey is the email address (primary key in Epsilon)
  const record: Record<string, string> = {
    CustomerKey: payload.email,
    EmailAddress: payload.email,
  };

  if (payload.postalCode) {
    record.Postal_Code = payload.postalCode;
  }

  if (payload.selectedStore) {
    record.Store_Locations = [
      payload.selectedStore.storeName,
      payload.selectedStore.city,
    ]
      .filter(Boolean)
      .join(" - ");
  }

  // Map flow answers to Epsilon field names
  if (payload.answers) {
    for (const answer of payload.answers) {
      const field = STEP_TO_EPSILON_FIELD[answer.stepId];
      if (field) {
        record[field] = answer.label;
      }
    }
  }

  return record;
}

// ── RTM (Real-Time Message) ─────────────────────────────────
// Triggers a follow-up email via Epsilon after the profile record is created.
// The email template pulls personalization from PeopleCloud directly.

const EPSILON_RTM_URL =
  "https://api.harmony.epsilon.com/v5/messages/0c06bb71-0c46-419b-8f6f-cea94a0f12ef/send";

async function sendRtmMessage(email: string, token: string, ouid: string) {
  console.log(`\n📧 ━━━ EPSILON RTM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Email: ${email}`);
  console.log(`   PUT ${EPSILON_RTM_URL}`);

  const res = await fetch(EPSILON_RTM_URL, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-OUID": ouid,
    },
    body: JSON.stringify({
      recipients: [
        {
          customerKey: email,
          emailAddress: email,
        },
      ],
    }),
  });

  const text = await res.text();

  if (!res.ok) {
    console.log(`   ❌ RTM FAILED (${res.status}):`, text);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    return;
  }

  console.log(`   ✅ RTM OK (${res.status}):`, text.substring(0, 200));
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
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
    const record = buildRecordPayload(payload);

    const body = JSON.stringify(record);

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-OUID": ouid,
    };

    console.log(`\n🔵 ━━━ EPSILON SUBMIT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Email: ${payload.email}`);
    console.log(`   Session: ${payload.sessionId}`);
    console.log(`   Payload:`, body);

    // Try POST first (creates record), fall back to PUT (updates) on duplicate
    console.log(`   POST ${EPSILON_RECORDS_URL}`);
    let res = await fetch(EPSILON_RECORDS_URL, {
      method: "POST",
      headers,
      body,
    });

    let text = await res.text();

    // If duplicate, retry with PUT to the record-specific endpoint
    if (!res.ok && text.includes("DUPLICATE_ITEM")) {
      const putUrl = `${EPSILON_RECORDS_URL}/${encodeURIComponent(payload.email)}`;
      console.log(`   ↳ Record exists, retrying PUT ${putUrl}`);
      res = await fetch(putUrl, {
        method: "PUT",
        headers,
        body,
      });
      text = await res.text();
    }

    if (!res.ok) {
      console.log(`   ❌ FAILED (${res.status}):`, text);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      return NextResponse.json(
        { error: "Failed to submit to Epsilon", detail: text },
        { status: 502 },
      );
    }

    const result = JSON.parse(text);
    console.log(`   ✅ OK (${res.status}):`, text.substring(0, 200));
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // ── RTM: Trigger follow-up email ────────────────────────
    // Fire-and-forget — don't block the user response
    sendRtmMessage(payload.email, token, ouid).catch((err) => {
      console.error("[Epsilon RTM] Failed to send:", err);
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("[Epsilon] Submit error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

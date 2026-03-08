// ─── Shared Epsilon OAuth + config ─────────────────────────
//
// Used by both /api/epsilon/submit and /api/epsilon/event

interface EpsilonTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

// ── Epsilon list endpoint ──────────────────────────────────
// PCM list: Tempurpedic_Better_Sleep
const EPSILON_LIST_ID = "5162eea3-507a-4d77-9f9b-35d6c6e0c731";
export const EPSILON_RECORDS_URL = `https://api.harmony.epsilon.com/v4/lists/${EPSILON_LIST_ID}/records`;

// ── Step ID → Epsilon field name mapping ───────────────────
// Maps our internal stepIds to the Epsilon list attribute names
export const STEP_TO_EPSILON_FIELD: Record<string, string> = {
  "intro-video": "Intro_Video",
  "q1-trouble-falling-asleep": "Trouble_Falling_Asleep",
  "q2-sleep-position": "Sleep_Position",
  "q3-motion-disturbance": "Motion_Disturbance",
  "q4-aches-pains-frequency": "Aches_Pains_Frequency",
  "q5-aches-pains-type": "Aches_Pains_Type",
  "q6-sleep-alone-or-partner": "Sleep_Alone_Or_Partner",
  "q7-purchase-intent": "Purchase_Intent",
  "video-step-1": "Summary_Video",
  "video-step-3": "Post_Selection_Video",
  "product-recommendations-step": "Product_Recommendations",
  "zipcode-capture-step": "Postal_Code",
  "store-locations-step": "Store_Locations",
  "booking-cta-step": "EmailAddress",
};

// OAuth token endpoint is on a separate domain from the data API
const EPSILON_AUTH_URL =
  "https://epsiapi-public.epsilon.com/Epsilon/oauth2/access_token";

export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    console.log(`🟢 ━━━ EPSILON AUTH ━━━ Using cached token (expires in ${Math.round((tokenExpiresAt - Date.now()) / 1000)}s)`);
    return cachedToken;
  }

  console.log(`🟠 ━━━ EPSILON AUTH ━━━ Fetching new bearer token...`);

  const clientId = process.env.EPSILON_CLIENT_ID;
  const clientSecret = process.env.EPSILON_CLIENT_SECRET;
  const apiUsername = process.env.EPSILON_API_USERNAME;
  const apiPassword = process.env.EPSILON_API_PASSWORD;

  if (!clientId || !clientSecret || !apiUsername || !apiPassword) {
    throw new Error("Missing Epsilon API credentials in environment variables");
  }

  // Basic auth header: base64-encoded "clientId:clientSecret"
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const body = new URLSearchParams({
    scope: "cn mail sn givenname uid employeeNumber",
    grant_type: "password",
    username: apiUsername,
    password: apiPassword,
  });

  const res = await fetch(EPSILON_AUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Epsilon OAuth failed (${res.status}): ${text}`);
  }

  const data: EpsilonTokenResponse = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  console.log(`🟢 ━━━ EPSILON AUTH ━━━ Token acquired (expires in ${data.expires_in}s)`);

  return cachedToken;
}

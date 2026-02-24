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

const EPSILON_REGIONS: Record<string, string> = {
  US: "https://api.epsilon.com",
  EU: "https://api.epsilon.eu",
};

export function getBaseUrl(): string {
  const region = process.env.EPSILON_REGION || "US";
  return EPSILON_REGIONS[region] || EPSILON_REGIONS.US;
}

export async function getAccessToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const clientId = process.env.EPSILON_CLIENT_ID;
  const clientSecret = process.env.EPSILON_CLIENT_SECRET;
  const apiUsername = process.env.EPSILON_API_USERNAME;
  const apiPassword = process.env.EPSILON_API_PASSWORD;

  if (!clientId || !clientSecret || !apiUsername || !apiPassword) {
    throw new Error("Missing Epsilon API credentials in environment variables");
  }

  const baseUrl = getBaseUrl();
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    client_secret: clientSecret,
    username: apiUsername,
    password: apiPassword,
  });

  const res = await fetch(`${baseUrl}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Epsilon OAuth failed (${res.status}): ${text}`);
  }

  const data: EpsilonTokenResponse = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return cachedToken;
}

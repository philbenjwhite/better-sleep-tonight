# Epsilon Integration — Overview

**For:** Stakeholder walkthrough
**Last updated:** 2026-02-27

---

## What It Does

Every time a user interacts with the Better Sleep Tonight quiz, their responses are sent to Epsilon PeopleCloud in real time. This gives the marketing team:

- **Full funnel visibility** — see exactly where users drop off
- **Anonymous tracking** — even users who never give their email are tracked by session
- **Contact linking** — when a user does provide their email, all their prior anonymous activity is linked to that contact record

---

## How Data Flows

1. User starts the quiz → a unique **session ID** is generated
2. Each answer fires a lightweight event to Epsilon (fire-and-forget, never slows the user down)
3. When the user enters their email on the final booking step, a single consolidated record is pushed with their email + all answers + store + postal code
4. Epsilon can now tie the anonymous step events to the real contact via the shared session ID

---

## What Gets Captured

| Step | What's Recorded |
|------|-----------------|
| Trouble falling asleep | Every Night / Frequently / On Occasion / Never |
| Sleep position | Side / Back / Stomach / Varies |
| Motion disturbance | Never / Occasionally / Regularly / Not Sure |
| Aches & pains frequency | Every Night / Frequently / On Occasion / Never |
| Aches & pains type | Chronic condition / Stiffness / Hip-Shoulder / None |
| Solo or partner | Just me / With partner |
| Purchase intent | Ready to buy / Not ready to buy |
| Mattress selected | Product name, size, price |
| Postal code | User-entered |
| Nearest store | Store name + city |
| Email | User-entered at booking step |

Plus: **flow variant** (back pain, hip pain, neck pain, etc.) so you know which ad/landing page brought them in.

---

## What Epsilon Needs to Provide

Before we go live, Epsilon needs to confirm:

1. **Field mapping** — our field names (e.g. `session_id`, `flow_id`, `email_address`) need to match their schema. We've documented our names; they need to confirm or provide their mapping.
2. **API credentials** — Client ID, Client Secret, API username, API password, Org Unit ID (OUID), and region (US or EU).
3. **Endpoint confirmation** — we're targeting `/v2.0/people/records` on their Single Record Management API. They should confirm this is the correct endpoint for their setup.

---

## Current Status

- **Code:** Complete and deployed
- **Mode:** Running in dev/mock mode (all calls succeed silently without contacting Epsilon)
- **To go live:** Drop the 6 environment variables into production config and it lights up — no code changes needed

---

## Error Handling

- Tracking failures **never** block the user experience
- If Epsilon is down, users complete the quiz normally — events are logged server-side for debugging
- OAuth tokens are cached and auto-refreshed

---

*For full technical details (API payloads, authentication flow, field mapping), see [epsilon-integration.md](epsilon-integration.md).*

# Epsilon PeopleCloud Integration

## Overview

The Better Sleep Tonight flow captures user interactions at every step and pushes them to Epsilon's PeopleCloud platform for CRM and follow-up marketing purposes.

**What this means in plain English:** Every time a user answers a question, selects a product, enters their postal code, or provides their email, that data is sent to Epsilon so the marketing team can follow up with relevant messaging and track how users move through the experience.

---

## How It Works

### Two-Phase Tracking

The integration uses two API endpoints that work together:

| Phase | Endpoint | When It Fires | What It Sends |
|-------|----------|---------------|---------------|
| **Step Tracking** | `/api/epsilon/event` | Every time the user completes a step | Anonymous session data + the answer |
| **Email Capture** | `/api/epsilon/submit` | When the user provides their email (final step) | Email + session ID + all answers in one record |

### Session Linking

When a user starts the flow, a unique **session ID** (UUID) is generated. This ID is attached to every event sent to Epsilon. When the user finally provides their email at the booking step, the session ID is included in the final submission, allowing Epsilon to link all the anonymous step-by-step events to a real contact record.

**Why this matters:** Even if a user drops off before giving their email, we still have their anonymous journey data. If they come back later and complete the flow, the data can be linked. This gives the marketing team full funnel visibility, including drop-off analysis.

---

## Data Collected at Each Step

| Step | Step ID | Data Captured | Example Values |
|------|---------|---------------|----------------|
| 1. Intro Video | `intro-video` | Video viewed | (video step, no direct answer) |
| 2. Trouble Falling Asleep | `q1-trouble-falling-asleep` | Frequency selection | "Every Night", "Frequently", "On Occasion", "Never" |
| 3. Sleep Position | `q2-sleep-position` | Position selection | "Side", "Back", "Stomach", "Combo" |
| 4. Motion Disturbance | `q3-motion-disturbance` | Disturbance frequency | "Every Night", "Frequently", "On Occasion", "Never" |
| 5. Aches & Pains Frequency | `q4-aches-pains-frequency` | Pain frequency | "Every Morning", "Frequently", "On Occasion", "Never" |
| 6. Aches & Pains Type | `q5-aches-pains-type` | Pain description | "Stiffness", "Soreness", "Numbness/Tingling", "Sharp Pain" |
| 7. Sleep Alone or Partner | `q6-sleep-alone-or-partner` | Sleep arrangement | "Alone", "With a Partner" |
| 8. Summary Video | `video-step-1` | Video viewed | (video step) |
| 9. Product Recommendations | `product-recommendations-step` | Mattress selection | Size + Feel + Price (e.g., "Queen-Medium, $1,299") |
| 10. Post-Selection Video | `video-step-3` | Video viewed | (video step) |
| 11. Postal Code | `zipcode-capture-step` | User's postal code | "L7M 1A1" |
| 12. Store Locations | `store-locations-step` | Selected store | Store name + city (e.g., "Burlington - Ashley HomeStore") |
| 13. Booking Email | `booking-cta-step` | Email address | "user@example.com" |

### Additional Context Sent With Every Event

- **Session ID** - Unique identifier linking all events from a single user session
- **Flow ID** - Which flow variant the user entered from (e.g., "back-pain", "hippain", "neckpain")
- **Step Index** - Numeric position in the flow (useful for drop-off analysis)
- **Postal Code** - Included once captured (step 11 onwards)
- **Timestamp** - ISO 8601 timestamp of each interaction

---

## Flow Variants

The flow is accessed via URL parameters. Each variant changes the intro heading and subheadline but uses the same question flow. The `flow_id` field in Epsilon tells you which variant the user came from:

| URL Parameter | Flow ID | Heading |
|---------------|---------|---------|
| (none / default) | `default` | Waking up with back pain? |
| `?flow=back-pain` | `back-pain` | Waking up with back pain? |
| `?flow=achesandpains` | `achesandpains` | Waking up with aches and pains? |
| `?flow=wakeupwithaheadache` | `wakeupwithaheadache` | Waking up with a headache? |
| `?flow=hippain` | `hippain` | Waking up with hip pain? |
| `?flow=wakeupfeelingtired` | `wakeupfeelingtired` | Waking up feeling tired? |
| `?flow=neckpain` | `neckpain` | Waking up with neck pain? |
| `?flow=shoulderpain` | `shoulderpain` | Waking up with shoulder pain? |

---

## Technical Architecture

```
User's Browser                    Our Server                      Epsilon
     |                               |                               |
     |  (User answers question)      |                               |
     |---POST /api/epsilon/event---->|                               |
     |                               |---OAuth2 token request------->|
     |                               |<--Bearer token (cached 1hr)---|
     |                               |---POST /v2.0/people/records-->|
     |                               |<--200 OK--------------------- |
     |<--{ success: true }-----------|                               |
     |                               |                               |
     |  (User submits email)         |                               |
     |---POST /api/epsilon/submit--->|                               |
     |                               |---POST /v2.0/people/records-->|
     |                               |<--200 OK---------------------|
     |<--{ success: true }-----------|                               |
     |                               |                               |
     |  (Redirect to booking page)   |                               |
```

### API Routes

#### `POST /api/epsilon/event` - Step Event Tracking

Fires on every user interaction (fire-and-forget, never blocks the UI).

**Request body:**
```json
{
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "flowId": "back-pain",
  "stepId": "q1-trouble-falling-asleep",
  "stepIndex": 1,
  "questionText": "How often do you have trouble falling asleep?",
  "value": "every-night",
  "label": "Every Night",
  "postalCode": null,
  "timestamp": "2026-02-17T14:30:00.000Z"
}
```

#### `POST /api/epsilon/submit` - Final Email + Full Record

Fires once when the user provides their email at the booking step.

**Request body:**
```json
{
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "user@example.com",
  "postalCode": "L7M 1A1",
  "flowId": "back-pain",
  "answers": [
    {
      "stepId": "q1-trouble-falling-asleep",
      "questionText": "How often do you have trouble falling asleep?",
      "value": "every-night",
      "label": "Every Night"
    },
    {
      "stepId": "q2-sleep-position",
      "questionText": "Which position do you sleep in the most?",
      "value": "side",
      "label": "Side"
    }
  ]
}
```

### Authentication

The server-side API routes handle Epsilon authentication automatically:

1. **OAuth2 Password Grant** - Uses `EPSILON_CLIENT_ID`, `EPSILON_CLIENT_SECRET`, `EPSILON_API_USERNAME`, and `EPSILON_API_PASSWORD` to obtain a Bearer token
2. **Token Caching** - Tokens are cached in-memory and auto-refreshed 60 seconds before expiry (tokens last ~1 hour)
3. **X-OUID Header** - The Epsilon Organization Unit ID is sent with every API call

### Epsilon Record Field Mapping

The following fields are sent to Epsilon. **Field names will need to match your Epsilon schema** - update the mapping in the API route code if Epsilon uses different field names.

**Per-event record (`/api/epsilon/event`):**

| Our Field Name | Description |
|----------------|-------------|
| `session_id` | UUID linking all events from one user session |
| `flow_id` | Which URL variant the user entered from |
| `step_id` | Identifier for the specific step |
| `step_index` | Numeric position (0-indexed) |
| `question_text` | The question shown to the user |
| `answer_value` | Machine-readable answer value |
| `answer_label` | Human-readable answer label |
| `postal_code` | User's postal code (when available) |
| `event_timestamp` | ISO 8601 timestamp |

**Final email submission record (`/api/epsilon/submit`):**

| Our Field Name | Description |
|----------------|-------------|
| `session_id` | UUID linking to all prior events |
| `email_address` | User's email |
| `postal_code` | User's postal code |
| `flow_id` | URL variant |
| `store_id` | Selected store identifier |
| `store_name` | Selected store name |
| `store_city` | Selected store city |
| `flow_[stepId]` | One field per answer (e.g., `flow_q1_trouble_falling_asleep = "every-night"`) |

---

## Environment Variables Required

These must be set in the `.env` file (or deployment environment) before the Epsilon integration will make real API calls:

```
EPSILON_CLIENT_ID=        # OAuth client ID from Epsilon
EPSILON_CLIENT_SECRET=    # OAuth client secret from Epsilon
EPSILON_API_USERNAME=     # API username from Epsilon
EPSILON_API_PASSWORD=     # API password from Epsilon
EPSILON_OUID=             # Organization Unit ID from Epsilon
EPSILON_REGION=US         # "US" or "EU" depending on your Epsilon instance
```

**Without these credentials:** The integration runs in dev/mock mode - all API calls succeed silently without contacting Epsilon. The user flow works exactly the same; data just isn't pushed to Epsilon.

---

## Error Handling

- **Event tracking errors are never shown to users.** If an event fails to send to Epsilon, it's logged server-side but the user's flow continues uninterrupted.
- **Email submission errors don't block the redirect.** If the final Epsilon call fails, the user still gets redirected to the appointment booking page. The error is logged for debugging.
- **OAuth failures are retried.** If the token expires mid-session, the next API call automatically fetches a new token.

---

## Files

| File | Purpose |
|------|---------|
| `src/app/api/epsilon/_shared.ts` | Shared OAuth token management and config |
| `src/app/api/epsilon/event/route.ts` | Per-step event tracking endpoint |
| `src/app/api/epsilon/submit/route.ts` | Final email + full record submission endpoint |
| `src/app/page.tsx` | Frontend - session ID generation, `trackEvent()` calls on every step |
| `.env` | Epsilon credentials (not committed to git) |

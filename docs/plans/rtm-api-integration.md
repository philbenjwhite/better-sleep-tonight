# Real-Time Messaging API Integration Plan

## Overview

Integration with a RESTful JSON-based messaging API to send quiz completion data for email personalization and delivery.

---

## API Architecture

### Regions & Endpoints

| Region | OAuth Endpoint | API Endpoint |
|--------|----------------|--------------|
| US | `https://api-public.example.com/oauth2/access_token` | `https://api.harmony.example.com` |
| EMEA | `https://api-public.eu.example.com/oauth2/access_token` | `https://api.harmony.eu.example.com` |

**Note:** OAuth endpoint is different from the API endpoint.

---

## Authentication

### Two-Tier Credential System

1. **OAuth Credentials** (for token request)
   - `Client_Id` / `Client_Secret` → Base64 encoded for Authorization header

2. **API Credentials** (for authorization)
   - `api_username` / `api_password` → Sent as form data

### Token Request

```bash
curl -X POST \
  -H "Authorization: Basic {base64(Client_ID:Client_Secret)}" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "scope=cn%20mail%20sn%20givenname%20uid%20employeeNumber" \
  -d "grant_type=password" \
  -d "username={api_username}" \
  -d "password={api_password}" \
  https://api-public.example.com/oauth2/access_token
```

### Token Response

```json
{
  "expires_in": 3599,
  "token_type": "Bearer",
  "refresh_token": "9d481e4e-c3e7-4feb-a03c-41af99e7db20",
  "access_token": "238d26ce-e057-4535-b257-c5bc06905b22"
}
```

### Token Lifecycle

- Expires every **3599 seconds** (~1 hour)
- Must cache and proactively refresh
- Recommend refreshing ~5 minutes before expiry

---

## API Request Headers

| Header | Required | Example | Description |
|--------|----------|---------|-------------|
| `Authorization` | Yes | `Bearer {access_token}` | OAuth token |
| `X-OUID` | Yes | `955dffa5-4659-4f6a-b0a4-b0439310b06b` | Business Unit ID |
| `Content-Type` | Yes | `application/json` | Always JSON |
| `X-Client-Request-Id` | No | `318a46c53469490d8e751b4932eedaae` | Client-side tracking ID |
| `X-Async` | No | `true` | Enable async execution |

---

## RTMv3 Endpoint

### Send Real-Time Message

```
PUT /v3/messages/{id}/send
```

- `{id}` = Pre-configured message/template ID
- Supports up to **10 recipients** per call

---

## Request Payload Schema

### TypeScript Interfaces

```typescript
interface RTMv3Request {
  // Optional - override email subject
  subjectOverride?: string;

  // Optional - override sender settings
  emailSettingsOverride?: {
    emailDisplayName?: string;
    emailReplyTo?: string;
  };

  // Optional - default attributes for all recipients
  // Can be overridden at recipient level
  defaultAttributes?: MessageAttribute[];

  // Required - array of recipients (max 10)
  recipients: Recipient[];
}

interface Recipient {
  customerKey: string;           // Unique customer identifier
  emailAddress: string;          // Recipient email
  attributes?: MessageAttribute[]; // Per-recipient personalization
}

interface MessageAttribute {
  attributeName: string;   // Variable name in template
  attributeType: string;   // Data type (typically "String")
  attributeValue: string;  // Value to inject
}
```

---

## Sample Payloads

### Sample 1: Fast RTM with Attributes

Sending to two recipients with default and per-recipient attributes:

```json
{
  "subjectOverride": "Better subject than deployment",
  "emailSettingsOverride": {
    "emailDisplayName": "Fire Sale!",
    "emailReplyTo": "someone@mailingdomain"
  },
  "defaultAttributes": [
    {
      "attributeName": "FirstName",
      "attributeType": "String",
      "attributeValue": "Valued Customer"
    }
  ],
  "recipients": [
    {
      "customerKey": "abcdefg",
      "emailAddress": "abcdefg@domain.com",
      "attributes": [
        {
          "attributeName": "FirstName",
          "attributeType": "String",
          "attributeValue": "Dennis"
        }
      ]
    },
    {
      "customerKey": "hijklm",
      "emailAddress": "hijklmg@domain.com",
      "attributes": [
        {
          "attributeName": "FirstName",
          "attributeType": "String",
          "attributeValue": "Joseph"
        }
      ]
    }
  ]
}
```

### Sample 2: Dynamic RTM (Profile Lookup)

All attributes referenced from List, Reference table, or Customer Profile:

```json
{
  "subjectOverride": "Subject Override of Dynamic RTM",
  "emailSettingsOverride": {
    "emailReplyTo": "otheremail@email1.domain.com",
    "emailDisplayName": "Fall River Sports Dynamic RTM"
  },
  "recipients": [
    {
      "customerKey": "Batman",
      "emailAddress": "help@batsign.com"
    }
  ]
}
```

### Sample 3: Hybrid Mode

Some attributes in payload, some from profile lookup:

```json
{
  "subjectOverride": "Hotel ID Testing",
  "emailSettingsOverride": {
    "emailReplyTo": "otheremail@email1.domain.com",
    "emailDisplayName": "Hotel Information"
  },
  "recipients": [
    {
      "customerKey": "Batman",
      "emailAddress": "recipient@domain.com",
      "attributes": [
        {
          "attributeName": "HotelId",
          "attributeType": "String",
          "attributeValue": "2"
        },
        {
          "attributeName": "Brand",
          "attributeType": "String",
          "attributeValue": "The Palms"
        }
      ]
    }
  ]
}
```

---

## Email Template Variables

Variables in email templates use `${VariableName}` syntax:

```html
<!DOCTYPE html>
<html>
<title>test</title>
<body>
  CustomerKey: ${CustomerKey}<br>
  EmailAddress: ${EmailAddress}<br>
  Brand: ${Brand}<br>
  HotelID: ${HotelId}<br>
  <!-- Profile lookups with joins -->
  HotelName: ${Profile.HotelId.HOTEL_BRANDS_TFK_596.HotelName}<br>
  HotelAddress: ${Profile.HotelId.HOTEL_BRANDS_TFK_596.HotelName.WHOTEL_META_DATA_ZFD_221.HotelAddress}<br>
</body>
</html>
```

---

## Quiz Data Mapping

### Source Data Structure

```json
{
  "flowId": "back-pain",
  "sessionData": {
    "email": "john.smith@gmail.com",
    "zipCode": "M5V 3L9",
    "mattressSelection": {
      "size": "queen",
      "feel": "medium"
    }
  },
  "answers": [
    {
      "stepId": "q2-sleep-position",
      "answer": { "value": "side", "label": "On My Side" }
    },
    {
      "stepId": "q5-aches-pains-type",
      "answer": { "value": "hip-shoulder", "label": "Hip or Shoulder Discomfort" }
    },
    {
      "stepId": "product-recommendations-step",
      "answer": { "value": "sealy-posturepedic-plus", "label": "Sealy Posturepedic Plus" }
    }
  ]
}
```

### Mapped RTM Payload

```json
{
  "subjectOverride": "Your Personalized Sleep Recommendations",
  "recipients": [
    {
      "customerKey": "john.smith@gmail.com",
      "emailAddress": "john.smith@gmail.com",
      "attributes": [
        {
          "attributeName": "PostalCode",
          "attributeType": "String",
          "attributeValue": "M5V 3L9"
        },
        {
          "attributeName": "MattressSize",
          "attributeType": "String",
          "attributeValue": "queen"
        },
        {
          "attributeName": "MattressFeel",
          "attributeType": "String",
          "attributeValue": "medium"
        },
        {
          "attributeName": "SleepPosition",
          "attributeType": "String",
          "attributeValue": "side"
        },
        {
          "attributeName": "AchesPainsType",
          "attributeType": "String",
          "attributeValue": "hip-shoulder"
        },
        {
          "attributeName": "ProductRecommendation",
          "attributeType": "String",
          "attributeValue": "Sealy Posturepedic Plus"
        },
        {
          "attributeName": "FlowId",
          "attributeType": "String",
          "attributeValue": "back-pain"
        }
      ]
    }
  ]
}
```

---

## Rate Limiting

- **100,000 calls/hour** per business unit
- Spike arrests may apply based on usage patterns
- Concurrent rate limiting possible

### 429 Response

```json
{
  "resultCode": "TOO_MANY_REQUESTS",
  "resultSubCode": "",
  "serviceTransactionId": null,
  "clientRequestId": null,
  "data": [],
  "total": 0,
  "resultString": "Rate limit exceeded."
}
```

---

## Async Operations

### Enable Async Mode

Add header: `X-Async: true`

### Acknowledgement Response (202)

```json
{
  "id": "1000300doa4dfd7e0d58b4498b09c62870839c150",
  "status": "SUBMITTED",
  "createdDate": 1455221411175,
  "createdBy": "a631780e-2797-4d4a-816b-2efcee649fc8"
}
```

### Check Task Status

```
GET /v1/tasks/{taskId}
```

---

## Error Responses

### 401/403 Authentication Failed

```json
{
  "resultCode": "ACCESS_DENIED",
  "resultSubCode": "",
  "serviceTransactionId": null,
  "clientRequestId": null,
  "data": [],
  "total": 0,
  "resultString": "Invalid credentials or permission denied."
}
```

### 404 Not Found

```json
{
  "resultCode": "NOT_FOUND",
  "resultSubCode": "",
  "serviceTransactionId": null,
  "clientRequestId": null,
  "data": [],
  "total": 0,
  "resultString": "{taskId} not found"
}
```

### 500 Server Error

```json
{
  "resultCode": "SERVER_ERROR",
  "resultSubCode": "",
  "serviceTransactionId": null,
  "clientRequestId": null,
  "data": [],
  "total": 0,
  "resultString": "Error Text"
}
```

---

## Implementation Flow

Based on requirements call:

```
┌─────────────────────────────────────────────────────────────────┐
│                      Quiz Completion                            │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Check Contact Table (Table 1)                          │
│  - Query database for existing contact by email                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
            ┌───────────────┐           ┌───────────────┐
            │ Contact EXISTS │           │ Contact NEW   │
            └───────┬───────┘           └───────┬───────┘
                    │                           │
                    │                           ▼
                    │               ┌───────────────────────────┐
                    │               │ Step 2: Create Contact    │
                    │               │ Write to Contact Table    │
                    │               └─────────────┬─────────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Write Quiz Data (Table 2 - New)                        │
│  - Store quiz answers and session details                       │
│  - Link to contact record via email/customerKey                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: Trigger RTM Email                                      │
│  - PUT /v3/messages/{id}/send                                   │
│  - Payload attributes must match template personalization       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Environment Setup

```env
RTM_CLIENT_ID=
RTM_CLIENT_SECRET=
RTM_API_USERNAME=
RTM_API_PASSWORD=
RTM_OUID=
RTM_REGION=US
RTM_MESSAGE_ID=
```

### Phase 2: Authentication Service

- `src/lib/rtm/auth.ts`
- Token caching (in-memory or Redis)
- Proactive refresh before expiry
- Error handling for 401/403

### Phase 3: Database Operations

- `src/lib/rtm/contacts.ts`
- **Check Contact** - Query Table 1 by email
- **Create Contact** - Insert new contact if not exists
- **Write Quiz Data** - Insert to Table 2 with all quiz details

### Phase 4: RTM Client

- `src/lib/rtm/types.ts` - TypeScript interfaces
- `src/lib/rtm/client.ts` - API client
- Quiz data → RTM payload transformation
- Rate limit handling with retry logic

### Phase 5: API Route

- `src/app/api/rtm/send/route.ts`
- Orchestrates full flow (check → create → write → send)
- Input validation
- Error logging/monitoring

---

## Resolved Questions

| Question | Answer |
|----------|--------|
| **Message ID** | Will be provided in URL (to be sent by vendor) |
| **customerKey Strategy** | Use **email address** as customerKey (their standard practice) |
| **Template Variables** | Vendor will configure via personalization feature. Our payload `attributeName` values must match exactly what they set up in the template |

## Remaining Questions

1. **Table 1 (Contacts)** - API endpoint for checking/creating contacts?
2. **Table 2 (Quiz Data)** - API endpoint for writing quiz details?
3. **Template Attributes** - Final list of `attributeName` values once template is configured

# Epsilon Submit Payload Example

## Frontend → `/api/epsilon/submit`

```json
{
  "sessionId": "36364753-591b-4db9-a3f3-b7fba935fff3",
  "email": "mark+1030AMtest@visualboston.com",
  "postalCode": "A1A 1A1",
  "flowId": "default",
  "selectedStore": {
    "id": "prescott",
    "storeName": "Prescott Ashley HomeStore",
    "city": "Prescott"
  },
  "answers": [
    { "stepId": "q1-trouble-falling-asleep", "questionText": "How often do you have trouble falling asleep?", "value": "...", "label": "..." },
    { "stepId": "q2-sleep-position", "questionText": "Which position do you sleep in the most?", "value": "side", "label": "..." },
    { "stepId": "q3-motion-disturbance", "questionText": "...", "value": "...", "label": "..." },
    { "stepId": "q4-aches-pains-frequency", "questionText": "How often do you wake with aches and pains?", "value": "...", "label": "..." },
    { "stepId": "q5-aches-pains-type", "questionText": "...", "value": "...", "label": "..." },
    { "stepId": "q6-sleep-alone-or-partner", "questionText": "Do you typically sleep alone or with a partner?", "value": "...", "label": "..." },
    { "stepId": "q7-purchase-intent", "questionText": "...", "value": "...", "label": "..." },
    { "stepId": "product-recommendations-step", "questionText": "Product Recommendation", "value": "...", "label": "..." },
    { "stepId": "zipcode-capture-step", "questionText": "Postal Code", "value": "A1A 1A1", "label": "A1A 1A1" },
    { "stepId": "store-locations-step", "questionText": "Store Location", "value": "prescott", "label": "..." },
    { "stepId": "booking-cta-step", "questionText": "Booking Email", "value": "mark+1030AMtest@visualboston.com", "label": "mark+1030AMtest@visualboston.com" }
  ]
}
```

Note: `sessionId` and `flowId` are not sent to Epsilon — they're only used server-side. The `intro-video` step is not included in the answers array (video steps are only tracked if explicitly stored as answers).

## Server → Epsilon PeopleCloud API

`buildRecordPayload()` in `src/app/api/epsilon/submit/route.ts` flattens the above into the actual Epsilon record. It loops through `answers`, maps each `stepId` to an Epsilon field name via `STEP_TO_EPSILON_FIELD`, and uses the `label` value:

```json
{
  "CustomerKey": "mark+1030AMtest@visualboston.com",
  "EmailAddress": "mark+1030AMtest@visualboston.com",
  "Postal_Code": "A1A 1A1",
  "Store_Locations": "Prescott Ashley HomeStore",
  "Trouble_Falling_Asleep": "...",
  "Sleep_Position": "...",
  "Motion_Disturbance": "...",
  "Aches_Pains_Frequency": "...",
  "Aches_Pains_Type": "...",
  "Sleep_Alone_Or_Partner": "...",
  "Purchase_Intent": "...",
  "Product_Recommendations": "..."
}
```

Fields only appear if their `stepId` is present in the answers array AND has a mapping in `STEP_TO_EPSILON_FIELD`. The video steps (`video-step-1` → `Summary_Video`, `video-step-3` → `Post_Selection_Video`) and `intro-video` → `Intro_Video` are mapped but typically not present in answers.

## Field Mapping Reference

| Step ID | Epsilon Field |
|---------|---------------|
| `intro-video` | `Intro_Video` |
| `q1-trouble-falling-asleep` | `Trouble_Falling_Asleep` |
| `q2-sleep-position` | `Sleep_Position` |
| `q3-motion-disturbance` | `Motion_Disturbance` |
| `q4-aches-pains-frequency` | `Aches_Pains_Frequency` |
| `q5-aches-pains-type` | `Aches_Pains_Type` |
| `q6-sleep-alone-or-partner` | `Sleep_Alone_Or_Partner` |
| `q7-purchase-intent` | `Purchase_Intent` |
| `video-step-1` | `Summary_Video` |
| `video-step-3` | `Post_Selection_Video` |
| `product-recommendations-step` | `Product_Recommendations` |
| `zipcode-capture-step` | `Postal_Code` |
| `store-locations-step` | `Store_Locations` |
| `booking-cta-step` | `EmailAddress` |

## Flow

1. **POST** to Epsilon PeopleCloud to create the record
2. If `DUPLICATE_ITEM` → **PUT** to update existing record
3. Immediately fires **RTM** (Real-Time Message) to trigger the personalized email
4. RTM email template pulls personalization from PeopleCloud fields above

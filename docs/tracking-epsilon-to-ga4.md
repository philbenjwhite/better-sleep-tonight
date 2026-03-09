# Epsilon & Analytics Integration

## How Data Flows to Epsilon

Epsilon PeopleCloud only receives data when a user submits their email at the final booking step. Previously, every quiz interaction was sent to Epsilon — creating anonymous records that never got an email attached. We removed that to keep PeopleCloud clean.

When a user completes the flow and enters their email, a single record is created in PeopleCloud containing:

- **Email address** (used as the record key)
- **All quiz answers** (sleep position, pain frequency, purchase intent, etc.)
- **Mattress selection** (size and feel)
- **Postal code**
- **Selected store** (name and city)
- **Product IDs shown** (which mattresses were recommended based on their answers)

### Product Recommendation Field Values

The product recommendations step now sends the actual product IDs instead of a generic label. The value stored in the `Product_Recommendations` field depends on the user's answer to the "sleep alone or with a partner" question:

- **"Just Me" (2 products shown):** `tempur-sense,tempur-prosense`
- **"With a Partner" (3 products shown):** `tempur-sense,tempur-prosense,tempur-luxealign`

The label field includes context: `Book a Rest Test (tempur-sense,tempur-prosense)`

This means every row in PeopleCloud has an email attached and a complete picture of the user's quiz journey.

## How We Track Dropoff (Without Epsilon)

Step-by-step progression and dropoff is tracked via GA4 instead. Every interaction point fires a GA4 event — video completions, question answers, mattress selections, zip code entry, store selection, etc.

To build funnel/dropoff reports in GA4:

1. Register `step_id`, `flow_id`, `answer_value`, and `answer_label` as **custom dimensions** in GA4 Admin → Custom Definitions
2. Create a **Funnel Exploration** report using `quiz_step` events filtered by `step_id` to visualize where users drop off

## Next Up: RTM (Real-Time Message) After Email Submission

Once a user submits their email, we want to trigger a follow-up email via Epsilon's RTM API. The submit call already populates the Customer Profile Table with all quiz data — so the email template can pull personalization directly from PeopleCloud. The RTM call itself just needs to send the email address to trigger the message.

The RTM endpoint is:

```
PUT /v3/messages/{messageId}/send
```

This uses the same Epsilon OAuth credentials and org unit ID that the data submission uses. The call fires after the profile record is created, so the template can reference all quiz data for personalization.

### Action Items

- [ ] **Get the RTM message ID** from Epsilon — this is the `{messageId}` in the endpoint above, corresponding to the email template/deployment configured in Epsilon
- [ ] **Confirm product ID format** — the `Product_Recommendations` field now contains comma-separated product IDs (e.g. `tempur-sense,tempur-prosense,tempur-luxealign`). Confirm this format works for Epsilon's template personalization and reporting needs

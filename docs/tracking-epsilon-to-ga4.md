# Tracking Changes: Epsilon to GA4 for Step Progression

## What Changed

We removed the per-step tracking to Epsilon PeopleCloud. Previously, every time a user answered a question, watched a video, or interacted with a step, we sent that data to Epsilon — creating a record keyed by their anonymous session ID. This meant PeopleCloud was filling up with rows that never had an email attached, since most users drop off before the final step.

Now, **Epsilon only receives data when the user submits their email** at the final booking step. That submission still includes all their accumulated answers, store selection, and zip code — so we don't lose any CRM data for users who complete the flow.

## How We Still Track Dropoff

We replaced the Epsilon per-step calls with GA4 events using the `trackQuizEvent` utility that was already built but unused in the main flow:

```ts
trackQuizEvent('quiz_step', currentStepIndex, {
  step_id: answer.stepId,
  flow_id: flowParam,
  answer_value: answer.value,
  answer_label: answer.label,
});
```

This fires at every interaction point — video completions, question answers, mattress selections, zip code entry, store selection, etc. All the same touchpoints we were tracking before, just routed to GA4 instead of Epsilon.

## Product ID Tracking

Previously, clicking "Book a Rest Test" on the product recommendations page just sent a generic `"book-rest-test"` value. Now it captures the actual product IDs that were shown to the user based on their earlier answer:

- **"Just Me"** — `tempur-sense,tempur-prosense`
- **"With a Partner"** — `tempur-sense,tempur-prosense,tempur-luxealign`

These IDs flow into both the GA4 event and the stored answer that gets sent to Epsilon when the user submits their email.

## What Was Removed

- The `/api/epsilon/event` API route (the one that handled per-step tracking) was deleted entirely
- The `trackEvent` function in the main page component was replaced with a lighter `trackStepGA4` wrapper

## What Stayed the Same

- The `/api/epsilon/submit` endpoint is untouched — email submissions still create full records in PeopleCloud with all answers attached
- GTM and GA4 were already configured, so no infrastructure changes needed

## GA4 Setup Needed

The events will flow into GA4 immediately, but to build the funnel/dropoff reports:

1. Register `step_id`, `flow_id`, `answer_value`, and `answer_label` as **custom dimensions** in GA4 Admin → Custom Definitions
2. Create a **Funnel Exploration** report using `quiz_step` events filtered by `step_id` to visualize where users drop off

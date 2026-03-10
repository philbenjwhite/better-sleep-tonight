# GA4 Analytics Tracking

## Overview

The Better Sleep Tonight quiz is a single-page app — the URL never changes. There are no traditional pageviews to track. Instead, we fire custom GA4 events at key moments as users move through the quiz.

All events flow through Google Tag Manager (GTM-NFXLP675) and GA4 (G-MQ5XK3D94V), configured in the app layout. Every event listed below can be used as a GTM trigger by matching on the event name.

---

## The User Journey (Plain English)

1. User lands on the page and sees the intro video with Ashley
2. User taps "Begin" → **we track this as the quiz starting**
3. User answers 6 sleep-related questions (each answer auto-advances) → **we track each answer**
4. Ashley summarizes their results in a video
5. User answers a purchase intent question
6. Product recommendations appear → **we track which products are shown**
7. User can tap "Buy Now" or "Learn More" on products → **we track these clicks**
8. Ashley presents a final video
9. User enters their zip code to find nearby stores
10. Store locations are displayed on a map
11. Final screen with "Book a Rest Test" and "Contact Us" CTAs → **this is quiz complete**

---

## Events Reference

### Quiz Events

These track the user's progression through the quiz flow.

| Event Name | When It Fires | Key Parameters |
|---|---|---|
| `quiz_start` | User taps "Begin" on the intro screen | `quiz_step`, `flow_id` |
| `quiz_step` | User selects an answer (fires once per step) | `quiz_step`, `step_id`, `answer_value`, `answer_label`, `flow_id` |
| `quiz_complete` | User reaches the final CTA screen | `quiz_step`, `flow_id` |

### Ecommerce Events

These track product engagement on the recommendations step.

| Event Name | When It Fires | Key Parameters |
|---|---|---|
| `view_item` | Product recommendations step is displayed (fires once per product) | `item_id`, `item_name` |
| `buy_now_click` | User taps "Buy Now" on a product card | `item_id`, `item_name`, `price` |
| `learn_more_click` | User taps "Learn More" on a product card | `item_id`, `item_name` |

### Engagement Events

These track intent signals beyond the quiz itself.

| Event Name | When It Fires | Key Parameters |
|---|---|---|
| `book_rest_test_intent` | User taps "Book a Rest Test" on product recommendations | `item_id`, `item_name`, `price` |
| `store_search` | User submits a zip code to find nearby stores | `zip_code` |

### Video Events

Ashley's video segments are tracked automatically throughout the flow.

| Event Name | When It Fires | Key Parameters |
|---|---|---|
| `video_start` | Video playback begins | `video_id`, `video_title` |
| `video_25_percent` | Video reaches 25% | `video_id`, `video_title`, `video_percent` |
| `video_50_percent` | Video reaches 50% | `video_id`, `video_title`, `video_percent` |
| `video_75_percent` | Video reaches 75% | `video_id`, `video_title`, `video_percent` |
| `video_complete` | Video finishes playing | `video_id`, `video_title`, `watch_time` |
| `video_pause` | User pauses a video | `video_id`, `video_title` |
| `video_resume` | User resumes a video | `video_id`, `video_title` |
| `video_replay` | User replays a video | `video_id`, `video_title` |
| `video_error` | Video fails to load or play | `video_id`, `error_type`, `error_message` |

### Scroll Tracking

| Event Name | When It Fires | Key Parameters |
|---|---|---|
| `scroll_depth` | User scrolls past 25%, 50%, 75%, 90%, or 100% of the page | `percent_scrolled`, `event_label` |

---

## Funnel Setup in GA4

For a conversion funnel report, use this sequence:

| Step | Event | What It Tells You |
|---|---|---|
| 1 | `quiz_start` | How many people begin the quiz |
| 2 | `quiz_step` (filter by `quiz_step` param) | Where people drop off in the questions |
| 3 | `view_item` | How many see product recommendations |
| 4 | `buy_now_click` or `learn_more_click` | How many engage with a specific product |
| 5 | `store_search` | How many look for a nearby store |
| 6 | `book_rest_test_intent` | How many want to try a mattress in-store |
| 7 | `quiz_complete` | How many reach the final screen |

Drop-off between steps 1→2 tells you if the intro video is too long. Drop-off between 3→4 tells you if the recommendations resonate. Drop-off between 5→6 tells you if store availability is a blocker.

---

## Flow Variants

The `?flow=back-pain` (and similar) query params change the intro headline but use the same underlying quiz steps. The `flow_id` parameter on quiz events lets you segment performance by variant in GA4.

## Epsilon Tracking (Separate System)

Server-side API calls to Epsilon PeopleCloud happen independently and are **not visible in GA4**. Epsilon tracks per-step data at `/api/epsilon/event` and email submissions at `/api/epsilon/submit`. See the Epsilon integration docs for details.

## Technical Notes

- `quiz_step` numbering is 0-indexed (step 0 = first question after intro video)
- The URL never changes — if a virtual pageview is needed for a GA4 conversion goal, push a synthetic `page_view` with a path like `/quiz/thank-you`
- All gtag() calls are guarded with `typeof window !== 'undefined'` for SSR safety
- Video events fire automatically via the `useVideoAnalytics` hook — no manual wiring needed per video

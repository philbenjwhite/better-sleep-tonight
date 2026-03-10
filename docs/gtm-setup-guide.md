# GTM / GA4 Setup Guide

This doc covers what needs to be configured in Google Tag Manager and GA4 to capture the custom events fired by the Better Sleep Tonight quiz.

The dev side is done — the app fires these events automatically. This guide is about catching them on the GTM/GA4 side.

---

## Two Types of Data

There are two kinds of data available in GTM — it helps to understand the difference before setting things up.

### Built-in GTM Variables (automatic)

These are captured by GTM on every page without any setup. You don't need to create triggers or tags for them — they're just available. Useful ones for this quiz:

| Variable | What It Gives You |
|---|---|
| Page URL / Page Path | Which page the user is on (and any UTM campaign params in the URL) |
| Referrer | Where the user came from (Google, Facebook ad, direct, etc.) |
| Click Text / Click URL | The text and link of any button a user clicks |
| Analytics Session ID | Ties all events in a session together |

These give you **context** — where did the user come from, what page are they on — but they don't know anything about the quiz itself.

### Custom Event Parameters (from our code)

These are the quiz-specific data points our app sends: which question was answered, which product was clicked, what zip code was searched, etc. GTM doesn't know about these automatically — you need to create **Data Layer Variables** to access them (instructions below in "Capturing Event Parameters").

**They work together.** For example, you could build a report that shows `buy_now_click` events (custom) filtered by Referrer (built-in) to see which traffic sources drive the most product clicks.

### A note on video

GTM has built-in video tracking variables (Video Title, Video Duration, Video Percent), but those only work for embedded YouTube videos. Since our quiz uses self-hosted MP4 videos, those built-in variables won't fire. That's why we send our own `video_start` and `video_complete` events with video details attached.

---

## Quick Summary

The quiz fires **9 custom events**. For each one, you need:

1. A **GTM Trigger** that listens for the event name
2. A **GTM Tag** (GA4 Event) that sends it to GA4
3. Optionally, mark it as a **Key Event** (conversion) in GA4

---

## Events to Set Up

### 1. quiz_start

- **What it means:** User tapped "Begin" to start the quiz
- **Trigger:** Custom Event, event name = `quiz_start`
- **Parameters to capture:** `quiz_step`, `flow_id`
- **Mark as conversion?** Optional — useful for measuring landing page effectiveness

### 2. quiz_step

- **What it means:** User answered a question (fires once per question, 6 total)
- **Trigger:** Custom Event, event name = `quiz_step`
- **Parameters to capture:** `quiz_step`, `step_id`, `answer_value`, `answer_label`, `flow_id`
- **Mark as conversion?** No — use for funnel analysis, not as a conversion
- **Note:** `quiz_step` is a number (0-5). You can filter by this to see where people drop off

### 3. quiz_complete

- **What it means:** User reached the final screen of the quiz
- **Trigger:** Custom Event, event name = `quiz_complete`
- **Parameters to capture:** `quiz_step`, `flow_id`
- **Mark as conversion?** Yes — this is the primary completion metric

### 4. buy_now_click

- **What it means:** User tapped "Buy Now" on a product recommendation
- **Trigger:** Custom Event, event name = `buy_now_click`
- **Parameters to capture:** `item_id`, `item_name`, `price`
- **Mark as conversion?** Yes — strongest purchase intent signal

### 5. learn_more_click

- **What it means:** User tapped "Learn More" on a product recommendation
- **Trigger:** Custom Event, event name = `learn_more_click`
- **Parameters to capture:** `item_id`, `item_name`
- **Mark as conversion?** Optional — softer intent than Buy Now, but still valuable

### 6. book_rest_test_intent

- **What it means:** User tapped "Book a Rest Test" (wants to try the mattress in-store)
- **Trigger:** Custom Event, event name = `book_rest_test_intent`
- **Parameters to capture:** `item_id`, `item_name`, `price`
- **Mark as conversion?** Yes — high-intent action

### 7. store_search

- **What it means:** User submitted a zip code to find nearby stores
- **Trigger:** Custom Event, event name = `store_search`
- **Parameters to capture:** `zip_code`
- **Mark as conversion?** Optional — indicates interest in visiting a store

### 8. video_start

- **What it means:** An Ashley avatar video began playing
- **Trigger:** Custom Event, event name = `video_start`
- **Parameters to capture:** `video_title`, `video_duration`
- **Mark as conversion?** No

### 9. video_complete

- **What it means:** An Ashley avatar video finished playing
- **Trigger:** Custom Event, event name = `video_complete`
- **Parameters to capture:** `video_title`, `video_duration`
- **Mark as conversion?** No

---

## How to Create a Trigger + Tag in GTM

For each event above, repeat these steps:

**Create the Trigger:**
1. Go to GTM > Triggers > New
2. Trigger Type: **Custom Event**
3. Event name: enter the exact event name (e.g. `quiz_start`)
4. Fire on: All Custom Events
5. Save

**Create the Tag:**
1. Go to GTM > Tags > New
2. Tag Type: **Google Analytics: GA4 Event**
3. Select your GA4 Configuration tag
4. Event Name: same name (e.g. `quiz_start`)
5. Under Event Parameters, add each parameter from the list above (Parameter Name = the name, Value = `{{Event Parameter}}` or use a Data Layer Variable)
6. Triggering: select the trigger you just created
7. Save

**Publish** when all tags/triggers are configured.

---

## Capturing Event Parameters

The parameters (like `item_id`, `price`, `quiz_step`) are sent via gtag() and land in the **Data Layer**. To use them in GTM:

1. Go to Variables > User-Defined Variables > New
2. Variable Type: **Data Layer Variable**
3. Data Layer Variable Name: enter the parameter name (e.g. `item_id`)
4. Save

Then reference this variable in your GA4 Event tag's Event Parameters section.

---

## Recommended Conversions (Key Events)

Mark these as Key Events in GA4 (Admin > Events > mark as Key Event):

| Event | Why |
|---|---|
| `quiz_complete` | Primary completion metric |
| `buy_now_click` | Strongest purchase signal |
| `book_rest_test_intent` | High in-store intent |

These can then be used for Google Ads optimization if you're running campaigns.

---

## Funnel Report Setup

In GA4, go to Explore > Funnel Exploration and set up:

| Step | Event | Shows |
|---|---|---|
| 1 | `quiz_start` | How many begin |
| 2 | `quiz_step` (filter: quiz_step = 5) | How many finish all questions |
| 3 | `buy_now_click` OR `learn_more_click` | Product engagement |
| 4 | `store_search` | Store interest |
| 5 | `book_rest_test_intent` | In-store intent |
| 6 | `quiz_complete` | Full completion |

---

## Flow Variants

The quiz supports URL variants like `?flow=back-pain`. The `flow_id` parameter on quiz events lets you compare performance across variants. In GA4, add `flow_id` as a secondary dimension or filter in your funnel report.

---

## Notes

- The URL never changes during the quiz (it's a single-page app), so traditional pageview tracking won't show progression
- GTM's built-in Click and Scroll triggers will work on the page, but the custom events above give you much richer data
- Video events are for self-hosted MP4s, not YouTube — GTM's built-in YouTube video trigger won't capture these
- All events only fire in production. In development, they log to the browser console instead

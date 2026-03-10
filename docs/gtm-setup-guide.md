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

The quiz fires **7 active custom events** (video events are defined but not yet wired up — skip those for now). For each one, you need:

1. A **GTM Trigger** that listens for the event name
2. A **GTM Tag** (GA4 Event) that sends it to GA4
3. Optionally, mark it as a **Key Event** (conversion) in GA4

---

## Step 1: Create Data Layer Variables

Do this first — these are reused across multiple tags.

Go to **Variables** > **User-Defined Variables** > **New**. For each row:
- Variable Type: **Data Layer Variable**
- Data Layer Version: **2**
- Default Value: leave unchecked

| Variable Name          | Data Layer Variable Name |
|------------------------|--------------------------|
| dlv - quiz_step        | `quiz_step`              |
| dlv - step_id          | `step_id`                |
| dlv - flow_id          | `flow_id`                |
| dlv - answer_value     | `answer_value`           |
| dlv - answer_label     | `answer_label`           |
| dlv - item_id          | `item_id`                |
| dlv - item_name        | `item_name`              |
| dlv - price            | `price`                  |
| dlv - zip_code         | `zip_code`               |
| dlv - results_count    | `results_count`          |
| dlv - event_category   | `event_category`         |
| dlv - event_label      | `event_label`            |

---

## Step 2: Create Triggers + Tags (all 7 events)

For each event, create one Trigger and one Tag.

---

### 1. quiz_start

User tapped "Begin" to start the quiz.

**Trigger:**
- Name: `CE - quiz_start`
- Type: Custom Event
- Event name: `quiz_start`
- Fires on: **All Custom Events**

**Tag:**
- Name: `GA4 - quiz_start`
- Type: Google Analytics: GA4 Event
- Measurement ID: `G-MQ5XK3D94V`
- Event Name: `quiz_start`
- Event Parameters:

| Parameter Name | Value                      |
|----------------|----------------------------|
| quiz_step      | `{{dlv - quiz_step}}`      |
| flow_id        | `{{dlv - flow_id}}`        |
| event_category | `{{dlv - event_category}}` |
| event_label    | `{{dlv - event_label}}`    |

- Triggering: `CE - quiz_start`
- Mark as Key Event? Optional — useful for measuring landing page effectiveness

---

### 2. quiz_step

User answered a question (fires once per question, 6 total). `quiz_step` is 0-indexed (0-5).

**Trigger:**
- Name: `CE - quiz_step`
- Type: Custom Event
- Event name: `quiz_step`
- Fires on: **All Custom Events**

**Tag:**
- Name: `GA4 - quiz_step`
- Type: Google Analytics: GA4 Event
- Measurement ID: `G-MQ5XK3D94V`
- Event Name: `quiz_step`
- Event Parameters:

| Parameter Name | Value                      |
|----------------|----------------------------|
| quiz_step      | `{{dlv - quiz_step}}`      |
| step_id        | `{{dlv - step_id}}`        |
| flow_id        | `{{dlv - flow_id}}`        |
| answer_value   | `{{dlv - answer_value}}`   |
| answer_label   | `{{dlv - answer_label}}`   |
| event_category | `{{dlv - event_category}}` |
| event_label    | `{{dlv - event_label}}`    |

- Triggering: `CE - quiz_step`
- Mark as Key Event? No — use for funnel analysis, not as a conversion

---

### 3. quiz_complete

User reached the final screen of the quiz.

**Trigger:**
- Name: `CE - quiz_complete`
- Type: Custom Event
- Event name: `quiz_complete`
- Fires on: **All Custom Events**

**Tag:**
- Name: `GA4 - quiz_complete`
- Type: Google Analytics: GA4 Event
- Measurement ID: `G-MQ5XK3D94V`
- Event Name: `quiz_complete`
- Event Parameters:

| Parameter Name | Value                      |
|----------------|----------------------------|
| quiz_step      | `{{dlv - quiz_step}}`      |
| flow_id        | `{{dlv - flow_id}}`        |
| event_category | `{{dlv - event_category}}` |
| event_label    | `{{dlv - event_label}}`    |

- Triggering: `CE - quiz_complete`
- Mark as Key Event? **Yes** — primary completion metric

---

### 4. buy_now_click

User tapped "Buy Now" on a product recommendation.

**Trigger:**
- Name: `CE - buy_now_click`
- Type: Custom Event
- Event name: `buy_now_click`
- Fires on: **All Custom Events**

**Tag:**
- Name: `GA4 - buy_now_click`
- Type: Google Analytics: GA4 Event
- Measurement ID: `G-MQ5XK3D94V`
- Event Name: `buy_now_click`
- Event Parameters:

| Parameter Name | Value                      |
|----------------|----------------------------|
| item_id        | `{{dlv - item_id}}`        |
| item_name      | `{{dlv - item_name}}`      |
| price          | `{{dlv - price}}`          |
| event_category | `{{dlv - event_category}}` |
| event_label    | `{{dlv - event_label}}`    |

- Triggering: `CE - buy_now_click`
- Mark as Key Event? **Yes** — strongest purchase intent signal

---

### 5. learn_more_click

User tapped "Learn More" on a product recommendation.

**Trigger:**
- Name: `CE - learn_more_click`
- Type: Custom Event
- Event name: `learn_more_click`
- Fires on: **All Custom Events**

**Tag:**
- Name: `GA4 - learn_more_click`
- Type: Google Analytics: GA4 Event
- Measurement ID: `G-MQ5XK3D94V`
- Event Name: `learn_more_click`
- Event Parameters:

| Parameter Name | Value                      |
|----------------|----------------------------|
| item_id        | `{{dlv - item_id}}`        |
| item_name      | `{{dlv - item_name}}`      |
| event_category | `{{dlv - event_category}}` |
| event_label    | `{{dlv - event_label}}`    |

- Triggering: `CE - learn_more_click`
- Mark as Key Event? Optional — softer intent than Buy Now, but still valuable

---

### 6. book_rest_test_intent

User tapped "Book a Rest Test" (wants to try the mattress in-store).

**Trigger:**
- Name: `CE - book_rest_test_intent`
- Type: Custom Event
- Event name: `book_rest_test_intent`
- Fires on: **All Custom Events**

**Tag:**
- Name: `GA4 - book_rest_test_intent`
- Type: Google Analytics: GA4 Event
- Measurement ID: `G-MQ5XK3D94V`
- Event Name: `book_rest_test_intent`
- Event Parameters:

| Parameter Name | Value                      |
|----------------|----------------------------|
| item_id        | `{{dlv - item_id}}`        |
| item_name      | `{{dlv - item_name}}`      |
| price          | `{{dlv - price}}`          |
| event_category | `{{dlv - event_category}}` |
| event_label    | `{{dlv - event_label}}`    |

- Triggering: `CE - book_rest_test_intent`
- Mark as Key Event? **Yes** — high in-store intent

---

### 7. store_search

User submitted a zip code to find nearby stores.

**Trigger:**
- Name: `CE - store_search`
- Type: Custom Event
- Event name: `store_search`
- Fires on: **All Custom Events**

**Tag:**
- Name: `GA4 - store_search`
- Type: Google Analytics: GA4 Event
- Measurement ID: `G-MQ5XK3D94V`
- Event Name: `store_search`
- Event Parameters:

| Parameter Name | Value                      |
|----------------|----------------------------|
| zip_code       | `{{dlv - zip_code}}`       |
| results_count  | `{{dlv - results_count}}`  |
| event_category | `{{dlv - event_category}}` |
| event_label    | `{{dlv - event_label}}`    |

- Triggering: `CE - store_search`
- Mark as Key Event? Optional — indicates interest in visiting a store

---

### Video events (not yet active)

`video_start` and `video_complete` are defined in the codebase but not wired up to any component yet. Skip these in GTM for now — they can be added later once the tracking calls are connected.

---

## Step 3: Testing

1. In GTM, click **Preview** to open Tag Assistant
2. Open the quiz in the connected browser tab
3. Walk through the quiz — you should see each event fire in Tag Assistant
4. Verify each tag shows "Tag Fired" with the correct parameters
5. Once confirmed, go back to GTM and click **Submit** to publish

---

## Step 4: GA4 Custom Dimensions (Recommended)

Without this step, the parameters flow into GA4 but won't appear in reports or funnel explorations. Register them in **GA4 Admin** > **Custom definitions** > **Create custom dimension**:

| Dimension Name | Scope | Event Parameter |
|----------------|-------|-----------------|
| Quiz Step      | Event | `quiz_step`     |
| Step ID        | Event | `step_id`       |
| Flow ID        | Event | `flow_id`       |
| Answer Value   | Event | `answer_value`  |
| Answer Label   | Event | `answer_label`  |
| Item ID        | Event | `item_id`       |
| Item Name      | Event | `item_name`     |
| Zip Code       | Event | `zip_code`      |

And two custom metrics:

| Metric Name   | Scope | Event Parameter | Unit     |
|---------------|-------|-----------------|----------|
| Price         | Event | `price`         | Currency |
| Results Count | Event | `results_count` | Standard |

---

## Recommended Key Events (Conversions)

Mark these as Key Events in GA4 (Admin > Events > mark as Key Event):

| Event                   | Why                        |
|-------------------------|----------------------------|
| `quiz_complete`         | Primary completion metric  |
| `buy_now_click`         | Strongest purchase signal  |
| `book_rest_test_intent` | High in-store intent       |

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

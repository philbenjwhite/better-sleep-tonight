# Funnel analysis (weekly)

Folder for the weekly Better Sleep Tonight funnel reports prepared for the marketing team.

Each report is one file named `week-of-YYYY-MM-DD.md`, where the date is the **Monday of the data week** (matching the marketing dashboard's "Week Starting" column).

---

## How to run this report

### 1. Pull the marketing dashboard table

The Paid Search / Email / Ecom table at the top of each report comes from the existing weekly marketing dashboard (the spreadsheet Mark receives). Copy the row for the relevant week into the three tables in the template.

If the row isn't available yet, leave the section out rather than guessing.

### 2. Pull the GA4 funnel numbers

In GA4, go to **Reports > Engagement > Events** and set the date range to the data week (Mon to Sun).

Capture **users** (not event count) for each of these events:

| Funnel stage | GA4 event |
|---|---|
| Landed on page | `page_view` |
| Clicked "Begin" | `quiz_start` |
| Got past the intro and answered at least one question | `quiz_step` |
| Clicked "Book a Rest Test" | `book_rest_test_intent` |
| Reached the final booking step | `quiz_complete` |
| Submitted their email | `form_submit` |

Plug those numbers into the funnel table in the template. Compute drop-from-prior and percent-of-visitors.

### 3. Pull the per-question breakdown

This is the one thing the standard events report can't give you directly. In GA4:

1. Go to **Explore > Free form**
2. Add `step_id` as a row dimension (it's a custom event parameter on `quiz_step`, may need to be registered as a custom dimension first)
3. Add `Total users` as the metric
4. Filter to event = `quiz_step`, same date range as above

That table tells you which question is bleeding users mid-quiz. Drop the highlights into Leak 3 of the report.

### 4. Sanity-check known caveats

Some events are mis-measured today. Until they're fixed (see "Status of recommended fixes" below), the report should keep flagging the relevant caveats so the team doesn't quote misleading numbers. The template already includes them.

If a caveat is fixed before the next report, remove it from the template and from this README.

### 5. Update the funnel diagnosis

The four "Leak" sections in the template are durable: they're tied to product steps, not to a particular week's numbers. Update the numbers, refresh the suggested actions if anything shipped, and note any new patterns visible in the per-question breakdown.

### 6. Update the recommended next steps

Cross items off as they ship. Add new items if new measurement gaps surface.

---

## Funnel stage reference

The product flow, in order, is:

1. **Intro page**: visitor lands, sees hero copy and a "Get Better Sleep" CTA.
2. **Intro avatar video**: plays the introduction; user clicks "Let's Go" to advance (this step does not auto-advance).
3. **Q1 to Q6**: six question steps about sleep habits.
4. **Summary video**: short transition video; user clicks "See My Results" to advance.
5. **Recommendations**: shows 2 or 3 mattress recommendations with a "Book A Rest Test" CTA.
6. **Booking CTA / email capture**: final screen with email field and a "Register Email" CTA, then a redirect to the thank-you page.

Retired stages, still named in older reports: the purchase intent question (removed July 2026), and the post-recommendations video, zipcode capture and store locations steps (removed August 2026). The funnel is 10 steps as of August 2026, down from 13. See `docs/tracking-changelog.md`.

Knowing the order matters because some events fire later than their name implies. See caveats in the report template.

---

## Known measurement caveats (active)

Keep these in every weekly report until they're fixed:

1. **"Quiz Complete" fires only on the final email-capture screen**, not when the user sees their recommendation. Users who click "Book a Rest Test" but bail during zipcode entry do not register as Quiz Complete.
2. **"Form Submit" is a Google Ads conversion event**, not a GA4 form-submission event. If another Ads conversion is added later, the GTM trigger may double-count.
3. **"Got past the intro" (quiz_step users) is a low bar.** It includes anyone who answered one question, then quit.
4. **The recommendations screen has no view-tracking** of its own; it only registers when the user clicks "Book a Rest Test." Users who see their recommendation and bounce are currently invisible.

### Recently fixed (note in the next 1 to 2 reports)

- **"Book a Rest Test" no longer double or triple counts** (fixed 2026-05-15). Previously, each click fired the event once per recommended mattress (2 or 3 times). It now fires once per click, with the shown products bundled into the event's `items` array. Expect this number to drop roughly 50 to 66% in the first week after the fix lands. That's the correction, not a regression. Mention this explicitly in the next 1 to 2 weekly reports so the change isn't misread as a drop in user intent.

---

## Status of recommended fixes

Update this list as items ship. When all are done, this folder's caveats section can shrink.

| # | Fix | Status | Notes |
|---|---|---|---|
| 1 | Per-question breakdown in GA4 (custom exploration) | Not started | No code work; just a saved GA4 exploration. |
| 2 | Fix "Book a Rest Test" to fire once per click | **Shipped 2026-05-15** | Event now fires once per click with `items` array. Counts will drop 50 to 66% week-over-week as the correction takes effect. |
| 3 | Add "recommendations viewed" event on render | Not started | Closes the recommendations-view measurement gap. |
| 4 | Align on "Quiz Complete" definition and update trigger | Not started | Stakeholder decision required: "saw recommendation" vs "reached email capture". |
| 5 | Add intro-video start/end tracking | Not started | Splits Leak 2 into "bailed during video" vs "watched but didn't click." |
| 6 | Audit GTM "Form Submit" trigger | Not started | Make sure it can't catch future Ads conversions by mistake. |
| 7 | A/B test the landing page (variants of intro headline / CTA) | Not started | Variant infrastructure already in place; no funnel changes needed. |

---

## Report template

When starting a new week, copy the most recent report file, rename it `week-of-YYYY-MM-DD.md` (Monday of the new week), and update:

1. The header date and "based on" date range.
2. The TL;DR (1 to 2 sentences on what changed vs last week).
3. Weekly performance dashboard tables (Paid Search, Email, Ecom).
4. Funnel by users table.
5. Each Leak section's numbers, with a sentence noting any meaningful change vs last week.
6. The caveats section (only remove items that have shipped).
7. The recommended next steps list (cross off completed items, add new ones).

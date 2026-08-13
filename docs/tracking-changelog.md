# Better Sleep Tonight: Tracking Changelog

**For:** the marketing and analytics team
**Last updated:** 12 August 2026

This is the single reference for what the quiz tracks today and what has changed since launch. Events have been added, renamed and retired along the way, and reports built on the older list will silently return nothing. If you are about to build a report, check the "Retired" and "Never fired" sections first.

This document supersedes the earlier GA4 tracking and Epsilon overview docs, both of which describe a version of the funnel that no longer exists.

---

## Read this first: three things that will break a report

**1. The funnel is now 10 steps, not 13.** The step numbers on quiz events are zero indexed and shift when steps are removed. Numbers 0 through 8 are unchanged. Number 9 is now the final booking screen. Numbers 10, 11 and 12 no longer exist. Any report filtering on a hard coded step number above 8 is now pointing at the wrong thing or at nothing.

**Filter on `step_id` instead of the step number wherever you can.** Step IDs are stable names and do not shift when the funnel changes length.

**2. Epsilon only receives data when someone submits their email.** There is no per step tracking in Epsilon and has not been since March 2026. If you are looking for drop off data, it is in GA4, not in PeopleCloud. People who abandon the quiz before the final screen leave no Epsilon record at all.

**3. Two video events have never fired.** `video_start` and `video_complete` are described in the older documentation as live. They are not, and never have been. Anything built on them has always been empty.

---

## What is tracked today

### The journey

| Step | What the user sees | Tracked as |
|---|---|---|
| 1 | Intro video with Ashley | `quiz_step`, step ID `intro-video` |
| 2 to 7 | Six sleep questions | `quiz_step`, step IDs `q1` through `q6` |
| 8 | Summary video | `quiz_step`, step ID `video-step-1` |
| 9 | Mattress recommendation cards | `quiz_step`, step ID `product-recommendations-step` |
| 10 | Booking screen with email gate | `quiz_step`, step ID `booking-cta-step`, plus `quiz_complete` |

### Live GA4 events

Everything flows through Google Tag Manager (GTM-NFXLP675) into GA4 (G-MQ5XK3D94V). Hotjar (site 6712707) also runs for session recordings.

| Event | When it fires | Useful parameters |
|---|---|---|
| `quiz_start` | The user taps "Get Better Sleep" on the intro screen | `flow_id` |
| `quiz_step` | Once per completed step, forwards only | `step_id`, `quiz_step`, `answer_value`, `answer_label`, `flow_id` |
| `quiz_step_back` | The user taps the back control | `quiz_step` (where they landed), `from_step`, `step_id`, `flow_id` |
| `quiz_complete` | The user reaches the final booking screen | `quiz_step`, `flow_id` |
| `book_rest_test_intent` | The user taps "Book A Rest Test" on the cards | `item_count`, `items` (ID, name and price per mattress), `event_label` |
| `conversion` | The user submits their email on the booking screen | Google Ads conversion, TSI Rest Test |

### Things worth knowing about these events

**`quiz_complete` means "reached the final screen", not "submitted".** It fires on arrival at the booking screen, before the email gate. The event that means a real lead is `conversion`, or a `quiz_step` carrying the `booking-cta-step` ID. Expect `quiz_complete` to be meaningfully higher than submissions, and do not read the gap as a bug.

**`quiz_step` also fires on the two video steps.** Video steps report an answer value of "Y" when the segment finishes, and carry two extra parameters: `skipped` tells you whether the user used the skip control, and `video_error` tells you the segment failed to load and the funnel advanced them anyway. `skipped` is how you measure appetite for the skip control that was added in July.

**Backwards moves are reported separately.** `quiz_step_back` exists so that a user stepping back and re-answering does not inflate forward step counts. If your funnel report only counts `quiz_step`, backwards movement is already excluded, which is what you want.

**Analytics only load on the client's production hosts.** Preview links and temporary deployment URLs deliberately load no GTM, no GA4 and no Hotjar. This keeps stakeholder walkthroughs of a preview link out of the real reporting. If you are testing a preview link and seeing no data, that is working as intended.

**Flow variants are segmented by `flow_id`.** The campaign parameter on the URL changes the intro headline only, and all variants run the same questions. Current variants: default, back pain, aches and pains, wake up with a headache, hip pain, wake up feeling tired, neck pain, shoulder pain. Use `flow_id` to compare performance by landing page.

### What reaches Epsilon PeopleCloud

One record is written to the Tempurpedic_Better_Sleep list at the moment the user submits their email, keyed on the email address. A follow up email is triggered through Epsilon straight after.

Fields populated today:

| Field | Contains |
|---|---|
| `EmailAddress` | The submitted email, also used as the record key |
| `Trouble_Falling_Asleep` | Answer to question 1 |
| `Sleep_Position` | Answer to question 2 |
| `Motion_Disturbance` | Answer to question 3 |
| `Aches_Pains_Frequency` | Answer to question 4 |
| `Aches_Pains_Type` | Answer to question 5 |
| `Sleep_Alone_Or_Partner` | Answer to question 6 |
| `Product_Recommendations` | The mattresses that were shown to this person |

**`Product_Recommendations` records what was recommended, not what was chosen.** The quiz recommends two mattresses to people sleeping alone and three to people sleeping with a partner, and the field lists whichever set appeared. There is no "mattress selected" data, because the funnel does not ask anyone to pick one. Older documentation describes this field as capturing a selected product with a size and a price. That is not correct and has not been for some time.

---

## Retired: do not build reports on these

These fired at some point and no longer do. Their GTM tags should stay paused so that reporting is not skewed by dead triggers.

| Event or field | Retired | Why |
|---|---|---|
| `buy_now_click` | July 2026 | The funnel moved to in store rest tests only. There is no Buy Now path anywhere. |
| `learn_more_click` | July 2026 | Removed with the product card links, same reason. |
| `store_search` | August 2026 | The postal code step was removed. |
| `Purchase_Intent` (Epsilon) | July 2026 | The purchase intent question was dropped from the quiz. |
| `Postal_Code` (Epsilon) | August 2026 | The postal code step was removed. |
| `Store_Locations` (Epsilon) | August 2026 | The store locations step was removed. |

The Epsilon fields still exist on the list. They simply stop receiving new values, so any segment or email personalisation that reads them will find them empty on records created from August 2026 onward. Historic records keep whatever they already had.

## Never fired: defined but not connected

| Event | Status |
|---|---|
| `video_start` | Described in the old docs as automatic. It has never been connected to the player. |
| `video_complete` | Same. |
| `Intro_Video` (Epsilon) | The field exists on the list, but video steps report to GA4 only, so nothing has ever written to it. |
| `Summary_Video` (Epsilon) | Same. |
| `Post_Selection_Video` (Epsilon) | Same, and the step itself was removed in August 2026. |

Video engagement is measurable today through `quiz_step` on the two video steps, using the `skipped` and `video_error` parameters. That is the honest source for how people handle the avatar segments.

---

## Changelog

### August 2026: postal code and store locations removed

The postal code entry and the store locations map were taken out of the funnel, along with the avatar video that introduced them. Both asked for effort immediately before the booking ask, and the booking screen already handles getting people into a store. The funnel went from 13 steps to 10.

What this changes for reporting:

- `store_search` no longer fires.
- `Postal_Code` and `Store_Locations` stop being written to Epsilon. Leads created from now on carry no geographic or store attribution data.
- Step numbers 10, 11 and 12 no longer exist. `quiz_complete` now fires at step 9 rather than step 12.

If postal code or store attribution matters for regional reporting, that visibility is gone from this point forward and would need to come from somewhere else, for example the appointment booking system.

### August 2026: back control added to every step

A back control was added throughout the funnel, and with it a new event.

- `quiz_step_back` is new. It reports the step the user landed on, the step they came from, and the flow variant.
- Stepping back also clears the answer recorded on the step being returned to, so re-answering revises the answer rather than recording a second one. Answer counts per user stay accurate.

### July 2026: skip control added, purchase intent question dropped

- The purchase intent question was removed. The quiz went from seven questions to six, and `Purchase_Intent` stopped being written to Epsilon.
- `buy_now_click` and `learn_more_click` were retired when the funnel committed to in store rest tests only.
- A skip control was added to every avatar video. `quiz_step` on video steps now carries `skipped` and `video_error`.

### July 2026: analytics restricted to production hosts

GTM, GA4 and Hotjar previously loaded on preview deployments as well, which meant internal walkthroughs of a shared preview link landed in the real GA4 property and in Hotjar recordings as if they were real users. They now load only on the client's production hosts. Data before this date includes some internal traffic.

### May 2026: `book_rest_test_intent` fires once per click

The event previously fired once per recommended mattress, which inflated counts by two or three times depending on how many cards were shown. It now fires once per click, with the shown mattresses bundled into an `items` array. Comparisons that cross this date are not like for like.

### April 2026: purchase intent stored as readable labels

`Purchase_Intent` began storing "Complete Purchase" or "Book a Rest Test" rather than a raw internal value, so that Epsilon email personalisation could use it directly. The question was retired three months later.

### March 2026: store field simplified

`Store_Locations` began storing only the store name, dropping the city prefix it previously carried. Values before and after this date are formatted differently.

### March 2026: per step Epsilon tracking replaced by GA4

This is the change most likely to be misremembered. Epsilon originally received a lightweight event on every step, which gave anonymous session level drop off data inside PeopleCloud. That was replaced by GA4 event tracking, and the per step Epsilon endpoint was removed.

Since this date, Epsilon receives exactly one record per person, written when they submit their email. There is no anonymous tracking, no session linking, and no drop off visibility in PeopleCloud. All funnel drop off analysis has to happen in GA4.

### March 2026: Google Ads conversion, GTM data layer, double firing fix

- A Google Ads conversion tag was added on email submission.
- Events moved to a GTM data layer push. For a short window events were arriving twice, once via the data layer and once directly, which was corrected on 11 March. Counts from the first half of March 2026 may be inflated.

### February 2026: Epsilon integration goes live

The original integration, with both per step events and a final consolidated submission.

---

## Suggested funnel report

Built only on events that currently fire:

| Step | Event | What it tells you |
|---|---|---|
| 1 | `quiz_start` | How many people begin |
| 2 | `quiz_step` filtered to `step_id` `q1` through `q6` | Where people drop off in the questions |
| 3 | `quiz_step` filtered to `step_id` `product-recommendations-step` | How many reach and act on the recommendations |
| 4 | `book_rest_test_intent` | How many express booking intent |
| 5 | `quiz_complete` | How many reach the booking screen |
| 6 | `conversion` | How many actually submit an email |

The gap between steps 5 and 6 is the email gate, and it is the most useful number in the funnel: it tells you how many people wanted to book but would not give an email to do it.

---

## Housekeeping for the team

1. Confirm the GTM tags for `buy_now_click`, `learn_more_click` and `store_search` are paused rather than merely unused.
2. Check any saved GA4 exploration that filters on a step number above 8, and move it to `step_id`.
3. Check any Epsilon segment or email personalisation that reads `Purchase_Intent`, `Postal_Code` or `Store_Locations`, as these will be empty on new records.
4. Add a GTM trigger for `quiz_step_back` if you want visibility on how often people revise answers.
5. Decide whether losing postal code on new leads needs replacing from another source.

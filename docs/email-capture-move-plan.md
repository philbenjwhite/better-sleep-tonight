# Email Capture Move, Implementation Plan

Branch: `feat/email-capture-move`. Written September 2026 against `main` at `a727ada`.

Supersedes `docs/email-gate-ab-test-spec.md`, which planned the same content change as a 50/50 A/B test and put the input on the results step. Neither decision survived. This is a straight swap, and the input goes on the summary video step. That older document is deliberately not committed.

## What changes

Today people see their mattress recommendations for free and are asked for their email at the end, on the booking step. The ask moves earlier: Ashley asks for the email as she finishes the summary video, and the booking step becomes a confirmation instead of a second ask.

| Step | Index | Today | After |
|---|---|---|---|
| Summary video | 7 | Ashley speaks, then a "See My Results" button | Ashley speaks, then an email field and the same button |
| Results | 8 | Three mattress cards | Unchanged |
| Booking | 9 | "Book a Rest Test" card with an email field | "Thanks, You're All Set" headline, Contact Us card stays |

No step is added or removed. Every index is unchanged, so saved progress from the last seven days still resumes correctly, `?step=N` links still point where they did, and the analytics step numbers do not shift. This is the main reason the input does not become its own step.

## New copy

Summary video. The production script keeps all four of its lines and gains a fifth:

> Did you know that many sleep problems start with an ageing or unsupportive mattress?
>
> Our bodies change over the years, but our mattress usually doesn't.
>
> If it's been 7 to 10 years since you changed your mattress, maybe it's time to swap it out.
>
> I found some mattress options that are perfect for you based on your responses.
>
> Leave me your email address so I can show them to you and I'll also send over your personalized sleep report!

Final step, replacing the current script:

> I'll send you an email in the next 5 minutes so you can book a rest test at your nearest Ashley store.
>
> Thanks for visiting Better Sleep Tonight.

## Where the input renders

Inside `SpeechBubbleSequence`, in the slot that currently holds the manual CTA button, on `video-step-1` only.

That slot already has the timing we want. The CTA button is gated on `currentParagraphIndex === paragraphs.length - 1`, so it appears only once Ashley has finished her last line. The email field inherits that behaviour for free: it does not appear mid-sentence, it arrives exactly when she asks for it.

The component gains an optional input slot alongside `ctaButtonText` and `onCtaClick`. When present, the button becomes the form's submit control rather than a plain advance.

Avatar visibility needs no change. `avatarHidden` is `isProductRecommendationsStep`, and the ask now happens a step earlier, where Ashley is already centre stage. This is the second reason this placement is cheaper than putting the input on the results step.

## The Skip leak, and how it closes

`canAdvanceVideo` puts a **Skip** button in the footer whenever the video is in `LOADING`, `READY`, `PLAYING`, `PAUSED` or `BLOCKED`. A separate effect pauses the video at its last caption on any step with a manual CTA, which means the state is `PAUSED` at precisely the moment the email field appears. Skip therefore sits live beside the ask and advances straight to the results.

Left alone, this is not an edge case. It is a visible button next to the one thing the funnel is being rebuilt to collect.

Close it by excluding the step from `canAdvanceVideo` once the field is showing and the email has not yet been given. Skip stays available during playback, which is what it is for, and disappears when the ask lands. The footer then shows the disabled Next, consistent with a question step awaiting an answer.

## Back navigation

`handleBack` prunes stored answers to those whose `stepId` appears in `questionSteps.slice(0, targetIndex)`. The captured email is stored against its own id rather than a real step, so any move back out of the results step would prune it and re-ask for an address that has already been given and already sent to the CRM.

Exempt it from the prune, the way the old spec proposed:

```ts
/** Not index-addressable: the email is captured inside the summary video step
 *  rather than being a step of its own, so the slice-based prune drops it. */
const NON_STEP_ANSWER_IDS = new Set(["email-capture"]);
```

The captured state is sticky for the visit and persisted, so a refresh does not re-ask either.

## Mobile keyboard

Focusing the field summons the keyboard over roughly half the viewport, directly over Ashley, who is the reason the person is being asked. `StoreLocations` already solved this once: it skips autofocus on `pointer: coarse` and uses `preventScroll` elsewhere. Reuse that rule rather than writing a second one.

Recent commits on `main` touched header behaviour when the keyboard lifts the page. Check the new field against those, because this is the first time an input has appeared on a step where the avatar is full-bleed.

## Submit path

On a valid email:

1. Push a `StoredAnswer` under `email-capture`.
2. Fire the GA4 capture event and the conversion event. The conversion moves here from the booking step, since this is now where the funnel actually converts.
3. Write the CRM record and send the follow-up email. One record per person, as today.
4. Call the existing `handleSeeOptionsClick` to advance. Do not duplicate its state teardown, which clears the speech, the response flags and the backdrop in a specific order.

No `keepalive` is needed. The page is not navigating, unlike the booking submit it replaces.

## Booking step

The left column drops its email form and renders the "Thanks, You're All Set" headline. The Contact Us card stays. `StoreLocations` currently branches on whether `onEmailSubmit` was passed; it gains a confirmation mode instead.

The follow-up email must not send twice. It currently fires on every successful CRM write, and after this change there are two writes for one person. The second write must not mail them again.

Nothing here should reach `/thank-you` any more, since the booking step is now itself the end of the funnel. Confirm before deleting that route: it is a real page with its own tests.

## Commit sequence

Ordered so each commit stands alone and the branch is demoable throughout.

1. `docs: plan the email capture move` (this file)
2. `content: new Ashley booking segment, captions and script` **done**
3. `content: new Ashley summary segment, captions and script` **done**
4. `refactor: extract the email capture form out of the booking step` (no behaviour change)
5. `feat: let the speech bubble carry an input alongside its CTA`
6. `feat: ask for the email as Ashley finishes the summary`
7. `fix: withhold the video skip while the email ask is showing`
8. `feat: turn the booking step into a confirmation`
9. `fix: send the follow-up email once, from the new capture point`
10. `test: cover the email ask and the confirmation step`

The footage arrived early, so the two content commits landed ahead of the build rather than after it. Both segments are in, transcoded, captioned, and their scripts rewritten. The rest of the sequence now runs against the final audio.

### How the summary segment got to its final cut

Three versions, in order.

**In production**, four paragraphs over 16.65s, ending on "I found some mattress options". No email is asked for.

**As first delivered**, the closing copy only: two paragraphs over 12.35s, opening on "I found some mattress options". The mattress-age opening was not in the file, so taking it as sent would have dropped three lines that play today.

**Spliced**, briefly, to avoid losing them. The two clips turned out to share a setup exactly, so the join held up on measurement, but it did not hold up on screen: her head and expression did not carry through the cut, and it read as a small lurch right after "swap it out". Worth recording that the failure was pose continuity and nothing else. The matte was identical in both at (252, 247, 244), head width moved 372px to 374px, and frame luminance moved 1.3 of 255.

**Re-recorded as one take**, which is what ships. All five paragraphs, 23.2s, no join, no fade to black at the end.

| | In production | First delivery | Final take |
|---|---|---|---|
| Runtime | 16.65s | 12.35s | 23.22s |
| Paragraphs | 4 | 2 | 5 |
| Closing cue opens | n/a | 5.92s | 15.77s |
| Video pauses at | end of file | 11.90s | 22.40s |

Cue boundaries sit at the midpoint of the gap between one line's last word and the next line's first, which is how the four internal boundaries were placed. The last cue ends 0.38s after the final word, on a settled closed-mouth smile that holds from 22.2s to the end of the file, so the freeze frame has most of a second of margin either side of where `timeupdate` actually fires.

The email field appears when the video pauses on the last cue's end. Nothing in the code carries that number: the pause effect and the Skip withholding both read it off the last cue in the VTT, so recutting the segment only ever means recutting the captions. The one spec that did name a timestamp is the handoff test's guard against a CTA arriving early, and it names the closing cue.

Source footage is HEVC at 9.3 Mbit/s. It ships as H.264 High at CRF 25, which matches the rest of the library and lands at 6.56MB, the same weight as the segment it replaces, so the preload budget is unchanged. CRF 23 measured 0.0017 better on SSIM for 2MB more, which is not a trade worth making on a flat-matte talking head.

The booking segment now opens by speaking the words that are also becoming the on-screen headline: "Thanks, you're all set." Captions must match the audio, so the phrase is in `ashley-5.vtt` and in the step's script, which means the speech bubble renders it alongside the headline. **Decide at build time whether the headline or the bubble carries it.** Showing both is the default if nobody chooses.

## Needed from Ashley's team

Two fields on the CRM list, so a captured email can be told apart from a completed booking.

Today the existence of a record implies the person booked, because a record is only ever written at the booking step. After this change that stops being true: records exist for everyone who gave an email, whether or not they went on to book. Without a flag, every lead silently counts as a booking and the reported numbers move for reasons that have nothing to do with the change.

## Estimate

5.5 hours at $150/hr, $825. Excludes the CRM fields above.

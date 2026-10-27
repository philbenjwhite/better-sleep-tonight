import { test, expect } from "@playwright/test";
import {
  answerAllQuestions,
  answerOption,
  bookRestTestLink,
  emailAskField,
  keepVideosSlow,
  setVideoRateNow,
  skipButton,
  speedUpVideos,
  startFunnel,
  stubExternalServices,
  walkToBookingStep,
  walkToSummaryVideo,
} from "./helpers";

/**
 * Coverage for the skip control added to every avatar video, and a plain
 * no-skip walk of the whole funnel as the regression net for the removed
 * purchase-intent question.
 *
 * All avatar video runs through one playback system (VideoAvatarContext), so
 * the control is built once and rendered for every video. Skipping produces the
 * same ENDED transition a finished video produces, which is what makes the
 * downstream advance handlers work unchanged. The intro normally pauses and
 * waits for a manual CTA, and a skip must advance straight past it rather than
 * reveal that button. The summary is the exception: its skip fast-forwards to
 * the email ask instead of advancing, since advancing would carry the user past
 * the one thing the step is for.
 */

const QUESTION_COUNT = 6; // q1..q6 — the purchase-intent question was removed

/** The avatar's playback state machine, surfaced by VideoAvatar for tests. */
const videoState = (page: import("@playwright/test").Page) =>
  page.locator("[data-video-state]").first();

test.beforeEach(async ({ page }) => {
  await stubExternalServices(page);
});

test.describe("no skipping", () => {
  test.beforeEach(async ({ page }) => {
    await speedUpVideos(page);
  });

  test("walks the full funnel with exactly six questions", async ({ page }) => {
    await startFunnel(page);

    const answered = await answerAllQuestions(page);

    // The purchase-intent question is gone: six questions, then the email ask
    // and the closing step.
    expect(answered).toHaveLength(QUESTION_COUNT);
    // No question should repeat — a duplicate would mean the walk double-answered.
    expect(new Set(answered).size).toBe(QUESTION_COUNT);
    await expect(bookRestTestLink(page).first()).toBeVisible();
  });

  test("lands on the booking step straight from the email ask", async ({
    page,
  }) => {
    await walkToBookingStep(page);

    // No recommendations page in between: the closing step sends people on to
    // book, with Contact Us beside it.
    await expect(bookRestTestLink(page).first()).toHaveAttribute(
      "href",
      "https://ashleyhomestore.ca/pages/book-appointment",
    );
    await expect(
      page.getByRole("link", { name: /Contact Us/i }).first(),
    ).toBeVisible({ timeout: 45_000 });
  });
});

test.describe("skipping", () => {
  // Real-time (slowed) playback, otherwise a video would finish on its own
  // before the skip control could be clicked and the assertion would be hollow.
  test.beforeEach(async ({ page }) => {
    await keepVideosSlow(page);
  });

  test("skip control appears on the intro video and advances past its CTA", async ({
    page,
  }) => {
    await startFunnel(page);

    // intro-video is gated behind avatar readiness and normally waits for a
    // "Let's Go" CTA — the riskiest skip point in the funnel.
    await expect(skipButton(page)).toBeVisible({ timeout: 30_000 });
    await skipButton(page).click();

    // Skipping should land on the first question, not on the "Let's Go" button.
    await expect(answerOption(page).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: /Let.s Go/i })).toHaveCount(0);
  });

  test("skipping every video still reaches the booking step", async ({
    page,
  }) => {
    await startFunnel(page);

    // Skip every video, answer every question. The summary's skip lands on the
    // ask rather than past it, so the walk still has to give an address to get
    // to the end.
    const answered = await answerAllQuestions(page, { skipVideos: true });

    expect(answered).toHaveLength(QUESTION_COUNT);
    await expect(bookRestTestLink(page).first()).toBeVisible({
      timeout: 45_000,
    });
  });

  /**
   * Skip on the summary jumps to the ask, it does not advance.
   *
   * The segment runs about twenty seconds, most of it the lead-in to the ask,
   * so the skip is worth having there. But the step exists to take an address,
   * so the skip seeks to the closing cue and lets Ashley ask, and withdraws
   * itself once she does.
   */
  test("skip on the summary fast-forwards to the email ask", async ({
    page,
  }) => {
    await walkToSummaryVideo(page);

    await expect(skipButton(page)).toBeVisible({ timeout: 30_000 });
    await skipButton(page).click();

    // Still on the summary, now on the ask: the closing cue opens at 11.80s.
    const time = await page
      .locator("video")
      .first()
      .evaluate((v) => (v as HTMLVideoElement).currentTime);
    expect(time).toBeGreaterThanOrEqual(11.7);
    await expect(
      page
        .locator('p[class*="SpeechBubbleSequence_text"]')
        .filter({ hasText: /Leave me your email address/i }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(skipButton(page)).toBeHidden({ timeout: 10_000 });

    // The ask arrives once she has finished it, and nothing went past it.
    await expect(emailAskField(page)).toBeVisible({ timeout: 30_000 });
    await expect(bookRestTestLink(page)).toHaveCount(0);
  });

  test("the booking step offers no skip control", async ({ page }) => {
    await speedUpVideos(page);
    // Slow the closing video right before landing on it. At the walk's
    // fast-forward it ends and hands off to the idle loop before the assertion
    // runs, and the idle loop suppresses the control on its own — so the
    // interesting window, the video actually playing, would go unchecked.
    await walkToBookingStep(page, {
      beforeEmailSubmit: () => setVideoRateNow(page, 0.25),
    });

    await expect(
      page.getByRole("link", { name: /Contact Us/i }).first(),
    ).toBeVisible({ timeout: 45_000 });

    // Nothing advances past the booking step, so a skip has nowhere to go. The
    // control is suppressed for the whole step: while the closing video plays,
    // and for the idle loop it hands off to. It was also anchored underneath
    // this step's speech bubble, which left it half-hidden behind the bubble.
    await expect(videoState(page)).toHaveAttribute("data-video-state", "PLAYING");
    await expect(skipButton(page)).toHaveCount(0);

    // ...and still none once it settles into the idle loop.
    await setVideoRateNow(page, 16);
    await page.waitForTimeout(3000);
    await expect(skipButton(page)).toHaveCount(0);
  });
});

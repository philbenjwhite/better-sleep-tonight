import { test, expect } from "@playwright/test";
import {
  answerAllQuestions,
  answerOption,
  bookRestTestButton,
  keepVideosSlow,
  setVideoRateNow,
  skipButton,
  speedUpVideos,
  startFunnel,
  stubExternalServices,
  walkToBookingStep,
  walkToRecommendations,
} from "./helpers";

/**
 * Coverage for the skip control added to every avatar video, and a plain
 * no-skip walk of the whole funnel as the regression net for the removed
 * purchase-intent question.
 *
 * All avatar video runs through one playback system (VideoAvatarContext), so
 * the control is built once and rendered for every video. Skipping produces the
 * same ENDED transition a finished video produces, which is what makes the
 * downstream advance handlers work unchanged. Two video steps (intro-video and
 * video-step-1) normally pause and wait for a manual CTA — a skip must advance
 * straight past them rather than reveal that button.
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

    // The purchase-intent question is gone: six questions, then the cards.
    expect(answered).toHaveLength(QUESTION_COUNT);
    // No question should repeat — a duplicate would mean the walk double-answered.
    expect(new Set(answered).size).toBe(QUESTION_COUNT);
    await expect(bookRestTestButton(page).first()).toBeVisible();
  });

  test("reaches the booking step from the recommendations", async ({ page }) => {
    await walkToRecommendations(page);
    await walkToBookingStep(page);

    // The booking step gates its CTA behind an email field.
    await expect(
      page.getByRole("button", { name: /Register Email/i }).first(),
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

  test("skipping every video still reaches the recommendations", async ({
    page,
  }) => {
    await startFunnel(page);

    // Skip every video, answer every question. The recommendations step must
    // still be reached: skipping video-step-1 must not carry the user past the
    // cards into the booking step.
    const answered = await answerAllQuestions(page, { skipVideos: true });

    expect(answered).toHaveLength(QUESTION_COUNT);
    await expect(bookRestTestButton(page).first()).toBeVisible({
      timeout: 45_000,
    });
  });

  test("the booking step offers no skip control", async ({ page }) => {
    await speedUpVideos(page);
    await walkToRecommendations(page);
    // Slow the closing video right before landing on it. At the walk's
    // fast-forward it ends and hands off to the idle loop before the assertion
    // runs, and the idle loop suppresses the control on its own — so the
    // interesting window, the video actually playing, would go unchecked.
    await walkToBookingStep(page, {
      beforeBookRestTest: () => setVideoRateNow(page, 0.25),
    });

    await expect(
      page.getByRole("button", { name: /Register Email/i }).first(),
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

import { test, expect } from "@playwright/test";
import {
  answerAllQuestions,
  answerOption,
  bookRestTestButton,
  keepVideosSlow,
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
      page.getByRole("button", { name: /Schedule Appointment/i }).first(),
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
    // cards into the postal code step.
    const answered = await answerAllQuestions(page, { skipVideos: true });

    expect(answered).toHaveLength(QUESTION_COUNT);
    await expect(bookRestTestButton(page).first()).toBeVisible({
      timeout: 45_000,
    });
  });

  test("the closing idle loop offers no skip control", async ({ page }) => {
    await speedUpVideos(page);
    await walkToRecommendations(page);
    await walkToBookingStep(page);

    await expect(
      page.getByRole("button", { name: /Schedule Appointment/i }).first(),
    ).toBeVisible({ timeout: 45_000 });

    // The booking video hands off to a looping idle video, which has nothing to
    // advance to — skipping it would strand the user on the final step.
    await page.waitForTimeout(3000);
    await expect(skipButton(page)).toHaveCount(0);
  });
});

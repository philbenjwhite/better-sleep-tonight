import { test, expect } from "@playwright/test";
import {
  answerEmailAskIfPresent,
  bookRestTestButton,
  emailAskField,
  emailAskSubmit,
  nextButton,
  setVideoRateNow,
  skipButton,
  speedUpVideos,
  stubExternalServices,
  walkToRecommendations,
  walkToSummaryVideo,
  WALKTHROUGH_EMAIL,
} from "./helpers";

/**
 * The email is asked for as Ashley finishes the summary, and the results are
 * what it buys.
 *
 * It is captured inside the summary video step rather than in a step of its
 * own. A step would have shifted every index after it, which breaks resumable
 * sessions inside the 7-day window, ?step=N links, the analytics step numbers
 * and the back button's index-based answer pruning, all at once.
 */

test.beforeEach(async ({ page }) => {
  await stubExternalServices(page);
  await speedUpVideos(page);
});

/** Drive to the moment the ask appears, at real speed so it lands properly. */
async function walkToEmailAsk(page: import("@playwright/test").Page) {
  await walkToSummaryVideo(page);
  // The pause that reveals the ask is measured in the media clock, and the
  // walk's fast-forward covers seconds of it between timeupdates.
  await setVideoRateNow(page, 1);
  await emailAskField(page).waitFor({ state: "visible", timeout: 60_000 });
}

test("asks for the email as the summary finishes", async ({ page }) => {
  await walkToEmailAsk(page);

  await expect(emailAskField(page)).toBeVisible();
  await expect(emailAskSubmit(page)).toHaveText(/See My Results/i);

  // Nothing is given away yet.
  await expect(bookRestTestButton(page)).toHaveCount(0);
});

/**
 * The one that matters.
 *
 * Skip does not seek to the end on a manual-CTA step, it advances past the CTA
 * outright. The video pauses on its closing cue, which is exactly when the ask
 * appears, so an unguarded Skip would sit live beside the ask and carry the
 * user to the results having given nothing.
 */
test("offers no way past the ask", async ({ page }) => {
  await walkToEmailAsk(page);

  const skips = await skipButton(page).count();
  if (skips > 0) {
    await expect(skipButton(page).first()).toBeHidden();
  }
  await expect(nextButton(page).first()).toBeDisabled();
  await expect(emailAskSubmit(page)).toBeDisabled();
});

test("refuses an address that is not one, and stays put", async ({ page }) => {
  await walkToEmailAsk(page);

  await emailAskField(page).fill("not-an-address");
  await emailAskSubmit(page).click();

  await expect(page.getByText(/valid email/i)).toBeVisible();
  await expect(bookRestTestButton(page)).toHaveCount(0);
  await expect(emailAskField(page)).toBeVisible();
});

test("shows the results once an address is given", async ({ page }) => {
  await walkToEmailAsk(page);

  await emailAskField(page).fill(WALKTHROUGH_EMAIL);
  await emailAskSubmit(page).click();

  await expect(bookRestTestButton(page).first()).toBeVisible({
    timeout: 45_000,
  });
  await expect(emailAskField(page)).toHaveCount(0);
});

/**
 * The address reaches the CRM from here rather than from the booking step,
 * because this is now where the funnel converts.
 */
test("sends the address on to the CRM", async ({ page }) => {
  const submitted: unknown[] = [];
  await page.route("**/api/epsilon/**", (route) => {
    const body = route.request().postDataJSON();
    submitted.push(body);
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, stubbed: true }),
    });
  });

  await walkToEmailAsk(page);
  await emailAskField(page).fill(WALKTHROUGH_EMAIL);
  await emailAskSubmit(page).click();
  await expect(bookRestTestButton(page).first()).toBeVisible({
    timeout: 45_000,
  });

  expect(submitted.length).toBeGreaterThanOrEqual(1);
  const record = submitted[0] as { email?: string; answers?: unknown[] };
  expect(record.email).toBe(WALKTHROUGH_EMAIL);
  // The quiz answers ride along with it, so the record is a lead and not just
  // an address.
  expect(Array.isArray(record.answers)).toBe(true);
  expect((record.answers ?? []).length).toBeGreaterThan(1);
});

/**
 * handleBack prunes answers by slicing the steps array, and the captured
 * address is not addressable by index. Without an exemption it is dropped on
 * the way back, and the person is asked again for something they have already
 * given and that has already been sent.
 */
test("does not ask twice after stepping back", async ({ page }) => {
  await walkToRecommendations(page);

  // answerAllQuestions already answered the ask on the way through.
  await page.getByRole("button", { name: /Back/i }).first().click();

  // Back onto the summary step: it must not re-ask.
  await page.waitForTimeout(1_500);
  await expect(emailAskField(page)).toHaveCount(0);

  // And forward again still reaches the results.
  const asked = await answerEmailAskIfPresent(page);
  expect(asked).toBe(false);
});

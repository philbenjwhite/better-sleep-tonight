import { test, expect } from "@playwright/test";
import {
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

/**
 * Coverage that moved here with the field, off the booking step.
 *
 * preventScroll matters: without it the browser jumps to the field on a short
 * viewport and takes the line above it off screen before it has been read.
 */
test("puts the cursor in the field on arrival", async ({ page }) => {
  await walkToEmailAsk(page);

  await expect(emailAskField(page)).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
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

  // One write, not two. The booking step used to send the second, and the CRM
  // mails a follow-up on every successful write, so a second one would mail
  // the same person twice.
  expect(submitted).toHaveLength(1);
  const record = submitted[0] as {
    email?: string;
    answers?: { stepId: string; label: string }[];
  };
  expect(record.email).toBe(WALKTHROUGH_EMAIL);
  // The quiz answers ride along with it, so the record is a lead and not just
  // an address.
  const answers = record.answers ?? [];
  expect(Array.isArray(answers)).toBe(true);
  expect(answers.length).toBeGreaterThan(1);

  /*
    The recommendations are on the payload even though the results step has not
    been reached yet. This is the only write, and it happens a step before the
    cards are shown, so the CRM's Product_Recommendations field depends on them
    being derived at capture time rather than collected from the step.
  */
  const recommended = answers.find(
    (a) => a.stepId === "product-recommendations-step",
  );
  expect(recommended).toBeDefined();
  expect(recommended?.label ?? "").not.toBe("");
});

/**
 * Stepping back onto the step that asks.
 *
 * The field used to be gated on the address not being in yet, so a step back
 * replayed Ashley asking for one with nothing to put it in, and See My
 * Results, Skip and Next all live beside her. Nothing escaped, because the
 * results cannot be reached without giving it once, but a step that asks and
 * then offers three ways past itself reads exactly like a hole, and that is
 * what it was reported as.
 *
 * The step asks either way now. What the capture changes is that the field
 * arrives filled in, and that answering it again writes nothing new.
 */
test("asks again on the way back, with the address already in the field", async ({
  page,
}) => {
  const submits: unknown[] = [];
  await page.route("**/api/epsilon/**", (route) => {
    submits.push(route.request().postDataJSON());
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, stubbed: true }),
    });
  });

  // answerAllQuestions answers the ask on the way through, which is the one
  // record the CRM should ever see for this person.
  await walkToRecommendations(page);
  expect(submits.length).toBe(1);

  await page.getByRole("button", { name: /Back/i }).first().click();
  // The segment replays, and the pause that reveals the ask is measured in the
  // media clock, so it needs real time rather than the walk's fast-forward.
  await setVideoRateNow(page, 1);

  await emailAskField(page).waitFor({ state: "visible", timeout: 60_000 });
  await expect(emailAskField(page)).toHaveValue(WALKTHROUGH_EMAIL);

  // Still no way around it, so it cannot read as a bypass.
  const skips = await skipButton(page).count();
  if (skips > 0) {
    await expect(skipButton(page).first()).toBeHidden();
  }

  // Answering the same address again is the step being seen twice, not
  // answered twice: it advances, and the CRM gets nothing further.
  await emailAskSubmit(page).click();
  await expect(bookRestTestButton(page).first()).toBeVisible({
    timeout: 45_000,
  });
  expect(submits.length).toBe(1);
});

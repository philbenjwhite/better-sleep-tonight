import { test, expect, type Page } from "@playwright/test";
import {
  answerOption,
  bookRestTestButton,
  questionHeading,
  skipButton,
  speedUpVideos,
  startFunnel,
  stubExternalServices,
  videoCta,
  walkToBookingStep,
  walkToRecommendations,
} from "./helpers";

/**
 * Coverage for the header back control.
 *
 * Stepping back has to undo the step it leaves, not just decrement the index:
 * the answer recorded on the step being returned to is dropped so re-answering
 * appends rather than duplicates, state derived from later steps is cleared,
 * and saved progress is rewritten so a reload does not restore the step the
 * user just backed out of.
 */

const STORAGE_KEY = "bettersleep_progress_v2";

// Exact, because one of the sleep-position answers is "On My Back".
const backButton = (page: Page) =>
  page.getByRole("button", { name: "Back", exact: true });

/** Answers recorded in localStorage, which is what a reload would restore. */
const savedAnswerIds = (page: Page) =>
  page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return [] as string[];
    return (JSON.parse(raw).answers as Array<{ stepId: string }>).map(
      (a) => a.stepId,
    );
  }, STORAGE_KEY);

/** Enter the funnel and clear the intro video via its manual CTA. */
async function walkToFirstQuestion(page: Page) {
  await startFunnel(page);
  await videoCta(page).first().waitFor({ state: "visible", timeout: 45_000 });
  await videoCta(page).first().click();
  await expect(answerOption(page).first()).toBeVisible({ timeout: 30_000 });
}

test.beforeEach(async ({ page }) => {
  await stubExternalServices(page);
  await speedUpVideos(page);
});

test("returns to the previous question with the earlier answer re-selected", async ({
  page,
}) => {
  await walkToFirstQuestion(page);

  const firstQuestion = (await questionHeading(page).textContent())?.trim();
  await answerOption(page).first().click();

  // Wait out the 1s selection pause and land on the next question
  await expect(questionHeading(page)).not.toHaveText(firstQuestion!, {
    timeout: 30_000,
  });
  expect(await savedAnswerIds(page)).toHaveLength(1);

  await backButton(page).click();

  await expect(questionHeading(page)).toHaveText(firstQuestion!, {
    timeout: 30_000,
  });
  // The answer shows as chosen, and is no longer counted as recorded — so
  // answering again revises it instead of adding a second answer.
  // `_selected__`, not `selected`: unchosen options carry `notSelected`.
  await expect(answerOption(page).first()).toHaveClass(/_selected__/);
  expect(await savedAnswerIds(page)).toHaveLength(0);

  await answerOption(page).first().click();
  await expect(questionHeading(page)).not.toHaveText(firstQuestion!, {
    timeout: 30_000,
  });
  expect(await savedAnswerIds(page)).toHaveLength(1);
});

/**
 * Back and Next both live in the header now. Next replaced the skip control
 * that used to float over the avatar video, so the two read as a pair and are
 * asserted as one: they sit on the same row, in that order, and drop their
 * labels together at 1024px. A width where one still has its label and the
 * other does not is the regression this guards.
 */
test.describe("header navigation pair", () => {
  test("sit together in the header row, back before next", async ({ page }) => {
    await startFunnel(page);
    await skipButton(page).waitFor({ state: "visible", timeout: 30_000 });

    const backBox = (await backButton(page).boundingBox())!;
    const nextBox = (await skipButton(page).boundingBox())!;

    // Same row, and Next to the right of Back.
    expect(backBox.y).toBeCloseTo(nextBox.y, 0);
    expect(nextBox.x).toBeGreaterThan(backBox.x);
    // Both in the header rather than floating over the video.
    expect(backBox.y).toBeLessThan(100);
    expect(nextBox.y).toBeLessThan(100);
  });

  test("show their labels above 1024px and only arrows below", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await startFunnel(page);
    await skipButton(page).waitFor({ state: "visible", timeout: 30_000 });

    // The labels are hidden with display:none, which textContent still reports,
    // so count the ones actually rendered rather than reading the buttons' text.
    const labels = page.locator("header [data-nav-label]:visible");
    await expect(labels).toHaveCount(2);
    await expect(labels).toHaveText(["Back", "Next"]);

    // Below the breakpoint neither label survives. Counting both in one
    // assertion is the point: a width where only one collapses fails here.
    await page.setViewportSize({ width: 900, height: 900 });
    await expect(labels).toHaveCount(0);

    // ...and both buttons are still there, still named, just down to arrows.
    await expect(backButton(page)).toBeVisible();
    await expect(skipButton(page)).toBeVisible();
  });

  test("pins to opposite viewport edges below the breakpoint", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 820, height: 1180 });
    await startFunnel(page);
    await skipButton(page).waitFor({ state: "visible", timeout: 30_000 });

    const back = (await backButton(page).boundingBox())!;
    const next = (await skipButton(page).boundingBox())!;

    // Hugging each edge rather than sitting in the header row.
    expect(back.x).toBeLessThan(24);
    expect(820 - (next.x + next.width)).toBeLessThan(24);
    expect(back.y).toBeGreaterThan(150);

    // Level with each other, and centred on the viewport. Centring is on the
    // viewport rather than the avatar frame on purpose, so it does not have to
    // track the frame's vh-derived height across breakpoints.
    expect(back.y).toBeCloseTo(next.y, 0);
    expect(back.y + back.height / 2).toBeCloseTo(1180 / 2, -1);
  });
});

test.describe("narrow viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("steps back through the funnel from the header", async ({ page }) => {
    await startFunnel(page);
    await videoCta(page).first().waitFor({ state: "visible", timeout: 45_000 });
    await videoCta(page).first().click();
    await expect(answerOption(page).first()).toBeVisible({ timeout: 30_000 });

    // Back from the first question returns to the intro video, which replays.
    await backButton(page).click();
    await expect(answerOption(page).first()).toBeHidden({ timeout: 30_000 });
    await expect(skipButton(page)).toBeVisible({ timeout: 30_000 });

    // And once more to leave the funnel for the intro screen
    await backButton(page).click();
    await expect(
      page.getByRole("button", { name: "Get Better Sleep" }),
    ).toBeVisible();
  });

  test("offers no forward control on the results steps", async ({ page }) => {
    await walkToRecommendations(page);

    // Nothing is playing here, so there is nothing to advance past.
    await expect(skipButton(page)).toBeHidden();
    const backBox = await backButton(page).boundingBox();
    expect(backBox!.y).toBeLessThan(80); // in the header row

    await backButton(page).click();
    await expect(bookRestTestButton(page).first()).toBeHidden();
  });
});

test("returns to the intro screen from the first step", async ({ page }) => {
  await startFunnel(page);
  await expect(backButton(page)).toBeVisible({ timeout: 30_000 });

  await backButton(page).click();

  await expect(
    page.getByRole("button", { name: "Get Better Sleep" }),
  ).toBeVisible();
  // Nothing to step back to from the intro screen.
  await expect(backButton(page)).toBeHidden();
});

test("backs out of the booking step and clears the recommendation it recorded", async ({
  page,
}) => {
  await walkToRecommendations(page);
  await walkToBookingStep(page);
  await expect(page.locator('input[type="email"]')).toBeVisible({
    timeout: 30_000,
  });

  const bookedAnswers = await savedAnswerIds(page);
  expect(bookedAnswers).toContain("product-recommendations-step");

  // Booking step → recommendation cards, with the recorded pick dropped so
  // booking again appends rather than duplicates.
  await backButton(page).click();
  await expect(bookRestTestButton(page).first()).toBeVisible({
    timeout: 30_000,
  });
  expect(await savedAnswerIds(page)).not.toContain(
    "product-recommendations-step",
  );

  // And the funnel still runs forward from here
  await walkToBookingStep(page);
  await expect(page.locator('input[type="email"]')).toBeVisible({
    timeout: 45_000,
  });
  expect(await savedAnswerIds(page)).toContain("product-recommendations-step");
});

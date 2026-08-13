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
 * Below 1200px the control leaves the header and pairs with skip on the avatar
 * frame's other edge. The two are positioned from separate files — skip off the
 * frame, back off the viewport — so the alignment is asserted rather than
 * trusted.
 */
test.describe("narrow viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("sits level with the skip control and still steps back", async ({
    page,
  }) => {
    await startFunnel(page);
    await skipButton(page).waitFor({ state: "visible", timeout: 30_000 });

    const skipBox = await skipButton(page).boundingBox();
    const backBox = await backButton(page).boundingBox();
    expect(backBox!.y).toBeCloseTo(skipBox!.y, 0);
    // One on each edge, at matching insets
    expect(backBox!.x).toBeLessThan(24);
    expect(390 - (skipBox!.x + skipBox!.width)).toBeLessThan(24);

    await videoCta(page).first().waitFor({ state: "visible", timeout: 45_000 });
    await videoCta(page).first().click();
    await expect(answerOption(page).first()).toBeVisible({ timeout: 30_000 });

    // The header's copy is hidden at this width, so this resolves to one node.
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

  test("keeps the control in the header on the results steps", async ({
    page,
  }) => {
    await walkToRecommendations(page);

    // No skip to pair with here, and the content runs full width
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

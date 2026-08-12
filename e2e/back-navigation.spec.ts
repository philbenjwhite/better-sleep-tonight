import { test, expect, type Page } from "@playwright/test";
import {
  answerOption,
  questionHeading,
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
 * appends rather than duplicates, state derived from later steps (postal code,
 * chosen store) is cleared, and saved progress is rewritten so a reload does
 * not restore the step the user just backed out of.
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

test("backs out of the booking step and clears the postal code it collected", async ({
  page,
}) => {
  await walkToRecommendations(page);
  await walkToBookingStep(page);
  await expect(page.locator('input[type="email"]')).toBeVisible({
    timeout: 30_000,
  });

  // Booking step → store locations
  await backButton(page).click();
  await expect(page.getByRole("button", { name: /^Select$/ }).first()).toBeVisible({
    timeout: 30_000,
  });

  // Store locations → postal code capture, with the earlier entry dropped
  await backButton(page).click();
  const zipInput = page.locator("#postal-code");
  await expect(zipInput).toBeVisible({ timeout: 30_000 });
  await expect(zipInput).toHaveValue("");

  // And the funnel still runs forward from here
  await zipInput.fill("L7M1A1");
  await page.getByRole("button", { name: /^Continue$/i }).first().click();
  await expect(page.getByRole("button", { name: /^Select$/ }).first()).toBeVisible({
    timeout: 45_000,
  });
});

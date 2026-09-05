import { test, expect, type Page } from "@playwright/test";
import {
  answerOption,
  bookRestTestButton,
  nextButton,
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

test("lets a different answer be chosen after stepping back", async ({
  page,
}) => {
  await walkToFirstQuestion(page);

  // The option's own text starts with its keyboard letter, so read the label
  // span to compare against what is recorded.
  const optionLabel = (index: number) =>
    answerOption(page).nth(index).locator('[class*="label"]');

  const firstQuestion = (await questionHeading(page).textContent())?.trim();
  const chosen = (await optionLabel(0).textContent())?.trim();
  await answerOption(page).first().click();
  await expect(questionHeading(page)).not.toHaveText(firstQuestion!, {
    timeout: 30_000,
  });

  await backButton(page).click();
  await expect(questionHeading(page)).toHaveText(firstQuestion!, {
    timeout: 30_000,
  });

  // The options the user passed over stay live. They are dimmed and made
  // unclickable while a committed choice plays out its pause, and returning to
  // a question is not that: a revision that could only re-pick the same answer
  // is not a revision.
  const second = answerOption(page).nth(1);
  await expect(second).not.toHaveClass(/notSelected/);
  const revised = (await optionLabel(1).textContent())?.trim();
  expect(revised).not.toBe(chosen);

  await second.click();
  await expect(questionHeading(page)).not.toHaveText(firstQuestion!, {
    timeout: 30_000,
  });

  // One answer for the question, and it is the revised one.
  const saved = await page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return JSON.parse(raw!).answers as Array<{ stepId: string; label: string }>;
  }, STORAGE_KEY);
  expect(saved).toHaveLength(1);
  expect(saved[0].label).toBe(revised);
});

/**
 * Back and the forward control sit together in the footer nav row.
 *
 * They were in the header, and below 1024px they pinned to the left and right
 * edges of the viewport, vertically centred — level with the middle of the
 * answer list, which is where they landed. In the footer they are part of the
 * layout rather than laid over it, so they cannot cover the question at any
 * width, and they are within reach of a thumb on a phone.
 */
test.describe("footer navigation row", () => {
  test("sits at the bottom of the page, back before next", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await startFunnel(page);
    await skipButton(page).waitFor({ state: "visible", timeout: 30_000 });

    const backBox = (await backButton(page).boundingBox())!;
    const nextBox = (await skipButton(page).boundingBox())!;

    // Same row, forward control to the right of Back.
    expect(backBox.y).toBeCloseTo(nextBox.y, 0);
    expect(nextBox.x).toBeGreaterThan(backBox.x);
    // In the footer rather than the header they used to share with the logo.
    expect(backBox.y).toBeGreaterThan(900 - 200);
    expect(nextBox.y).toBeGreaterThan(900 - 200);
  });

  test("keeps both labels at every width", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await startFunnel(page);
    await skipButton(page).waitFor({ state: "visible", timeout: 30_000 });

    // Nothing overlaps in the footer, so neither control has to collapse to a
    // bare arrow the way the edge-pinned pair did.
    const labels = page.locator("footer [data-nav-label]:visible");
    await expect(labels).toHaveText(["Back", "Skip"]);

    await page.setViewportSize({ width: 390, height: 844 });
    await expect(labels).toHaveText(["Back", "Skip"]);
  });

  test("names the forward control for the job it is doing", async ({
    page,
  }) => {
    await walkToFirstQuestion(page);

    // A question waiting to be answered has nothing to go forward past: the
    // questions are the point, so there is no skipping them, and the answer
    // advances the step itself. The control stays in the row all the same, so
    // that Back is never the only thing offered.
    await expect(skipButton(page)).toBeHidden();
    await expect(nextButton(page)).toBeVisible();
    await expect(nextButton(page)).toBeDisabled();

    const firstQuestion = (await questionHeading(page).textContent())?.trim();
    await answerOption(page).first().click();
    await expect(questionHeading(page)).not.toHaveText(firstQuestion!, {
      timeout: 30_000,
    });
    await backButton(page).click();
    await expect(questionHeading(page)).toHaveText(firstQuestion!, {
      timeout: 30_000,
    });

    // Back leaves an answer on the step, so there is something to carry
    // forward, and the control offers to do exactly that.
    await expect(nextButton(page)).toBeVisible();
    await expect(nextButton(page)).toHaveAttribute("data-nav-variant", "primary");
  });

  test("carries a revisited question forward on its existing answer", async ({
    page,
  }) => {
    await walkToFirstQuestion(page);

    const firstQuestion = (await questionHeading(page).textContent())?.trim();
    const kept = (
      await answerOption(page).first().locator('[class*="label"]').textContent()
    )?.trim();
    await answerOption(page).first().click();
    await expect(questionHeading(page)).not.toHaveText(firstQuestion!, {
      timeout: 30_000,
    });

    await backButton(page).click();
    await expect(questionHeading(page)).toHaveText(firstQuestion!, {
      timeout: 30_000,
    });

    await nextButton(page).click();
    await expect(questionHeading(page)).not.toHaveText(firstQuestion!, {
      timeout: 30_000,
    });

    // Recorded exactly as if the option had been clicked again.
    const saved = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return JSON.parse(raw!).answers as Array<{ label: string }>;
    }, STORAGE_KEY);
    expect(saved).toHaveLength(1);
    expect(saved[0].label).toBe(kept);
  });

  /**
   * The regression the move was made for. Kept as geometry rather than as a
   * width: what matters is that no control lands on an option, at any width.
   */
  for (const width of [390, 500, 820]) {
    test(`keeps clear of the answer options at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await walkToFirstQuestion(page);
      // The options slide in from 15px to the left of where they settle, so
      // measure once GSAP has cleared its transform rather than mid-entrance.
      await page.waitForFunction(() =>
        [...document.querySelectorAll('[data-animate="option"]')].every(
          (el) => getComputedStyle(el).transform === "none",
        ),
      );

      const navBoxes = [];
      for (const control of [backButton(page), skipButton(page)]) {
        if (await control.isVisible()) navBoxes.push((await control.boundingBox())!);
      }
      expect(navBoxes.length).toBeGreaterThan(0);

      const options = await answerOption(page).all();
      expect(options.length).toBeGreaterThan(0);

      for (const option of options) {
        const box = (await option.boundingBox())!;
        for (const nav of navBoxes) {
          const overlaps =
            box.x < nav.x + nav.width &&
            nav.x < box.x + box.width &&
            box.y < nav.y + nav.height &&
            nav.y < box.y + box.height;
          expect(
            overlaps,
            `option ${JSON.stringify(box)} overlaps nav ${JSON.stringify(nav)}`,
          ).toBe(false);
        }
      }
    });
  }
});

test.describe("narrow viewport", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("steps back through the funnel from the footer", async ({ page }) => {
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

  test("offers no way forward from the results steps", async ({ page }) => {
    await walkToRecommendations(page);

    // Nothing is playing here, and the way on is a card's own CTA, so the
    // forward control has nothing to do and says so.
    await expect(skipButton(page)).toBeHidden();
    await expect(nextButton(page)).toBeDisabled();

    // Back stays in the same place it occupies everywhere else. The footer is
    // fixed, so it holds over the scrolling cards rather than being scrolled
    // past — which is why the results steps used to need their own exemption.
    const backBox = await backButton(page).boundingBox();
    expect(backBox!.y).toBeGreaterThan(844 - 200);

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
  await expect(
    page.getByRole("link", { name: /Contact Us/i }).first(),
  ).toBeVisible({ timeout: 30_000 });

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
  await expect(
    page.getByRole("link", { name: /Contact Us/i }).first(),
  ).toBeVisible({ timeout: 45_000 });
  expect(await savedAnswerIds(page)).toContain("product-recommendations-step");
});

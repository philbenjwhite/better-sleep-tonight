import { test, expect, type Page } from "@playwright/test";

/**
 * Regression coverage for the mattress recommendation cards.
 *
 * Background: the recommendations step renders no avatar video, yet the whole
 * "question" view used to be gated behind avatar/video readiness. A video
 * failure earlier in the flow left `videoState` in an error state, which then
 * hid the recommendation cards on a step that never needed video, so some users
 * reached a blank screen where the mattresses should be. See the
 * `isNonVideoStep` gate in src/app/page.tsx.
 *
 * These tests walk the real funnel to the recommendations step and assert the
 * cards render, including the case where the pre-recommendations video fails.
 */

const AVATAR_VIDEO = /ashley-\d+\.mp4/i;
const PRE_RECS_VIDEO = /ashley-2\.mp4/i; // the segment that plays just before the cards

// Speed every video up so video steps finish quickly and the walk is fast and
// deterministic, regardless of the real segment durations.
async function speedUpVideos(page: Page) {
  await page.addInitScript(() => {
    const boost = (v: HTMLVideoElement) => {
      try {
        v.playbackRate = 16;
        v.muted = true;
      } catch {
        /* ignore */
      }
    };
    const apply = () =>
      document.querySelectorAll("video").forEach((v) => {
        const vid = v as HTMLVideoElement;
        boost(vid);
        // Nudge stalled autoplay so video steps reliably reach their end state.
        if (vid.paused && !vid.ended) vid.play().catch(() => {});
      });
    document.addEventListener("DOMContentLoaded", () => {
      apply();
      new MutationObserver(apply).observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
    document.addEventListener(
      "play",
      (e) => {
        if ((e.target as HTMLElement)?.tagName === "VIDEO")
          boost(e.target as HTMLVideoElement);
      },
      true,
    );
  });
}

const bookRestTestButton = (page: Page) =>
  page.getByRole("button", { name: /Book A Rest Test/i });

/**
 * Drive the funnel from the intro screen to the product recommendations step by
 * clicking whatever advances the current step: a video CTA, an answer option,
 * or stopping once the cards appear. Resilient to the exact step ordering.
 */
async function walkToRecommendations(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Get Better Sleep" }).click();

  const cta = page.locator('[class*="ctaButton"]');
  const option = page.locator('button[class*="answerOption"]');
  // Matches either CTA that can appear on the recommendations step, regardless
  // of which purchase-intent answer the walker happened to select.
  const recsCta = page.getByRole("button", { name: /Buy Now|Book A Rest Test/i });

  for (let i = 0; i < 60; i++) {
    if (await recsCta.first().isVisible().catch(() => false)) return;
    if (await cta.first().isVisible().catch(() => false)) {
      await cta.first().click().catch(() => {});
    } else if (await option.first().isVisible().catch(() => false)) {
      await option.first().click().catch(() => {});
    }
    await page.waitForTimeout(600);
  }
  throw new Error("Never reached the product recommendations step");
}

/**
 * Inject saved-progress answers into localStorage so the recovery modal appears
 * on load, letting us jump straight to the recommendations step with a specific
 * purchase intent — no funnel walk required.
 */
async function goToRecommendationsWithIntent(
  page: Page,
  purchaseIntent: "ready-to-buy" | "not-ready-to-buy",
) {
  const progress = {
    flowId: "default",
    currentStepIndex: 9,
    answers: [
      {
        stepId: "q6-sleep-alone-or-partner",
        questionText: "Do you typically sleep alone or with a partner?",
        value: "alone",
        label: "Just me",
        timestamp: new Date().toISOString(),
      },
      {
        stepId: "q7-purchase-intent",
        questionText: "Are you ready to buy a mattress and sleep better tonight?",
        value: purchaseIntent,
        label:
          purchaseIntent === "ready-to-buy"
            ? "Yes, I'm ready to buy"
            : "No, I'd like to try out a few options",
        timestamp: new Date().toISOString(),
      },
    ],
    lastUpdated: new Date().toISOString(),
  };

  await page.addInitScript((data) => {
    localStorage.setItem("bettersleep_progress", JSON.stringify(data));
  }, progress);

  await page.goto("/");
  await page
    .getByRole("button", { name: /Continue where I left off/i })
    .click();
  await page.locator('[class*="productName"]').first().waitFor({ timeout: 15_000 });
}

test.beforeEach(async ({ page }) => {
  await speedUpVideos(page);
});

test("shows the mattress recommendation cards at the end of the funnel", async ({
  page,
}) => {
  await walkToRecommendations(page);

  // Cards rendered — at least two product names visible.
  const cards = page.locator('[class*="productName"]');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThanOrEqual(2);

  // Each card has a primary CTA (Buy Now or Book A Rest Test depending on the
  // answer the funnel walk selected for purchase intent).
  const cardCtas = page.getByRole("button", { name: /Buy Now|Book A Rest Test/i });
  await expect(cardCtas.first()).toBeVisible();
  expect(await cardCtas.count()).toBeGreaterThanOrEqual(2);
});

test("still shows the cards when the pre-recommendations video fails to load", async ({
  page,
}) => {
  // Let the earlier avatar videos play (so the funnel is navigable) but fail the
  // segment that plays right before the recommendations step. This leaves the
  // video state in an error condition on arrival at the cards, the exact
  // situation that previously rendered a blank screen for some users.
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (AVATAR_VIDEO.test(url) && PRE_RECS_VIDEO.test(url)) return route.abort();
    return route.continue();
  });

  await walkToRecommendations(page);

  // Cards should still render even with the video error.
  await expect(page.locator('[class*="productName"]').first()).toBeVisible();
});

test("ready-to-buy: shows Buy Now buttons, promo badge, and no Book A Rest Test", async ({
  page,
}) => {
  await goToRecommendationsWithIntent(page, "ready-to-buy");

  // Every card should have a Buy Now CTA — expect at least two cards.
  const buyButtons = page.getByRole("button", { name: /Buy Now/i });
  await expect(buyButtons.first()).toBeVisible();
  expect(await buyButtons.count()).toBeGreaterThanOrEqual(2);

  // Discount promo badge should be present on at least one card.
  await expect(page.getByText(/\$200 discount/i).first()).toBeVisible();

  // No "Book A Rest Test" should appear anywhere — not as a card button or a
  // bottom bar.
  await expect(bookRestTestButton(page)).not.toBeVisible();
});

test("not-ready-to-buy: shows Book A Rest Test buttons and no Buy Now", async ({
  page,
}) => {
  await goToRecommendationsWithIntent(page, "not-ready-to-buy");

  // Every card should have a Book A Rest Test CTA — expect at least two.
  const bookButtons = page.getByRole("button", { name: /Book A Rest Test/i });
  await expect(bookButtons.first()).toBeVisible();
  expect(await bookButtons.count()).toBeGreaterThanOrEqual(2);

  // No Buy Now should appear.
  await expect(page.getByRole("button", { name: /Buy Now/i })).not.toBeVisible();
});

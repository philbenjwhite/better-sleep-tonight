import { test, expect } from "@playwright/test";
import {
  bookRestTestButton,
  speedUpVideos,
  stubExternalServices,
  walkToRecommendations,
} from "./helpers";

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
 * Since July 2026 the funnel targets in-store rest tests only: there is no
 * purchase-intent question and no Buy Now path, so every card carries the same
 * Book a Rest Test CTA and the $300 offer flash.
 */

const AVATAR_VIDEO = /ashley-\d+\.mp4/i;
const PRE_RECS_VIDEO = /ashley-2\.mp4/i; // the segment that plays just before the cards

test.beforeEach(async ({ page }) => {
  await stubExternalServices(page);
  await speedUpVideos(page);
});

/**
 * The one step with more than a viewport of content has to move under a finger.
 *
 * It once did not: overscroll-behavior was set on the body as well as the
 * document element to stop the page rubber-banding, and the body is a scroll
 * container here — overflow-x: hidden makes its overflow-y compute to auto — so
 * refusing overscroll on it stopped touch scrolling outright. The cards were
 * frozen on a phone while every wheel-driven test still passed, which is why
 * this one drives a real touch gesture through the compositor.
 */
test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 664 }, hasTouch: true, isMobile: true });

  test("scrolls the cards under a finger", async ({ page, context }) => {
    await walkToRecommendations(page);
    await expect(bookRestTestButton(page).first()).toBeVisible({
      timeout: 30_000,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight > window.innerHeight,
      ),
    ).toBe(true);

    const session = await context.newCDPSession(page);
    await session.send("Input.synthesizeScrollGesture", {
      x: 195,
      y: 400,
      xDistance: 0,
      yDistance: -400,
      gestureSourceType: "touch",
      speed: 2000,
    });

    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 })
      .toBeGreaterThan(100);
  });
});

test("shows the mattress recommendation cards at the end of the funnel", async ({
  page,
}) => {
  await walkToRecommendations(page);

  // Cards rendered — at least two product names visible.
  const cards = page.locator('[class*="productName"]');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThanOrEqual(2);

  // Every card carries the same Book a Rest Test CTA.
  const cardCtas = bookRestTestButton(page);
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
  // Scoped to the video path on purpose: a "**/*" handler routes every asset,
  // page chunk and HMR request through the test process, which slows the shared
  // dev server enough to time out the funnel walk.
  await page.route("**/videos/**", (route) => {
    const url = route.request().url();
    if (AVATAR_VIDEO.test(url) && PRE_RECS_VIDEO.test(url)) return route.abort();
    return route.continue();
  });

  await walkToRecommendations(page);

  // Cards should still render even with the video error.
  await expect(page.locator('[class*="productName"]').first()).toBeVisible();
});

test("no Buy Now path remains anywhere on the results page", async ({
  page,
}) => {
  await walkToRecommendations(page);

  await expect(page.getByRole("button", { name: /Buy Now/i })).toHaveCount(0);
  await expect(page.getByText(/\$200 discount/i)).toHaveCount(0);

  // No outbound purchase links either.
  await expect(page.locator('a[href*="ashleyhomestore.ca"]')).toHaveCount(0);
});

test("every card shows the $300 offer flash above the CTA", async ({ page }) => {
  await walkToRecommendations(page);

  // Count cards by their CTA — the productName class also matches the
  // productNameLight spans used for the bracketed part of a product name.
  const cardCount = await bookRestTestButton(page).count();
  const flashes = page.getByText(/Get \$300 off/i);

  await expect(flashes.first()).toBeVisible();
  expect(await flashes.count()).toBe(cardCount);
});

import { test, expect } from "@playwright/test";
import {
  bookRestTestButton,
  setVideoRateNow,
  speedUpVideos,
  stubExternalServices,
  walkToBookingStep,
  walkToRecommendations,
} from "./helpers";

/**
 * The hand-off from one avatar segment to the next.
 *
 * Two separate things used to blank the player at that moment, and both showed
 * as one black flash. Every recording delivered so far ends on three black
 * frames baked into the file, and playing a segment out to its end put them on
 * screen. Then swapping the source empties the element, and the browser paints
 * that gap black until the next segment decodes a frame.
 *
 * Measured on the booking step's hand-off to the idle loop before the fix, the
 * darkest frame in the avatar's area averaged 30 of 255 against 163 either side
 * of it. Neither cause is observable from the DOM, so each is asserted through
 * the mechanism that addresses it.
 */

test.beforeEach(async ({ page }) => {
  await stubExternalServices(page);
  await speedUpVideos(page);
});

test("stops a segment short of the black frames it ends on", async ({
  page,
}) => {
  await walkToRecommendations(page);

  // Record where the closing segment actually stops. The state it leaves behind
  // is gone within a frame or two of the swap, so catch it as it happens rather
  // than polling for it afterwards.
  await page.evaluate(() => {
    const video = document.querySelector("video");
    if (!video) return;
    video.addEventListener("pause", () => {
      (window as unknown as Record<string, unknown>).__stoppedAt = {
        time: video.currentTime,
        duration: video.duration,
      };
    });
  });

  // Real time for the segment under test. The margin is measured in the media's
  // own clock, and the walk's 16x fast-forward covers four seconds of it between
  // timeupdates — enough to step over the margin, the black tail and the end of
  // the video in a single tick, which is a fact about the harness rather than
  // about the funnel.
  await walkToBookingStep(page, {
    beforeBookRestTest: () => setVideoRateNow(page, 1),
  });
  await expect(page.locator('input[type="email"]')).toBeVisible({
    timeout: 30_000,
  });

  const stopped = await page.waitForFunction(
    () => (window as unknown as Record<string, unknown>).__stoppedAt,
    undefined,
    { timeout: 30_000 },
  );
  const { time, duration } = (await stopped.jsonValue()) as {
    time: number;
    duration: number;
  };

  // The tail is 0.1s. Clearing it by at least another 0.05s is what the 0.4s
  // margin buys, once timeupdate's jitter is spent.
  expect(duration).toBeGreaterThan(0);
  expect(time).toBeLessThanOrEqual(duration - 0.15);
});

test("holds the outgoing frame while the next segment loads", async ({
  page,
}) => {
  // Stall the idle clip so the gap the still covers is long enough to assert
  // on. It is milliseconds on a warm cache and a good deal longer on a phone.
  await page.route("**/ashley-idle-crf28.mp4", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    await route.continue();
  });

  await walkToRecommendations(page);
  await walkToBookingStep(page);
  await expect(bookRestTestButton(page).first()).toBeHidden({
    timeout: 30_000,
  });

  const heldFrame = page.locator("canvas[data-held-frame]");
  await expect(heldFrame).toHaveAttribute("data-held-frame", "visible", {
    timeout: 30_000,
  });

  // ...and it carries a picture rather than the blank it is covering for.
  const isBlank = await heldFrame.evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d");
    if (!context) return true;
    const { data } = context.getImageData(
      Math.floor(canvas.width / 2),
      Math.floor(canvas.height / 3),
      1,
      1,
    );
    return data[0] + data[1] + data[2] < 30;
  });
  expect(isBlank).toBe(false);

  // Once the segment it was covering for arrives, the still gets out of the way.
  await expect(heldFrame).toHaveAttribute("data-held-frame", "hidden", {
    timeout: 30_000,
  });
});

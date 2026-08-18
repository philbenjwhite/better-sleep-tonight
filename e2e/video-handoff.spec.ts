import { test, expect } from "@playwright/test";
import {
  bookRestTestButton,
  setVideoRateNow,
  speedUpVideos,
  stubExternalServices,
  walkToBookingStep,
  walkToRecommendations,
  walkToSummaryVideo,
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

/**
 * The clock the hand-off reports for the incoming segment.
 *
 * Everything timed off a segment reads currentTime from the context: the
 * subtitle bubble picks its cue from it, and the manual CTA appears once that
 * cue is the closing one. The context only learns a position from timeupdate,
 * so between the src assignment and the new segment's first event there is a
 * window where the value on offer belongs to the segment that just finished.
 * The intro runs 22.6s and the summary's last cue opens at 12.7s, so that stale
 * value sits past every cue in the file: the summary opened on its closing line
 * and offered "See My Results" while Ashley was still on her first sentence.
 *
 * Chromium hides it by resetting the position as the src is assigned and firing
 * an immediate timeupdate, so this reproduces only on a phone unless that first
 * event is held back the way mobile Safari holds it back until the media has
 * data. That is what the init script below does, scoped to the one segment.
 */
test("opens the incoming segment on its first cue, not the outgoing one's last", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const proto = HTMLMediaElement.prototype;
    const src = Object.getOwnPropertyDescriptor(proto, "src")!;
    Object.defineProperty(proto, "src", {
      configurable: true,
      get() {
        return (src.get as () => string).call(this);
      },
      set(value: string) {
        if (value.includes("ashley-2.mp4")) {
          (this as { __quietUntil?: number }).__quietUntil = Date.now() + 2500;
        }
        (src.set as (v: string) => void).call(this, value);
      },
    });

    // React attaches media events to the element itself rather than delegating
    // them, so wrapping addEventListener is enough to hold them back.
    const add = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions,
    ) {
      if (type === "timeupdate" && this instanceof HTMLMediaElement) {
        const element = this as HTMLMediaElement & { __quietUntil?: number };
        return add.call(
          this,
          type,
          function (this: unknown, event: Event) {
            if (element.__quietUntil && Date.now() < element.__quietUntil) {
              return;
            }
            return (listener as EventListener).call(this, event);
          },
          options,
        );
      }
      return add.call(this, type, listener, options);
    };
  });

  await walkToSummaryVideo(page);

  // Sample across the swap: the window being guarded is a few hundred
  // milliseconds wide, so a single check after the fact would miss it.
  const lines: string[] = [];
  let ctaWhileSpeaking = false;

  for (let i = 0; i < 30; i++) {
    const frame = await page.evaluate(() => {
      const video = document.querySelector("video") as HTMLVideoElement | null;
      const bubble = document.querySelector('p[class*="text"]');
      const cta = document.querySelector('[class*="ctaButton"]');
      return {
        segment: video?.currentSrc?.split("/").pop() ?? null,
        time: video ? video.currentTime : null,
        line: bubble?.textContent?.replace(/\s+/g, " ").trim() ?? "",
        cta: !!cta && (cta as HTMLElement).offsetParent !== null,
      };
    });

    if (frame.segment === "ashley-2.mp4") {
      if (frame.line) lines.push(frame.line);
      // The closing cue opens at 12.7s; a CTA before it is one the stale clock
      // brought forward.
      if (frame.cta && (frame.time ?? Infinity) < 12) ctaWhileSpeaking = true;
    }
    await page.waitForTimeout(100);
  }

  expect(lines[0]).toContain("Did you know");
  expect(ctaWhileSpeaking).toBe(false);
});

import { test, expect } from "@playwright/test";
import {
  speedUpVideos,
  stubExternalServices,
  walkToBookingStep,
  walkToRecommendations,
} from "./helpers";

/**
 * Regression coverage for the final booking step.
 *
 * Background: the whole "question" view used to be gated on the avatar video
 * being "ready", where ready meant only "not in an error state". Two things
 * then combined into a blank page:
 *
 *  1. VideoAvatarContext treated a rejected play() as a fatal media error, so
 *     an autoplay refusal — which iOS Safari raises for every unmuted
 *     off-gesture play() — looked identical to a corrupt file.
 *  2. The booking step is exempt from nothing and nothing advances past it, so
 *     the resulting empty render was terminal: no avatar, no speech bubble, no
 *     email field, no CTA. Just the header and footer.
 *
 * The step's content does not depend on video, so these assert it renders no
 * matter what the video does. See the render gate in src/app/page.tsx and
 * VideoState.BLOCKED in VideoAvatarContext.
 */

const BOOKING_VIDEO = /ashley-5\.mp4/i;

test.beforeEach(async ({ page }) => {
  await stubExternalServices(page);
  await speedUpVideos(page);
});

/**
 * What makes the closing step actionable, now that the address is taken a step
 * earlier and this one only confirms.
 */
async function expectBookingStepUsable(page: import("@playwright/test").Page) {
  await expect(
    page.getByRole("link", { name: /Contact Us/i }).first(),
  ).toBeVisible({ timeout: 30_000 });

  // And nothing asks for the address a second time.
  await expect(page.locator('input[type="email"]')).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Register Email/i }),
  ).toHaveCount(0);
}

test("reaches the closing step with Contact Us and no second ask", async ({
  page,
}) => {
  await walkToRecommendations(page);
  await walkToBookingStep(page);
  await expectBookingStepUsable(page);
});

/**
 * The closing line has to survive the hand-off to the idle loop.
 *
 * It did not. Paragraphs are the cue texts while a segment plays and the split
 * script once it stops, and the parent withdraws the cue track when the avatar
 * switches to its idle clip. The two lists were different lengths, because the
 * splitter counted an apostrophe as a quote mark and merged the paragraph after
 * every contraction, so the live index pointed past the end of the shorter list
 * and the bubble rendered as an empty box over the avatar.
 */
test("keeps the closing line up after the avatar goes idle", async ({
  page,
}) => {
  await walkToRecommendations(page);
  await walkToBookingStep(page);

  const closing = page.getByText(/Thanks for visiting Better Sleep Tonight/i);
  await expect(closing).toBeVisible({ timeout: 45_000 });

  // Past the end of the segment, which is when the idle clip takes over.
  await page.waitForTimeout(4_000);
  await expect(closing).toBeVisible();
});

/**
 * The promise of the follow-up email moved off a card and into what Ashley
 * says, so the flow script and the caption file carry it now. Both are edited
 * by hand, which is why it is worth pinning.
 */
test("closes on the promise of the follow-up email", async ({ page }) => {
  await walkToRecommendations(page);
  await walkToBookingStep(page);

  await expect(
    page.getByText(/Thanks for visiting Better Sleep Tonight/i),
  ).toBeVisible({ timeout: 45_000 });

  // Nothing offers to book on the spot, and the card that used to ask for an
  // address a second time is gone with it.
  await expect(page.getByText(/before you buy/i)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Schedule Appointment/i }),
  ).toHaveCount(0);
  await expect(page.getByText(/Leave your email/i)).toHaveCount(0);
});

/** The avatar's playback state machine, surfaced by VideoAvatar for tests. */
const videoState = (page: import("@playwright/test").Page) =>
  page.locator("[data-video-state]").first();

test("still shows the booking CTA when the final video fails to load", async ({
  page,
}) => {
  // Fail only the closing segment, so the funnel stays navigable and the video
  // state is in error exactly on arrival at the last step. Scoped to the one
  // video path: a broad handler routes every asset through the test process and
  // starves the shared dev server.
  await page.route("**/videos/**", (route) =>
    BOOKING_VIDEO.test(route.request().url())
      ? route.abort()
      : route.continue(),
  );

  await walkToRecommendations(page);
  await walkToBookingStep(page);

  // The regression: this state used to hide the entire step behind the render
  // gate. The failure is still reported honestly, the step just survives it.
  await expect(videoState(page)).toHaveAttribute("data-video-state", "ERROR");
  await expectBookingStepUsable(page);
});

test("treats a refused final segment as blocked, not as a broken video", async ({
  page,
}) => {
  // Refuse playback of the closing segment the way an autoplay policy does.
  // Scoped to that one segment so the rest of the funnel stays walkable, and
  // deliberately independent of the muted flag, which speedUpVideos sets on
  // every element — keying off it would make this assert nothing.
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      if (/ashley-5\.mp4/i.test(this.currentSrc || this.src || "")) {
        return Promise.reject(
          new DOMException("Autoplay refused", "NotAllowedError"),
        );
      }
      return play.apply(this, arguments as never);
    };
  });

  await walkToRecommendations(page);
  await walkToBookingStep(page);

  // The step stays fully actionable.
  await expectBookingStepUsable(page);

  // The point of the fix: a refusal must never be classified as a broken file,
  // because ERROR is what the render gate keyed off. Whether the segment ends
  // up BLOCKED (refused outright) or recovers by playing muted, ERROR is wrong.
  await expect(videoState(page)).not.toHaveAttribute(
    "data-video-state",
    "ERROR",
  );
  await expect(page.getByText(/Video failed to load/i)).toHaveCount(0);
});

/**
 * The step has to stay readable on a short phone.
 *
 * questionBlockWrapper is a fixed, full-viewport flex box that centres what the
 * step puts in it, which suits a question because a question always fits. The
 * card here need not: when it stands taller than the viewport, centring splits
 * the overflow evenly and puts its heading behind the logo.
 *
 * The keyboard that used to make this acute is gone with the email field, but
 * the geometry has not changed, and 483px is still a real measurement rather
 * than an arbitrary small viewport: it is what an iPhone reporting 755 at rest
 * reports with a keyboard up.
 */
test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 755 }, isMobile: true, hasTouch: true });

  test("keeps the card clear of the header and scrollable at keyboard height", async ({
    page,
  }) => {
    await walkToRecommendations(page);
    await walkToBookingStep(page);
    await page
      .getByRole("link", { name: /Contact Us/i })
      .first()
      .waitFor({ timeout: 45_000 });

    const measure = () =>
      page.evaluate(() => {
        const header = document.querySelector("header");
        const heading = [...document.querySelectorAll("*")].find(
          (el) =>
            el.children.length === 0 &&
            /^Questions\? We're here to help$/i.test(
              el.textContent?.trim() ?? "",
            ),
        );
        return {
          headerBottom: header?.getBoundingClientRect().bottom ?? 0,
          headingTop: heading?.getBoundingClientRect().top ?? -1,
          overflows:
            document.documentElement.scrollHeight > window.innerHeight,
        };
      });

    for (const height of [755, 483]) {
      await page.setViewportSize({ width: 390, height });
      await page.waitForTimeout(500);
      const { headerBottom, headingTop, overflows } = await measure();

      expect(headingTop, `heading must render at ${height}px`).toBeGreaterThan(
        -1,
      );
      expect(
        headingTop,
        `heading must clear the header at ${height}px`,
      ).toBeGreaterThan(headerBottom);

      // Anything that does not fit has to be reachable rather than clipped.
      if (overflows) {
        await page.evaluate(() => window.scrollTo(0, 200));
        await page.waitForTimeout(300);
        expect(
          await page.evaluate(() => window.scrollY),
          `page must scroll at ${height}px`,
        ).toBeGreaterThan(0);
        await page.evaluate(() => window.scrollTo(0, 0));
      }
    }

    await expect(
      page.getByRole("link", { name: /Contact Us/i }).first(),
    ).toBeVisible();
  });
});

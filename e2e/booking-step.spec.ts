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

/** The email gate and CTAs that make the final step actionable. */
async function expectBookingStepUsable(page: import("@playwright/test").Page) {
  await expect(page.locator('input[type="email"]')).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    page.getByRole("button", { name: /Register Email/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Contact Us/i }).first(),
  ).toBeVisible();
}

test("reaches the booking step with its email gate and CTAs", async ({
  page,
}) => {
  await walkToRecommendations(page);
  await walkToBookingStep(page);
  await expectBookingStepUsable(page);
});

/**
 * The closing steps promise a follow-up email rather than booking on the spot,
 * so the card copy is the change rather than decoration around it. Worth
 * pinning: the wording lives in the flow JSON and the caption file, both of
 * which are edited by hand.
 */
test("the booking card is framed around the follow-up email", async ({
  page,
}) => {
  await walkToRecommendations(page);
  await walkToBookingStep(page);

  await expect(
    page.getByText(/we'll send you a link to book a rest test/i),
  ).toBeVisible({ timeout: 30_000 });

  // Nothing should still offer to book on the spot.
  await expect(page.getByText(/before you buy/i)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Schedule Appointment/i }),
  ).toHaveCount(0);
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

import { test, expect } from "@playwright/test";
import { stubExternalServices } from "./helpers";

/**
 * Coverage for the thank-you page's closing message.
 *
 * Worth pinning because of where the words live: the page has no copy of its
 * own beyond the heading. Its message is built from the cues in
 * ashley-thank-you.vtt, so that file is both the caption track and the page
 * copy, and the message renders only when at least one cue parses. A VTT that
 * 404s or fails to parse leaves the page with a heading and a video and nothing
 * else, which is a silent failure rather than a visible one.
 */

test.beforeEach(async ({ page }) => {
  await stubExternalServices(page);
});

test("closes on the follow-up email message", async ({ page }) => {
  await page.goto("/thank-you");

  await expect(
    page.getByRole("heading", { name: /You're All Set/i }),
  ).toBeVisible({ timeout: 30_000 });

  // The message reveals progressively, timed to the video when it plays and
  // untimed when autoplay is refused, so match on the copy rather than a
  // single settled string.
  await expect(
    page.getByText(/watch out for that email to book your rest test/i).first(),
  ).toBeVisible({ timeout: 30_000 });

  // The old framing promised a sleep report to carry into a store.
  await expect(page.getByText(/personalized sleep report/i)).toHaveCount(0);
});

/**
 * The page used to rewind half a second and freeze when the closing segment
 * ended, which parked on whatever the recording's final moment happened to be.
 * It now hands off to the same looping idle clip the booking step uses. The
 * closing line has to survive the swap: the idle loop restarts the clock on
 * every pass, and the bubble is driven off that clock.
 */
test("hands off to the looping idle clip and keeps the closing line up", async ({
  page,
}) => {
  await page.goto("/thank-you");

  const video = page.locator("video").first();
  await expect(video).toHaveAttribute("src", /ashley-thank-you\.mp4/, {
    timeout: 30_000,
  });

  // Run the closing segment out rather than waiting ~8s for it.
  await page.evaluate(() => {
    const v = document.querySelector("video");
    if (v) v.playbackRate = 16;
  });

  await expect(video).toHaveAttribute("src", /ashley-idle-crf28\.mp4/, {
    timeout: 30_000,
  });
  await expect(video).toHaveAttribute("loop", "");

  // The sign-off stays put instead of snapping back to the first line.
  await expect(
    page.getByText(/thanks for visiting better sleep tonight/i).first(),
  ).toBeVisible();
});

test("renders the message from the caption file, not hardcoded copy", async ({
  page,
}) => {
  // If the cues never arrive the page has nothing to say. Asserting the empty
  // case documents it: the message is gated on cues parsing, so this is the
  // shape of the failure if the VTT is ever moved, renamed, or malformed.
  await page.route("**/ashley-thank-you.vtt", (route) =>
    route.fulfill({ status: 404, body: "" }),
  );

  await page.goto("/thank-you");

  await expect(
    page.getByRole("heading", { name: /You're All Set/i }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByText(/watch out for that email/i),
  ).toHaveCount(0);
});

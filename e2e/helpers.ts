import { expect, type Page } from "@playwright/test";

/**
 * Shared helpers for the funnel end-to-end specs.
 */

/** Matches the CTA on the product recommendations cards. */
export const bookRestTestButton = (page: Page) =>
  page.getByRole("button", { name: /Book A Rest Test/i });

/** The skip control rendered over every avatar video. */
export const skipButton = (page: Page) =>
  page.getByRole("button", { name: /Skip video/i });

/** The heading of the question currently on screen. */
export const questionHeading = (page: Page) =>
  page.locator('[class*="questionText"]').first();

/** An answer option on the current question. */
export const answerOption = (page: Page) =>
  page.locator('button[class*="answerOption"]');

/** The manual CTA that some video steps pause on ("Let's Go", "See My Results"). */
export const videoCta = (page: Page) => page.locator('[class*="ctaButton"]');

/**
 * Force a playback rate on every avatar video.
 *
 * Deliberately does NOT nudge paused videos back into playing. The app pauses
 * videos on purpose in two places — the manual-CTA steps hold on the last frame,
 * and skip() pauses before forcing the ENDED state — and a helper that calls
 * play() on anything paused fights both, leaving the funnel stuck on the video it
 * was told to leave. Autoplay does not need the nudge: the Playwright config
 * launches Chromium with --autoplay-policy=no-user-gesture-required.
 */
async function setVideoRate(page: Page, rate: number) {
  await page.addInitScript((r) => {
    const apply = (v: HTMLVideoElement) => {
      try {
        v.playbackRate = r;
        v.muted = true;
      } catch {
        /* a detached or not-yet-ready element will be caught by a later event */
      }
    };
    const applyAll = () =>
      document
        .querySelectorAll("video")
        .forEach((v) => apply(v as HTMLVideoElement));

    document.addEventListener("DOMContentLoaded", () => {
      applyAll();
      // The avatar swaps src per step rather than remounting, so also re-apply on
      // DOM changes to catch newly mounted players.
      new MutationObserver(applyAll).observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
    // Chromium resets playbackRate when src changes, so re-apply on every play.
    document.addEventListener(
      "play",
      (e) => {
        const t = e.target as HTMLElement | null;
        if (t?.tagName === "VIDEO") apply(t as HTMLVideoElement);
      },
      true,
    );
  }, rate);
}

/**
 * Speed every video up so video steps finish quickly and the walk is fast and
 * deterministic, regardless of the real segment durations.
 */
export async function speedUpVideos(page: Page) {
  await setVideoRate(page, 16);
}

/**
 * Let videos play at their real speed. Used by the skip specs, where a
 * fast-forwarded video would reach its end before the skip control could be
 * clicked, making the assertion meaningless. Real time is enough headroom: the
 * shortest avatar segment runs well over ten seconds.
 */
export async function keepVideosSlow(page: Page) {
  await setVideoRate(page, 1);
}

/**
 * Stub the two live third-party dependencies the funnel touches.
 *
 * EPSILON_OUID is set in .env, so an unstubbed run POSTs a real record to the
 * client's PeopleCloud list on every walk that reaches the email submit, and
 * every store search burns Mapbox geocoding quota against the same postal code.
 * Beyond the pollution, both are network round trips on the critical path, which
 * is what makes an unstubbed suite slow and erratic.
 */
export async function stubExternalServices(page: Page) {
  await page.route("**/api.mapbox.com/geocoding/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      // Burlington, ON — matches the L7M FSA the specs search for.
      body: JSON.stringify({
        features: [
          { center: [-79.76, 43.39], place_name: "L7M 1A1, Burlington, Ontario, Canada" },
        ],
      }),
    }),
  );

  await page.route("**/api/epsilon/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, stubbed: true }),
    }),
  );
}

/** Enter the funnel from the intro screen. */
export async function startFunnel(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Get Better Sleep" }).click();
}

/**
 * Answer every question, one option each, until the recommendation cards appear.
 * Returns the distinct question headings that were answered.
 *
 * Counts by heading, and waits for the heading to change after each answer,
 * rather than clicking on a fixed poll. handleAnswerSelect holds for 1000ms
 * before it advances, and the options stay mounted for that whole pause, so a
 * blind poll-and-click loop clicks the same question twice. That schedules two
 * advances and the funnel jumps a step — which looks exactly like a product bug
 * (recommendations never shown) but is purely the walk's fault.
 *
 * With `skipVideos`, dismiss every avatar video via its skip control instead of
 * waiting it out or clicking its manual CTA.
 */
export async function answerAllQuestions(
  page: Page,
  { skipVideos = false }: { skipVideos?: boolean } = {},
): Promise<string[]> {
  const seen: string[] = [];

  for (let i = 0; i < 80; i++) {
    if (await bookRestTestButton(page).first().isVisible().catch(() => false)) {
      break;
    }

    // Short explicit timeout: video steps have no question heading at all, and the
    // default 30s implicit wait would burn the whole test budget on each one.
    const heading = await questionHeading(page)
      .textContent({ timeout: 1_000 })
      .catch(() => null);
    const onNewQuestion =
      heading != null &&
      heading.trim() !== "" &&
      heading.trim() !== seen[seen.length - 1];

    if (onNewQuestion && (await answerOption(page).first().isVisible().catch(() => false))) {
      const current = heading!.trim();
      await answerOption(page).first().click().catch(() => {});
      seen.push(current);
      // Wait out the avatar response so the next poll sees the next question,
      // not the one just answered.
      await page
        .waitForFunction(
          (prev) => {
            const el = document.querySelector('[class*="questionText"]');
            const text = el?.textContent?.trim();
            return !text || text !== prev;
          },
          current,
          { timeout: 30_000 },
        )
        .catch(() => {});
      continue;
    }

    if (skipVideos && (await skipButton(page).isVisible().catch(() => false))) {
      await skipButton(page).click().catch(() => {});
      // Let the skip settle into ENDED and advance before polling again, so we
      // do not click a second time on the video we already dismissed.
      await skipButton(page)
        .waitFor({ state: "hidden", timeout: 15_000 })
        .catch(() => {});
      continue;
    }

    if (await videoCta(page).first().isVisible().catch(() => false)) {
      await videoCta(page).first().click().catch(() => {});
    }
    await page.waitForTimeout(400);
  }

  return seen;
}

/**
 * Drive the funnel from the intro screen to the product recommendations step.
 */
export async function walkToRecommendations(page: Page) {
  await startFunnel(page);
  await answerAllQuestions(page);
  await expect(bookRestTestButton(page).first()).toBeVisible({
    timeout: 45_000,
  });
}

/**
 * Continue past the recommendations cards through to the final booking step:
 * Book A Rest Test, a post-selection video, the postal code, then picking the
 * first store in the list.
 */
export async function walkToBookingStep(page: Page) {
  await bookRestTestButton(page).first().click();

  // Postal code capture (a video step plays in between)
  const zipInput = page.locator("#postal-code");
  await zipInput.waitFor({ timeout: 45_000 });
  await zipInput.fill("L7M1A1");
  await page.getByRole("button", { name: /^Continue$/i }).first().click();

  // Store locations — select the first store in the list
  const selectButton = page.getByRole("button", { name: /^Select$/ });
  await selectButton.first().waitFor({ timeout: 45_000 });
  await selectButton.first().click();
}

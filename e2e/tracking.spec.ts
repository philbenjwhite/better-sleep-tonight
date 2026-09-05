import { test, expect, type Page } from "@playwright/test";
import {
  bookRestTestButton,
  speedUpVideos,
  stubExternalServices,
  walkToBookingStep,
  walkToRecommendations,
  WALKTHROUGH_EMAIL,
} from "./helpers";

/**
 * Tracking verification for the July 2026 UX changes: with a question removed
 * and video skipping added, confirm the step-by-step data still lands correctly
 * in GA4 (via the GTM dataLayer) and in the Epsilon submit payload.
 *
 * Note: `fireEvent` in src/lib/analytics/conversionTracking.ts only pushes to
 * `dataLayer` when NODE_ENV is production; in dev it console.logs the same
 * payload. These tests run against `next dev`, so they read the console lines.
 */

interface CapturedEvent {
  name: string;
  payload: Record<string, unknown>;
}

/** Collect the `[GA4 Event] <name> {...}` lines the dev build logs. */
function captureGa4Events(page: Page): CapturedEvent[] {
  const events: CapturedEvent[] = [];

  page.on("console", async (msg) => {
    const text = msg.text();
    const match = text.match(/^\[GA4 Event\]\s+(\S+)/);
    if (!match) return;

    let payload: Record<string, unknown> = {};
    try {
      const arg = msg.args()[1];
      if (arg) payload = (await arg.jsonValue()) as Record<string, unknown>;
    } catch {
      /* argument already collected — name alone is enough */
    }
    events.push({ name: match[1], payload });
  });

  return events;
}

const namesOf = (events: CapturedEvent[]) => events.map((e) => e.name);
const stepIdsOf = (events: CapturedEvent[]) =>
  events
    .filter((e) => e.name === "quiz_step")
    .map((e) => e.payload.step_id as string);

test.beforeEach(async ({ page }) => {
  await stubExternalServices(page);
  await speedUpVideos(page);
});

test("fires the expected GA4 events across the funnel", async ({ page }) => {
  const events = captureGa4Events(page);

  await walkToRecommendations(page);

  expect(namesOf(events)).toContain("quiz_start");

  // Each of the six remaining questions reports its own step.
  const stepIds = stepIdsOf(events);
  for (const stepId of [
    "q1-trouble-falling-asleep",
    "q2-sleep-position",
    "q3-motion-disturbance",
    "q4-aches-pains-frequency",
    "q5-aches-pains-type",
    "q6-sleep-alone-or-partner",
  ]) {
    expect(stepIds).toContain(stepId);
  }

  // The removed question must never report.
  expect(stepIds).not.toContain("q7-purchase-intent");

  // Video steps report whether the user skipped, so the client can see how many
  // people use the new control.
  const videoStepEvent = events.find(
    (e) => e.name === "quiz_step" && e.payload.step_id === "intro-video",
  );
  expect(videoStepEvent?.payload).toHaveProperty("skipped");
});

test("fires book_rest_test_intent and never buy_now_click", async ({ page }) => {
  const events = captureGa4Events(page);

  await walkToRecommendations(page);
  await bookRestTestButton(page).first().click();

  await expect
    .poll(() => namesOf(events))
    .toContain("book_rest_test_intent");

  // The Buy Now event is retired — it must not fire anywhere in the funnel.
  expect(namesOf(events)).not.toContain("buy_now_click");
  expect(namesOf(events)).not.toContain("learn_more_click");
});

test("Epsilon submit carries the six questions and no purchase intent", async ({
  page,
}) => {
  let submitBody: Record<string, unknown> | null = null;

  await page.route("**/api/epsilon/submit", async (route) => {
    submitBody = route.request().postDataJSON();
    // Don't hit the real Epsilon API from a test run.
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  // The submit fires from the summary step now, not the booking step, so the
  // walk to the recommendations is what triggers it: answering the email ask
  // is what buys the results.
  await walkToRecommendations(page);

  await expect.poll(() => submitBody, { timeout: 30_000 }).not.toBeNull();

  const body = submitBody as unknown as {
    email: string;
    answers: Array<{ stepId: string }>;
  };
  const answeredStepIds = body.answers.map((a) => a.stepId);

  expect(body.email).toBe(WALKTHROUGH_EMAIL);
  for (const stepId of [
    "q1-trouble-falling-asleep",
    "q2-sleep-position",
    "q3-motion-disturbance",
    "q4-aches-pains-frequency",
    "q5-aches-pains-type",
    "q6-sleep-alone-or-partner",
  ]) {
    expect(answeredStepIds).toContain(stepId);
  }
  expect(answeredStepIds).not.toContain("q7-purchase-intent");

  // The postal code and store location steps were removed, so neither reports
  // and no postal code or store rides along with the submission.
  expect(answeredStepIds).not.toContain("zipcode-capture-step");
  expect(answeredStepIds).not.toContain("store-locations-step");
  expect(submitBody).not.toHaveProperty("postalCode");
  expect(submitBody).not.toHaveProperty("selectedStore");
});

/**
 * The session key the submit is filed under, where crypto.randomUUID is absent.
 *
 * randomUUID is exposed only in a secure context. Over plain http it is
 * undefined rather than merely unavailable, so calling it threw and took the
 * whole funnel down on an unhandled runtime error before a single question was
 * asked. That is the state the app is in on a LAN address during testing, and a
 * deploy behind a proxy away from being the state real people meet.
 *
 * Removing it from the prototype is what a non-secure context does; the rest of
 * the Crypto interface, getRandomValues included, stays where it is.
 */
test("files the submit under a well-formed session key without crypto.randomUUID", async ({
  page,
}) => {
  const crashes: string[] = [];
  page.on("pageerror", (error) => crashes.push(error.message));

  await page.addInitScript(() => {
    delete (Crypto.prototype as { randomUUID?: unknown }).randomUUID;
    delete (crypto as { randomUUID?: unknown }).randomUUID;
  });

  let submitBody: Record<string, unknown> | null = null;
  await page.route("**/api/epsilon/submit", async (route) => {
    submitBody = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  // The submit fires from the summary step, which the walk answers on its way
  // through, so reaching the recommendations is enough to trigger it.
  await walkToRecommendations(page);

  await expect.poll(() => submitBody, { timeout: 30_000 }).not.toBeNull();

  const { sessionId } = submitBody as unknown as { sessionId: string };

  expect(sessionId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  expect(crashes).toEqual([]);
});

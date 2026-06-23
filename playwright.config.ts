import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config. The dev server is started automatically (reused if already up).
 * Tina is skipped: the flow content is read from the local JSON, so plain
 * `next dev` is enough and avoids the heavier `dev:tina` startup.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Let avatar videos autoplay without a user gesture so video steps
        // advance deterministically; the tests speed playback up to keep fast.
        launchOptions: {
          args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
        },
      },
    },
  ],
  webServer: {
    command: `next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

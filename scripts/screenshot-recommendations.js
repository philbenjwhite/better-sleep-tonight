#!/usr/bin/env node
/**
 * Screenshots the ProductRecommendations step for all 4 state combinations:
 *   - q6: "Just me" (2 mattresses) vs "Me and my partner" (3 mattresses)
 *   - q7: "Yes, I'm ready to buy" vs "No, I'd like to try out a few options"
 *
 * Strategy: inject answers via localStorage so the app's recovery modal
 * appears on load — click "Continue" to jump straight to step 9 with the
 * right state, no funnel walk needed.
 *
 * Also runs a second pass with the recommendation component files stashed so
 * you can compare prod vs local changes side-by-side.
 *
 * Assumes the dev server is running at http://localhost:3000.
 * Usage: node scripts/screenshot-recommendations.js
 *
 * Output:
 *   screenshots/with-changes/2-mattresses__ready-to-buy.png  (+__mobile.png)
 *   screenshots/with-changes/2-mattresses__not-ready-to-buy.png
 *   screenshots/with-changes/3-mattresses__ready-to-buy.png
 *   screenshots/with-changes/3-mattresses__not-ready-to-buy.png
 *   screenshots/prod/  (same set, taken after stashing component changes)
 */

const { chromium } = require("playwright");
const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ROOT = path.join(__dirname, "..");
const SCREENSHOTS_DIR = path.join(ROOT, "screenshots");
const VIEWPORT = { width: 1280, height: 900 };
const MOBILE_VIEWPORT = { width: 390, height: 844 };

// Only stash these two files — avoids the untracked .beads credential conflict
const STASH_FILES = [
  "src/components/ProductRecommendations/ProductRecommendations.tsx",
  "src/components/ProductRecommendations/ProductRecommendations.module.css",
];

const COMBINATIONS = [
  {
    q6Value: "alone",
    q6Label: "Just me",
    q7Value: "ready-to-buy",
    q7Label: "Yes, I'm ready to buy",
    filename: "alone__ready-to-buy",
  },
  {
    q6Value: "alone",
    q6Label: "Just me",
    q7Value: "not-ready-to-buy",
    q7Label: "No, I'd like to try out a few options",
    filename: "alone__not-ready-to-buy",
  },
  {
    q6Value: "with-partner",
    q6Label: "Me and my partner",
    q7Value: "ready-to-buy",
    q7Label: "Yes, I'm ready to buy",
    filename: "with-partner__ready-to-buy",
  },
  {
    q6Value: "with-partner",
    q6Label: "Me and my partner",
    q7Value: "not-ready-to-buy",
    q7Label: "No, I'd like to try out a few options",
    filename: "with-partner__not-ready-to-buy",
  },
];

function buildProgress(combo) {
  return {
    flowId: "default",
    currentStepIndex: 9, // productRecommendationsStep
    answers: [
      {
        stepId: "q6-sleep-alone-or-partner",
        questionText: "Do you typically sleep alone or with a partner?",
        value: combo.q6Value,
        label: combo.q6Label,
        timestamp: new Date().toISOString(),
      },
      {
        stepId: "q7-purchase-intent",
        questionText: "Are you ready to buy a mattress and sleep better tonight?",
        value: combo.q7Value,
        label: combo.q7Label,
        timestamp: new Date().toISOString(),
      },
    ],
    lastUpdated: new Date().toISOString(),
  };
}

async function screenshotCombo(browser, combo, outDir) {
  const progress = buildProgress(combo);

  const ctx = await browser.newContext({
    baseURL: BASE_URL,
    viewport: VIEWPORT,
  });
  const page = await ctx.newPage();

  // Inject progress into localStorage before page JS runs
  await page.addInitScript((data) => {
    localStorage.setItem("bettersleep_progress", JSON.stringify(data));
  }, progress);

  // Speed up and mute all videos
  await page.addInitScript(() => {
    const boost = (v) => {
      try { v.playbackRate = 16; v.muted = true; } catch {}
    };
    const apply = () =>
      document.querySelectorAll("video").forEach((v) => {
        boost(v);
        if (v.paused && !v.ended) v.play().catch(() => {});
      });
    document.addEventListener("DOMContentLoaded", () => {
      apply();
      new MutationObserver(apply).observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
    document.addEventListener("play", (e) => {
      if (e.target?.tagName === "VIDEO") boost(e.target);
    }, true);
  });

  await page.goto("/");

  // Recovery modal appears because localStorage has saved progress
  const continueBtn = page.getByRole("button", {
    name: /Continue where I left off/i,
  });
  await continueBtn.waitFor({ timeout: 15_000 });
  await continueBtn.click();

  // Wait for product cards to animate in
  const productName = page.locator('[class*="productName"]').first();
  await productName.waitFor({ timeout: 15_000 });
  await page.waitForTimeout(1500);

  await page.screenshot({
    path: path.join(outDir, `${combo.filename}.png`),
    fullPage: true,
  });

  // Mobile pass in the same context
  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(outDir, `${combo.filename}__mobile.png`),
    fullPage: true,
  });

  await ctx.close();
}

async function takeScreenshots(browser, label) {
  const outDir = path.join(SCREENSHOTS_DIR, label);
  fs.mkdirSync(outDir, { recursive: true });

  for (const combo of COMBINATIONS) {
    process.stdout.write(`  [${label}] ${combo.filename} ... `);
    try {
      await screenshotCombo(browser, combo, outDir);
      console.log("✓");
    } catch (err) {
      console.log(`✗  ${err.message}`);
    }
  }
}

function hasChanges() {
  const result = spawnSync(
    "git",
    ["diff", "--quiet", "--", ...STASH_FILES],
    { cwd: ROOT },
  );
  return result.status !== 0;
}

function stashChanges() {
  execSync(`git stash push -- ${STASH_FILES.join(" ")}`, {
    cwd: ROOT,
    stdio: "inherit",
  });
}

function unstashChanges() {
  execSync("git stash pop", { cwd: ROOT, stdio: "inherit" });
}

async function waitForHmr(ms = 4000) {
  process.stdout.write(`  Waiting ${ms / 1000}s for HMR ... `);
  await new Promise((r) => setTimeout(r, ms));
  console.log("ready");
}

async function main() {
  const changed = hasChanges();

  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"],
  });

  try {
    if (changed) {
      console.log("\n── Pass 1: with-changes ─────────────────────────────");
      await takeScreenshots(browser, "with-changes");

      console.log("\n── Stashing component changes for prod pass ─────────");
      stashChanges();
      await waitForHmr();

      console.log("\n── Pass 2: prod ──────────────────────────────────────");
      await takeScreenshots(browser, "prod");

      console.log("\n── Restoring changes ─────────────────────────────────");
      unstashChanges();
      await waitForHmr();
    } else {
      console.log("\n── No local changes — single prod pass ───────────────");
      await takeScreenshots(browser, "prod");
    }
  } finally {
    await browser.close();
  }

  console.log(`\n✓ Done. Screenshots saved to: ${SCREENSHOTS_DIR}`);
  console.log("  To compare: open screenshots/with-changes screenshots/prod");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

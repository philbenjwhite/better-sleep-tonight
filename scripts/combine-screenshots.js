#!/usr/bin/env node
/**
 * Combines prod/ and with-changes/ screenshots into side-by-side before/after images.
 * Output: screenshots/comparison/
 *
 * Usage: node scripts/combine-screenshots.js
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BEFORE_DIR = path.join(ROOT, "screenshots", "prod");
const AFTER_DIR = path.join(ROOT, "screenshots", "with-changes");
const OUT_DIR = path.join(ROOT, "screenshots", "comparison");
const LABEL_HEIGHT = 48;
const DIVIDER_WIDTH = 4;
const DIVIDER_COLOR = { r: 220, g: 80, b: 30, alpha: 1 }; // orange divider

async function makeLabel(text, width, height, bg = { r: 30, g: 30, b: 30 }) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="rgb(${bg.r},${bg.g},${bg.b})"/>
      <text
        x="${width / 2}" y="${height / 2 + 6}"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="18" font-weight="600" fill="white"
        text-anchor="middle"
      >${text}</text>
    </svg>`;
  return Buffer.from(svg);
}

async function combine(name) {
  const beforePath = path.join(BEFORE_DIR, name);
  const afterPath = path.join(AFTER_DIR, name);

  if (!fs.existsSync(beforePath) || !fs.existsSync(afterPath)) {
    console.log(`  skip ${name} (missing before or after)`);
    return;
  }

  const [beforeMeta, afterMeta] = await Promise.all([
    sharp(beforePath).metadata(),
    sharp(afterPath).metadata(),
  ]);

  const w = Math.max(beforeMeta.width, afterMeta.width);
  const h = Math.max(beforeMeta.height, afterMeta.height);
  const totalWidth = w * 2 + DIVIDER_WIDTH;
  const totalHeight = h + LABEL_HEIGHT;

  // Resize both to the same canvas size
  const [beforeBuf, afterBuf] = await Promise.all([
    sharp(beforePath).resize(w, h, { fit: "contain", background: { r: 245, g: 242, b: 237, alpha: 1 } }).toBuffer(),
    sharp(afterPath).resize(w, h, { fit: "contain", background: { r: 245, g: 242, b: 237, alpha: 1 } }).toBuffer(),
  ]);

  const [beforeLabel, afterLabel] = await Promise.all([
    makeLabel("BEFORE  (prod)", w, LABEL_HEIGHT, { r: 60, g: 60, b: 60 }),
    makeLabel("AFTER  (with changes)", w, LABEL_HEIGHT, { r: 180, g: 70, b: 20 }),
  ]);

  const divider = await sharp({
    create: { width: DIVIDER_WIDTH, height: totalHeight, channels: 4, background: DIVIDER_COLOR },
  }).png().toBuffer();

  const outPath = path.join(OUT_DIR, name);

  await sharp({
    create: { width: totalWidth, height: totalHeight, channels: 4, background: { r: 245, g: 242, b: 237, alpha: 1 } },
  })
    .composite([
      // Before column
      { input: beforeLabel, top: 0, left: 0 },
      { input: beforeBuf, top: LABEL_HEIGHT, left: 0 },
      // Divider
      { input: divider, top: 0, left: w },
      // After column
      { input: afterLabel, top: 0, left: w + DIVIDER_WIDTH },
      { input: afterBuf, top: LABEL_HEIGHT, left: w + DIVIDER_WIDTH },
    ])
    .png()
    .toFile(outPath);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs.readdirSync(BEFORE_DIR).filter((f) => f.endsWith(".png"));

  for (const file of files) {
    process.stdout.write(`  ${file} ... `);
    try {
      await combine(file);
      console.log("✓");
    } catch (err) {
      console.log(`✗  ${err.message}`);
    }
  }

  console.log(`\n✓ Comparisons saved to: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

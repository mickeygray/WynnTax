#!/usr/bin/env node
/**
 * Image Optimizer for Wynn Tax Solutions
 * =======================================
 * Compresses and resizes images in the public/images folder.
 *
 * SETUP (one time):
 *   cd C:\Users\admin\code\wynntax\client
 *   npm install sharp --save-dev
 *
 * USAGE:
 *   node optimize-images.js                          # Process ALL images
 *   node optimize-images.js hero-5.png               # Process one file
 *   node optimize-images.js hero-5.png logo.png      # Process specific files
 *
 * OPTIONS (edit below):
 *   MAX_WIDTH  — max pixel width (default 1920, good for hero images)
 *   QUALITY    — JPEG/WebP quality 1-100 (default 80)
 *   PNG_QUALITY — PNG compression level 0-9 (default 8, higher = smaller)
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// ─── Configuration ───────────────────────────────────────────
const IMAGES_DIR = path.join(__dirname, "public", "images");
const MAX_WIDTH = 1920;
const JPEG_QUALITY = 80;
const PNG_COMPRESSION = 8; // 0-9, higher = more compression
const WEBP_QUALITY = 80;
const SKIP_UNDER_KB = 10; // Skip files smaller than this (logos, icons)
// ─────────────────────────────────────────────────────────────

const SUPPORTED = new Set([".png", ".jpg", ".jpeg", ".webp"]);

async function optimizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const name = path.basename(filePath);

  if (!SUPPORTED.has(ext)) {
    console.log(`  ⏭  ${name} — unsupported format, skipping`);
    return;
  }

  const stat = fs.statSync(filePath);
  const originalKB = (stat.size / 1024).toFixed(1);

  if (stat.size < SKIP_UNDER_KB * 1024) {
    console.log(
      `  ⏭  ${name} — ${originalKB}KB (under ${SKIP_UNDER_KB}KB threshold)`,
    );
    return;
  }

  try {
    const image = sharp(filePath);
    const metadata = await image.metadata();

    let pipeline = sharp(filePath);

    // Resize if wider than MAX_WIDTH
    if (metadata.width && metadata.width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, null, {
        withoutEnlargement: true,
        fit: "inside",
      });
    }

    // Apply format-specific compression
    if (ext === ".jpg" || ext === ".jpeg") {
      pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
    } else if (ext === ".png") {
      pipeline = pipeline.png({ compressionLevel: PNG_COMPRESSION });
    } else if (ext === ".webp") {
      pipeline = pipeline.webp({ quality: WEBP_QUALITY });
    }

    // Write to temp file then replace (safe overwrite)
    const tempPath = filePath + ".tmp";
    await pipeline.toFile(tempPath);

    const newStat = fs.statSync(tempPath);
    const newKB = (newStat.size / 1024).toFixed(1);
    const savings = (((stat.size - newStat.size) / stat.size) * 100).toFixed(1);

    if (newStat.size >= stat.size) {
      // New file is bigger or same — keep original
      fs.unlinkSync(tempPath);
      console.log(`  ✓  ${name} — ${originalKB}KB → already optimal`);
    } else {
      fs.renameSync(tempPath, filePath);
      console.log(`  ✓  ${name} — ${originalKB}KB → ${newKB}KB (−${savings}%)`);
    }
  } catch (err) {
    console.error(`  ✗  ${name} — ERROR: ${err.message}`);
    // Clean up temp file if it exists
    const tempPath = filePath + ".tmp";
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

async function main() {
  console.log(`\n🖼  Wynn Tax Image Optimizer`);
  console.log(`   Directory: ${IMAGES_DIR}`);
  console.log(`   Max width: ${MAX_WIDTH}px | JPEG quality: ${JPEG_QUALITY}\n`);

  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ Directory not found: ${IMAGES_DIR}`);
    console.error(`   Make sure you run this from the client/ folder.`);
    process.exit(1);
  }

  const args = process.argv.slice(2);

  let files;
  if (args.length > 0) {
    // Process specific files
    files = args
      .map((f) => path.join(IMAGES_DIR, f))
      .filter((f) => {
        if (!fs.existsSync(f)) {
          console.log(`  ⚠  ${path.basename(f)} — file not found, skipping`);
          return false;
        }
        return true;
      });
  } else {
    // Process all images
    files = fs
      .readdirSync(IMAGES_DIR)
      .filter((f) => SUPPORTED.has(path.extname(f).toLowerCase()))
      .map((f) => path.join(IMAGES_DIR, f));
  }

  console.log(`   Processing ${files.length} file(s)...\n`);

  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const before = fs.statSync(file).size;
    totalBefore += before;
    await optimizeFile(file);
    totalAfter += fs.statSync(file).size;
  }

  const savedMB = ((totalBefore - totalAfter) / (1024 * 1024)).toFixed(2);
  const savedPct =
    totalBefore > 0
      ? (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)
      : 0;

  console.log(`\n   ─────────────────────────────────`);
  console.log(`   Total saved: ${savedMB}MB (${savedPct}%)`);
  console.log(`   Done! ✨\n`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

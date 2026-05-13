/**
 * fix_all_sequences_hq.mjs
 * Fixes Hero, Dark, and Progression sequences quality issues:
 * - Hero:       converts hero_webp/*.jpg  → hero_q92/*.webp (every 4th → 150 frames)
 * - Dark:       re-encodes d_webp/*.webp  → d_q92/*.webp   at quality 92
 */
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const publicDir  = path.join(__dirname, 'public');

// ── Helper ──────────────────────────────────────────────────────────────────
async function convert(inputDir, outputDir, step, quality, label) {
  if (!fs.existsSync(inputDir)) {
    console.warn(`⚠️  ${label}: input dir not found → ${inputDir}`);
    return 0;
  }
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const files = fs.readdirSync(inputDir)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f) && !f.includes('..'))
    .sort();

  const total = Math.ceil(files.length / step);
  console.log(`\n📦  ${label}: ${files.length} src → ~${total} output  (step ${step}, q${quality})`);

  let outIdx = 0;
  const t0   = Date.now();

  for (let i = 0; i < files.length; i += step) {
    const src  = path.join(inputDir, files[i]);
    const dest = path.join(outputDir, `frame_${String(outIdx).padStart(5, '0')}.webp`);

    await sharp(src)
      .webp({ quality, effort: 4, smartSubsample: true })
      .toFile(dest);

    outIdx++;
    if (outIdx % 16 === 0 || outIdx === total) {
      const pct  = ((outIdx / total) * 100).toFixed(0);
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      process.stdout.write(`\r  ⚡ ${pct}%  (${outIdx}/${total})  ${secs}s`);
    }
  }

  console.log(`\n  ✅  Done! → ${outIdx} frames in ${outputDir}\n`);
  return outIdx;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function run() {
  // 1. Hero — 603 JPGs in hero_webp, step=4 → ~150 frames
  const heroCount = await convert(
    path.join(publicDir, 'hero_webp'),
    path.join(publicDir, 'hero_q92'),
    4, 92,
    'HeroSequence'
  );

  // 2. Dark — 120 WebPs in d_webp, step=1 → 120 frames re-encoded at q92
  const darkCount = await convert(
    path.join(publicDir, 'd_webp'),
    path.join(publicDir, 'd_q92'),
    1, 92,
    'DarkSequence'
  );

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📝  Update HeroSequence.jsx   → FRAME_COUNT = ${heroCount},  path: /hero_q92/`);
  console.log(`📝  Update DarkSequence.jsx   → FRAME_COUNT = ${darkCount},  path: /d_q92/`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

run().catch(e => { console.error(e); process.exit(1); });

/**
 * reoptimize_hq.mjs
 * Re-generates h_webp from the high-quality source frames in /ص/
 * at WebP quality 92 (up from the previous 80).
 * Samples every 3rd frame → 128 output frames from 384 source frames.
 */
import fs   from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

async function reoptimizeHQ() {
  const publicDir = path.join(__dirname, 'public');
  const inputDir  = path.join(publicDir, 'ص');
  const outputDir = path.join(publicDir, 'h_webp');

  if (!fs.existsSync(inputDir)) {
    console.error('❌  Source folder "ص" not found!');
    process.exit(1);
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const files = fs.readdirSync(inputDir)
    .filter(f => /\.(jpe?g|png|webp)$/i.test(f))
    .sort();

  const STEP = 3;                        // keep 1 of every 3 frames → 128 frames
  const total = Math.ceil(files.length / STEP);
  console.log(`📦  Source: ${files.length} frames  |  Step: ${STEP}  |  Output: ~${total} frames`);
  console.log(`🎯  Quality: 92  (was 80)`);
  console.log('');

  let outIdx = 0;
  const t0   = Date.now();

  for (let i = 0; i < files.length; i += STEP) {
    const src  = path.join(inputDir, files[i]);
    const dest = path.join(outputDir, `frame_${String(outIdx).padStart(5, '0')}.webp`);

    await sharp(src)
      .webp({ quality: 92, effort: 4, smartSubsample: true })
      .toFile(dest);

    outIdx++;
    if (outIdx % 16 === 0 || outIdx === total) {
      const pct = ((outIdx / total) * 100).toFixed(0);
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      process.stdout.write(`\r  ⚡ ${pct}%  (${outIdx}/${total})  ${elapsed}s`);
    }
  }

  console.log(`\n\n✅  Done! Generated ${outIdx} high-quality WebP frames in /public/h_webp/`);
  console.log(`📝  Update IntroSequence.jsx → FRAME_COUNT = ${outIdx}`);
  return outIdx;
}

reoptimizeHQ().catch(e => { console.error(e); process.exit(1); });

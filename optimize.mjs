import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function optimizeSequence(inputDir, outputDir, prefix, step) {
    console.log(`Optimizing ${inputDir}...`);
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const files = fs.readdirSync(inputDir)
        .filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'))
        .sort();

    let newIndex = 0;
    for (let i = 0; i < files.length; i += step) {
        const file = files[i];
        const inputPath = path.join(inputDir, file);
        const paddedIndex = newIndex.toString().padStart(5, '0');
        const outputPath = path.join(outputDir, `${prefix}_${paddedIndex}.webp`);

        // Convert to WebP with 80% quality, resize slightly if needed, but 1080p is fine.
        await sharp(inputPath)
            .webp({ quality: 80, effort: 6 })
            .toFile(outputPath);

        newIndex++;
        if (newIndex % 20 === 0) console.log(`Processed ${newIndex} frames for ${prefix}...`);
    }

    console.log(`Finished ${prefix}. Total frames: ${newIndex}`);
    return newIndex;
}

async function run() {
    try {
        const publicDir = path.join(__dirname, 'public');
        
        // 1. Hero Sequence
        const heroCount = 151; // Hardcoded from previous run

        // 2. Progression Sequence
        const progCount = 128; // Hardcoded from previous run
        
        // 3. Intro Sequence: 120 frames -> keep every frame (step 1)
        const hCount = await optimizeSequence(
            path.join(publicDir, 'h'), 
            path.join(publicDir, 'h_webp'), 
            'frame', 
            1
        );
        
        // Write counts to a JSON file so we know exactly how many we generated
        fs.writeFileSync(path.join(__dirname, 'frames.json'), JSON.stringify({
            heroCount,
            progCount,
            hCount
        }));

        console.log("Optimization complete!");
    } catch (e) {
        console.error(e);
    }
}

run();

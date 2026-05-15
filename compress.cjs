const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dirs = [
  'public/الاول',
  'public/الثاني',
  'public/الثالث',
  'public/الرابع',
  'public/لودنج'
];

async function compressDir(dirPath) {
  const fullPath = path.join(__dirname, dirPath);
  if (!fs.existsSync(fullPath)) return;
  const files = fs.readdirSync(fullPath);
  for (const file of files) {
    if (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg')) {
      const filePath = path.join(fullPath, file);
      const ext = path.extname(file);
      const outPath = filePath.replace(ext, '.webp');
      
      try {
        // Only convert if the webp doesn't already exist
        if (!fs.existsSync(outPath)) {
          await sharp(filePath)
            .webp({ quality: 60 })
            .toFile(outPath);
          console.log(`Converted: ${outPath}`);
        }
        // Delete original to save space
        fs.unlinkSync(filePath); 
      } catch (err) {
        console.error(`Error converting ${filePath}:`, err);
      }
    }
  }
}

async function main() {
  for (const dir of dirs) {
    console.log(`Processing ${dir}...`);
    await compressDir(dir);
  }
  console.log("Done compressing all directories!");
}

main();

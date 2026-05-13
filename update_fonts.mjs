import fs from 'fs';
import path from 'path';

const dir = './src';

function processDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/'Bebas Neue', sans-serif/g, 'var(--font-heading)');
      content = content.replace(/'Outfit', sans-serif/g, 'var(--font-body)');
      fs.writeFileSync(fullPath, content);
      console.log(`Updated fonts in ${fullPath}`);
    }
  }
}

processDir(dir);

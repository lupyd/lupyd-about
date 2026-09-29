import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const SPECIFIC_FILES = [
  {
    file: 'public/frames/macbook-pro-16.webp',
    widths: [640, 1024, 1600, 2400]
  },
  {
    file: 'public/frames/pixel-9-pro.webp',
    widths: [240, 480, 720]
  }
];

const DIRECTORIES = [
  { dir: 'public/screenshots/desktop', widths: [640, 1024] },
  { dir: 'public/screenshots/mobile', widths: [360, 540] },
  { dir: 'public/screenshots', widths: [480, 768] }
];

function resizeFile(fullPath, widths) {
  if (!fs.existsSync(fullPath)) return;
  const dir = path.dirname(fullPath);
  const ext = path.extname(fullPath);
  const base = path.basename(fullPath, ext);

  for (const w of widths) {
    const outFile = path.join(dir, `${base}-${w}.webp`);
    console.log(`Generating ${outFile}`);
    execSync(`magick "${fullPath}" -resize ${w}x -quality 85 "${outFile}"`);
  }
}

console.log('Generating frames...');
for (const item of SPECIFIC_FILES) {
  resizeFile(item.file, item.widths);
}

console.log('Generating directory screenshots...');
for (const { dir, widths } of DIRECTORIES) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (!file.endsWith('.webp')) continue;
    // Skip generated files matching -(240|360|480|540|640|720|768|1024|1600|2400).webp
    if (/-(240|360|480|540|640|720|768|1024|1600|2400)\.webp$/.test(file)) continue;
    resizeFile(path.join(dir, file), widths);
  }
}

console.log('Done generating all responsive images.');

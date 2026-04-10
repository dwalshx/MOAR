// One-off script to generate PWA placeholder icons.
// Orange "M" on dark rounded-rect background (per D-07).
// Outputs: public/pwa-192.png, public/pwa-512.png, public/apple-touch-icon.png
import sharp from 'sharp';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const BG = '#0f0f0f';
const FG = '#f97316';

function makeSvg(size) {
  const radius = Math.round(size * 0.22);
  // Font size tuned so a bold "M" is prominent but not clipped.
  const fontSize = Math.round(size * 0.62);
  // Nudge baseline upward so the glyph reads centered optically.
  const cy = Math.round(size * 0.5 + fontSize * 0.35);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="${BG}"/>
  <text x="50%" y="${cy}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="${fontSize}" fill="${FG}">M</text>
</svg>`;
}

async function renderPng(size, outPath) {
  const svg = makeSvg(size);
  const dir = dirname(outPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  await sharp(Buffer.from(svg))
    .png()
    .toFile(outPath);
  console.log(`wrote ${outPath}`);
}

async function main() {
  await renderPng(192, 'public/pwa-192.png');
  await renderPng(512, 'public/pwa-512.png');
  await renderPng(180, 'public/apple-touch-icon.png');

  // Also write an SVG for sharp-resolution displays / fallback
  const svg512 = makeSvg(512);
  writeFileSync('public/pwa-icon.svg', svg512);
  console.log('wrote public/pwa-icon.svg');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

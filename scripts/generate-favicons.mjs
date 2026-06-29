/**
 * Generates favicon assets for GTA6Hub (static files — reliable in all browsers).
 * Run: npm run generate:favicons
 */
import { writeFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

const tabSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <rect width="32" height="32" rx="8" fill="#09090b"/>
  <rect x="1.25" y="1.25" width="29.5" height="29.5" rx="7" fill="none" stroke="#e879a8" stroke-width="1.25"/>
  <text x="16" y="22.5" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" font-weight="900" fill="#f06aad">VI</text>
</svg>`;

const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
  <rect width="180" height="180" rx="40" fill="#09090b"/>
  <rect x="4" y="4" width="172" height="172" rx="36" fill="none" stroke="#e879a8" stroke-width="4"/>
  <text x="90" y="78" text-anchor="middle" font-family="system-ui,sans-serif" font-size="52" font-weight="900" fill="#f06aad">GTA</text>
  <text x="90" y="148" text-anchor="middle" font-family="system-ui,sans-serif" font-size="64" font-weight="900" fill="#ffffff">6</text>
</svg>`;

const png32 = await sharp({
  create: {
    width: 32,
    height: 32,
    channels: 4,
    background: { r: 9, g: 9, b: 11, alpha: 1 },
  },
})
  .composite([{ input: Buffer.from(tabSvg) }])
  .png()
  .toBuffer();

const png16 = await sharp(png32).resize(16, 16).png().toBuffer();
const png192 = await sharp({
  create: {
    width: 192,
    height: 192,
    channels: 4,
    background: { r: 9, g: 9, b: 11, alpha: 1 },
  },
})
  .composite([
    {
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192">
          <rect width="192" height="192" rx="42" fill="#09090b"/>
          <rect x="4" y="4" width="184" height="184" rx="38" fill="none" stroke="#e879a8" stroke-width="4"/>
          <text x="96" y="118" text-anchor="middle" font-family="system-ui,sans-serif" font-size="88" font-weight="900" fill="#f06aad">VI</text>
        </svg>`,
      ),
    },
  ])
  .png()
  .toBuffer();

const applePng = await sharp({
  create: {
    width: 180,
    height: 180,
    channels: 4,
    background: { r: 9, g: 9, b: 11, alpha: 1 },
  },
})
  .composite([{ input: Buffer.from(appleSvg) }])
  .png()
  .toBuffer();

const ico = await pngToIco([png16, png32]);

const publicIco = join(publicDir, "favicon.ico");
const icon32 = join(publicDir, "icon-32.png");
const appleTouch = join(publicDir, "apple-touch-icon.png");
const icon192 = join(publicDir, "icon-192.png");

writeFileSync(publicIco, ico);
writeFileSync(icon32, png32);
writeFileSync(appleTouch, applePng);
writeFileSync(icon192, png192);

console.log(`Wrote ${publicIco} (${ico.length} bytes)`);
console.log(`Wrote ${icon32}`);
console.log(`Wrote ${appleTouch}`);
console.log(`Wrote ${icon192}`);

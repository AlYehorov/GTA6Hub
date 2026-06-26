/**
 * Generates app/favicon.ico and public/favicon.ico from the tab icon PNG.
 * Run: node scripts/generate-favicons.mjs
 */
import { writeFileSync, copyFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const png32 = await sharp({
  create: {
    width: 32,
    height: 32,
    channels: 4,
    background: { r: 9, g: 9, b: 11, alpha: 1 },
  },
})
  .composite([
    {
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
          <rect width="32" height="32" rx="8" fill="#09090b"/>
          <rect x="1.25" y="1.25" width="29.5" height="29.5" rx="7" fill="none" stroke="#e879a8" stroke-width="1.25"/>
          <text x="16" y="22.5" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" font-weight="900" fill="#f06aad">VI</text>
        </svg>`,
      ),
    },
  ])
  .png()
  .toBuffer();

const png16 = await sharp(png32).resize(16, 16).png().toBuffer();
const ico = await pngToIco([png16, png32]);

const appIco = join(root, "app/favicon.ico");
const publicIco = join(root, "public/favicon.ico");

writeFileSync(appIco, ico);
copyFileSync(appIco, publicIco);

console.log(`Wrote ${appIco} (${ico.length} bytes)`);
console.log(`Wrote ${publicIco}`);

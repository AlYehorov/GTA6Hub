/**
 * Generates favicon assets for GTA6Hub (static files — reliable in all browsers).
 * Run: npm run generate:favicons
 *
 * Safari notes:
 * - No query strings on icon URLs
 * - High-contrast tab icon (pink bg) for dark Safari toolbars
 * - apple-touch-icon-precomposed.png for legacy iOS/macOS
 * - favicon.svg for modern Safari tab icons
 */
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");

/** High-contrast tab icon — visible on Safari dark toolbar */
const tabSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
  <rect width="32" height="32" rx="7" fill="#f06aad"/>
  <text x="16" y="23" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="900" fill="#ffffff">6</text>
</svg>`;

const tabSvg48 = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48">
  <rect width="48" height="48" rx="10" fill="#f06aad"/>
  <text x="24" y="34" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="28" font-weight="900" fill="#ffffff">6</text>
</svg>`;

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#f06aad"/>
  <text x="16" y="23" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="20" font-weight="900" fill="#ffffff">6</text>
</svg>`;

const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
  <circle cx="8" cy="8" r="7.5" fill="#f06aad"/>
  <text x="8" y="11.5" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="9" font-weight="900" fill="#ffffff">6</text>
</svg>`;

const appleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180">
  <rect width="180" height="180" rx="40" fill="#09090b"/>
  <rect x="4" y="4" width="172" height="172" rx="36" fill="none" stroke="#f06aad" stroke-width="4"/>
  <text x="90" y="78" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="52" font-weight="900" fill="#f06aad">GTA</text>
  <text x="90" y="148" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="64" font-weight="900" fill="#ffffff">6</text>
</svg>`;

const png32 = await sharp(Buffer.from(tabSvg)).png().toBuffer();
const png48 = await sharp(Buffer.from(tabSvg48)).png().toBuffer();
const png16 = await sharp(png32).resize(16, 16).png().toBuffer();

const png192 = await sharp({
  create: {
    width: 192,
    height: 192,
    channels: 4,
    background: { r: 240, g: 106, b: 173, alpha: 1 },
  },
})
  .composite([
    {
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192">
          <rect width="192" height="192" rx="42" fill="#f06aad"/>
          <text x="96" y="128" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="96" font-weight="900" fill="#ffffff">6</text>
        </svg>`,
      ),
    },
  ])
  .png()
  .toBuffer();

const applePng = await sharp(Buffer.from(appleSvg)).png().toBuffer();
const ico = await pngToIco([png16, png32, png48]);

const files = {
  faviconIco: join(publicDir, "favicon.ico"),
  faviconSvg: join(publicDir, "favicon.svg"),
  maskSvg: join(publicDir, "safari-pinned-tab.svg"),
  icon32: join(publicDir, "icon-32.png"),
  icon48: join(publicDir, "icon-48.png"),
  icon192: join(publicDir, "icon-192.png"),
  appleTouch: join(publicDir, "apple-touch-icon.png"),
  applePrecomposed: join(publicDir, "apple-touch-icon-precomposed.png"),
};

writeFileSync(files.faviconIco, ico);
writeFileSync(files.faviconSvg, faviconSvg);
writeFileSync(files.maskSvg, maskSvg);
writeFileSync(files.icon32, png32);
writeFileSync(files.icon48, png48);
writeFileSync(files.icon192, png192);
writeFileSync(files.appleTouch, applePng);
writeFileSync(files.applePrecomposed, applePng);

for (const [name, path] of Object.entries(files)) {
  console.log(`Wrote ${name}: ${path}`);
}

/**
 * Ensures favicon assets exist before production builds.
 * Run automatically via npm prebuild.
 */
import { statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const REQUIRED = [
  { path: "public/favicon.ico", minBytes: 500 },
  { path: "public/favicon.svg", minBytes: 100 },
  { path: "public/safari-pinned-tab.svg", minBytes: 80 },
  { path: "public/icon-32.png", minBytes: 200 },
  { path: "public/icon-48.png", minBytes: 300 },
  { path: "public/icon-192.png", minBytes: 500 },
  { path: "public/apple-touch-icon.png", minBytes: 1000 },
  { path: "public/apple-touch-icon-precomposed.png", minBytes: 1000 },
];

let failed = false;

for (const { path, minBytes } of REQUIRED) {
  const full = join(root, path);
  try {
    const size = statSync(full).size;
    if (size < minBytes) {
      console.error(`[validate-favicons] ${path} too small (${size} < ${minBytes} bytes)`);
      failed = true;
    }
  } catch {
    console.error(`[validate-favicons] Missing ${path}`);
    failed = true;
  }
}

if (failed) {
  console.error("[validate-favicons] Run: npm run generate:favicons");
  process.exit(1);
}

console.log("[validate-favicons] OK — all favicon assets present");

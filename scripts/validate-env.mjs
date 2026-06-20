import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  try {
    const content = readFileSync(join(root, ".env.local"), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      if (!process.env[trimmed.slice(0, eq)]) {
        process.env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
      }
    }
  } catch {
    // .env.local optional for CI
  }
}

loadEnv();

const errors = [];
const warnings = [];

if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) {
  errors.push("NEXT_PUBLIC_SUPABASE_URL is required");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
  errors.push("NEXT_PUBLIC_SUPABASE_ANON_KEY is required");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
  errors.push("SUPABASE_SERVICE_ROLE_KEY is required for admin/seed");
}
if (!process.env.NEXT_PUBLIC_SITE_URL?.trim() && !process.env.VERCEL_URL?.trim()) {
  warnings.push("NEXT_PUBLIC_SITE_URL not set — SEO URLs will use localhost fallback");
}
if (!process.env.ADMIN_EMAILS?.trim()) {
  warnings.push("ADMIN_EMAILS not set — any authenticated user can access /admin");
}
if (!process.env.OPENAI_API_KEY?.trim()) {
  warnings.push("OPENAI_API_KEY not set — mock AI provider will be used");
}

for (const w of warnings) console.warn(`[env] ${w}`);
for (const e of errors) console.error(`[env] ${e}`);

if (errors.length) {
  console.error("\nEnvironment validation failed.");
  process.exit(1);
}

console.log("\nEnvironment validation passed.");

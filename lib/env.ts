/**
 * Central environment validation for GTA6Hub.
 * Public vars are safe for the browser; server vars must never be exposed client-side.
 */

export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EnvConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey?: string;
  adminEmails: string[];
  siteUrl: string;
  openAiApiKey?: string;
  aiProvider: "openai" | "mock";
  cronSecret?: string;
}

function missing(name: string): string {
  return `${name} is required but not set. Add it to .env.local (local) or Vercel Environment Variables (production).`;
}

function invalidUrl(name: string, value: string): string {
  return `${name} must be a valid HTTPS URL (got "${value.slice(0, 40)}...").`;
}

export function validateEnv(options?: {
  requireServiceRole?: boolean;
  requireSiteUrl?: boolean;
}): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelUrl = process.env.VERCEL_URL?.trim();
  const openAi = process.env.OPENAI_API_KEY?.trim();

  if (!url) {
    errors.push(missing("NEXT_PUBLIC_SUPABASE_URL"));
  } else if (!url.startsWith("https://")) {
    errors.push(invalidUrl("NEXT_PUBLIC_SUPABASE_URL", url));
  }

  if (!anon) {
    errors.push(missing("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  }

  if (options?.requireServiceRole && !service) {
    errors.push(missing("SUPABASE_SERVICE_ROLE_KEY"));
  } else if (!service) {
    warnings.push(
      "SUPABASE_SERVICE_ROLE_KEY is not set — admin writes, seeding, and source ingestion are disabled."
    );
  }

  if (!openAi) {
    warnings.push(
      "OPENAI_API_KEY is not set — AI draft generation uses the mock provider (safe for production demo)."
    );
  }

  if (!process.env.CRON_SECRET?.trim()) {
    warnings.push(
      "CRON_SECRET is not set — /api/cron/ingest will reject all requests until configured."
    );
  }

  if (options?.requireSiteUrl && !siteUrl && !vercelUrl) {
    errors.push(missing("NEXT_PUBLIC_SITE_URL"));
  } else if (!siteUrl && !vercelUrl) {
    warnings.push(
      "NEXT_PUBLIC_SITE_URL is not set — sitemap and Open Graph URLs default to http://localhost:3000."
    );
  }

  if (!process.env.ADMIN_EMAILS?.trim()) {
    warnings.push(
      "ADMIN_EMAILS is not set — any authenticated Supabase user can access /admin."
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function logEnvValidation(result: EnvValidationResult): void {
  for (const w of result.warnings) console.warn(`[env] ${w}`);
  for (const e of result.errors) console.error(`[env] ${e}`);
}

export function assertProductionEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const result = validateEnv({
    requireServiceRole: true,
    requireSiteUrl: true,
  });

  logEnvValidation(result);

  if (!result.valid) {
    throw new Error(
      `Production environment validation failed:\n${result.errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }
}

export function getEnvConfig(): EnvConfig {
  const openAi = process.env.OPENAI_API_KEY?.trim();

  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    adminEmails: (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean),
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    openAiApiKey: openAi,
    aiProvider: openAi ? "openai" : "mock",
    cronSecret: process.env.CRON_SECRET?.trim(),
  };
}

export function isPublicSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

export function isAdminSupabaseConfigured(): boolean {
  return isPublicSupabaseConfigured() && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

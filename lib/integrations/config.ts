import { getSiteUrl } from "@/lib/constants/site";

export interface IntegrationsEnvConfig {
  searchConsoleProperty: string | null;
  gaMeasurementId: string | null;
  ga4PropertyId: string | null;
  clarityProjectId: string | null;
  clarityApiToken: string | null;
  googleServiceAccountJson: string | null;
  siteUrl: string;
}

export function getIntegrationsEnv(): IntegrationsEnvConfig {
  const siteUrl = getSiteUrl().replace(/\/$/, "");

  return {
    searchConsoleProperty:
      process.env.GOOGLE_SEARCH_CONSOLE_PROPERTY?.trim() ||
      `sc-domain:${siteUrl.replace(/^https?:\/\//, "").replace(/^www\./, "")}` ||
      null,
    gaMeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || null,
    ga4PropertyId: process.env.GA4_PROPERTY_ID?.trim() || null,
    clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_ID?.trim() || null,
    clarityApiToken: process.env.CLARITY_API_TOKEN?.trim() || null,
    googleServiceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() || null,
    siteUrl,
  };
}

export function isGoogleApiConfigured(): boolean {
  const env = getIntegrationsEnv();
  return Boolean(env.googleServiceAccountJson);
}

export function isSearchConsoleConfigured(): boolean {
  const env = getIntegrationsEnv();
  return isGoogleApiConfigured() && Boolean(env.searchConsoleProperty);
}

export function isGa4Configured(): boolean {
  const env = getIntegrationsEnv();
  return isGoogleApiConfigured() && Boolean(env.ga4PropertyId);
}

export function isClarityConfigured(): boolean {
  return Boolean(getIntegrationsEnv().clarityProjectId);
}

export function isClarityApiConfigured(): boolean {
  const env = getIntegrationsEnv();
  return Boolean(env.clarityProjectId && env.clarityApiToken);
}

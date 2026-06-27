import { google } from "googleapis";
import { getIntegrationsEnv } from "@/lib/integrations/config";

export function parseServiceAccountJson(): Record<string, unknown> | null {
  const raw = getIntegrationsEnv().googleServiceAccountJson;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf8");
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

export function getGoogleAuth(scopes: string[]) {
  const credentials = parseServiceAccountJson();
  if (!credentials) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured or invalid");
  }

  return new google.auth.GoogleAuth({
    credentials,
    scopes,
  });
}

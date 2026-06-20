/**
 * Server-side admin client — uses SUPABASE_SERVICE_ROLE_KEY.
 * ONLY use in Server Actions, admin queries, seed scripts, and workflows.
 * NEVER import in Client Components or expose to the browser.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export function createAdminClient() {
  if (!isSupabaseAdminConfigured()) {
    throw new Error("Supabase admin is not configured");
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

/**
 * Browser Supabase client — uses anon key only.
 * NEVER import this in Server Actions that need elevated privileges.
 */
import { createBrowserClient } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileForUser } from "@/lib/actions/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/tracker";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      await ensureProfileForUser(data.user.id, data.user.email);
      return NextResponse.redirect(`${origin}/auth/complete?next=${encodeURIComponent(next)}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

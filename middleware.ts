import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PUBLIC_PATHS = ["/admin/login"];

function isAdminPublicPath(pathname: string) {
  return ADMIN_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (user && pathname === "/admin/login") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (!user && !isAdminPublicPath(pathname)) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && process.env.ADMIN_EMAILS) {
    const allowed = process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase());
    const email = user.email?.toLowerCase() ?? "";
    if (!allowed.includes(email)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL("/admin/login?error=unauthorized", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};

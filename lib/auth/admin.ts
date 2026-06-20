import { createClient } from "@/lib/supabase/server";

export class AdminAuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AdminAuthError";
  }
}

function getAllowedAdminEmails(): string[] | null {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw?.trim()) return null;
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const allowed = getAllowedAdminEmails();
  if (!allowed) return true;
  return allowed.includes(email.toLowerCase());
}

export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

export async function requireAdminUser() {
  const user = await getAdminUser();
  if (!user) throw new AdminAuthError();
  return user;
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isUsernameAvailable } from "@/lib/profile/queries";
import { evaluateAndUnlockAchievements, unlockAchievementBySlug } from "@/lib/profile/achievements";
import { trackActivity } from "@/lib/profile/activity";
import { awardXP, XP_REWARDS } from "@/lib/profile/xp";
import { syncLocalProgressToServer } from "@/lib/actions/tracker-progress";
import { getSiteUrl } from "@/lib/constants/site";

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 24) {
    return "Username must be 3–24 characters.";
  }
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return "Username can only contain letters, numbers, and underscores.";
  }
  return null;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  username: string
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Auth is not configured." };
  }

  const usernameError = validateUsername(username);
  if (usernameError) return { success: false, error: usernameError };

  const available = await isUsernameAvailable(username);
  if (!available) return { success: false, error: "Username is already taken." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: username.trim() },
    },
  });

  if (error) return { success: false, error: error.message };
  if (!data.user) return { success: false, error: "Sign up failed." };

  const admin = createAdminClient();
  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    username: username.trim(),
  });

  if (profileError) {
    return { success: false, error: profileError.message };
  }

  await awardXP(data.user.id, XP_REWARDS.profile_created, "profile_created");
  await trackActivity(data.user.id, "profile_created", "Created GTAVIHub profile", {
    username: username.trim(),
  });
  await unlockAchievementBySlug(data.user.id, "first_login");

  return { success: true };
}

export async function signInWithEmail(
  email: string,
  password: string,
  localItemIds?: string[]
): Promise<AuthActionResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "Auth is not configured." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { success: false, error: error.message };
  if (!data.user) return { success: false, error: "Sign in failed." };

  if (localItemIds && localItemIds.length > 0) {
    await syncLocalProgressToServer(localItemIds);
  }

  await evaluateAndUnlockAchievements(data.user.id);
  revalidatePath("/tracker");
  revalidatePath("/profile");
  revalidatePath("/leaderboard");

  return { success: true };
}

export type OAuthProvider = "google" | "apple";

export async function signInWithOAuthProvider(provider: OAuthProvider): Promise<void> {
  if (!isSupabaseConfigured()) {
    redirect("/login?error=auth_not_configured");
  }

  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      ...(provider === "google"
        ? {
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          }
        : {}),
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? "oauth_failed")}`);
  }

  redirect(data.url);
}

/** @deprecated Use signInWithOAuthProvider("google") */
export async function signInWithGoogle(): Promise<void> {
  return signInWithOAuthProvider("google");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function ensureProfileForUser(userId: string, email?: string | null): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const admin = createAdminClient();
  const { data: existing } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (existing) return false;

  const base = email?.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "_") || "player";
  let username = base.slice(0, 20);
  let suffix = 1;

  while (!(await isUsernameAvailable(username))) {
    username = `${base.slice(0, 16)}_${suffix}`;
    suffix++;
  }

  await admin.from("profiles").insert({ id: userId, username });
  await awardXP(userId, XP_REWARDS.profile_created, "profile_created");
  await trackActivity(userId, "profile_created", "Created GTAVIHub profile", { username });
  return true;
}

export async function postLoginSync(localItemIds: string[]): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await ensureProfileForUser(user.id, user.email);
  if (localItemIds.length > 0) {
    await syncLocalProgressToServer(localItemIds);
  }
  await unlockAchievementBySlug(user.id, "first_login");
  await evaluateAndUnlockAchievements(user.id);
  revalidatePath("/tracker");
  revalidatePath("/profile");
  revalidatePath("/u");
  revalidatePath("/leaderboard");
}

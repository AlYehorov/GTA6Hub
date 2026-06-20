"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface AdminSignOutButtonProps {
  email?: string | null;
}

export function AdminSignOutButton({ email }: AdminSignOutButtonProps) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {email && (
        <span className="hidden text-xs text-white/40 sm:inline">{email}</span>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        className="gap-1.5 border-white/10 bg-transparent text-white/60 hover:bg-white/5 hover:text-white"
      >
        <LogOut className="size-3.5" />
        Sign out
      </Button>
    </div>
  );
}

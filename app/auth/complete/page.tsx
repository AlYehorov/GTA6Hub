import { Suspense } from "react";
import { AuthCompleteClient } from "@/components/auth/auth-complete-client";

export default function AuthCompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-white/50">
          Syncing your progress...
        </div>
      }
    >
      <AuthCompleteClient />
    </Suspense>
  );
}

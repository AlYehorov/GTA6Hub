import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { LoginForm } from "@/components/auth/login-form";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Sign In",
  description: "Sign in to GTA6Hub to sync your GTA 6 completion tracker progress across devices.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <>
      <PageHeader
        title="Sign In"
        description="Sync your Leonida completion progress across devices."
      />
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </>
  );
}

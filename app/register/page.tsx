import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { RegisterForm } from "@/components/auth/register-form";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Create Account",
  description: "Join GTA6Hub and track your GTA 6 completion progress, achievements, and leaderboard rank.",
  path: "/register",
});

export default function RegisterPage() {
  return (
    <>
      <PageHeader
        title="Create Account"
        description="Join the Leonida community and track your progress."
      />
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 sm:p-8">
          <RegisterForm />
        </div>
      </div>
    </>
  );
}

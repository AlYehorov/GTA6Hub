import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-black px-4 pt-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-gta-pink">
            GTA6Hub
          </p>
          <h1 className="font-heading text-2xl font-bold text-white">Admin sign in</h1>
          <p className="mt-2 text-sm text-white/45">
            Content management requires authentication.
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
          <Suspense fallback={null}>
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

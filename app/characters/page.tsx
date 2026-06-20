import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Characters",
  description: "Meet the cast of GTA VI — Lucia, Jason, and everyone in Leonida.",
};

export default function CharactersPage() {
  return (
    <>
      <PageHeader
        title="Characters"
        description="Profiles, backstories, and everything we know about the cast of GTA VI."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">
          Character profiles coming soon.
        </p>
      </div>
    </>
  );
}

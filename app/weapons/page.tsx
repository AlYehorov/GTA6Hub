import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Weapons",
  description: "GTA VI weapons, stats, and loadout guides.",
};

export default function WeaponsPage() {
  return (
    <>
      <PageHeader
        title="Weapons"
        description="Every weapon in the GTA VI arsenal — stats, locations, and loadout tips."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">
          Weapons database coming soon.
        </p>
      </div>
    </>
  );
}

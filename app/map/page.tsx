import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Map",
  description: "Interactive map of Leonida and Vice City.",
};

export default function MapPage() {
  return (
    <>
      <PageHeader
        title="Map"
        description="Explore Leonida — Vice City, the Keys, and everything in between."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">
          Interactive map coming soon.
        </p>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Vehicles",
  description: "Every car, bike, boat, and aircraft in GTA VI.",
};

export default function VehiclesPage() {
  return (
    <>
      <PageHeader
        title="Vehicles"
        description="Cars, bikes, boats, and aircraft — the full garage of Leonida."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">
          Vehicle catalog coming soon.
        </p>
      </div>
    </>
  );
}

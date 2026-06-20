import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Checklist",
  description: "Track your GTA VI progress — missions, collectibles, and achievements.",
};

export default function ChecklistPage() {
  return (
    <>
      <PageHeader
        title="Checklist"
        description="Track missions, collectibles, and 100% completion across Leonida."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">
          Progress checklist coming soon.
        </p>
      </div>
    </>
  );
}

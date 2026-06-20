import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";

export const metadata: Metadata = {
  title: "Trailers",
  description: "GTA VI trailers, breakdowns, and frame-by-frame analysis.",
};

export default function TrailersPage() {
  return (
    <>
      <PageHeader
        title="Trailers"
        description="Every official trailer and our detailed breakdowns of what they reveal."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-muted-foreground">
          Trailer library coming soon.
        </p>
      </div>
    </>
  );
}

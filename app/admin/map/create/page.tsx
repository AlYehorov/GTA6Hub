import { PageHeader } from "@/components/shared/page-header";
import { MapPointForm } from "@/components/admin/map-point-form";

export default function AdminMapCreatePage() {
  return (
    <>
      <PageHeader
        title="Add map point"
        description="Place a new location on the Leonida map. Coordinates use 0–100 normalized positions."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <MapPointForm />
      </div>
    </>
  );
}

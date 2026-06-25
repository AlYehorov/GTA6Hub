import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { MapPointForm } from "@/components/admin/map-point-form";
import { MapPointActions } from "@/components/admin/map-point-actions";
import { getMapPointByIdAdmin } from "@/lib/map/queries";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminMapEditPage({ params }: PageProps) {
  const { id } = await params;
  const point = await getMapPointByIdAdmin(id);
  if (!point) notFound();

  return (
    <>
      <PageHeader title="Edit map point" description={point.title} />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <MapPointActions id={point.id} status={point.status} />
        </div>
        <MapPointForm point={point} />
      </div>
    </>
  );
}

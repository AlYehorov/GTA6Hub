import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CompletionItemForm } from "@/components/admin/completion-item-form";
import {
  getAllCategoriesAdmin,
  getCompletionItemByIdAdmin,
} from "@/lib/tracker/queries";

interface AdminTrackerEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminTrackerEditPage({ params }: AdminTrackerEditPageProps) {
  const { id } = await params;
  const [item, categories] = await Promise.all([
    getCompletionItemByIdAdmin(id),
    getAllCategoriesAdmin(),
  ]);

  if (!item) notFound();

  return (
    <>
      <PageHeader
        title="Edit tracker item"
        description={`${item.category.title} · ${item.status}`}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <CompletionItemForm categories={categories} item={item} />
      </div>
    </>
  );
}

import { PageHeader } from "@/components/shared/page-header";
import { CompletionItemForm } from "@/components/admin/completion-item-form";
import { getAllCategoriesAdmin } from "@/lib/tracker/queries";

export default async function AdminTrackerCreatePage() {
  const categories = await getAllCategoriesAdmin();

  return (
    <>
      <PageHeader
        title="Add tracker item"
        description="Create a new completion tracker entry. Assign a category, set difficulty, and publish when ready."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {categories.length === 0 ? (
          <p className="text-center text-white/40">
            No categories found. Run migration 006 and `npm run seed:tracker` first.
          </p>
        ) : (
          <CompletionItemForm categories={categories} />
        )}
      </div>
    </>
  );
}

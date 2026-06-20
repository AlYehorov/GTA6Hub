import { PageHeader } from "@/components/shared/page-header";
import { ArticleForm } from "@/components/admin/article-form";
import { getCategoriesAdmin, getTagsAdmin } from "@/lib/articles/queries";

export default async function CreateArticlePage() {
  const [categories, tags] = await Promise.all([
    getCategoriesAdmin(),
    getTagsAdmin(),
  ]);

  return (
    <>
      <PageHeader
        title="Create article"
        description="Write a new news post or guide. Save as draft or publish immediately."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ArticleForm categories={categories} tags={tags} />
      </div>
    </>
  );
}

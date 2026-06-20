import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { ArticleForm } from "@/components/admin/article-form";
import {
  getArticleByIdAdmin,
  getCategoriesAdmin,
  getTagsAdmin,
} from "@/lib/articles/queries";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params;

  const [article, categories, tags] = await Promise.all([
    getArticleByIdAdmin(id),
    getCategoriesAdmin(),
    getTagsAdmin(),
  ]);

  if (!article) notFound();

  return (
    <>
      <PageHeader
        title="Edit article"
        description={article.title}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ArticleForm article={article} categories={categories} tags={tags} />
      </div>
    </>
  );
}

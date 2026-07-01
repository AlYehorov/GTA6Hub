import { revalidatePath, revalidateTag } from "next/cache";

/** Bust public article listings after publish (manual or cron). */
export function revalidatePublishedArticlePaths(articleSlug?: string, type?: "news" | "guide") {
  revalidatePath("/news");
  revalidatePath("/newsroom");
  revalidatePath("/");
  revalidateTag("articles");
  revalidateTag("homepage");
  if (articleSlug && type) {
    revalidatePath(`/${type}/${articleSlug}`);
  }
}

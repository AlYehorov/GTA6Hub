import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured, isSupabaseConfigured } from "@/lib/supabase/config";
import type {
  CompletionCategory,
  CompletionItem,
  CompletionItemFormData,
  CompletionItemWithCategory,
} from "@/lib/types/completion";
import { buildTrackerOverview } from "@/lib/tracker/progress-utils";

export { buildTrackerOverview };

function rowToCategory(row: Record<string, unknown>): CompletionCategory {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    icon: row.icon as string,
    sort_order: Number(row.sort_order),
    created_at: row.created_at as string,
  };
}

function rowToItem(row: Record<string, unknown>): CompletionItem {
  return {
    id: row.id as string,
    category_id: row.category_id as string,
    title: row.title as string,
    description: row.description as string,
    spoiler: Boolean(row.spoiler),
    difficulty: row.difficulty as CompletionItem["difficulty"],
    image_url: (row.image_url as string | null) ?? null,
    sort_order: Number(row.sort_order),
    status: row.status as CompletionItem["status"],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getCompletionCategories(): Promise<CompletionCategory[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("completion_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []).map(rowToCategory);
}

export async function getCategoryBySlug(slug: string): Promise<CompletionCategory | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("completion_categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return rowToCategory(data);
}

export async function getPublishedItemsByCategory(
  categoryId: string
): Promise<CompletionItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("completion_items")
    .select("*")
    .eq("category_id", categoryId)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []).map(rowToItem);
}

export async function getAllPublishedItems(): Promise<CompletionItem[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("completion_items")
    .select("*")
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []).map(rowToItem);
}

export async function getAllPublishedItemsWithCategory(): Promise<CompletionItemWithCategory[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("completion_items")
    .select(`
      *,
      category:completion_categories(id, slug, title, icon)
    `)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (error) return [];

  return (data ?? []).map((row) => {
    const { category, ...item } = row;
    return {
      ...rowToItem(item as Record<string, unknown>),
      category: category as CompletionItemWithCategory["category"],
    };
  });
}

export async function getTrackerPublicTotals(): Promise<{
  totalItems: number;
  categoryCount: number;
}> {
  if (!isSupabaseConfigured()) return { totalItems: 0, categoryCount: 0 };

  const supabase = await createClient();
  const [items, categories] = await Promise.all([
    supabase.from("completion_items").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("completion_categories").select("id", { count: "exact", head: true }),
  ]);

  return {
    totalItems: items.count ?? 0,
    categoryCount: categories.count ?? 0,
  };
}

// --- Admin ---

export async function getAllCompletionItemsAdmin(): Promise<CompletionItemWithCategory[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("completion_items")
    .select(`
      *,
      category:completion_categories(id, slug, title, icon)
    `)
    .order("updated_at", { ascending: false });

  if (error) return [];

  return (data ?? []).map((row) => {
    const { category, ...item } = row;
    return {
      ...rowToItem(item as Record<string, unknown>),
      category: category as CompletionItemWithCategory["category"],
    };
  });
}

export async function getCompletionItemByIdAdmin(
  id: string
): Promise<CompletionItemWithCategory | null> {
  if (!isSupabaseAdminConfigured()) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("completion_items")
    .select(`
      *,
      category:completion_categories(id, slug, title, icon)
    `)
    .eq("id", id)
    .single();

  if (error || !data) return null;

  const { category, ...item } = data;
  return {
    ...rowToItem(item as Record<string, unknown>),
    category: category as CompletionItemWithCategory["category"],
  };
}

export async function getAllCategoriesAdmin(): Promise<CompletionCategory[]> {
  if (!isSupabaseAdminConfigured()) return [];

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("completion_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (data ?? []).map(rowToCategory);
}

export function itemToFormData(item: CompletionItem): CompletionItemFormData {
  return {
    category_id: item.category_id,
    title: item.title,
    description: item.description,
    spoiler: item.spoiler,
    difficulty: item.difficulty,
    image_url: item.image_url ?? "",
    sort_order: item.sort_order,
    status: item.status,
  };
}

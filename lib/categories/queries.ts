import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function listCategories(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, image_url")
    .eq("store_id", storeId)
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  return data ?? [];
}

// Inclui categorias arquivadas — uso exclusivo do painel administrativo.
export async function listAllCategoriesForAdmin(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, description, status")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function getCategoryBySlug(storeId: string, slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, description")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  return data;
}

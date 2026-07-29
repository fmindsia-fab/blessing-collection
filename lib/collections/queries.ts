import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function listCollections(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("collections")
    .select("id, name, slug, image_url")
    .eq("store_id", storeId)
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function getCollectionBySlug(storeId: string, slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("collections")
    .select("id, name, slug, description")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  return data;
}

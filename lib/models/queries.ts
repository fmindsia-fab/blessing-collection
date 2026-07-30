import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function listModels(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("models")
    .select("id, name, slug")
    .eq("store_id", storeId)
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  return data ?? [];
}

// Inclui modelos arquivados — uso exclusivo do painel administrativo.
export async function listAllModelsForAdmin(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("models")
    .select("id, name, slug, description, status")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function getModelBySlug(storeId: string, slug: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("models")
    .select("id, name, slug, description")
    .eq("store_id", storeId)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  return data;
}

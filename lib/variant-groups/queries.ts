import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Grupos ativos da loja — alimenta o datalist de grupo na variante. */
export async function listVariantGroups(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("variant_groups")
    .select("id, name")
    .eq("store_id", storeId)
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  return data ?? [];
}

// Inclui arquivados — uso exclusivo do painel administrativo.
export async function listAllVariantGroupsForAdmin(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("variant_groups")
    .select("id, name, status")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

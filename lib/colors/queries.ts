import { createServerSupabaseClient } from "@/lib/supabase/server";

/** Cores ativas da loja — alimenta o seletor de cor da variante. */
export async function listColors(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("colors")
    .select("id, name, slug, hex, hex_secondary")
    .eq("store_id", storeId)
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  return data ?? [];
}

// Inclui cores arquivadas — uso exclusivo do painel administrativo.
export async function listAllColorsForAdmin(storeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("colors")
    .select("id, name, slug, hex, hex_secondary, status")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

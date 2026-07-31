import { createServerSupabaseClient } from "@/lib/supabase/server";

const PUBLIC_STATUSES = ["available", "made_to_order", "sold_out"] as const;

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

/**
 * Modelos que realmente têm peças no catálogo, com a contagem de cada um.
 *
 * O filtro público não pode listar todos os modelos cadastrados: a loja pode
 * ter 14 modelos e produtos em apenas 1, e as outras 13 opções levariam a
 * "nenhuma peça encontrada" — beco sem saída para a cliente.
 */
export async function listModelsInUse(storeId: string) {
  const supabase = await createServerSupabaseClient();

  const [{ data: models }, { data: products }] = await Promise.all([
    supabase
      .from("models")
      .select("id, name, slug")
      .eq("store_id", storeId)
      .eq("status", "active")
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("model_id")
      .eq("store_id", storeId)
      .in("status", PUBLIC_STATUSES)
      .not("model_id", "is", null),
  ]);

  const countByModel = new Map<string, number>();
  for (const product of products ?? []) {
    if (!product.model_id) continue;
    countByModel.set(product.model_id, (countByModel.get(product.model_id) ?? 0) + 1);
  }

  return (models ?? [])
    .filter((model) => countByModel.has(model.id))
    .map((model) => ({ ...model, count: countByModel.get(model.id)! }));
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

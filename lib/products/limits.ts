import { createServerSupabaseClient } from "@/lib/supabase/server";

// Teste grátis: limite de produtos ativos por loja (ver landing "/").
// Fixo para toda loja por enquanto — não há conceito de plano pago ainda;
// quando existir, este valor passa a depender de stores.plan.
export const FREE_PLAN_PRODUCT_LIMIT = 10;

// inactive não conta: é o "arquivar" da lojista, e contar isso puniria quem
// organiza o catálogo em vez de incentivar.
const COUNTED_STATUSES = ["available", "made_to_order", "sold_out"] as const;

export async function countActiveProducts(storeId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("store_id", storeId)
    .in("status", COUNTED_STATUSES);

  return count ?? 0;
}

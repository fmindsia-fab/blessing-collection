import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { PricingMethodValue, TaxRegime } from "@/types/database.types";

// Dados PRIVADOS da loja (Pix e precificação) — migration 0037. Ficam em
// `store_private`, com RLS só para a dona: a tabela `stores` é legível por
// qualquer visitante (policy pública), então nada sensível pode morar nela.

export type StorePrivate = {
  pix_key: string | null;
  monthly_pay: number;
  monthly_fixed_cost: number;
  productive_hours_per_month: number;
  tax_regime: TaxRegime;
  tax_percent: number;
  default_pricing_method: PricingMethodValue;
  default_margin_percent: number;
};

// Valores de uma loja que ainda não salvou nada (mesmos defaults do banco).
export const STORE_PRIVATE_DEFAULTS: StorePrivate = {
  pix_key: null,
  monthly_pay: 0,
  monthly_fixed_cost: 0,
  productive_hours_per_month: 0,
  tax_regime: "none",
  tax_percent: 0,
  default_pricing_method: "margin",
  default_margin_percent: 50,
};

export const STORE_PRIVATE_COLUMNS =
  "pix_key, monthly_pay, monthly_fixed_cost, productive_hours_per_month, tax_regime, tax_percent, default_pricing_method, default_margin_percent";

// Só a dona enxerga a própria linha (RLS); para qualquer outra pessoa o
// resultado é o padrão vazio, nunca os dados de outra loja.
export async function getStorePrivate(storeId: string): Promise<StorePrivate> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("store_private")
    .select(STORE_PRIVATE_COLUMNS)
    .eq("store_id", storeId)
    .maybeSingle();

  return data ? { ...STORE_PRIVATE_DEFAULTS, ...data } : STORE_PRIVATE_DEFAULTS;
}

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { toCents, percentToBasisPoints } from "./money";
import { calculateLaborRates, type LaborRates, type PaymentMethod } from "./calculate";
import type { PricingMethodValue, TaxRegime } from "@/types/database.types";

export type StorePricingSettings = {
  monthlyPayCents: number;
  monthlyFixedCostCents: number;
  productiveHoursPerMonth: number;
  taxRegime: TaxRegime;
  taxPercent: number;
  defaultMethod: PricingMethodValue;
  defaultRatePercent: number;
  rates: LaborRates;
  /** Alíquota que incide sobre cada venda, em basis points. */
  taxBasisPoints: number;
};

/**
 * Configuração de precificação da loja, já com o valor/hora derivado.
 *
 * O MEI não gera alíquota por venda: o DAS é um valor fixo mensal que a
 * proprietária soma aos custos fixos. Aplicar percentual também sobre a venda
 * cobraria o imposto duas vezes.
 */
export async function getStorePricingSettings(storeId: string): Promise<StorePricingSettings> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("stores")
    .select(
      "monthly_pay, monthly_fixed_cost, productive_hours_per_month, tax_regime, tax_percent, default_pricing_method, default_margin_percent",
    )
    .eq("id", storeId)
    .single();

  const monthlyPayCents = toCents(data?.monthly_pay ?? 0);
  const monthlyFixedCostCents = toCents(data?.monthly_fixed_cost ?? 0);
  const productiveHoursPerMonth = data?.productive_hours_per_month ?? 0;
  const taxRegime = (data?.tax_regime ?? "none") as TaxRegime;
  const taxPercent = data?.tax_percent ?? 0;

  const incidesOnSale = taxRegime === "simples" || taxRegime === "other";

  return {
    monthlyPayCents,
    monthlyFixedCostCents,
    productiveHoursPerMonth,
    taxRegime,
    taxPercent,
    defaultMethod: (data?.default_pricing_method ?? "margin") as PricingMethodValue,
    defaultRatePercent: data?.default_margin_percent ?? 50,
    rates: calculateLaborRates({
      monthlyPayCents,
      monthlyFixedCostCents,
      productiveHoursPerMonth,
    }),
    taxBasisPoints: incidesOnSale ? percentToBasisPoints(taxPercent) : 0,
  };
}

export async function listPaymentMethods(storeId: string): Promise<PaymentMethod[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("payment_methods")
    .select("id, label, fee_percent, installments")
    .eq("store_id", storeId)
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  return (data ?? []).map((method) => ({
    id: method.id,
    label: method.label,
    feeBasisPoints: percentToBasisPoints(method.fee_percent),
    installments: method.installments,
  }));
}

// Inclui arquivadas — uso exclusivo da tela de configurações.
export async function listAllPaymentMethodsForAdmin(storeId: string) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("payment_methods")
    .select("id, label, fee_percent, installments, status")
    .eq("store_id", storeId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function listProductMaterials(productId: string) {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("product_materials")
    .select("id, description, quantity, unit, unit_cost, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

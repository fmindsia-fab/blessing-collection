"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";

export type PricingFormState = {
  error?: string;
  success?: boolean;
};

/** Campo monetário/numérico vindo de <input type="number">, vazio vira 0. */
const optionalNumber = (label: string, max = 9_999_999) =>
  z
    .union([z.literal(""), z.coerce.number().min(0, `${label} não pode ser negativo`).max(max)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? 0 : value));

const settingsSchema = z.object({
  monthlyPay: optionalNumber("A remuneração"),
  monthlyFixedCost: optionalNumber("O custo fixo"),
  productiveHours: optionalNumber("As horas produtivas", 744),
  taxRegime: z.enum(["none", "mei", "simples", "other"]),
  taxPercent: z
    .union([z.literal(""), z.coerce.number().min(0).max(99.99)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? 0 : value)),
  defaultMethod: z.enum(["margin", "markup"]),
  defaultRate: optionalNumber("A margem", 9_999),
});

export async function updatePricingSettings(
  _prevState: PricingFormState,
  formData: FormData,
): Promise<PricingFormState> {
  const parsed = settingsSchema.safeParse({
    monthlyPay: formData.get("monthlyPay"),
    monthlyFixedCost: formData.get("monthlyFixedCost"),
    productiveHours: formData.get("productiveHours"),
    taxRegime: formData.get("taxRegime"),
    taxPercent: formData.get("taxPercent"),
    defaultMethod: formData.get("defaultMethod"),
    defaultRate: formData.get("defaultRate"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;

  // Margem sobre o preço acima de 100% não tem solução: o preço tenderia ao
  // infinito. Markup acima de 100% é legítimo (dobrar o custo).
  if (data.defaultMethod === "margin" && data.defaultRate >= 100) {
    return { error: "Margem sobre o preço precisa ser menor que 100%." };
  }

  // MEI recolhe DAS fixo mensal, não percentual por venda: o valor entra em
  // custos fixos. Guardar um percentual aqui taxaria a peça duas vezes.
  const taxPercent = data.taxRegime === "simples" || data.taxRegime === "other" ? data.taxPercent : 0;

  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("stores")
    .update({
      monthly_pay: data.monthlyPay,
      monthly_fixed_cost: data.monthlyFixedCost,
      productive_hours_per_month: data.productiveHours,
      tax_regime: data.taxRegime,
      tax_percent: taxPercent,
      default_pricing_method: data.defaultMethod,
      default_margin_percent: data.defaultRate,
    })
    .eq("id", store.id);

  if (error) return { error: "Não foi possível salvar as configurações." };

  revalidatePath("/admin/precificacao");
  revalidatePath("/admin/produtos", "layout");
  return { success: true };
}

// ========== FORMAS DE PAGAMENTO ==========

const paymentMethodSchema = z.object({
  label: z.string().trim().min(1, "Informe o nome da forma de pagamento").max(40),
  feePercent: z
    .union([z.literal(""), z.coerce.number().min(0).max(99.99)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? 0 : value)),
  installments: z.coerce.number().int().min(1).max(12),
});

export async function createPaymentMethod(
  _prevState: PricingFormState,
  formData: FormData,
): Promise<PricingFormState> {
  const parsed = paymentMethodSchema.safeParse({
    label: formData.get("label"),
    feePercent: formData.get("feePercent"),
    installments: formData.get("installments"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  const { count } = await supabase
    .from("payment_methods")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id);

  const { error } = await supabase.from("payment_methods").insert({
    store_id: store.id,
    label: parsed.data.label,
    fee_percent: parsed.data.feePercent,
    installments: parsed.data.installments,
    sort_order: count ?? 0,
  });

  if (error) return { error: "Não foi possível adicionar a forma de pagamento." };

  revalidatePath("/admin/precificacao");
  return { success: true };
}

export async function updatePaymentMethodFee(id: string, feePercent: number) {
  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  if (!Number.isFinite(feePercent) || feePercent < 0 || feePercent >= 100) return;

  await supabase
    .from("payment_methods")
    .update({ fee_percent: feePercent })
    .eq("id", id)
    .eq("store_id", store.id);

  revalidatePath("/admin/precificacao");
  revalidatePath("/admin/produtos", "layout");
}

// "Excluir" no painel é sempre soft delete via status.
export async function togglePaymentMethod(id: string, currentStatus: string) {
  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  await supabase
    .from("payment_methods")
    .update({ status: currentStatus === "active" ? "archived" : "active" })
    .eq("id", id)
    .eq("store_id", store.id);

  revalidatePath("/admin/precificacao");
  revalidatePath("/admin/produtos", "layout");
}

// ========== CUSTOS DA PEÇA ==========

// O productId chega do formulário: confirma que pertence à loja ativa antes de
// qualquer escrita. A RLS já bloquearia, mas a checagem explícita é a defesa da
// aplicação (regra do CLAUDE.md).
async function assertProductBelongsToStore(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  productId: string,
) {
  const store = await getActiveStore();
  const { data } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("store_id", store.id)
    .maybeSingle();

  return data !== null;
}

const materialSchema = z.object({
  description: z.string().trim().min(1, "Informe o material").max(80),
  quantity: z.coerce.number().min(0, "Quantidade não pode ser negativa").max(99_999),
  unit: z.string().trim().max(10).default("un"),
  unitCost: optionalNumber("O custo"),
});

export async function addProductMaterial(
  productId: string,
  _prevState: PricingFormState,
  formData: FormData,
): Promise<PricingFormState> {
  const parsed = materialSchema.safeParse({
    description: formData.get("description"),
    quantity: formData.get("quantity") || 1,
    unit: formData.get("unit") || "un",
    unitCost: formData.get("unitCost"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) {
    return { error: "Produto não encontrado." };
  }

  const { count } = await supabase
    .from("product_materials")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId);

  const { error } = await supabase.from("product_materials").insert({
    product_id: productId,
    description: parsed.data.description,
    quantity: parsed.data.quantity,
    unit: parsed.data.unit,
    unit_cost: parsed.data.unitCost,
    sort_order: count ?? 0,
  });

  if (error) return { error: "Não foi possível adicionar o material." };

  revalidatePath(`/admin/produtos/${productId}/editar`);
  return { success: true };
}

// Material é linha de rascunho de custo, não registro de negócio com
// histórico: aqui o DELETE é o comportamento certo.
export async function removeProductMaterial(productId: string, materialId: string) {
  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) return;

  await supabase
    .from("product_materials")
    .delete()
    .eq("id", materialId)
    .eq("product_id", productId);

  revalidatePath(`/admin/produtos/${productId}/editar`);
}

const productPricingSchema = z.object({
  productionHours: optionalNumber("As horas de produção", 9_999),
  otherCosts: optionalNumber("Outros custos"),
  method: z.enum(["margin", "markup", "inherit"]),
  ratePercent: optionalNumber("O percentual", 9_999),
});

export async function updateProductPricing(
  productId: string,
  _prevState: PricingFormState,
  formData: FormData,
): Promise<PricingFormState> {
  const parsed = productPricingSchema.safeParse({
    productionHours: formData.get("productionHours"),
    otherCosts: formData.get("otherCosts"),
    method: formData.get("method") || "inherit",
    ratePercent: formData.get("ratePercent"),
  });

  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;

  if (data.method === "margin" && data.ratePercent >= 100) {
    return { error: "Margem sobre o preço precisa ser menor que 100%." };
  }

  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) {
    return { error: "Produto não encontrado." };
  }

  // "inherit" grava null: a peça passa a seguir o padrão da loja, e mudanças
  // no padrão passam a valer para ela automaticamente.
  const { error } = await supabase
    .from("products")
    .update({
      production_hours: data.productionHours,
      other_costs: data.otherCosts,
      pricing_method: data.method === "inherit" ? null : data.method,
      pricing_rate_percent: data.method === "inherit" ? null : data.ratePercent,
    })
    .eq("id", productId);

  if (error) return { error: "Não foi possível salvar os custos." };

  revalidatePath(`/admin/produtos/${productId}/editar`);
  return { success: true };
}

/** Copia a sugestão calculada para o preço de etiqueta da peça. */
export async function applySuggestedPrice(productId: string, priceReais: number) {
  if (!Number.isFinite(priceReais) || priceReais <= 0) return;

  const supabase = await createServerSupabaseClient();
  if (!(await assertProductBelongsToStore(supabase, productId))) return;

  await supabase.from("products").update({ price: priceReais }).eq("id", productId);

  revalidatePath(`/admin/produtos/${productId}/editar`);
  revalidatePath("/produtos");
  revalidatePath("/");
}

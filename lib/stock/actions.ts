"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getNotOwnerError } from "@/lib/store/ownership";
import { purchasePaymentSchema } from "@/lib/finance/schema";
import { adjustStockSchema, minStockSchema, purchaseSchema } from "./schema";

export type StockFormState = { error?: string; success?: boolean };

function revalidateStock() {
  revalidatePath("/admin/estoque");
  revalidatePath("/admin/compras");
  revalidatePath("/admin/materiais");
  // A compra gera (ou cancela) contas a pagar.
  revalidatePath("/admin/contas-a-pagar");
  revalidatePath("/admin/fluxo-de-caixa");
}

// Mensagens que as funções do banco levantam de propósito (raise exception) são em português e
// seguras de mostrar; qualquer outro erro vira uma frase genérica (o detalhe vai para o log).
function friendlyDbError(error: { code?: string; message: string }, fallback: string): string {
  if (error.code === "P0001") return error.message;
  console.error("[estoque]", error.code, error.message);
  return fallback;
}

export async function createPurchase(_prev: StockFormState, formData: FormData): Promise<StockFormState> {
  let rawItems: unknown = [];
  try {
    rawItems = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Não foi possível ler os itens da compra. Tente de novo." };
  }

  const parsed = purchaseSchema.safeParse({
    purchasedAt: formData.get("purchasedAt"),
    supplier: formData.get("supplier") || undefined,
    freight: formData.get("freight") || 0,
    notes: formData.get("notes") || undefined,
    items: rawItems,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const payment = purchasePaymentSchema.safeParse({
    mode: formData.get("paymentMode") || "paid",
    firstDue: formData.get("firstDue") || undefined,
    installments: formData.get("installments") || 1,
  });
  if (!payment.success) return { error: payment.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { data: purchaseId, error } = await supabase.rpc("create_purchase", {
    p_store_id: store.id,
    p_purchased_at: parsed.data.purchasedAt,
    p_supplier: parsed.data.supplier ?? null,
    p_freight: parsed.data.freight,
    p_notes: parsed.data.notes ?? null,
    p_items: parsed.data.items.map((item) => ({
      material_id: item.materialId,
      quantity: item.quantity,
      total_cost: item.totalCost,
      update_cost: item.updateCost,
    })),
    p_payment_mode: payment.data.mode,
    p_first_due: payment.data.mode === "later" ? (payment.data.firstDue ?? null) : null,
    p_installments: payment.data.mode === "later" ? payment.data.installments : 1,
  });

  if (error || !purchaseId) {
    return { error: error ? friendlyDbError(error, "Não foi possível registrar a compra. Tente novamente.") : "Não foi possível registrar a compra." };
  }

  revalidateStock();
  // O custo do material pode ter mudado: a formação de preço das peças acompanha.
  revalidatePath("/admin/produtos", "layout");
  redirect(`/admin/compras/${purchaseId}`);
}

export async function cancelPurchase(purchaseId: string): Promise<StockFormState> {
  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.rpc("cancel_purchase", { p_purchase_id: purchaseId });
  if (error) return { error: friendlyDbError(error, "Não foi possível cancelar a compra. Tente novamente.") };

  revalidateStock();
  revalidatePath(`/admin/compras/${purchaseId}`);
  return { success: true };
}

export async function adjustStock(materialId: string, quantity: number, note?: string): Promise<StockFormState> {
  const parsed = adjustStockSchema.safeParse({ materialId, quantity, note: note || undefined });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.rpc("adjust_stock", {
    p_material_id: parsed.data.materialId,
    p_new_quantity: parsed.data.quantity,
    p_note: parsed.data.note ?? null,
  });
  if (error) return { error: friendlyDbError(error, "Não foi possível ajustar o estoque. Tente novamente.") };

  revalidateStock();
  revalidatePath(`/admin/estoque/${parsed.data.materialId}`);
  return { success: true };
}

export async function setMinStock(materialId: string, minStock: number | null): Promise<StockFormState> {
  const parsed = minStockSchema.safeParse({ materialId, minStock });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("materials")
    .update({ min_stock: parsed.data.minStock })
    .eq("id", parsed.data.materialId)
    .eq("store_id", store.id);
  if (error) return { error: "Não foi possível salvar o estoque mínimo." };

  revalidatePath("/admin/estoque");
  return { success: true };
}

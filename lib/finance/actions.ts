"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";
import { getNotOwnerError } from "@/lib/store/ownership";
import { cashIncomeSchema, cashOpeningSchema, paymentDateSchema, payableSchema, purchasePaymentSchema } from "./schema";
import { splitInstallments } from "./calc";
import { todayInStoreZone } from "./queries";

export type FinanceFormState = { error?: string; success?: boolean };

function revalidateFinance() {
  revalidatePath("/admin/contas-a-pagar");
  revalidatePath("/admin/fluxo-de-caixa");
  revalidatePath("/admin");
}

// Mensagens que as funções do banco levantam de propósito (raise exception) são em português e
// seguras de mostrar; qualquer outro erro vira uma frase genérica (o detalhe vai para o log).
function friendlyDbError(error: { code?: string; message: string }, fallback: string): string {
  if (error.code === "P0001") return error.message;
  console.error("[financeiro]", error.code, error.message);
  return fallback;
}

export async function createPayable(_prev: FinanceFormState, formData: FormData): Promise<FinanceFormState> {
  const parsed = payableSchema.safeParse({
    description: formData.get("description"),
    category: formData.get("category"),
    supplier: formData.get("supplier") || undefined,
    dueDate: formData.get("dueDate"),
    amount: String(formData.get("amount") ?? "").replace(",", "."),
    recurrence: formData.get("recurrence") === "monthly" ? "monthly" : "none",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("payables").insert({
    store_id: store.id,
    description: parsed.data.description,
    category: parsed.data.category,
    supplier: parsed.data.supplier ?? null,
    due_date: parsed.data.dueDate,
    amount: parsed.data.amount,
    recurrence: parsed.data.recurrence,
  });
  if (error) return { error: friendlyDbError(error, "Não foi possível salvar a conta. Tente novamente.") };

  revalidateFinance();
  redirect("/admin/contas-a-pagar");
}

/** Dá baixa numa conta. Sem data, vale hoje. Se a conta repete todo mês, a do mês seguinte nasce junto. */
export async function markPayablePaid(payableId: string, paidAt?: string): Promise<FinanceFormState> {
  const date = paymentDateSchema.safeParse(paidAt ?? todayInStoreZone());
  if (!date.success) return { error: date.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.rpc("pay_payable", {
    p_store_id: store.id,
    p_payable_id: payableId,
    p_paid_at: date.data,
  });
  if (error) return { error: friendlyDbError(error, "Não foi possível marcar como paga. Tente novamente.") };

  revalidateFinance();
  return { success: true };
}

export async function unmarkPayablePaid(payableId: string): Promise<FinanceFormState> {
  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("payables")
    .update({ paid_at: null })
    .eq("id", payableId)
    .eq("store_id", store.id)
    .eq("status", "active");
  if (error) return { error: friendlyDbError(error, "Não foi possível desfazer o pagamento. Tente novamente.") };

  revalidateFinance();
  return { success: true };
}

// "Excluir" não apaga: a conta fica como cancelada e sai das listas e do fluxo de caixa.
export async function cancelPayable(payableId: string): Promise<FinanceFormState> {
  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("payables")
    .update({ status: "cancelled" })
    .eq("id", payableId)
    .eq("store_id", store.id);
  if (error) return { error: friendlyDbError(error, "Não foi possível remover a conta. Tente novamente.") };

  revalidateFinance();
  return { success: true };
}

export async function addCashIncome(_prev: FinanceFormState, formData: FormData): Promise<FinanceFormState> {
  const parsed = cashIncomeSchema.safeParse({
    description: formData.get("description"),
    amount: String(formData.get("amount") ?? "").replace(",", "."),
    receivedAt: formData.get("receivedAt"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.from("cash_incomes").insert({
    store_id: store.id,
    description: parsed.data.description,
    amount: parsed.data.amount,
    received_at: parsed.data.receivedAt,
  });
  if (error) return { error: friendlyDbError(error, "Não foi possível salvar a entrada. Tente novamente.") };

  revalidateFinance();
  return { success: true };
}

export async function cancelCashIncome(incomeId: string): Promise<FinanceFormState> {
  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("cash_incomes")
    .update({ status: "cancelled" })
    .eq("id", incomeId)
    .eq("store_id", store.id);
  if (error) return { error: friendlyDbError(error, "Não foi possível remover a entrada. Tente novamente.") };

  revalidateFinance();
  return { success: true };
}

export async function saveCashOpening(_prev: FinanceFormState, formData: FormData): Promise<FinanceFormState> {
  const parsed = cashOpeningSchema.safeParse({
    amount: String(formData.get("amount") ?? "").replace(",", "."),
    date: formData.get("date"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("store_private")
    .upsert(
      { store_id: store.id, cash_opening_balance: parsed.data.amount, cash_opening_date: parsed.data.date },
      { onConflict: "store_id" },
    );
  if (error) return { error: friendlyDbError(error, "Não foi possível salvar o saldo inicial. Tente novamente.") };

  revalidateFinance();
  return { success: true };
}

/** Lança as contas de uma compra que ficou sem elas (feita antes do financeiro ou esquecida). */
export async function createPurchasePayables(purchaseId: string, _prev: FinanceFormState, formData: FormData): Promise<FinanceFormState> {
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

  const { data: purchase } = await supabase
    .from("purchases")
    .select("id, purchased_at, supplier, total_amount, status")
    .eq("store_id", store.id)
    .eq("id", purchaseId)
    .maybeSingle();
  if (!purchase) return { error: "Compra não encontrada." };
  if (purchase.status === "cancelled") return { error: "Esta compra foi cancelada." };
  const total = Number(purchase.total_amount);
  if (total <= 0) return { error: "Esta compra não tem valor a pagar." };

  const { count } = await supabase
    .from("payables")
    .select("id", { count: "exact", head: true })
    .eq("store_id", store.id)
    .eq("purchase_id", purchase.id)
    .eq("status", "active");
  if (count && count > 0) return { error: "Esta compra já tem contas lançadas." };

  const label = purchase.supplier ? `Compra - ${purchase.supplier}` : "Compra de materiais";
  const parts =
    payment.data.mode === "paid"
      ? [{ dueDate: purchase.purchased_at, amount: total, paidAt: purchase.purchased_at as string | null }]
      : splitInstallments(total, payment.data.installments, payment.data.firstDue as string).map((part) => ({ ...part, paidAt: null }));

  const { error } = await supabase.from("payables").insert(
    parts.map((part, index) => ({
      store_id: store.id,
      description: `${label}${parts.length > 1 ? ` (${index + 1}/${parts.length})` : ""}`.slice(0, 120),
      category: "supplies" as const,
      supplier: purchase.supplier,
      due_date: part.dueDate,
      amount: part.amount,
      paid_at: part.paidAt,
      purchase_id: purchase.id,
    })),
  );
  if (error) return { error: friendlyDbError(error, "Não foi possível lançar as contas. Tente novamente.") };

  revalidateFinance();
  revalidatePath(`/admin/compras/${purchaseId}`);
  return { success: true };
}

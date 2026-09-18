"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";
import { calculateOrderTotal } from "@/lib/orders/calculate";
import type { OrderStatus } from "@/types/database.types";

export type OrderFormState = {
  error?: string;
  success?: boolean;
};

const optionalNumber = (label: string, max = 9_999_999) =>
  z
    .union([z.literal(""), z.coerce.number().min(0, `${label} não pode ser negativo`).max(max)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? 0 : value));

const optionalDate = z
  .union([z.literal(""), z.string()])
  .optional()
  .transform((value) => (value ? value : null));

const itemSchema = z.object({
  productId: z.string().uuid().optional().or(z.literal("")),
  variantId: z.string().uuid().optional().or(z.literal("")),
  customName: z.string().trim().max(120).optional().default(""),
  customDescription: z.string().trim().max(2000).optional().default(""),
  quantity: z.coerce.number().positive("A quantidade precisa ser maior que zero").max(9_999),
  unitPrice: optionalNumber("O preço do item"),
});

const orderSchema = z.object({
  customerId: z.string().uuid("Selecione a cliente"),
  orderDate: z.string().min(1, "Informe a data do pedido"),
  expectedDeliveryDate: optionalDate,
  notes: z.string().trim().max(2000).optional().default(""),
  productionNotes: z.string().trim().max(2000).optional().default(""),
  depositAmount: optionalNumber("O valor do sinal"),
  depositPaidAt: optionalDate,
  depositPaymentMethodId: z.string().uuid().optional().or(z.literal("")),
  balanceAmount: optionalNumber("O valor do saldo"),
  balancePaidAt: optionalDate,
  balancePaymentMethodId: z.string().uuid().optional().or(z.literal("")),
  items: z.array(itemSchema).min(1, "Adicione ao menos um item ao pedido"),
});

function parseItemsFromFormData(formData: FormData) {
  const count = Number(formData.get("itemCount") ?? 0);
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      productId: formData.get(`items[${i}].productId`) ?? "",
      variantId: formData.get(`items[${i}].variantId`) ?? "",
      customName: formData.get(`items[${i}].customName`) ?? "",
      customDescription: formData.get(`items[${i}].customDescription`) ?? "",
      quantity: formData.get(`items[${i}].quantity`) ?? "1",
      unitPrice: formData.get(`items[${i}].unitPrice`) ?? "",
    });
  }
  return items;
}

function parseOrderFormData(formData: FormData) {
  return {
    customerId: formData.get("customerId"),
    orderDate: formData.get("orderDate"),
    expectedDeliveryDate: formData.get("expectedDeliveryDate") ?? "",
    notes: formData.get("notes") ?? "",
    productionNotes: formData.get("productionNotes") ?? "",
    depositAmount: formData.get("depositAmount") ?? "",
    depositPaidAt: formData.get("depositPaidAt") ?? "",
    depositPaymentMethodId: formData.get("depositPaymentMethodId") ?? "",
    balanceAmount: formData.get("balanceAmount") ?? "",
    balancePaidAt: formData.get("balancePaidAt") ?? "",
    balancePaymentMethodId: formData.get("balancePaymentMethodId") ?? "",
    items: parseItemsFromFormData(formData),
  };
}

async function assertCustomerBelongsToStore(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  storeId: string,
  customerId: string,
) {
  const { data } = await supabase
    .from("customers")
    .select("id")
    .eq("id", customerId)
    .eq("store_id", storeId)
    .maybeSingle();
  return data !== null;
}

export async function createOrder(
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const parsed = orderSchema.safeParse(parseOrderFormData(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;

  // Item avulso exige nome digitado; item de catálogo já tem nome próprio.
  for (const item of data.items) {
    if (!item.productId && !item.customName.trim()) {
      return { error: "Cada item precisa de um produto do catálogo ou um nome digitado." };
    }
  }

  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  if (!(await assertCustomerBelongsToStore(supabase, store.id, data.customerId))) {
    return { error: "Cliente não encontrada." };
  }

  const totalAmount = calculateOrderTotal(data.items);

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      store_id: store.id,
      customer_id: data.customerId,
      order_date: data.orderDate,
      expected_delivery_date: data.expectedDeliveryDate,
      notes: data.notes || null,
      production_notes: data.productionNotes || null,
      deposit_amount: data.depositAmount,
      deposit_paid_at: data.depositPaidAt,
      deposit_payment_method_id: data.depositPaymentMethodId || null,
      balance_amount: data.balanceAmount,
      balance_paid_at: data.balancePaidAt,
      balance_payment_method_id: data.balancePaymentMethodId || null,
      total_amount: totalAmount,
    })
    .select("id")
    .single();

  if (error || !order) {
    if (error) console.error("createOrder (pedido) falhou:", error.message);
    return { error: "Não foi possível criar o pedido." };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    data.items.map((item, index) => ({
      order_id: order.id,
      product_id: item.productId || null,
      variant_id: item.variantId || null,
      custom_name: item.productId ? null : item.customName.trim(),
      custom_description: item.productId ? null : item.customDescription.trim() || null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      sort_order: index,
    })),
  );

  if (itemsError) {
    console.error("createOrder (itens) falhou:", itemsError.message);
    // Sem itens, o pedido fica órfão — melhor desfazer do que deixar um
    // registro inconsistente no painel.
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: "Não foi possível salvar os itens do pedido." };
  }

  revalidatePath("/admin/pedidos");
  redirect(`/admin/pedidos/${order.id}`);
}

export async function updateOrder(
  orderId: string,
  _prevState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const parsed = orderSchema.safeParse(parseOrderFormData(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const data = parsed.data;

  for (const item of data.items) {
    if (!item.productId && !item.customName.trim()) {
      return { error: "Cada item precisa de um produto do catálogo ou um nome digitado." };
    }
  }

  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("id", orderId)
    .eq("store_id", store.id)
    .maybeSingle();
  if (!existing) return { error: "Pedido não encontrado." };

  if (!(await assertCustomerBelongsToStore(supabase, store.id, data.customerId))) {
    return { error: "Cliente não encontrada." };
  }

  const totalAmount = calculateOrderTotal(data.items);

  const { error } = await supabase
    .from("orders")
    .update({
      customer_id: data.customerId,
      order_date: data.orderDate,
      expected_delivery_date: data.expectedDeliveryDate,
      notes: data.notes || null,
      production_notes: data.productionNotes || null,
      deposit_amount: data.depositAmount,
      deposit_paid_at: data.depositPaidAt,
      deposit_payment_method_id: data.depositPaymentMethodId || null,
      balance_amount: data.balanceAmount,
      balance_paid_at: data.balancePaidAt,
      balance_payment_method_id: data.balancePaymentMethodId || null,
      total_amount: totalAmount,
    })
    .eq("id", orderId)
    .eq("store_id", store.id);

  if (error) return { error: "Não foi possível salvar o pedido." };

  // Reescreve todos os itens: mais simples e seguro que diffar item a item
  // num formulário onde linhas podem ser adicionadas/removidas livremente.
  await supabase.from("order_items").delete().eq("order_id", orderId);
  const { error: itemsError } = await supabase.from("order_items").insert(
    data.items.map((item, index) => ({
      order_id: orderId,
      product_id: item.productId || null,
      variant_id: item.variantId || null,
      custom_name: item.productId ? null : item.customName.trim(),
      custom_description: item.productId ? null : item.customDescription.trim() || null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      sort_order: index,
    })),
  );

  if (itemsError) return { error: "Não foi possível salvar os itens do pedido." };

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  return { success: true };
}

const VALID_STATUSES: OrderStatus[] = [
  "quote",
  "confirmed",
  "in_production",
  "ready",
  "delivered",
  "cancelled",
];

export async function updateOrderStatus(orderId: string, status: string) {
  if (!VALID_STATUSES.includes(status as OrderStatus)) return;

  const store = await getActiveStore();
  const supabase = await createServerSupabaseClient();

  const update: { status: OrderStatus; delivered_at?: string | null } = { status: status as OrderStatus };
  // `delivered_at` marca o momento real da entrega; sai automaticamente do
  // status "entregue" para não exigir um segundo campo manual no formulário.
  if (status === "delivered") update.delivered_at = new Date().toISOString();
  if (status !== "delivered") update.delivered_at = null;

  await supabase.from("orders").update(update).eq("id", orderId).eq("store_id", store.id);

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
}

// Encomenda cancelada não deve mais aparecer nas listas/alertas de trabalho
// pendente, mas o registro fica no histórico (nunca DELETE, regra do
// CLAUDE.md) — trocar o status para "cancelled" já cobre isso, sem exclusão.
export async function cancelOrder(orderId: string) {
  await updateOrderStatus(orderId, "cancelled");
}

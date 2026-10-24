"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getActiveStore } from "@/lib/store/get-active-store";
import { calculateOrderTotal } from "@/lib/orders/calculate";
import type { OrderStatus } from "@/types/database.types";
import { getNotOwnerError } from "@/lib/store/ownership";
import {
  buildItemVariantRows,
  parseVariantIds,
  type ItemVariantRow,
  type VariantRecord,
} from "@/lib/orders/item-variants";

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
  // Ids separados por vírgula: nenhuma, uma ou várias variações (uma de cada grupo).
  variantIds: z
    .string()
    .optional()
    .default("")
    .transform((value) => parseVariantIds(value))
    .pipe(z.array(z.string().uuid("Variação inválida.")).max(12, "Variações demais num item.")),
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
      variantIds: formData.get(`items[${i}].variantIds`) ?? "",
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

type ParsedItem = z.infer<typeof itemSchema>;

/**
 * Confere, antes de gravar, que as peças do pedido são da loja e que as variações escolhidas
 * existem, são da peça e não repetem grupo. Devolve as linhas de variação de cada item (na mesma
 * ordem dos itens).
 */
async function prepareItems(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  storeId: string,
  items: ParsedItem[],
): Promise<{ rowsByItem: ItemVariantRow[][] } | { error: string }> {
  const productIds = [...new Set(items.map((item) => item.productId).filter((id): id is string => Boolean(id)))];

  const prices = new Map<string, number>();
  if (productIds.length > 0) {
    const { data } = await supabase.from("products").select("id, price").eq("store_id", storeId).in("id", productIds);
    for (const product of data ?? []) prices.set(product.id, Number(product.price));
    if (prices.size !== productIds.length) return { error: "Uma das peças do pedido não foi encontrada." };
  }

  const variantIds = [...new Set(items.flatMap((item) => item.variantIds))];
  const records = new Map<string, VariantRecord>();
  if (variantIds.length > 0) {
    const { data } = await supabase
      .from("product_variants")
      .select("id, product_id, name, variant_group, price, status, is_required")
      .in("id", variantIds);
    for (const variant of data ?? []) {
      records.set(variant.id, { ...variant, price: variant.price === null ? null : Number(variant.price) });
    }
  }

  const rowsByItem: ItemVariantRow[][] = [];
  for (const item of items) {
    if (!item.productId) {
      if (item.variantIds.length > 0) return { error: "Item avulso não tem variações do catálogo." };
      rowsByItem.push([]);
      continue;
    }
    const built = buildItemVariantRows(prices.get(item.productId) ?? 0, item.variantIds, records, item.productId);
    if ("error" in built) return built;
    rowsByItem.push(built.rows);
  }

  return { rowsByItem };
}

/** Grava os itens do pedido e as variações de cada um. Devolve a mensagem de erro, ou null se deu certo. */
async function saveOrderItems(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  orderId: string,
  items: ParsedItem[],
  rowsByItem: ItemVariantRow[][],
): Promise<string | null> {
  const { data: inserted, error } = await supabase
    .from("order_items")
    .insert(
      items.map((item, index) => ({
        order_id: orderId,
        product_id: item.productId || null,
        // Compatibilidade: a coluna antiga guarda a primeira variação; a lista completa fica em order_item_variants.
        variant_id: rowsByItem[index]?.[0]?.variant_id ?? null,
        custom_name: item.productId ? null : item.customName.trim(),
        custom_description: item.productId ? null : item.customDescription.trim() || null,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        sort_order: index,
      })),
    )
    .select("id, sort_order");

  if (error || !inserted) return error?.message ?? "sem itens gravados";

  const variantRows = inserted.flatMap((row) =>
    (rowsByItem[row.sort_order] ?? []).map((variant) => ({ order_item_id: row.id, ...variant })),
  );
  if (variantRows.length > 0) {
    const { error: variantsError } = await supabase.from("order_item_variants").insert(variantRows);
    if (variantsError) return variantsError.message;
  }

  return null;
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
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  if (!(await assertCustomerBelongsToStore(supabase, store.id, data.customerId))) {
    return { error: "Cliente não encontrada." };
  }

  const prepared = await prepareItems(supabase, store.id, data.items);
  if ("error" in prepared) return { error: prepared.error };

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

  const itemsError = await saveOrderItems(supabase, order.id, data.items, prepared.rowsByItem);

  if (itemsError) {
    console.error("createOrder (itens) falhou:", itemsError);
    // Sem itens, o pedido fica órfão — melhor desfazer do que deixar um
    // registro inconsistente no painel.
    await supabase.from("orders").delete().eq("id", order.id).eq("store_id", store.id);
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
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
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

  const prepared = await prepareItems(supabase, store.id, data.items);
  if ("error" in prepared) return { error: prepared.error };

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
  const itemsError = await saveOrderItems(supabase, orderId, data.items, prepared.rowsByItem);

  if (itemsError) {
    console.error("updateOrder (itens) falhou:", itemsError);
    return { error: "Não foi possível salvar os itens do pedido." };
  }

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

export type OrderStatusResult = {
  error?: string;
  /** Quantos materiais foram descontados do estoque nesta troca de situação. */
  consumed?: number;
  /** Quantos materiais foram devolvidos ao estoque. */
  returned?: number;
  /** Materiais que ficaram com saldo negativo por causa deste pedido (só aviso). */
  shortages?: { name: string; unit: string; short: number }[];
};

/**
 * Troca a situação do pedido. A troca e a baixa/devolução de estoque acontecem na MESMA transação,
 * dentro da função set_order_status do banco (migration 0045), para os dois nunca ficarem
 * desencontrados. `delivered_at` também é decidido lá: marca a entrega real ao ir para "Entregue".
 *
 * `returnStock` só importa ao cancelar um pedido que já baixou insumos: true devolve ao estoque.
 */
export async function updateOrderStatus(
  orderId: string,
  status: string,
  returnStock?: boolean,
): Promise<OrderStatusResult> {
  if (!VALID_STATUSES.includes(status as OrderStatus)) return { error: "Situação do pedido inválida." };

  const store = await getActiveStore();
  const notOwnerError = await getNotOwnerError(store);
  if (notOwnerError) return { error: notOwnerError };
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc("set_order_status", {
    p_store_id: store.id,
    p_order_id: orderId,
    p_status: status,
    p_return_stock: returnStock ?? null,
  });

  if (error) {
    console.error("[updateOrderStatus]", error.code, error.message);
    return { error: error.code === "P0001" ? error.message : "Não foi possível mudar a situação do pedido." };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${orderId}`);
  // Mexer na produção muda o estoque e a lista de materiais a comprar.
  revalidatePath("/admin/estoque");
  revalidatePath("/admin/pedidos/dashboard");

  return { consumed: data?.consumed ?? 0, returned: data?.returned ?? 0, shortages: data?.shortages ?? [] };
}

// Encomenda cancelada não deve mais aparecer nas listas/alertas de trabalho
// pendente, mas o registro fica no histórico (nunca DELETE, regra do
// CLAUDE.md) — trocar o status para "cancelled" já cobre isso, sem exclusão.
export async function cancelOrder(orderId: string, returnStock?: boolean): Promise<OrderStatusResult> {
  return updateOrderStatus(orderId, "cancelled", returnStock);
}

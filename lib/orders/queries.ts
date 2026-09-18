import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateProductionList } from "@/lib/orders/calculate";
import type { OrderStatus } from "@/types/database.types";

export type OrderListRow = {
  id: string;
  status: OrderStatus;
  order_date: string;
  expected_delivery_date: string | null;
  total_amount: number;
  customer: { id: string; name: string } | null;
};

/** OrderListRow + resumo dos itens (nome/capa), usado nos cards do Kanban. */
export type OrderKanbanRow = OrderListRow & {
  itemsSummary: { label: string; coverImageUrl: string | null };
};

/**
 * Busca o(s) nome(s) dos itens de cada pedido e a foto de capa do primeiro
 * item que é produto do catálogo — usado no Kanban, sem N+1 (uma query para
 * todos os pedidos da tela, não uma por pedido).
 */
async function attachItemsSummary<T extends { id: string }>(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  orders: T[],
): Promise<(T & { itemsSummary: { label: string; coverImageUrl: string | null } })[]> {
  if (orders.length === 0) return [];

  const { data: items } = await supabase
    .from("order_items")
    .select("order_id, custom_name, sort_order, product:products(id, name)")
    .in(
      "order_id",
      orders.map((o) => o.id),
    )
    .order("sort_order", { ascending: true });

  const itemsByOrder = new Map<string, { name: string; productId: string | null }[]>();
  for (const item of items ?? []) {
    const product = Array.isArray(item.product) ? (item.product[0] ?? null) : item.product;
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push({ name: product?.name ?? item.custom_name ?? "Item", productId: product?.id ?? null });
    itemsByOrder.set(item.order_id, list);
  }

  // Capa do primeiro item de catálogo de cada pedido (um único IN para todos).
  const firstProductIds = [...itemsByOrder.values()]
    .map((list) => list.find((i) => i.productId)?.productId)
    .filter((id): id is string => Boolean(id));

  const { data: covers } =
    firstProductIds.length > 0
      ? await supabase
          .from("product_images")
          .select("product_id, url")
          .in("product_id", firstProductIds)
          .eq("is_cover", true)
      : { data: [] };

  const coverByProduct = new Map((covers ?? []).map((c) => [c.product_id, c.url]));

  return orders.map((order) => {
    const list = itemsByOrder.get(order.id) ?? [];
    const names = list.map((i) => i.name);
    const label =
      names.length === 0
        ? "Sem itens"
        : names.length === 1
          ? names[0]
          : `${names[0]} +${names.length - 1}`;
    const firstProductId = list.find((i) => i.productId)?.productId ?? null;

    return {
      ...order,
      itemsSummary: {
        label,
        coverImageUrl: firstProductId ? (coverByProduct.get(firstProductId) ?? null) : null,
      },
    };
  });
}

/** Produtos/variantes ativos, para o seletor de item do pedido. */
export async function listProductsForOrderPicker(storeId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, price")
    .eq("store_id", storeId)
    .neq("status", "inactive")
    .order("name", { ascending: true });

  if (!products || products.length === 0) return [];

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, product_id, name, color, size, price")
    .in(
      "product_id",
      products.map((p) => p.id),
    )
    .neq("status", "archived")
    .order("sort_order", { ascending: true });

  const variantsByProduct = new Map<string, typeof variants>();
  for (const variant of variants ?? []) {
    const list = variantsByProduct.get(variant.product_id) ?? [];
    list.push(variant);
    variantsByProduct.set(variant.product_id, list);
  }

  return products.map((product) => ({
    ...product,
    variants: variantsByProduct.get(product.id) ?? [],
  }));
}

export async function listOrders(
  storeId: string,
  filters: { status?: OrderStatus; search?: string } = {},
): Promise<OrderKanbanRow[]> {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from("orders")
    .select("id, status, order_date, expected_delivery_date, total_amount, customer:customers(id, name)")
    .eq("store_id", storeId)
    .order("order_date", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) {
    console.error("listOrders falhou:", error.message);
    return [];
  }
  let rows = (data ?? []).map((row) => ({
    ...row,
    customer: Array.isArray(row.customer) ? (row.customer[0] ?? null) : row.customer,
  }));

  // Busca por nome de cliente em memória: a lista de pedidos de uma loja
  // pequena não justifica full-text search no banco.
  if (filters.search) {
    const term = filters.search.trim().toLowerCase();
    if (term) rows = rows.filter((row) => row.customer?.name.toLowerCase().includes(term));
  }

  return attachItemsSummary(supabase, rows);
}

/**
 * Pedidos em aberto com previsão de entrega vencida — alerta de atraso do
 * painel (decisão do usuário: único extra de boas práticas incluído no M12).
 */
export async function listOverdueOrders(storeId: string): Promise<OrderListRow[]> {
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("orders")
    .select("id, status, order_date, expected_delivery_date, total_amount, customer:customers(id, name)")
    .eq("store_id", storeId)
    .not("status", "in", "(delivered,cancelled)")
    .not("expected_delivery_date", "is", null)
    .lt("expected_delivery_date", today)
    .order("expected_delivery_date", { ascending: true });

  return (data ?? []).map((row) => ({
    ...row,
    customer: Array.isArray(row.customer) ? (row.customer[0] ?? null) : row.customer,
  }));
}

/** Pedidos com previsão de entrega dentro do mês informado — calendário. */
export async function listOrdersForMonth(storeId: string, year: number, month: number) {
  const supabase = await createServerSupabaseClient();
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 1).toISOString().slice(0, 10);

  const { data } = await supabase
    .from("orders")
    .select("id, status, expected_delivery_date, customer:customers(id, name)")
    .eq("store_id", storeId)
    .gte("expected_delivery_date", start)
    .lt("expected_delivery_date", end)
    .order("expected_delivery_date", { ascending: true });

  const rows = (data ?? []).map((row) => ({
    ...row,
    customer: Array.isArray(row.customer) ? (row.customer[0] ?? null) : row.customer,
  }));

  return attachItemsSummary(supabase, rows);
}

export async function getOrder(storeId: string, orderId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*, customer:customers(id, name, phone)")
    .eq("id", orderId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (orderError) console.error("getOrder (pedido) falhou:", orderError.message);
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select(
      "id, product_id, variant_id, custom_name, custom_description, quantity, unit_price, sort_order, product:products(id, name), variant:product_variants(id, name, color, size)",
    )
    .eq("order_id", orderId)
    .order("sort_order", { ascending: true });

  if (itemsError) console.error("getOrder (itens) falhou:", itemsError.message);

  const resolvedItems = (items ?? []).map((item) => ({
    ...item,
    product: Array.isArray(item.product) ? (item.product[0] ?? null) : item.product,
    variant: Array.isArray(item.variant) ? (item.variant[0] ?? null) : item.variant,
  }));

  const productIds = [...new Set(resolvedItems.map((item) => item.product?.id).filter((id): id is string => Boolean(id)))];
  const { data: covers } =
    productIds.length > 0
      ? await supabase
          .from("product_images")
          .select("product_id, url")
          .in("product_id", productIds)
          .eq("is_cover", true)
      : { data: [] };
  const coverByProduct = new Map((covers ?? []).map((c) => [c.product_id, c.url]));

  return {
    order: {
      ...order,
      customer: Array.isArray(order.customer) ? (order.customer[0] ?? null) : order.customer,
    },
    items: resolvedItems.map((item) => ({
      ...item,
      coverImageUrl: item.product ? (coverByProduct.get(item.product.id) ?? null) : null,
    })),
  };
}

/**
 * Lista de materiais para produção: soma dos materiais cadastrados em cada
 * peça do catálogo presente no pedido, multiplicados pela quantidade
 * encomendada. Itens avulsos (sem product_id) não entram aqui — não têm
 * materiais cadastrados; ficam cobertos pelo campo livre `production_notes`.
 */
export async function getOrderProductionList(orderId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId)
    .not("product_id", "is", null);

  if (itemsError) console.error("getOrderProductionList (itens) falhou:", itemsError.message);
  if (!items || items.length === 0) return [];

  const productIds = [...new Set(items.map((item) => item.product_id as string))];

  const { data: materials, error: materialsError } = await supabase
    .from("product_materials")
    .select("product_id, description, quantity, unit, material_id, materials(name, unit)")
    .in("product_id", productIds);

  if (materialsError) console.error("getOrderProductionList (materiais) falhou:", materialsError.message);

  const quantityByProduct = new Map<string, number>();
  for (const item of items) {
    const productId = item.product_id as string;
    quantityByProduct.set(productId, (quantityByProduct.get(productId) ?? 0) + item.quantity);
  }

  const materialInputs = (materials ?? []).map((material) => {
    const catalogMaterial = Array.isArray(material.materials) ? material.materials[0] : material.materials;
    return {
      productId: material.product_id,
      name: catalogMaterial?.name ?? material.description,
      unit: catalogMaterial?.unit ?? material.unit,
      quantityPerUnit: material.quantity,
    };
  });

  return calculateProductionList(quantityByProduct, materialInputs);
}

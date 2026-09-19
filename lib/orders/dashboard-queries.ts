import { createServerSupabaseClient } from "@/lib/supabase/server";
import { calculateProductionList } from "@/lib/orders/calculate";
import {
  calculateFinancialSummary,
  calculateStatusBreakdown,
  calculateTopEntries,
  type FinancialSummary,
  type StatusCount,
  type TopEntry,
} from "@/lib/orders/dashboard-calculate";

export const ORDER_DASHBOARD_PERIODS = ["7", "30", "90", "total"] as const;
export type OrderDashboardPeriod = (typeof ORDER_DASHBOARD_PERIODS)[number];

export const ORDER_DASHBOARD_PERIOD_LABEL: Record<OrderDashboardPeriod, string> = {
  "7": "Últimos 7 dias",
  "30": "Últimos 30 dias",
  "90": "Últimos 90 dias",
  total: "Todo o período",
};

export function parseOrderDashboardPeriod(value: string | undefined): OrderDashboardPeriod {
  return ORDER_DASHBOARD_PERIODS.includes(value as OrderDashboardPeriod)
    ? (value as OrderDashboardPeriod)
    : "30";
}

function periodStartDate(period: OrderDashboardPeriod): string | null {
  if (period === "total") return null;
  const days = Number(period);
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export type OrderDashboardData = {
  financial: FinancialSummary;
  statusBreakdown: StatusCount[];
  overdueCount: number;
  overdueAmount: number;
  topProducts: TopEntry[];
  topCustomers: TopEntry[];
  totalOrders: number;
};

/**
 * Todos os indicadores do dashboard de pedidos numa só função: as queries de
 * banco compartilham o mesmo conjunto de pedidos do período (busca uma vez,
 * agrega em memória com as funções puras de dashboard-calculate.ts) — mais
 * simples que uma RPC por indicador para o volume de pedidos de uma loja.
 */
export async function getOrderDashboardData(
  storeId: string,
  period: OrderDashboardPeriod,
): Promise<OrderDashboardData> {
  const supabase = await createServerSupabaseClient();
  const start = periodStartDate(period);
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("orders")
    .select(
      "id, status, order_date, expected_delivery_date, total_amount, deposit_amount, deposit_paid_at, balance_amount, balance_paid_at, customer:customers(id, name)",
    )
    .eq("store_id", storeId);

  if (start) query = query.gte("order_date", start);

  const { data: orders, error } = await query;
  if (error) {
    console.error("getOrderDashboardData (pedidos) falhou:", error.message);
    return {
      financial: { received: 0, pending: 0, averageTicket: 0 },
      statusBreakdown: [],
      overdueCount: 0,
      overdueAmount: 0,
      topProducts: [],
      topCustomers: [],
      totalOrders: 0,
    };
  }

  const rows = (orders ?? []).map((row) => ({
    ...row,
    customer: Array.isArray(row.customer) ? (row.customer[0] ?? null) : row.customer,
  }));

  const financial = calculateFinancialSummary(
    rows.map((row) => ({
      status: row.status,
      depositAmount: row.deposit_amount,
      depositPaidAt: row.deposit_paid_at,
      balanceAmount: row.balance_amount,
      balancePaidAt: row.balance_paid_at,
    })),
  );

  const statusBreakdown = calculateStatusBreakdown(
    rows.map((row) => ({ status: row.status, totalAmount: row.total_amount })),
  );

  const overdueOrders = rows.filter(
    (row) =>
      row.status !== "delivered" &&
      row.status !== "cancelled" &&
      row.expected_delivery_date !== null &&
      row.expected_delivery_date < today,
  );
  const overdueCount = overdueOrders.length;
  const overdueAmount = overdueOrders.reduce((sum, row) => sum + row.total_amount, 0);

  const orderIds = rows.filter((row) => row.status !== "cancelled").map((row) => row.id);

  const topCustomers = calculateTopEntries(
    rows
      .filter((row) => row.status !== "cancelled")
      .map((row) => ({
        key: row.customer?.id ?? "sem-cliente",
        label: row.customer?.name ?? "Cliente",
        amount: row.total_amount,
      })),
  );

  let topProducts: TopEntry[] = [];
  if (orderIds.length > 0) {
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("order_id, product_id, custom_name, quantity, unit_price, product:products(id, name)")
      .in("order_id", orderIds);

    if (itemsError) console.error("getOrderDashboardData (itens) falhou:", itemsError.message);

    topProducts = calculateTopEntries(
      (items ?? []).map((item) => {
        const product = Array.isArray(item.product) ? (item.product[0] ?? null) : item.product;
        return {
          key: product?.id ?? `avulso:${item.custom_name}`,
          label: product?.name ?? item.custom_name ?? "Item",
          amount: item.quantity * item.unit_price,
        };
      }),
    );
  }

  return {
    financial,
    statusBreakdown,
    overdueCount,
    overdueAmount,
    topProducts,
    topCustomers,
    totalOrders: rows.filter((row) => row.status !== "cancelled").length,
  };
}

/**
 * Materiais a comprar: soma dos materiais cadastrados em cada peça do
 * catálogo presente em pedidos com status "confirmed" — decisão do usuário:
 * estritamente esse status, não "em produção" (que já pode ter material
 * comprado). Reaproveita calculateProductionList (mesma lógica por pedido,
 * agregada aqui entre todos os pedidos confirmados).
 */
export async function getMaterialsToBuy(storeId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: confirmedOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("store_id", storeId)
    .eq("status", "confirmed");

  if (!confirmedOrders || confirmedOrders.length === 0) return [];

  const orderIds = confirmedOrders.map((o) => o.id);

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .in("order_id", orderIds)
    .not("product_id", "is", null);

  if (!items || items.length === 0) return [];

  const productIds = [...new Set(items.map((item) => item.product_id as string))];

  const { data: materials } = await supabase
    .from("product_materials")
    .select("product_id, description, quantity, unit, material_id, materials(name, unit)")
    .in("product_id", productIds);

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

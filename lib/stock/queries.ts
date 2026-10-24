import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { OrderCostMovement } from "./calc";

export type StockRow = {
  id: string;
  name: string;
  unit: string;
  unitCost: number;
  tracked: boolean;
  minStock: number | null;
  stock: number;
};

/** Materiais ativos com o saldo de cada um (view material_stock). Sempre filtrado pela loja. */
export async function listStockOverview(storeId: string): Promise<StockRow[]> {
  const supabase = await createServerSupabaseClient();

  const [{ data: materials }, { data: balances }] = await Promise.all([
    supabase
      .from("materials")
      .select("id, name, unit, unit_cost, track_stock, min_stock")
      .eq("store_id", storeId)
      .eq("status", "active")
      .order("name", { ascending: true }),
    supabase.from("material_stock").select("material_id, stock").eq("store_id", storeId),
  ]);

  const stockById = new Map((balances ?? []).map((row) => [row.material_id, Number(row.stock)]));

  return (materials ?? []).map((material) => ({
    id: material.id,
    name: material.name,
    unit: material.unit,
    unitCost: Number(material.unit_cost),
    tracked: material.track_stock,
    minStock: material.min_stock === null ? null : Number(material.min_stock),
    stock: stockById.get(material.id) ?? 0,
  }));
}

export type MovementRow = {
  id: string;
  kind: "purchase" | "consumption" | "return" | "adjustment";
  quantity: number;
  unitCost: number | null;
  note: string | null;
  createdAt: string;
  purchaseId: string | null;
  orderId: string | null;
};

export type PricePoint = {
  date: string;
  supplier: string | null;
  quantity: number;
  totalCost: number;
  unitCost: number;
  purchaseId: string;
};

/** Tudo da tela "Extrato" de um material: saldo, movimentos recentes e preços pagos nas compras. */
export async function getMaterialStockDetail(storeId: string, materialId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: material } = await supabase
    .from("materials")
    .select("id, name, unit, unit_cost, track_stock, min_stock")
    .eq("store_id", storeId)
    .eq("id", materialId)
    .maybeSingle();
  if (!material) return null;

  const [{ data: balance }, { data: movements }, { data: items }] = await Promise.all([
    supabase.from("material_stock").select("stock").eq("store_id", storeId).eq("material_id", materialId).maybeSingle(),
    supabase
      .from("stock_movements")
      .select("id, kind, quantity, unit_cost, note, created_at, order_id, purchase_items(purchase_id)")
      .eq("store_id", storeId)
      .eq("material_id", materialId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("purchase_items")
      .select("quantity, total_cost, unit_cost, purchases!inner(id, store_id, purchased_at, supplier, status)")
      .eq("material_id", materialId)
      .eq("purchases.store_id", storeId)
      .eq("purchases.status", "active"),
  ]);

  const one = <T,>(value: T | T[] | null | undefined): T | null =>
    Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

  const pricePoints: PricePoint[] = (items ?? [])
    .map((item) => {
      const purchase = one(item.purchases);
      if (!purchase) return null;
      return {
        date: purchase.purchased_at,
        supplier: purchase.supplier,
        quantity: Number(item.quantity),
        totalCost: Number(item.total_cost),
        unitCost: Number(item.unit_cost),
        purchaseId: purchase.id,
      };
    })
    .filter((point): point is PricePoint => point !== null)
    .sort((a, b) => b.date.localeCompare(a.date));

  return {
    material: {
      id: material.id,
      name: material.name,
      unit: material.unit,
      unitCost: Number(material.unit_cost),
      tracked: material.track_stock,
      minStock: material.min_stock === null ? null : Number(material.min_stock),
    },
    stock: Number(balance?.stock ?? 0),
    movements: (movements ?? []).map(
      (movement): MovementRow => ({
        id: movement.id,
        kind: movement.kind,
        quantity: Number(movement.quantity),
        unitCost: movement.unit_cost === null ? null : Number(movement.unit_cost),
        note: movement.note,
        createdAt: movement.created_at,
        purchaseId: one(movement.purchase_items)?.purchase_id ?? null,
        orderId: movement.order_id,
      }),
    ),
    pricePoints,
  };
}

export type PurchaseListRow = {
  id: string;
  purchasedAt: string;
  supplier: string | null;
  totalAmount: number;
  status: "active" | "cancelled";
  itemCount: number;
};

export async function listPurchases(storeId: string, limit = 100): Promise<PurchaseListRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("purchases")
    .select("id, purchased_at, supplier, total_amount, status, purchase_items(count)")
    .eq("store_id", storeId)
    .order("purchased_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((purchase) => {
    const counter = Array.isArray(purchase.purchase_items) ? purchase.purchase_items[0] : purchase.purchase_items;
    return {
      id: purchase.id,
      purchasedAt: purchase.purchased_at,
      supplier: purchase.supplier,
      totalAmount: Number(purchase.total_amount),
      status: purchase.status,
      itemCount: Number((counter as { count?: number } | null)?.count ?? 0),
    };
  });
}

export async function getPurchase(storeId: string, purchaseId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: purchase } = await supabase
    .from("purchases")
    .select("id, purchased_at, supplier, freight, total_amount, notes, status, cancelled_at, created_at")
    .eq("store_id", storeId)
    .eq("id", purchaseId)
    .maybeSingle();
  if (!purchase) return null;

  const { data: items } = await supabase
    .from("purchase_items")
    .select("id, quantity, total_cost, unit_cost, materials(id, name, unit)")
    .eq("purchase_id", purchase.id)
    .order("created_at", { ascending: true });

  return {
    purchase,
    items: (items ?? []).map((item) => {
      const material = Array.isArray(item.materials) ? item.materials[0] : item.materials;
      return {
        id: item.id,
        materialId: material?.id ?? null,
        materialName: material?.name ?? "Material",
        unit: material?.unit ?? "un",
        quantity: Number(item.quantity),
        totalCost: Number(item.total_cost),
        unitCost: Number(item.unit_cost),
      };
    }),
  };
}

/** Fornecedores já usados nas compras (para sugerir ao digitar), sem repetir. */
export async function listSuppliers(storeId: string): Promise<string[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("purchases")
    .select("supplier")
    .eq("store_id", storeId)
    .not("supplier", "is", null)
    .order("created_at", { ascending: false })
    .limit(300);

  return [...new Set((data ?? []).map((row) => row.supplier).filter((name): name is string => Boolean(name)))];
}

export type PurchasableMaterial = { id: string; name: string; unit: string; unitCost: number; tracked: boolean };

export async function listPurchasableMaterials(storeId: string): Promise<PurchasableMaterial[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("materials")
    .select("id, name, unit, unit_cost, track_stock")
    .eq("store_id", storeId)
    .eq("status", "active")
    .order("name", { ascending: true });

  return (data ?? []).map((material) => ({
    id: material.id,
    name: material.name,
    unit: material.unit,
    unitCost: Number(material.unit_cost),
    tracked: material.track_stock,
  }));
}

/** Baixas e devoluções de estoque de um pedido, com o custo do dia (base do custo real do pedido). */
export async function getOrderStockMovements(storeId: string, orderId: string): Promise<OrderCostMovement[]> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("stock_movements")
    .select("material_id, quantity, unit_cost, materials(name, unit)")
    .eq("store_id", storeId)
    .eq("order_id", orderId)
    .in("kind", ["consumption", "return"]);

  return (data ?? []).map((row) => {
    const material = Array.isArray(row.materials) ? row.materials[0] : row.materials;
    return {
      materialId: row.material_id,
      materialName: material?.name ?? "Material",
      unit: material?.unit ?? "un",
      quantity: Number(row.quantity),
      unitCost: row.unit_cost === null ? null : Number(row.unit_cost),
    };
  });
}

/**
 * Peças ativas sem nenhum material cadastrado na receita: a baixa de estoque não funciona para elas
 * (não há o que descontar). Serve para a pessoa completar o cadastro.
 */
export async function listProductsWithoutMaterials(storeId: string, limit = 12) {
  const supabase = await createServerSupabaseClient();

  const [{ data: products }, { data: withMaterials }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name")
      .eq("store_id", storeId)
      .neq("status", "inactive")
      .order("name", { ascending: true }),
    supabase.from("product_materials").select("product_id, products!inner(store_id)").eq("products.store_id", storeId),
  ]);

  const covered = new Set((withMaterials ?? []).map((row) => row.product_id));
  const missing = (products ?? []).filter((product) => !covered.has(product.id));

  return { total: missing.length, items: missing.slice(0, limit) };
}

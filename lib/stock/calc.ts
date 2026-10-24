// Cálculos puros do estoque e das compras de insumos (sem banco, para testar isolado).

/** Custo da unidade a partir do que foi pago: R$ 18,00 por 200 g = R$ 0,09/g. */
export function unitCostFromPurchase(totalCost: number, quantity: number): number {
  if (!Number.isFinite(totalCost) || !Number.isFinite(quantity) || quantity <= 0) return 0;
  return totalCost / quantity;
}

/** "Comprei 5 novelos de 200 g": 5 embalagens × 200 = 1000 g (3 casas, sem erro de ponto flutuante). */
export function quantityFromPackages(packages: number, perPackage: number): number {
  if (!Number.isFinite(packages) || !Number.isFinite(perPackage) || packages <= 0 || perPackage <= 0) return 0;
  return Math.round(packages * perPackage * 1000) / 1000;
}

export type StockLevel = "untracked" | "negative" | "empty" | "low" | "ok";

/**
 * Situação do estoque de um material:
 *  - untracked: a pessoa ainda não liga o controle (não entra na baixa nem em alertas);
 *  - negative: saldo abaixo de zero (usou mais do que registrou; só aviso, nunca trava a produção);
 *  - empty: zerado; low: no estoque mínimo ou abaixo; ok: o resto.
 */
export function stockLevel(stock: number, minStock: number | null, tracked: boolean): StockLevel {
  if (!tracked) return "untracked";
  if (stock < 0) return "negative";
  if (stock === 0) return "empty";
  if (minStock !== null && minStock > 0 && stock <= minStock) return "low";
  return "ok";
}

export const STOCK_LEVEL_LABEL: Record<StockLevel, string> = {
  untracked: "Sem controle",
  negative: "Saldo negativo",
  empty: "Acabou",
  low: "Acabando",
  ok: "Em estoque",
};

export type PurchaseCostPoint = { date: string; quantity: number; totalCost: number };

export type CostSummary = {
  lastUnitCost: number | null;
  averageUnitCost: number | null;
  lowestUnitCost: number | null;
  highestUnitCost: number | null;
};

/**
 * Resumo dos preços pagos por um material nas compras (da mais antiga para a mais nova ou ao
 * contrário: a ordem de entrada não importa, o "último" é decidido pela data). O custo médio é
 * ponderado pela quantidade (quem comprou mais pesa mais).
 */
export function summarizeCosts(purchases: PurchaseCostPoint[]): CostSummary {
  const valid = purchases.filter((p) => p.quantity > 0 && Number.isFinite(p.totalCost));
  if (valid.length === 0) {
    return { lastUnitCost: null, averageUnitCost: null, lowestUnitCost: null, highestUnitCost: null };
  }

  const byDate = [...valid].sort((a, b) => a.date.localeCompare(b.date));
  const unitCosts = byDate.map((p) => p.totalCost / p.quantity);
  const totalQuantity = byDate.reduce((sum, p) => sum + p.quantity, 0);
  const totalCost = byDate.reduce((sum, p) => sum + p.totalCost, 0);

  return {
    lastUnitCost: unitCosts[unitCosts.length - 1],
    averageUnitCost: totalCost / totalQuantity,
    lowestUnitCost: Math.min(...unitCosts),
    highestUnitCost: Math.max(...unitCosts),
  };
}

/** Variação do preço pago agora contra o custo cadastrado, em %, para avisar na tela de compra. */
export function costChangePercent(currentCost: number, newUnitCost: number): number | null {
  if (!Number.isFinite(currentCost) || currentCost <= 0 || !Number.isFinite(newUnitCost)) return null;
  return Math.round(((newUnitCost - currentCost) / currentCost) * 100);
}

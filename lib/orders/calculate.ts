/**
 * Cálculos puros do controle de pedidos — sem acesso a banco, para poder
 * testar isolado (mesmo padrão de lib/pricing/calculate.ts).
 */

export type OrderItemInput = {
  quantity: number;
  unitPrice: number;
};

/** Total do pedido: soma de quantidade × preço unitário de cada item. */
export function calculateOrderTotal(items: OrderItemInput[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

export type ProductMaterialInput = {
  productId: string;
  name: string;
  unit: string;
  quantityPerUnit: number;
  /** Material do catálogo (null/ausente = material avulso, digitado à mão na peça). */
  materialId?: string | null;
};

export type ProductionListEntry = {
  name: string;
  unit: string;
  quantity: number;
  materialId?: string | null;
};

/**
 * Soma os materiais cadastrados em cada peça do catálogo presente no pedido,
 * multiplicados pela quantidade encomendada daquela peça, agregando por
 * nome+unidade entre itens diferentes (o mesmo fio usado em duas peças do
 * pedido vira uma única linha somada).
 */
export function calculateProductionList(
  orderedQuantityByProduct: Map<string, number>,
  materials: ProductMaterialInput[],
): ProductionListEntry[] {
  const aggregated = new Map<string, ProductionListEntry>();

  for (const material of materials) {
    const orderedQuantity = orderedQuantityByProduct.get(material.productId) ?? 0;
    if (orderedQuantity <= 0) continue;

    const key = `${material.name}__${material.unit}`;
    const additional = material.quantityPerUnit * orderedQuantity;
    const existing = aggregated.get(key);

    aggregated.set(key, {
      name: material.name,
      unit: material.unit,
      quantity: (existing?.quantity ?? 0) + additional,
      materialId: existing?.materialId ?? material.materialId ?? undefined,
    });
  }

  return [...aggregated.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export type VariantMaterialNeed = {
  materialId: string;
  name: string;
  unit: string;
  /** Já multiplicado pela quantidade do item no pedido. */
  quantity: number;
};

/**
 * Soma ao que as peças pedem (a receita) os materiais das VARIAÇÕES escolhidas no pedido (ex.: a
 * alça). Só entram as variações lançadas naquele pedido, nunca as outras opções da peça. O mesmo
 * material (mesmo nome e unidade) vira uma linha só.
 */
export function mergeMaterialNeeds(
  base: ProductionListEntry[],
  extras: VariantMaterialNeed[],
): ProductionListEntry[] {
  const merged = new Map<string, ProductionListEntry>();

  for (const entry of base) merged.set(`${entry.name}__${entry.unit}`, { ...entry });

  for (const extra of extras) {
    if (extra.quantity <= 0) continue;
    const key = `${extra.name}__${extra.unit}`;
    const existing = merged.get(key);
    merged.set(key, {
      name: extra.name,
      unit: extra.unit,
      quantity: Math.round(((existing?.quantity ?? 0) + extra.quantity) * 1000) / 1000,
      materialId: existing?.materialId ?? extra.materialId,
    });
  }

  return [...merged.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}


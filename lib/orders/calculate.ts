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
};

export type ProductionListEntry = {
  name: string;
  unit: string;
  quantity: number;
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
    });
  }

  return [...aggregated.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

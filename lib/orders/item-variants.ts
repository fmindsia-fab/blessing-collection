// Variações escolhidas num item do pedido: validação e montagem das linhas a gravar.
// Funções puras (sem banco) para testar as regras isoladamente.

export type VariantRecord = {
  id: string;
  product_id: string;
  name: string;
  variant_group: string | null;
  price: number | null;
  status: string;
  /** Escolha obrigatória (conjunto separado dos complementos do mesmo grupo). */
  is_required?: boolean;
  /** O grupo aceita mais de uma escolha (duas alças): então não vale a regra de uma por conjunto. */
  allow_multiple?: boolean;
};

export type ItemVariantRow = {
  variant_id: string;
  name: string;
  variant_group: string | null;
  surcharge: number;
  sort_order: number;
};

/** Grupo das variações sem grupo definido (mesmo nome usado no catálogo). */
const DEFAULT_GROUP = "Opções";

/** "id1,id2" -> ["id1","id2"], sem vazios nem repetidos. */
export function parseVariantIds(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((id) => id.trim()).filter(Boolean))];
}

/**
 * Confere as variações escolhidas para um item e monta as linhas a gravar.
 *
 * Regras (as mesmas do catálogo): toda variação precisa ser da peça do item e não estar
 * arquivada; só uma opção por conjunto (alça obrigatória OU outra alça obrigatória, não as duas;
 * um complemento do mesmo grupo pode vir junto), exceto nos grupos que aceitam mais de uma
 * escolha ("pode escolher mais de uma", ex.: duas alças). O acréscimo é a diferença
 * do preço da variação para o preço base da peça, nunca negativo, em reais com 2 casas.
 */
export function buildItemVariantRows(
  productPrice: number,
  selectedIds: string[],
  records: Map<string, VariantRecord>,
  productId: string,
): { rows: ItemVariantRow[] } | { error: string } {
  const groupsSeen = new Set<string>();
  const rows: ItemVariantRow[] = [];

  for (const [index, id] of selectedIds.entries()) {
    const record = records.get(id);
    if (!record || record.product_id !== productId || record.status === "archived") {
      return { error: "Uma das variações escolhidas não existe mais. Atualize a página e escolha de novo." };
    }

    const group = record.variant_group?.trim() || DEFAULT_GROUP;
    // Obrigatórias e complementos do mesmo grupo são conjuntos separados: pode uma de cada.
    const setKey = `${group}::${record.is_required ? "obrigatoria" : "complemento"}`;
    if (groupsSeen.has(setKey) && !record.allow_multiple) {
      return { error: `Escolha só uma opção de "${group}${record.is_required ? "" : " (complementos)"}" por item.` };
    }
    groupsSeen.add(setKey);

    const surcharge =
      record.price == null ? 0 : Math.max(0, Math.round((Number(record.price) - Number(productPrice)) * 100) / 100);

    rows.push({
      variant_id: record.id,
      name: record.name.slice(0, 120),
      variant_group: record.variant_group ? record.variant_group.slice(0, 60) : null,
      surcharge,
      sort_order: index,
    });
  }

  return { rows };
}

/** Nome das variações escolhidas, para mostrar numa linha: "Alça Corrente, Tassel". */
export function describeItemVariants(variants: { name: string }[]): string | null {
  return variants.length > 0 ? variants.map((variant) => variant.name).join(", ") : null;
}

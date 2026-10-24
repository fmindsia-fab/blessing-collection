// Ordenação da lista de peças do catálogo. Sem escolha, vale a ordem que a dona definiu no
// painel ("sugestão da loja"); as demais são pedidos explícitos da cliente, guardados na URL
// (?ordem=...) para o link continuar igual quando compartilhado.

export const CATALOG_SORTS = ["novidades", "menor-preco", "maior-preco"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export const CATALOG_SORT_LABEL: Record<CatalogSort | "", string> = {
  "": "Sugestão da loja",
  novidades: "Novidades primeiro",
  "menor-preco": "Menor preço",
  "maior-preco": "Maior preço",
};

/** Aceita só valores conhecidos: qualquer outra coisa na URL volta à ordem da loja. */
export function parseCatalogSort(value: string | undefined | null): CatalogSort | undefined {
  return (CATALOG_SORTS as readonly string[]).includes(value ?? "") ? (value as CatalogSort) : undefined;
}

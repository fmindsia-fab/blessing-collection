export type FilterParams = {
  busca?: string;
  categoria?: string;
  modelo?: string;
  cor?: string;
  disponibilidade?: string;
};

/**
 * URL de uma combinação de filtros (PRD 3.2).
 *
 * Os filtros são links, não estado no client: cada combinação vira uma URL
 * própria, compartilhável e indexável. A ordem dos parâmetros é fixa para que
 * a mesma seleção produza sempre a mesma URL — o contrário geraria entradas
 * duplicadas no histórico e no índice de busca.
 *
 * `page` fica de fora de propósito: trocar um filtro volta à página 1, senão a
 * paginação da busca anterior vazaria para a nova.
 */
export function buildFilterHref(basePath: string, params: FilterParams): string {
  const query = new URLSearchParams();

  if (params.busca) query.set("busca", params.busca);
  if (params.categoria) query.set("categoria", params.categoria);
  if (params.modelo) query.set("modelo", params.modelo);
  if (params.cor) query.set("cor", params.cor);
  if (params.disponibilidade) query.set("disponibilidade", params.disponibilidade);

  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

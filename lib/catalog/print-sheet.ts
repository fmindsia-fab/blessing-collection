// Montagem das folhas do "catálogo para imprimir": filtra as peças, separa por tipo
// (categoria) e divide em folhas A4 com 4 ou 6 peças cada. Sem acesso a banco, para
// poder ser testado.

export type PrintAvailability = "todas" | "pronta-entrega" | "sob-encomenda";
export type PerSheet = 4 | 6;

export type PrintProduct = {
  id: string;
  name: string;
  price: number;
  /** Só peças à venda entram: pronta entrega ou sob encomenda. */
  status: "available" | "made_to_order";
  /** Alguma variação custa mais que o preço base: o valor impresso é o mínimo. */
  fromPrice: boolean;
  coverUrl: string | null;
  categoryId: string | null;
};

export type PrintCategory = { id: string; name: string };

export type PrintPage = {
  /** Tipo das peças da folha ("Bolsas", "Acessórios"…). */
  categoryName: string;
  products: PrintProduct[];
};

export const PRINT_AVAILABILITY_OPTIONS: { value: PrintAvailability; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pronta-entrega", label: "Pronta entrega" },
  { value: "sob-encomenda", label: "Sob encomenda" },
];

export const PRINT_PER_SHEET_OPTIONS: PerSheet[] = [4, 6];

/** Nome do grupo das peças sem tipo cadastrado. */
export const UNCATEGORIZED_LABEL = "Outras peças";

export function parsePrintAvailability(value: string | undefined): PrintAvailability {
  return value === "pronta-entrega" || value === "sob-encomenda" ? value : "todas";
}

export function parsePerSheet(value: string | undefined): PerSheet {
  return value === "6" ? 6 : 4;
}

export function matchesAvailability(product: PrintProduct, availability: PrintAvailability): boolean {
  if (availability === "pronta-entrega") return product.status === "available";
  if (availability === "sob-encomenda") return product.status === "made_to_order";
  return true;
}

/**
 * Folhas na ordem das categorias da loja, cada tipo começando numa folha nova.
 * `categoryIds` vazio significa todos os tipos; as peças sem tipo ficam por último
 * e só aparecem nesse caso.
 */
export function buildPrintPages({
  products,
  categories,
  availability,
  categoryIds,
  perSheet,
}: {
  products: PrintProduct[];
  categories: PrintCategory[];
  availability: PrintAvailability;
  categoryIds: string[];
  perSheet: PerSheet;
}): PrintPage[] {
  const visible = products.filter((product) => matchesAvailability(product, availability));
  const onlySelected = categoryIds.length > 0;
  const knownIds = new Set(categories.map((category) => category.id));

  const groups: { name: string; items: PrintProduct[] }[] = categories
    .filter((category) => !onlySelected || categoryIds.includes(category.id))
    .map((category) => ({
      name: category.name,
      items: visible.filter((product) => product.categoryId === category.id),
    }));

  if (!onlySelected) {
    groups.push({
      name: UNCATEGORIZED_LABEL,
      items: visible.filter((product) => !product.categoryId || !knownIds.has(product.categoryId)),
    });
  }

  const pages: PrintPage[] = [];
  for (const group of groups) {
    for (let start = 0; start < group.items.length; start += perSheet) {
      pages.push({ categoryName: group.name, products: group.items.slice(start, start + perSheet) });
    }
  }
  return pages;
}

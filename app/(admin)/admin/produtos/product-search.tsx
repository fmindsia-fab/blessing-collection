"use client";

import { useMemo, useState } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { CategoryGroup } from "./category-group";
import { SortableList } from "./sortable-list";
import { ProductRow, type AdminProduct } from "./product-row";

const SEM_CATEGORIA = "__sem_categoria__";

type CategoryOption = { id: string; name: string };

// Ignora acento na busca: "colares" deve achar "Colarés". NFD separa a letra
// do diacrítico para poder remover só ele (faixa Unicode dos diacríticos
// combinantes, U+0300-U+036F, escrita como escape para não depender de um
// caractere combinante literal no código-fonte).
function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Busca por nome filtra em memória — a lista já vem inteira do servidor (é
 * leve: nome, preço, status) e o painel é de loja única, sem paginação.
 *
 * Enquanto a busca está ativa, a lista larga o agrupamento por categoria e o
 * drag-and-drop: a ordem por posição só faz sentido dentro de uma categoria
 * completa, e um resultado filtrado quebraria essa referência.
 */
export function ProductSearch({
  products,
  categories,
  statusLabels,
}: {
  products: AdminProduct[];
  categories: CategoryOption[];
  statusLabels: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();

  const filtered = useMemo(() => {
    if (!trimmed) return null;
    const needle = normalize(trimmed);
    return products.filter((product) => normalize(product.name).includes(needle));
  }, [products, trimmed]);

  const groups = useMemo(() => {
    const byCategory = new Map<string, AdminProduct[]>();
    for (const product of products) {
      const key = product.category_id ?? SEM_CATEGORIA;
      byCategory.set(key, [...(byCategory.get(key) ?? []), product]);
    }

    return [
      ...categories
        .filter((category) => byCategory.has(category.id))
        .map((category) => ({
          key: category.id,
          name: category.name,
          items: byCategory.get(category.id)!,
        })),
      ...(byCategory.has(SEM_CATEGORIA)
        ? [{ key: SEM_CATEGORIA, name: "Sem categoria", items: byCategory.get(SEM_CATEGORIA)! }]
        : []),
    ];
  }, [products, categories]);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar peça pelo nome…"
          aria-label="Buscar peça pelo nome"
          className="w-full rounded-full border border-input bg-background py-2.5 pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
          >
            <XIcon className="size-4" />
          </button>
        ) : null}
      </div>

      {filtered ? (
        filtered.length > 0 ? (
          <div className="flex flex-col gap-3">
            {/* Sem alça de arraste nem setas: a posição num resultado
                filtrado não corresponde à ordem real dentro da categoria,
                então reordenar aqui não faz sentido. */}
            {filtered.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                statusLabel={statusLabels[product.status]}
                isFirst
                isLast
              />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma peça encontrada para &ldquo;{trimmed}&rdquo;.
          </p>
        )
      ) : (
        groups.map((group) => (
          <CategoryGroup
            key={group.key}
            name={group.name}
            count={group.items.length}
            defaultOpen={group.key !== SEM_CATEGORIA}
          >
            <SortableList items={group.items} statusLabels={statusLabels} />
          </CategoryGroup>
        ))
      )}
    </div>
  );
}

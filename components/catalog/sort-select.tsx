"use client";

import { useRouter } from "next/navigation";
import { buildFilterHref, type FilterParams } from "@/lib/catalog/filter-url";
import { CATALOG_SORTS, CATALOG_SORT_LABEL, type CatalogSort } from "@/lib/catalog/sort";

// "Ordenar por": troca só a ordem e mantém todos os filtros e a busca. A lista volta à primeira
// página, como em qualquer troca de filtro.
export function SortSelect({
  basePath,
  params,
  active,
}: {
  basePath: string;
  params: FilterParams;
  active?: CatalogSort;
}) {
  const router = useRouter();

  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <span>Ordenar por</span>
      <select
        value={active ?? ""}
        onChange={(event) => {
          const next = event.target.value as CatalogSort | "";
          router.push(buildFilterHref(basePath, { ...params, ordem: next || undefined }));
        }}
        className="h-10 rounded-full border border-border bg-card px-4 text-sm text-foreground outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
      >
        {(["", ...CATALOG_SORTS] as const).map((option) => (
          <option key={option} value={option}>
            {CATALOG_SORT_LABEL[option]}
          </option>
        ))}
      </select>
    </label>
  );
}

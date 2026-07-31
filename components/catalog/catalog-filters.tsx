import Link from "next/link";
import { cn } from "@/lib/utils";

export const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Pronta entrega" },
  { value: "made_to_order", label: "Sob encomenda" },
  { value: "sold_out", label: "Esgotadas" },
] as const;

type CatalogFiltersProps = {
  basePath: string;
  colors: { name: string; count: number }[];
  models?: { id: string; name: string; slug: string; count: number }[];
  activeColor?: string;
  activeAvailability?: string;
  activeModel?: string;
  search?: string;
};

// Filtros por link (PRD 3.2): sem estado no client, cada combinação é uma URL
// própria — compartilhável e indexável. Trocar um filtro sempre volta à
// página 1, senão a paginação da busca anterior vazaria para a nova.
function buildHref(
  basePath: string,
  params: { busca?: string; cor?: string; disponibilidade?: string; modelo?: string },
) {
  const query = new URLSearchParams();
  if (params.busca) query.set("busca", params.busca);
  if (params.cor) query.set("cor", params.cor);
  if (params.disponibilidade) query.set("disponibilidade", params.disponibilidade);
  if (params.modelo) query.set("modelo", params.modelo);

  const queryString = query.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

function FilterChip({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  /** Quantas peças a opção tem — ausente para filtros sem contagem. */
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs tracking-wide outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "border-foreground bg-foreground text-background shadow-sm"
          : "border-border text-muted-foreground hover:border-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      {children}
      {count !== undefined ? (
        <span className={cn("tabular-nums", active ? "text-background/70" : "text-muted-foreground/60")}>
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function CatalogFilters({
  basePath,
  colors,
  models = [],
  activeColor,
  activeAvailability,
  activeModel,
  search,
}: CatalogFiltersProps) {
  const hasActiveFilter = Boolean(activeColor || activeAvailability || activeModel);

  return (
    <div className="flex flex-col gap-5 border-y border-border py-6">
      {models.length > 0 ? (
        <div className="flex flex-col items-center gap-2.5">
          <span className="kicker">Modelo</span>
          <div className="flex flex-wrap justify-center gap-2">
            {models.map((model) => {
              const active = activeModel === model.slug;
              return (
                <FilterChip
                  key={model.id}
                  active={active}
                  count={model.count}
                  href={buildHref(basePath, {
                    busca: search,
                    cor: activeColor,
                    disponibilidade: activeAvailability,
                    modelo: active ? undefined : model.slug,
                  })}
                >
                  {model.name}
                </FilterChip>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col items-center gap-2.5">
        <span className="kicker">Disponibilidade</span>
        <div className="flex flex-wrap justify-center gap-2">
          {AVAILABILITY_OPTIONS.map((option) => {
            const active = activeAvailability === option.value;
            return (
              <FilterChip
                key={option.value}
                active={active}
                href={buildHref(basePath, {
                  busca: search,
                  cor: activeColor,
                  modelo: activeModel,
                  // Clicar no filtro ativo remove-o.
                  disponibilidade: active ? undefined : option.value,
                })}
              >
                {option.label}
              </FilterChip>
            );
          })}
        </div>
      </div>

      {colors.length > 0 ? (
        <div className="flex flex-col items-center gap-2.5">
          <span className="kicker">Cor</span>
          <div className="flex flex-wrap justify-center gap-2">
            {colors.map((color) => {
              const active = activeColor === color.name;
              return (
                <FilterChip
                  key={color.name}
                  active={active}
                  count={color.count}
                  href={buildHref(basePath, {
                    busca: search,
                    cor: active ? undefined : color.name,
                    disponibilidade: activeAvailability,
                    modelo: activeModel,
                  })}
                >
                  {color.name}
                </FilterChip>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasActiveFilter ? (
        <Link
          href={buildHref(basePath, { busca: search })}
          className="self-center text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground underline underline-offset-4 outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
        >
          Limpar filtros
        </Link>
      ) : null}
    </div>
  );
}

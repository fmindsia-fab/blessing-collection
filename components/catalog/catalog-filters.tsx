import Link from "next/link";
import { cn } from "@/lib/utils";

export const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Pronta entrega" },
  { value: "made_to_order", label: "Sob encomenda" },
  { value: "sold_out", label: "Esgotadas" },
] as const;

type CatalogFiltersProps = {
  basePath: string;
  colors: string[];
  models?: { id: string; name: string; slug: string }[];
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
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "border px-4 py-2 text-xs tracking-wide outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
      )}
    >
      {children}
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
        <div className="flex flex-col gap-2.5">
          <span className="kicker">Modelo</span>
          <div className="flex flex-wrap gap-2">
            {models.map((model) => {
              const active = activeModel === model.slug;
              return (
                <FilterChip
                  key={model.id}
                  active={active}
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

      <div className="flex flex-col gap-2.5">
        <span className="kicker">Disponibilidade</span>
        <div className="flex flex-wrap gap-2">
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
        <div className="flex flex-col gap-2.5">
          <span className="kicker">Cor</span>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const active = activeColor === color;
              return (
                <FilterChip
                  key={color}
                  active={active}
                  href={buildHref(basePath, {
                    busca: search,
                    cor: active ? undefined : color,
                    disponibilidade: activeAvailability,
                    modelo: activeModel,
                  })}
                >
                  {color}
                </FilterChip>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasActiveFilter ? (
        <Link
          href={buildHref(basePath, { busca: search })}
          className="self-start text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground underline underline-offset-4 outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
        >
          Limpar filtros
        </Link>
      ) : null}
    </div>
  );
}

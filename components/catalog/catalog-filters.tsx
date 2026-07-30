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
  activeColor?: string;
  activeAvailability?: string;
  search?: string;
};

// Filtros por link (PRD 3.2): sem estado no client, cada combinação é uma URL
// própria — compartilhável e indexável. Trocar um filtro sempre volta à
// página 1, senão a paginação da busca anterior vazaria para a nova.
function buildHref(
  basePath: string,
  params: { busca?: string; cor?: string; disponibilidade?: string },
) {
  const query = new URLSearchParams();
  if (params.busca) query.set("busca", params.busca);
  if (params.cor) query.set("cor", params.cor);
  if (params.disponibilidade) query.set("disponibilidade", params.disponibilidade);

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
        "border px-3.5 py-1.5 text-xs tracking-wide transition-colors",
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
  activeColor,
  activeAvailability,
  search,
}: CatalogFiltersProps) {
  const hasActiveFilter = Boolean(activeColor || activeAvailability);

  return (
    <div className="flex flex-col gap-5 border-y border-border py-6">
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
          className="self-start text-xs uppercase tracking-[0.16em] text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
        >
          Limpar filtros
        </Link>
      ) : null}
    </div>
  );
}

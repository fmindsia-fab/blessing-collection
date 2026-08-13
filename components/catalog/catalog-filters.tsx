"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildFilterHref, type FilterParams } from "@/lib/catalog/filter-url";
import type { ColorFilterOption } from "@/lib/products/queries";

export const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Pronta entrega" },
  { value: "made_to_order", label: "Sob encomenda" },
  { value: "sold_out", label: "Esgotadas" },
] as const;

type Option = { name: string; slug: string; count: number };

type CatalogFiltersProps = {
  basePath: string;
  colors: ColorFilterOption[];
  models?: Option[];
  categories?: Option[];
  activeColor?: string;
  activeAvailability?: string;
  activeModel?: string;
  activeCategory?: string;
  search?: string;
  /** Some da barra quando a página já é de uma categoria específica. */
  hideCategory?: boolean;
};

/** Amostra da cor. Composta ("Lilás - Branco") sai dividida na diagonal. */
function ColorSwatch({ hex, hexSecondary }: { hex: string; hexSecondary: string | null }) {
  return (
    <span
      aria-hidden
      className="size-4 shrink-0 rounded-full border border-foreground/15 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)]"
      style={
        hexSecondary
          ? { background: `linear-gradient(135deg, ${hex} 50%, ${hexSecondary} 50%)` }
          : { backgroundColor: hex }
      }
    />
  );
}

/**
 * Botão que abre um painel de opções.
 *
 * Fecha ao clicar fora e no Esc. O painel é `absolute` sobre o conteúdo em vez
 * de empurrar a página: com quatro grupos abertos em sequência, o catálogo
 * ficaria pulando para baixo a cada toque.
 */
function FilterDropdown({
  label,
  activeLabel,
  children,
}: {
  label: string;
  activeLabel?: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = Boolean(activeLabel);

  return (
    // `static` no celular: assim o painel abaixo se posiciona contra a barra
    // inteira (que é `relative`) e ocupa a largura dela, em vez de se ancorar
    // neste botão e escapar da tela.
    <div ref={containerRef} className="static sm:relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs tracking-wide outline-none transition-all duration-300 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isActive
            ? "border-foreground bg-foreground text-background shadow-sm"
            : "border-border text-muted-foreground hover:border-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        <span>{activeLabel ?? label}</span>
        <ChevronDownIcon
          className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      {/* No celular o painel ocupa a faixa inteira da barra em vez de se
          centralizar no botão: centralizado, o painel do primeiro filtro saía
          ~58px para fora da tela. A partir de sm há espaço para centralizar.
          A barra tem `relative` para servir de referência a este `inset-x-0`. */}
      {open ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-40 rounded-[var(--radius)] border border-border bg-card p-2 shadow-lg sm:inset-x-auto sm:left-1/2 sm:w-80 sm:-translate-x-1/2">
          <div className="flex max-h-[min(22rem,50vh)] flex-col gap-0.5 overflow-y-auto">
            {children(() => setOpen(false))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Linha do painel: nome à esquerda, contagem à direita. */
function FilterOption({
  href,
  active,
  count,
  onSelect,
  children,
}: {
  href: string;
  active: boolean;
  count?: number;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex items-center justify-between gap-3 rounded-[calc(var(--radius)-0.25rem)] px-3 py-2.5 text-sm outline-none transition-colors focus-visible:bg-secondary",
        active
          ? "bg-secondary font-medium text-foreground"
          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">{children}</span>
      {count !== undefined ? (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground/70">{count}</span>
      ) : null}
    </Link>
  );
}

/** Filtro escolhido, com o x para remover. */
function ActiveChip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-foreground bg-foreground py-1.5 pl-3 pr-2 text-xs text-background outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-[var(--gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {children}
      <XIcon className="size-3.5" />
    </Link>
  );
}

export function CatalogFilters({
  basePath,
  colors,
  models = [],
  categories = [],
  activeColor,
  activeAvailability,
  activeModel,
  activeCategory,
  search,
  hideCategory = false,
}: CatalogFiltersProps) {
  const current: FilterParams = {
    busca: search,
    categoria: activeCategory,
    modelo: activeModel,
    cor: activeColor,
    disponibilidade: activeAvailability,
  };

  const selectedCategory = categories.find((c) => c.slug === activeCategory);
  const selectedModel = models.find((m) => m.slug === activeModel);
  const selectedColor = colors.find((c) => c.slug === activeColor);
  const selectedAvailability = AVAILABILITY_OPTIONS.find((o) => o.value === activeAvailability);

  // Um grupo com uma opção só não é escolha: filtrar por ele devolveria tudo.
  const showCategory = !hideCategory && categories.length > 1;
  const hasActiveFilter = Boolean(
    activeColor || activeAvailability || activeModel || (activeCategory && !hideCategory),
  );

  return (
    <div className="flex flex-col items-center gap-3 border-y border-border py-5">
      {/* `relative` é a referência do painel no celular, onde ele ocupa a
          largura da barra em vez de se ancorar no próprio botão. */}
      <div className="relative flex flex-wrap items-center justify-center gap-2">
        {showCategory ? (
          <FilterDropdown label="Categoria" activeLabel={selectedCategory?.name}>
            {(close) =>
              categories.map((category) => {
                const active = activeCategory === category.slug;
                return (
                  <FilterOption
                    key={category.slug}
                    active={active}
                    count={category.count}
                    onSelect={close}
                    href={buildFilterHref(basePath, {
                      ...current,
                      categoria: active ? undefined : category.slug,
                    })}
                  >
                    {category.name}
                  </FilterOption>
                );
              })
            }
          </FilterDropdown>
        ) : null}

        {models.length > 1 ? (
          <FilterDropdown label="Modelo" activeLabel={selectedModel?.name}>
            {(close) =>
              models.map((model) => {
                const active = activeModel === model.slug;
                return (
                  <FilterOption
                    key={model.slug}
                    active={active}
                    count={model.count}
                    onSelect={close}
                    href={buildFilterHref(basePath, {
                      ...current,
                      modelo: active ? undefined : model.slug,
                    })}
                  >
                    {model.name}
                  </FilterOption>
                );
              })
            }
          </FilterDropdown>
        ) : null}

        {colors.length > 1 ? (
          <FilterDropdown label="Cor" activeLabel={selectedColor?.name}>
            {(close) =>
              colors.map((color) => {
                const active = activeColor === color.slug;
                return (
                  <FilterOption
                    key={color.slug}
                    active={active}
                    count={color.count}
                    onSelect={close}
                    href={buildFilterHref(basePath, {
                      ...current,
                      cor: active ? undefined : color.slug,
                    })}
                  >
                    <ColorSwatch hex={color.hex} hexSecondary={color.hexSecondary} />
                    <span className="truncate">{color.name}</span>
                  </FilterOption>
                );
              })
            }
          </FilterDropdown>
        ) : null}

        <FilterDropdown label="Disponibilidade" activeLabel={selectedAvailability?.label}>
          {(close) =>
            AVAILABILITY_OPTIONS.map((option) => {
              const active = activeAvailability === option.value;
              return (
                <FilterOption
                  key={option.value}
                  active={active}
                  onSelect={close}
                  href={buildFilterHref(basePath, {
                    ...current,
                    disponibilidade: active ? undefined : option.value,
                  })}
                >
                  {option.label}
                </FilterOption>
              );
            })
          }
        </FilterDropdown>
      </div>

      {/* Os filtros escolhidos ficam visíveis fora do painel: sem isso a
          cliente perde de vista o que está aplicado depois de fechar. */}
      {hasActiveFilter ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {selectedCategory && !hideCategory ? (
            <ActiveChip href={buildFilterHref(basePath, { ...current, categoria: undefined })}>
              {selectedCategory.name}
            </ActiveChip>
          ) : null}
          {selectedModel ? (
            <ActiveChip href={buildFilterHref(basePath, { ...current, modelo: undefined })}>
              {selectedModel.name}
            </ActiveChip>
          ) : null}
          {selectedColor ? (
            <ActiveChip href={buildFilterHref(basePath, { ...current, cor: undefined })}>
              <ColorSwatch hex={selectedColor.hex} hexSecondary={selectedColor.hexSecondary} />
              {selectedColor.name}
            </ActiveChip>
          ) : null}
          {selectedAvailability ? (
            <ActiveChip href={buildFilterHref(basePath, { ...current, disponibilidade: undefined })}>
              {selectedAvailability.label}
            </ActiveChip>
          ) : null}

          <Link
            href={buildFilterHref(basePath, { busca: search })}
            className="ml-1 text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground underline underline-offset-4 outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
          >
            Limpar
          </Link>
        </div>
      ) : null}
    </div>
  );
}

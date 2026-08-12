"use client";

import { useTransition } from "react";
import Link from "next/link";
import { deactivateProduct, restoreProduct, moveProduct } from "@/lib/products/actions";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/admin/status-pill";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import type { ProductStatus } from "@/types/database.types";

type ProductRowProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    status: ProductStatus;
    is_featured: boolean;
    is_new_arrival: boolean;
    category_id: string | null;
  };
  statusLabel: string;
  isFirst: boolean;
  isLast: boolean;
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProductRow({ product, statusLabel, isFirst, isLast }: ProductRowProps) {
  const [isPending, startTransition] = useTransition();
  const isInactive = product.status === "inactive";

  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-image)] border border-border bg-card px-5 py-4 shadow-sm transition-all duration-300 hover:border-foreground/25 hover:shadow-md">
      {/* Ordem de exibição no catálogo (PRD 3.7). */}
      <ReorderButtons
        label={product.name}
        isFirst={isFirst}
        isLast={isLast}
        disabled={isPending}
        onMove={(direction) => startTransition(() => moveProduct(product.id, direction))}
      />

      <div className="flex flex-1 flex-col gap-2">
        <Link
          href={`/admin/produtos/${product.id}/editar`}
          className="font-[family-name:var(--font-brand)] text-base outline-none transition-colors hover:text-[var(--gold)] focus-visible:text-[var(--gold)] focus-visible:underline focus-visible:underline-offset-4"
        >
          {product.name}
        </Link>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-sm tabular-nums text-muted-foreground">
            {formatPrice(product.price)}
          </span>
          <StatusPill tone={isInactive ? "muted" : "positive"}>{statusLabel}</StatusPill>
          {product.is_featured ? <StatusPill tone="accent">Destaque</StatusPill> : null}
          {product.is_new_arrival ? <StatusPill tone="accent">Lançamento</StatusPill> : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          render={<Link href={`/admin/produtos/${product.id}/editar`} />}
        >
          Editar
        </Button>
        <Button
          type="button"
          variant={isInactive ? "secondary" : "ghost"}
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(() => (isInactive ? restoreProduct(product.id) : deactivateProduct(product.id)))
          }
        >
          {isInactive ? "Reativar" : "Desativar"}
        </Button>
      </div>
    </div>
  );
}

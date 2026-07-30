"use client";

import { useTransition } from "react";
import Link from "next/link";
import { deactivateProduct, restoreProduct } from "@/lib/products/actions";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/admin/status-pill";
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
  };
  statusLabel: string;
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProductRow({ product, statusLabel }: ProductRowProps) {
  const [isPending, startTransition] = useTransition();
  const isInactive = product.status === "inactive";

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-image)] border border-border bg-card px-5 py-4 shadow-sm transition-all duration-300 hover:border-foreground/25 hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2">
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

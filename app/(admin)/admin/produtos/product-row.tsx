"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { GripVerticalIcon, ImageIcon } from "lucide-react";
import { deactivateProduct, restoreProduct, moveProduct } from "@/lib/products/actions";
import { Button } from "@/components/ui/button";
import { DuplicateProductButton } from "./duplicate-product-button";
import { StatusPill } from "@/components/admin/status-pill";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { cn } from "@/lib/utils";
import type { DragHandlers } from "./sortable-list";
import type { ProductStatus } from "@/types/database.types";

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  status: ProductStatus;
  is_featured: boolean;
  is_new_arrival: boolean;
  category_id: string | null;
  cover_url?: string | null;
};

type ProductRowProps = {
  product: AdminProduct;
  statusLabel: string;
  isFirst: boolean;
  isLast: boolean;
  drag?: DragHandlers;
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProductRow({ product, statusLabel, isFirst, isLast, drag }: ProductRowProps) {
  const [isPending, startTransition] = useTransition();
  const isInactive = product.status === "inactive";

  return (
    <div
      draggable={drag !== undefined}
      onDragStart={drag?.onDragStart}
      onDragOver={drag?.onDragOver}
      onDrop={drag?.onDrop}
      onDragEnd={drag?.onDragEnd}
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:border-[var(--gold)]/40 hover:shadow-md lg:flex-nowrap sm:px-4",
        drag?.isDragging && "opacity-40",
        drag?.isOver && !drag.isDragging && "border-[var(--gold)]",
      )}
    >
      {/* A alça só sinaliza que a linha inteira arrasta — `draggable` está no
          container, senão soltar sobre o próprio card não seria detectado. */}
      {drag ? (
        <span
          aria-hidden
          title="Arraste para reordenar"
          className="hidden cursor-grab text-muted-foreground/50 transition-colors hover:text-foreground active:cursor-grabbing sm:block"
        >
          <GripVerticalIcon className="size-4" />
        </span>
      ) : null}

      {/* Alternativa por clique e teclado: `draggable` não é operável sem
          mouse, e no celular arrastar numa página que rola é impreciso. */}
      <ReorderButtons
        label={product.name}
        isFirst={isFirst}
        isLast={isLast}
        disabled={isPending}
        onMove={(direction) => startTransition(() => moveProduct(product.id, direction))}
      />

      <Link
        href={`/admin/produtos/${product.id}/editar`}
        aria-hidden
        tabIndex={-1}
        className={cn(
          "relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary sm:size-[4.5rem]",
          isInactive && "opacity-60 grayscale",
        )}
      >
        {product.cover_url ? (
          <Image src={product.cover_url} alt="" fill sizes="96px" className="object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-muted-foreground/60">
            <ImageIcon className="size-5" />
          </span>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 basis-40 flex-col gap-2">
        <Link
          href={`/admin/produtos/${product.id}/editar`}
          className="font-semibold text-base outline-none transition-colors hover:text-[var(--gold)] focus-visible:text-[var(--gold)] focus-visible:underline focus-visible:underline-offset-4"
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

      <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border/60 pt-3 lg:w-auto lg:border-t-0 lg:pt-0">
        <DuplicateProductButton productId={product.id} productName={product.name} />
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-help="product-edit"
          render={<Link href={`/admin/produtos/${product.id}/editar`} />}
        >
          Editar
        </Button>
        <Button
          type="button"
          variant={isInactive ? "secondary" : "ghost"}
          size="sm"
          data-help="product-toggle"
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

"use client";

import { useTransition } from "react";
import Link from "next/link";
import { deactivateProduct, restoreProduct } from "@/lib/products/actions";
import { Button } from "@/components/ui/button";
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
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="flex flex-col">
        <Link href={`/admin/produtos/${product.id}/editar`} className="text-sm font-medium hover:underline">
          {product.name}
        </Link>
        <span className="text-xs text-zinc-500">
          {formatPrice(product.price)} · {statusLabel}
          {product.is_featured ? " · Destaque" : ""}
          {product.is_new_arrival ? " · Lançamento" : ""}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" size="sm" render={<Link href={`/admin/produtos/${product.id}/editar`} />}>
          Editar
        </Button>
        <Button
          type="button"
          variant="outline"
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

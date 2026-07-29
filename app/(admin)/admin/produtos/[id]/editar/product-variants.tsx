"use client";

import { useActionState, useTransition } from "react";
import { createVariant, toggleVariantStatus, deleteVariant, type VariantFormState } from "@/lib/products/variant-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VariantStatus } from "@/types/database.types";

type ProductVariantsProps = {
  productId: string;
  variants: {
    id: string;
    name: string;
    color: string | null;
    size: string | null;
    price: number | null;
    status: VariantStatus;
  }[];
};

const initialState: VariantFormState = {};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProductVariants({ productId, variants }: ProductVariantsProps) {
  const createAction = createVariant.bind(null, productId);
  const [state, formAction, isPending] = useActionState(createAction, initialState);
  const [isToggling, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Variações</h2>
        <p className="text-xs text-zinc-500">Cores, tamanhos ou outras variações. Preço opcional substitui o preço base.</p>
      </div>

      {variants.length > 0 ? (
        <div className="flex flex-col divide-y divide-zinc-200 border-y border-zinc-200">
          {variants.map((variant) => (
            <div key={variant.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm">{variant.name}</span>
                <span className="text-xs text-zinc-500">
                  {variant.price ? formatPrice(variant.price) : "Preço base"} ·{" "}
                  {variant.status === "available" ? "Disponível" : "Esgotado"}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={isToggling}
                  onClick={() => startTransition(() => toggleVariantStatus(productId, variant.id, variant.status))}
                >
                  {variant.status === "available" ? "Marcar esgotado" : "Marcar disponível"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={isToggling}
                  onClick={() => startTransition(() => deleteVariant(productId, variant.id))}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <form action={formAction} className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="variant-name">Nome</Label>
          <Input id="variant-name" name="name" placeholder="Cor: Caramelo" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="variant-price">Preço específico (opcional)</Label>
          <Input id="variant-price" name="price" type="number" step="0.01" min="0" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="variant-color">Cor (opcional)</Label>
          <Input id="variant-color" name="color" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="variant-size">Tamanho (opcional)</Label>
          <Input id="variant-size" name="size" />
        </div>
        <input type="hidden" name="status" value="available" />
        {state.error ? <p className="col-span-2 text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" variant="outline" disabled={isPending} className="col-span-2 w-fit">
          {isPending ? "Adicionando..." : "Adicionar variação"}
        </Button>
      </form>
    </div>
  );
}

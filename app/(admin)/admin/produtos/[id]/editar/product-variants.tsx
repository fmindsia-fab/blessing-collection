"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import { createVariant, toggleVariantStatus, archiveVariant, type VariantFormState } from "@/lib/products/variant-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VariantStatus } from "@/types/database.types";

type StoreColor = { id: string; name: string; hex: string; hex_secondary: string | null };

type ProductVariantsProps = {
  productId: string;
  variants: {
    id: string;
    name: string;
    color: string | null;
    color_id: string | null;
    variant_group: string | null;
    size: string | null;
    price: number | null;
    status: VariantStatus;
  }[];
  colors: StoreColor[];
};

const initialState: VariantFormState = {};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ProductVariants({ productId, variants, colors }: ProductVariantsProps) {
  const createAction = createVariant.bind(null, productId);
  const [state, formAction, isPending] = useActionState(createAction, initialState);
  const [isToggling, startTransition] = useTransition();

  const colorById = new Map(colors.map((color) => [color.id, color]));
  const existingGroups = [
    ...new Set(variants.map((v) => v.variant_group).filter((g): g is string => Boolean(g))),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Variações</h2>
        <p className="text-xs text-zinc-500">Cores, tamanhos ou outras variações. Preço opcional substitui o preço base.</p>
      </div>

      {variants.length > 0 ? (
        <div className="flex flex-col divide-y divide-zinc-200 border-y border-zinc-200">
          {variants.map((variant) => {
            const color = variant.color_id ? colorById.get(variant.color_id) : undefined;

            return (
            <div key={variant.id} className="flex items-center justify-between gap-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                {color ? (
                  <span
                    aria-hidden
                    title={color.name}
                    className="size-6 shrink-0 rounded-full border border-foreground/15"
                    style={
                      color.hex_secondary
                        ? { background: `linear-gradient(135deg, ${color.hex} 50%, ${color.hex_secondary} 50%)` }
                        : { backgroundColor: color.hex }
                    }
                  />
                ) : null}
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm">{variant.name}</span>
                  <span className="text-xs text-zinc-500">
                    {variant.variant_group ? `${variant.variant_group} · ` : ""}
                    {variant.price ? formatPrice(variant.price) : "Preço base"} ·{" "}
                    {variant.status === "available" ? "Disponível" : "Esgotado"}
                    {color ? ` · ${color.name}` : ""}
                    {/* Variante anterior à migration 0013 que não casou com
                        nenhuma cor cadastrada: não aparece no filtro público. */}
                    {!color && variant.color ? ` · ${variant.color} (sem cor cadastrada)` : ""}
                  </span>
                </div>
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
                  onClick={() => startTransition(() => archiveVariant(productId, variant.id))}
                >
                  Remover
                </Button>
              </div>
            </div>
            );
          })}
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
          <select
            id="variant-color"
            name="colorId"
            defaultValue=""
            className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
          >
            <option value="">Sem cor</option>
            {colors.map((color) => (
              <option key={color.id} value={color.id}>
                {color.name}
              </option>
            ))}
          </select>
          {colors.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              Nenhuma cor cadastrada —{" "}
              <Link href="/admin/cores" className="underline underline-offset-2">
                cadastrar cores
              </Link>
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="variant-group">Grupo</Label>
          <Input
            id="variant-group"
            name="variantGroup"
            list="variant-groups"
            maxLength={30}
            placeholder="Cor"
            defaultValue="Cor"
          />
          {/* Sugere os grupos já usados nesta peça, para não surgir "Cor" e
              "cores" como eixos separados por diferença de digitação. */}
          <datalist id="variant-groups">
            {existingGroups.map((group) => (
              <option key={group} value={group} />
            ))}
            <option value="Cor" />
            <option value="Alça" />
            <option value="Tamanho" />
            <option value="Acabamento" />
          </datalist>
          <span className="text-xs text-muted-foreground">
            A cliente escolhe uma opção de cada grupo.
          </span>
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

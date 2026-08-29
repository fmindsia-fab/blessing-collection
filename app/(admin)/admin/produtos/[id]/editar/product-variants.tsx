"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createVariant, type VariantFormState } from "@/lib/products/variant-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VariantRow, type StoreColor, type Variant } from "./variant-row";

type ProductVariantsProps = {
  productId: string;
  variants: Variant[];
  colors: StoreColor[];
  /** Grupos cadastrados em Grupos de variação (/admin/grupos-variacao). */
  catalogGroups: string[];
};

const initialState: VariantFormState = {};

export function ProductVariants({ productId, variants, colors, catalogGroups }: ProductVariantsProps) {
  const createAction = createVariant.bind(null, productId);
  const [state, formAction, isPending] = useActionState(createAction, initialState);

  // Grupos já usados nesta peça + os cadastrados no catálogo da loja, sem
  // repetir. O catálogo é a fonte principal (pedido do usuário: gerenciar os
  // grupos numa tela própria); os já usados na peça cobrem um grupo digitado
  // antes de existir uma tela de catálogo, ou já arquivado nela.
  const existingGroups = [
    ...new Set([
      ...catalogGroups,
      ...variants.map((v) => v.variant_group).filter((g): g is string => Boolean(g)),
    ]),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Variações</h2>
        <p className="text-xs text-zinc-500">Cores, tamanhos ou outras variações. Preço opcional substitui o preço base.</p>
      </div>

      {variants.length > 0 ? (
        <div className="flex flex-col divide-y divide-zinc-200 border-y border-zinc-200">
          {variants.map((variant) => (
            <VariantRow
              key={variant.id}
              productId={productId}
              variant={variant}
              colors={colors}
              groups={existingGroups}
            />
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
          {/* Sugere os grupos do catálogo (/admin/grupos-variacao) + os já
              usados nesta peça, para não surgir "Cor" e "cores" como eixos
              separados por diferença de digitação. Os 4 fixos abaixo cobrem o
              catálogo vazio; o navegador ignora repetição no datalist. */}
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
            A cliente escolhe uma opção de cada grupo.{" "}
            <Link href="/admin/grupos-variacao" className="underline underline-offset-2">
              Gerenciar grupos
            </Link>
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

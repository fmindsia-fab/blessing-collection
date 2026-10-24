"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createVariant, type VariantFormState } from "@/lib/products/variant-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { VariantRow, type StoreColor, type Variant } from "./variant-row";
import { VariationTypeField } from "./variation-type-field";

type ProductVariantsProps = {
  productId: string;
  variants: Variant[];
  colors: StoreColor[];
  /** Variações cadastradas em Variações das peças (/admin/grupos-variacao). */
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
        <h2 className="text-xl font-semibold tracking-tight">Variações</h2>
        <p className="text-sm text-muted-foreground">Cores, tamanhos ou outras variações. Preço opcional substitui o preço base.</p>
      </div>

      {variants.length > 0 ? (
        <div className="flex flex-col gap-2">
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

      <form action={formAction} className="grid gap-3 sm:grid-cols-2">
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
          <NativeSelect id="variant-color" name="colorId" defaultValue="">
            <option value="">Sem cor</option>
            {colors.map((color) => (
              <option key={color.id} value={color.id}>
                {color.name}
              </option>
            ))}
          </NativeSelect>
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
          <VariationTypeField id="variant-group" options={existingGroups} defaultValue="Cor" />
          <span className="text-sm text-muted-foreground">
            A cliente escolhe uma opção de cada variação.{" "}
            <Link href="/admin/grupos-variacao" className="underline underline-offset-2">
              Gerenciar variações
            </Link>
          </span>
        </div>
        <input type="hidden" name="status" value="available" />
        {state.error ? <p className="sm:col-span-2 text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" variant="outline" disabled={isPending} className="w-full sm:col-span-2 sm:w-fit">
          {isPending ? "Adicionando..." : "Adicionar variação"}
        </Button>
      </form>
    </div>
  );
}

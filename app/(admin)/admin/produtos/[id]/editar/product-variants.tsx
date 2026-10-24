"use client";

import { useActionState } from "react";
import { createVariant, type VariantFormState } from "@/lib/products/variant-actions";
import { Button } from "@/components/ui/button";
import { VariantRow, type StoreColor, type Variant } from "./variant-row";
import type { CatalogMaterial } from "@/lib/products/variation-materials";
import { VariantFormFields } from "./variant-form-fields";

type ProductVariantsProps = {
  productId: string;
  variants: Variant[];
  colors: StoreColor[];
  /** Variações cadastradas em Variações das peças (/admin/grupos-variacao). */
  catalogGroups: string[];
  /** Materiais do cadastro: sugeridos quando a variação tem o nome deles (ex.: Alça). */
  catalogMaterials: CatalogMaterial[];
  /** Preço base da peça, somado ao do material escolhido. */
  basePrice: number;
};

const initialState: VariantFormState = {};

export function ProductVariants({
  productId,
  variants,
  colors,
  catalogGroups,
  catalogMaterials,
  basePrice,
}: ProductVariantsProps) {
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
              materials={catalogMaterials}
              basePrice={basePrice}
            />
          ))}
        </div>
      ) : null}

      {/* key: ao adicionar com sucesso a lista cresce e os campos recomeçam do zero. */}
      <form key={variants.length} action={formAction} className="grid gap-3 sm:grid-cols-2">
        <VariantFormFields
          idPrefix="variant"
          groupOptions={existingGroups}
          colors={colors}
          materials={catalogMaterials}
          basePrice={basePrice}
          defaults={{ name: "", group: "Cor", colorId: "", price: "" }}
          showHints
        />
        <input type="hidden" name="status" value="available" />
        {state.error ? <p className="sm:col-span-2 text-sm text-destructive">{state.error}</p> : null}
        <Button type="submit" variant="outline" disabled={isPending} className="w-full sm:col-span-2 sm:w-fit">
          {isPending ? "Adicionando..." : "Adicionar variação"}
        </Button>
      </form>
    </div>
  );
}

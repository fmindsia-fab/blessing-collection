"use client";

import { useState, useTransition } from "react";
import {
  archiveVariant,
  toggleVariantStatus,
  updateVariant,
} from "@/lib/products/variant-actions";
import { Button } from "@/components/ui/button";
import { VariantFormFields } from "./variant-form-fields";
import type { CatalogMaterial } from "@/lib/products/variation-materials";
import type { VariantStatus } from "@/types/database.types";

export type StoreColor = { id: string; name: string; hex: string; hex_secondary: string | null };

export type Variant = {
  id: string;
  name: string;
  color: string | null;
  color_id: string | null;
  variant_group: string | null;
  is_required: boolean;
  allow_multiple: boolean;
  material_id: string | null;
  material_quantity: number;
  size: string | null;
  price: number | null;
  status: VariantStatus;
};


function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Swatch({ color }: { color: StoreColor }) {
  return (
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
  );
}

export function VariantRow({
  productId,
  variant,
  colors,
  groups,
  materials,
  basePrice,
  groupMultiple,
}: {
  productId: string;
  variant: Variant;
  colors: StoreColor[];
  /** Variações cadastradas e já usadas na peça, para escolher na lista. */
  groups: string[];
  materials: CatalogMaterial[];
  basePrice: number;
  groupMultiple: Record<string, boolean>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  // O formulário só fecha DEPOIS de salvar de verdade: se o banco recusar, o erro aparece aqui em vez
  // de a janela fechar e a pessoa só descobrir ao reabrir que nada foi gravado.
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  const color = variant.color_id ? colors.find((c) => c.id === variant.color_id) : undefined;

  if (isEditing) {
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          setSaveError(null);
          startSaving(async () => {
            const result = await updateVariant(productId, variant.id, {}, formData);
            if (result.error) setSaveError(result.error);
            else setIsEditing(false);
          });
        }}
        className="flex flex-col gap-3 rounded-2xl border border-[var(--gold)]/40 bg-card p-4 shadow-sm"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <VariantFormFields
            idPrefix={`variant-${variant.id}`}
            groupOptions={groups}
            colors={colors}
            materials={materials}
            basePrice={basePrice}
            defaults={{
              name: variant.name,
              group: variant.variant_group ?? "",
              colorId: variant.color_id ?? "",
              price: variant.price != null ? String(variant.price) : "",
              isRequired: variant.is_required,
              allowMultiple: variant.allow_multiple,
              materialId: variant.material_id ?? "",
              materialQuantity: String(variant.material_quantity ?? 1),
            }}
            groupMultiple={groupMultiple}
          />
        </div>

        {saveError ? (
          <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm font-medium text-destructive">
            {saveError}
          </p>
        ) : null}

        <div className="flex gap-2">
          <Button type="submit" size="xs" disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
          <Button type="button" variant="outline" size="xs" onClick={() => setIsEditing(false)}>
            Cancelar
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:flex-nowrap">
      <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
        {color ? <Swatch color={color} /> : null}
        <div className="flex min-w-0 flex-col">
          <span className="break-words text-sm font-medium">{variant.name}</span>
          <span className="text-xs text-muted-foreground">
            {variant.variant_group ? `${variant.variant_group} · ` : ""}
            {variant.is_required ? "Escolha obrigatória · " : ""}
            {variant.allow_multiple ? "Pode escolher mais de uma · " : ""}
            {variant.material_id ? `Desconta do estoque: ${materials.find((material) => material.id === variant.material_id)?.name ?? "material"} · ` : ""}
            {variant.price ? formatPrice(variant.price) : "Preço base"} ·{" "}
            {variant.status === "available" ? "Disponível" : "Esgotado"}
            {color ? ` · ${color.name}` : ""}
            {/* Variante anterior à migration 0013 que não casou com nenhuma cor
                cadastrada: não aparece no filtro público. */}
            {!color && variant.color ? ` · ${variant.color} (sem cor cadastrada)` : ""}
          </span>
        </div>
      </div>

      <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:shrink-0">
        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          Editar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(() => toggleVariantStatus(productId, variant.id, variant.status))
          }
        >
          {variant.status === "available" ? "Marcar esgotado" : "Marcar disponível"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => startTransition(() => archiveVariant(productId, variant.id))}
        >
          Remover
        </Button>
      </div>
    </div>
  );
}

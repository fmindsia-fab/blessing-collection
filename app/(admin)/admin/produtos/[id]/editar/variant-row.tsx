"use client";

import { useActionState, useState, useTransition } from "react";
import {
  archiveVariant,
  toggleVariantStatus,
  updateVariant,
  type VariantFormState,
} from "@/lib/products/variant-actions";
import { Button } from "@/components/ui/button";
import { VariationTypeField } from "./variation-type-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { VariantStatus } from "@/types/database.types";

export type StoreColor = { id: string; name: string; hex: string; hex_secondary: string | null };

export type Variant = {
  id: string;
  name: string;
  color: string | null;
  color_id: string | null;
  variant_group: string | null;
  size: string | null;
  price: number | null;
  status: VariantStatus;
};

const initialState: VariantFormState = {};

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
}: {
  productId: string;
  variant: Variant;
  colors: StoreColor[];
  /** Variações cadastradas e já usadas na peça, para escolher na lista. */
  groups: string[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const saveAction = updateVariant.bind(null, productId, variant.id);
  const [state, formAction, isSaving] = useActionState(saveAction, initialState);

  const color = variant.color_id ? colors.find((c) => c.id === variant.color_id) : undefined;

  if (isEditing) {
    return (
      <form
        action={(formData) => {
          formAction(formData);
          setIsEditing(false);
        }}
        className="flex flex-col gap-3 rounded-2xl border border-[var(--gold)]/40 bg-card p-4 shadow-sm"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`name-${variant.id}`}>Nome</Label>
            <Input
              id={`name-${variant.id}`}
              name="name"
              defaultValue={variant.name}
              required
              maxLength={60}
            />
          </div>

          <VariationTypeField
            id={`group-${variant.id}`}
            options={groups}
            defaultValue={variant.variant_group ?? ""}
          />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`color-${variant.id}`}>Cor</Label>
            <NativeSelect id={`color-${variant.id}`} name="colorId" defaultValue={variant.color_id ?? ""}>
              <option value="">Sem cor</option>
              {colors.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`price-${variant.id}`}>Preço total (opcional)</Label>
            <Input
              id={`price-${variant.id}`}
              name="price"
              type="number"
              step="0.01"
              min="0"
              defaultValue={variant.price ?? ""}
              placeholder="Preço base"
            />
            {/* O catálogo deriva o adicional da diferença para o preço base,
                então aqui vai o valor cheio da peça com esta variação. */}
            <span className="text-xs text-muted-foreground">
              Valor cheio da peça com esta variação, não o acréscimo.
            </span>
          </div>
        </div>

        {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

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

"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  archiveVariant,
  toggleVariantStatus,
  updateVariant,
  type VariantFormState,
} from "@/lib/products/variant-actions";
import { SIZE_PRESETS } from "@/lib/products/size-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BusinessType, VariantStatus } from "@/types/database.types";

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
  businessType,
}: {
  productId: string;
  variant: Variant;
  colors: StoreColor[];
  /** Grupos já usados na peça, para o autocompletar. */
  groups: string[];
  businessType: BusinessType;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const saveAction = updateVariant.bind(null, productId, variant.id);
  const [state, formAction, isSaving] = useActionState(saveAction, initialState);
  const nameRef = useRef<HTMLInputElement>(null);
  const groupRef = useRef<HTMLInputElement>(null);
  const preset = SIZE_PRESETS[businessType];

  const color = variant.color_id ? colors.find((c) => c.id === variant.color_id) : undefined;

  if (isEditing) {
    return (
      <form
        action={(formData) => {
          formAction(formData);
          setIsEditing(false);
        }}
        className="flex flex-col gap-3 py-4"
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
              ref={nameRef}
            />
            {preset ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {preset.values.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      if (nameRef.current) nameRef.current.value = value;
                      if (groupRef.current) groupRef.current.value = preset.group;
                    }}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                  >
                    {value}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`group-${variant.id}`}>Grupo</Label>
            <Input
              id={`group-${variant.id}`}
              name="variantGroup"
              list={`groups-${variant.id}`}
              defaultValue={variant.variant_group ?? ""}
              maxLength={30}
              placeholder="Cor"
              ref={groupRef}
            />
            <datalist id={`groups-${variant.id}`}>
              {groups.map((group) => (
                <option key={group} value={group} />
              ))}
              <option value="Cor" />
              <option value="Alça" />
              <option value="Tamanho" />
              <option value="Acabamento" />
            </datalist>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`color-${variant.id}`}>Cor</Label>
            <select
              id={`color-${variant.id}`}
              name="colorId"
              defaultValue={variant.color_id ?? ""}
              className="h-9 rounded-[var(--radius)] border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
            >
              <option value="">Sem cor</option>
              {colors.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
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
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {color ? <Swatch color={color} /> : null}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm">{variant.name}</span>
          <span className="text-xs text-zinc-500">
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

      <div className="flex shrink-0 gap-2">
        <Button type="button" variant="outline" size="xs" onClick={() => setIsEditing(true)}>
          Editar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
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
          size="xs"
          disabled={isPending}
          onClick={() => startTransition(() => archiveVariant(productId, variant.id))}
        >
          Remover
        </Button>
      </div>
    </div>
  );
}
